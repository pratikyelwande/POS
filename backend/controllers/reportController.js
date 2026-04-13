const db = require("../config/db");

exports.getSummary = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    let dateFilter = "";
    const params = [];
    let i = 1;

    if (req.user.role === "cashier") {
      dateFilter = " AND created_at >= CURRENT_DATE";
    } else {
      if (date_from) { dateFilter += ` AND created_at >= $${i++}`; params.push(date_from); }
      if (date_to) { dateFilter += ` AND created_at <= $${i++}`; params.push(date_to); }
    }

    // Revenue (excluding pending)
    const revenue = await db.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN cash_amount ELSE 0 END), 0) as total_cash,
        COALESCE(SUM(CASE WHEN payment_method = 'upi' THEN upi_amount ELSE 0 END), 0) as total_upi,
        COALESCE(SUM(CASE WHEN payment_method = 'split' THEN cash_amount ELSE 0 END), 0) as split_cash,
        COALESCE(SUM(CASE WHEN payment_method = 'split' THEN upi_amount ELSE 0 END), 0) as split_upi,
        COALESCE(SUM(total), 0) as total_revenue,
        COUNT(*) as total_orders
       FROM orders WHERE is_pending = false ${dateFilter}`,
      params
    );

    // Pending totals
    const pending = await db.query(
      `SELECT COALESCE(SUM(total), 0) as pending_total, COUNT(*) as pending_count 
       FROM orders WHERE is_pending = true ${dateFilter}`,
      params
    );

    // Expenses
    const expenses = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total_expenses, COUNT(*) as expense_count 
       FROM expenses WHERE 1=1 ${dateFilter}`,
      params
    );

    const rev = revenue.rows[0];
    const pend = pending.rows[0];
    const exp = expenses.rows[0];

    res.json({
      revenue: {
        cash: parseFloat(rev.total_cash) + parseFloat(rev.split_cash),
        upi: parseFloat(rev.total_upi) + parseFloat(rev.split_upi),
        total: parseFloat(rev.total_revenue),
        order_count: parseInt(rev.total_orders),
      },
      pending: {
        total: parseFloat(pend.pending_total),
        count: parseInt(pend.pending_count),
      },
      expenses: {
        total: parseFloat(exp.total_expenses),
        count: parseInt(exp.expense_count),
      },
      profit: parseFloat(rev.total_revenue) - parseFloat(exp.total_expenses),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.exportOrders = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    let dateFilter = "";
    const params = [];
    let i = 1;

    if (date_from) { dateFilter += ` AND o.created_at >= $${i++}`; params.push(date_from); }
    if (date_to) { dateFilter += ` AND o.created_at <= $${i++}`; params.push(date_to); }

    const result = await db.query(
      `SELECT o.id, o.order_type, o.payment_method, o.cash_amount, o.upi_amount, o.total, 
              o.status, o.is_pending, o.customer_name, o.customer_phone, o.created_at,
              u.username as cashier
       FROM orders o LEFT JOIN users u ON o.created_by = u.id
       WHERE 1=1 ${dateFilter}
       ORDER BY o.created_at DESC`,
      params
    );

    // CSV format
    const header = "ID,Type,Payment,Cash,UPI,Total,Status,Pending,Customer,Phone,Date,Cashier\n";
    const rows = result.rows.map(r =>
      `${r.id},${r.order_type},${r.payment_method},${r.cash_amount},${r.upi_amount},${r.total},${r.status},${r.is_pending},${r.customer_name || ""},${r.customer_phone || ""},${r.created_at},${r.cashier}`
    ).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=orders-export.csv");
    res.send(header + rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.exportPending = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT o.id, o.total, o.customer_name, o.customer_phone, o.order_type, o.status, o.created_at,
              u.username as cashier
       FROM orders o LEFT JOIN users u ON o.created_by = u.id
       WHERE o.is_pending = true
       ORDER BY o.created_at DESC`
    );

    const header = "ID,Total,Customer,Phone,Type,Status,Date,Cashier\n";
    const rows = result.rows.map(r =>
      `${r.id},${r.total},${r.customer_name || ""},${r.customer_phone || ""},${r.order_type},${r.status},${r.created_at},${r.cashier}`
    ).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=pending-export.csv");
    res.send(header + rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
