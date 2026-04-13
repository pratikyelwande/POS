const db = require("../config/db");

exports.createOrder = async (req, res) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const { order_type, table_number, payment_method, cash_amount, upi_amount, total, customer_name, customer_phone, items } = req.body;

    if (!items || items.length === 0) return res.status(400).json({ error: "Order must have items" });

    const is_pending = payment_method === "pending";

    const orderResult = await client.query(
      `INSERT INTO orders (order_type, table_number, payment_method, cash_amount, upi_amount, total, is_pending, customer_name, customer_phone, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [order_type || "dine-in", table_number, payment_method, cash_amount || 0, upi_amount || 0, total, is_pending, customer_name, customer_phone, req.user.id]
    );
    const order = orderResult.rows[0];

    for (const item of items) {
      await client.query(
        "INSERT INTO order_items (order_id, menu_item_id, name, price, quantity) VALUES ($1, $2, $3, $4, $5)",
        [order.id, item.menu_item_id, item.name, item.price, item.quantity]
      );
    }

    await client.query("COMMIT");

    const orderItems = await db.query("SELECT * FROM order_items WHERE order_id = $1", [order.id]);
    res.status(201).json({ ...order, items: orderItems.rows });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { status, payment_method, order_type, date_from, date_to, search } = req.query;
    let query = `SELECT o.*, u.username as created_by_name FROM orders o LEFT JOIN users u ON o.created_by = u.id WHERE 1=1`;
    const params = [];
    let i = 1;

    if (status) { query += ` AND o.status = $${i++}`; params.push(status); }
    if (payment_method) { query += ` AND o.payment_method = $${i++}`; params.push(payment_method); }
    if (order_type) { query += ` AND o.order_type = $${i++}`; params.push(order_type); }
    if (date_from) { query += ` AND o.created_at >= $${i++}`; params.push(date_from); }
    if (date_to) { query += ` AND o.created_at <= $${i++}`; params.push(date_to); }
    if (search) { query += ` AND (o.customer_name ILIKE $${i} OR CAST(o.id AS TEXT) ILIKE $${i++})`; params.push(`%${search}%`); }

    // Cashier restriction: today only
    if (req.user.role === "cashier") {
      query += ` AND o.created_at >= CURRENT_DATE`;
    }

    query += " ORDER BY o.created_at DESC";

    const result = await db.query(query, params);

    // Fetch items for each order
    for (const order of result.rows) {
      const items = await db.query("SELECT * FROM order_items WHERE order_id = $1", [order.id]);
      order.items = items.rows;
    }

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPendingOrders = async (req, res) => {
  try {
    let query = `SELECT o.*, u.username as created_by_name FROM orders o LEFT JOIN users u ON o.created_by = u.id WHERE o.is_pending = true ORDER BY o.created_at DESC`;
    const result = await db.query(query);

    for (const order of result.rows) {
      const items = await db.query("SELECT * FROM order_items WHERE order_id = $1", [order.id]);
      order.items = items.rows;
    }

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOrder = async (req, res) => {
  const client = await db.connect();
  try {
    const { id } = req.params;

    // Check order is editable
    const check = await client.query("SELECT status FROM orders WHERE id = $1", [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: "Order not found" });
    if (check.rows[0].status === "served") return res.status(403).json({ error: "Cannot edit served order" });

    await client.query("BEGIN");
    const { items, total } = req.body;

    // Delete old items and insert new
    await client.query("DELETE FROM order_items WHERE order_id = $1", [id]);
    for (const item of items) {
      await client.query(
        "INSERT INTO order_items (order_id, menu_item_id, name, price, quantity) VALUES ($1, $2, $3, $4, $5)",
        [id, item.menu_item_id, item.name, item.price, item.quantity]
      );
    }

    await client.query("UPDATE orders SET total = $1 WHERE id = $2", [total, id]);
    await client.query("COMMIT");

    const order = await db.query("SELECT * FROM orders WHERE id = $1", [id]);
    const orderItems = await db.query("SELECT * FROM order_items WHERE order_id = $1", [id]);
    res.json({ ...order.rows[0], items: orderItems.rows });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      "UPDATE orders SET status = 'served' WHERE id = $1 AND status = 'preparing' RETURNING *",
      [id]
    );
    if (result.rows.length === 0) return res.status(400).json({ error: "Order not found or already served" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.completePendingOrder = async (req, res) => {
  const client = await db.connect();
  try {
    const { id } = req.params;
    const { completion_method, completion_cash_amount, completion_upi_amount } = req.body;

    if (!completion_method) return res.status(400).json({ error: "Payment method required" });

    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE orders SET 
        is_pending = false, 
        completed_at = NOW(), 
        completion_method = $1, 
        completion_cash_amount = $2, 
        completion_upi_amount = $3,
        payment_method = $1,
        cash_amount = $2,
        upi_amount = $3
       WHERE id = $4 AND is_pending = true RETURNING *`,
      [completion_method, completion_cash_amount || 0, completion_upi_amount || 0, id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Order not found or not pending" });
    }

    await client.query("COMMIT");
    res.json(result.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
