const db = require("../config/db");

exports.addExpense = async (req, res) => {
  try {
    const { amount, category, note } = req.body;
    if (!amount || !category) return res.status(400).json({ error: "Amount and category required" });

    const result = await db.query(
      "INSERT INTO expenses (amount, category, note, created_by) VALUES ($1, $2, $3, $4) RETURNING *",
      [amount, category, note, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const { category, date_from, date_to } = req.query;
    let query = "SELECT e.*, u.username as created_by_name FROM expenses e LEFT JOIN users u ON e.created_by = u.id WHERE 1=1";
    const params = [];
    let i = 1;

    if (category) { query += ` AND e.category = $${i++}`; params.push(category); }
    if (date_from) { query += ` AND e.created_at >= $${i++}`; params.push(date_from); }
    if (date_to) { query += ` AND e.created_at <= $${i++}`; params.push(date_to); }

    if (req.user.role === "cashier") {
      query += " AND e.created_at >= CURRENT_DATE";
    }

    query += " ORDER BY e.created_at DESC";
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query("DELETE FROM expenses WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Expense not found" });
    res.json({ message: "Expense deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
