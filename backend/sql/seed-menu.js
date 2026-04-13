require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const menuData = {
  "Veg Pizzas": [
    ["Cheese Pizza (7 inch)", 129], ["Cheese Pizza (10 inch)", 229], ["Cheese Pizza (13 inch)", 259],
    ["Cheese & Corn (7 inch)", 129], ["Cheese & Corn (10 inch)", 229], ["Cheese & Corn (13 inch)", 259],
    ["Cheese & Veggies (7 inch)", 129], ["Cheese & Veggies (10 inch)", 229], ["Cheese & Veggies (13 inch)", 259],
    ["Farm House (7 inch)", 199], ["Farm House (10 inch)", 349], ["Farm House (13 inch)", 539],
    ["Peppy Paneer (7 inch)", 199], ["Peppy Paneer (10 inch)", 349], ["Peppy Paneer (13 inch)", 539],
    ["Veg Supreme (7 inch)", 199], ["Veg Supreme (10 inch)", 349], ["Veg Supreme (13 inch)", 539],
    ["Tandoori Paneer (7 inch)", 249], ["Tandoori Paneer (10 inch)", 449], ["Tandoori Paneer (13 inch)", 639],
    ["Veg Extravaganza (7 inch)", 249], ["Veg Extravaganza (10 inch)", 449], ["Veg Extravaganza (13 inch)", 639],
    ["Paneer Makhani (7 inch)", 249], ["Paneer Makhani (10 inch)", 449], ["Paneer Makhani (13 inch)", 639],
    ["Double Cheese Margherita (7 inch)", 169], ["Double Cheese Margherita (10 inch)", 269], ["Double Cheese Margherita (13 inch)", 369],
    ["Special Juicy Paneer Pizza (7 inch)", 179], ["Special Juicy Paneer Pizza (10 inch)", 279], ["Special Juicy Paneer Pizza (13 inch)", 379]
  ],
  "Non-Veg Pizzas": [
    ["Cheesy Chicken (7 inch)", 139], ["Cheesy Chicken (10 inch)", 259], ["Cheesy Chicken (13 inch)", 389],
    ["Chicken & Corn (7 inch)", 139], ["Chicken & Corn (10 inch)", 259], ["Chicken & Corn (13 inch)", 389],
    ["Chicken & Onion (7 inch)", 139], ["Chicken & Onion (10 inch)", 259], ["Chicken & Onion (13 inch)", 389],
    ["Chicken Tikka (7 inch)", 229], ["Chicken Tikka (10 inch)", 379], ["Chicken Tikka (13 inch)", 559],
    ["Peri Peri Chicken (7 inch)", 229], ["Peri Peri Chicken (10 inch)", 379], ["Peri Peri Chicken (13 inch)", 559],
    ["Chicken Supreme (7 inch)", 229], ["Chicken Supreme (10 inch)", 379], ["Chicken Supreme (13 inch)", 559],
    ["Tandoori Chicken (7 inch)", 269], ["Tandoori Chicken (10 inch)", 479], ["Tandoori Chicken (13 inch)", 659],
    ["Chicken Extravaganza (7 inch)", 269], ["Chicken Extravaganza (10 inch)", 479], ["Chicken Extravaganza (13 inch)", 659],
    ["Chicken Makhani (7 inch)", 269], ["Chicken Makhani (10 inch)", 479], ["Chicken Makhani (13 inch)", 659],
    ["BBQ Chicken (7 inch)", 229], ["BBQ Chicken (10 inch)", 329], ["BBQ Chicken (13 inch)", 429]
  ],
  "Sides": [
    ["French Fries", 60], ["Peri Peri Fries", 70], ["Peri Peri Cheese Fries", 80], ["Cheesy Garlic Bread", 100],
    ["Cheesy Garlic Scroll", 110], ["Potato Cheese Shortz", 90], ["Chicken Nuggets", 120]
  ],
  "Burger": [
    ["Aloo Tikki", 70], ["Crispy Veg Burger", 80], ["Cheese Veg Burger", 90],
    ["Spicy Paneer Burger", 100], ["Crispy Chicken Burger", 100], ["Cheesy Chicken Burger", 110]
  ],
  "Sandwich": [
    ["Veg Grill Sandwich", 100], ["Cheese Grill Sandwich", 110], ["Paneer Tikka Sandwich", 120],
    ["Chicken Grill Sandwich", 130], ["Chicken Cheese Grill Sandwich", 150]
  ],
  "Pasta": [
    ["Veg Pasta (White/Pink)", 130], ["White Sause Mushroom Pasta", 140], ["Non Veg Pasta (White/Pink)", 150]
  ],
  "Thick Cold Coffee": [
    ["Thick Cold Coffee", 45], ["Thick Coffee With Crush", 50], ["Thick Chocolate", 50], ["Thick Chocolate With Crush", 55],
    ["Mocca", 50], ["Mocca With Crush", 55], ["Coffee With Icecream", 80], ["Chocolate With Icecream", 90],
    ["Mocca With Icecream", 90], ["White Coffee", 55]
  ],
  "Thick Shakes": [
    ["Mango", 55], ["Chocolate", 55], ["Butterscotch", 55], ["Vanilla", 55], ["Strawberry", 55], ["Rose", 50],
    ["Blackcurrant", 65], ["Pista", 55], ["Kulfi", 50], ["Kit Kat", 80], ["Oreo", 80], ["Real Gulkand", 60]
  ],
  "Mastani": [
    ["Mango", 100], ["Chocolate", 90], ["Butterscotch", 100], ["Vanilla", 80], ["Strawberry", 90], ["Blackcurrant", 90], ["Pista", 90]
  ],
  "Ice-Cream": [
    ["Mango (2 scoops)", 50], ["Chocolate (2 scoops)", 50], ["Butterscotch (2 scoops)", 50], ["Vanilla (2 scoops)", 50],
    ["Strawberry (2 scoops)", 50], ["Blackcurrant (2 scoops)", 50], ["Pista (2 scoops)", 50]
  ],
  "Hot Coffee": [
    ["Hot Coffee", 30]
  ],
  "Extras": [
    ["Cheese Burst Add-on (Small)", 60], ["Cheese Burst Add-on (Medium)", 100], ["Cheese Burst Add-on (Large)", 120]
  ]
};

