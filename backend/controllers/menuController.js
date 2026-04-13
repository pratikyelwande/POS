const db = require("../config/db");

exports.getCategories = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM categories ORDER BY sort_order, name");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMenuItems = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT mi.*, c.name as category_name 
       FROM menu_items mi 
       LEFT JOIN categories c ON mi.category_id = c.id 
       WHERE mi.active = true 
       ORDER BY c.sort_order, mi.name`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addMenuItem = async (req, res) => {
  try {
    const { name, price, category_id } = req.body;
    if (!name || !price) return res.status(400).json({ error: "Name and price required" });

    const result = await db.query(
      "INSERT INTO menu_items (name, price, category_id) VALUES ($1, $2, $3) RETURNING *",
      [name, price, category_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category_id, active } = req.body;
    const result = await db.query(
      `UPDATE menu_items SET 
        name = COALESCE($1, name), 
        price = COALESCE($2, price), 
        category_id = COALESCE($3, category_id),
        active = COALESCE($4, active)
       WHERE id = $5 RETURNING *`,
      [name, price, category_id, active, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Item not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("UPDATE menu_items SET active = false WHERE id = $1", [id]);
    res.json({ message: "Item deactivated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
