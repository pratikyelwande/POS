require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

async function initDB() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Run schema
    const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
    await pool.query(schema);

    // Create admin user with hashed password
    const hash = await bcrypt.hash("admin123", 10);
    await pool.query(
      `INSERT INTO users (username, password_hash, role) VALUES ('admin', $1, 'admin') ON CONFLICT (username) DO UPDATE SET password_hash = $1`,
      [hash]
    );

    // Create default cashier
    const cashierHash = await bcrypt.hash("cashier123", 10);
    await pool.query(
      `INSERT INTO users (username, password_hash, role) VALUES ('cashier', $1, 'cashier') ON CONFLICT (username) DO NOTHING`,
      [cashierHash]
    );

    // Seed categories
    await pool.query(`
      INSERT INTO categories (name, sort_order) VALUES 
        ('Hot Coffee', 1), ('Cold Coffee', 2), ('Tea', 3), ('Snacks', 4), ('Desserts', 5)
      ON CONFLICT DO NOTHING
    `);

    console.log("✅ Database initialized successfully!");
    console.log("   Admin login:   admin / admin123");
    console.log("   Cashier login: cashier / cashier123");
  } catch (err) {
    console.error("❌ DB init failed:", err.message);
  } finally {
    await pool.end();
  }
}

initDB();