async function seedMenu() {
  try {
    await pool.query("BEGIN");

    const categoryIds = {};
    let sortOrder = 1;

    for (const categoryName of Object.keys(menuData)) {
      const existingCat = await pool.query("SELECT id FROM categories WHERE name = $1 LIMIT 1", [categoryName]);
      if (existingCat.rowCount > 0) {
        categoryIds[categoryName] = existingCat.rows[0].id;
      } else {
        const insertedCat = await pool.query(
          "INSERT INTO categories (name, sort_order) VALUES ($1, $2) RETURNING id",
          [categoryName, sortOrder]
        );
        categoryIds[categoryName] = insertedCat.rows[0].id;
      }
      sortOrder += 1;
    }

    let inserted = 0;
    let updated = 0;

    for (const [categoryName, items] of Object.entries(menuData)) {
      const categoryId = categoryIds[categoryName];
      for (const [name, price] of items) {
        const existing = await pool.query(
          "SELECT id FROM menu_items WHERE name = $1 AND category_id = $2 LIMIT 1",
          [name, categoryId]
        );

        if (existing.rowCount > 0) {
          await pool.query("UPDATE menu_items SET price = $1, active = true WHERE id = $2", [price, existing.rows[0].id]);
          updated += 1;
        } else {
          await pool.query(
            "INSERT INTO menu_items (name, price, category_id, active) VALUES ($1, $2, $3, true)",
            [name, price, categoryId]
          );
          inserted += 1;
        }
      }
    }

    await pool.query("COMMIT");

    const totals = await pool.query(
      "SELECT COUNT(*)::int AS total, SUM(CASE WHEN active THEN 1 ELSE 0 END)::int AS active FROM menu_items"
    );

    console.log("Menu seed completed:", { inserted, updated, totals: totals.rows[0] });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Menu seed failed:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedMenu();
