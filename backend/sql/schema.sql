-- POS Database Schema

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(10) CHECK (role IN ('admin', 'cashier')) NOT NULL DEFAULT 'cashier',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_type VARCHAR(10) CHECK (order_type IN ('dine-in', 'parcel')) NOT NULL DEFAULT 'dine-in',
  table_number VARCHAR(20),
  payment_method VARCHAR(10) CHECK (payment_method IN ('cash', 'upi', 'split', 'pending')) NOT NULL,
  cash_amount DECIMAL(10,2) DEFAULT 0,
  upi_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(15) CHECK (status IN ('preparing', 'served')) NOT NULL DEFAULT 'preparing',
  is_pending BOOLEAN DEFAULT false,
  customer_name VARCHAR(100),
  customer_phone VARCHAR(20),
  completed_at TIMESTAMP,
  completion_method VARCHAR(10) CHECK (completion_method IN ('cash', 'upi', 'split')),
  completion_cash_amount DECIMAL(10,2) DEFAULT 0,
  completion_upi_amount DECIMAL(10,2) DEFAULT 0,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  menu_item_id INT REFERENCES menu_items(id) ON DELETE SET NULL,
  name VARCHAR(150) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  note TEXT,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed default admin user (password: admin123)
INSERT INTO users (username, password_hash, role) VALUES
  ('admin', '$2a$10$placeholder_hash_replace_on_init', 'admin')
ON CONFLICT (username) DO NOTHING;
