// src/lib/migration-sql.ts

export const sqlScript = `
-- Script de Generación de Tablas para Local Sales Hub (MySQL 8.0+)
-- Arquitectura basada en claves primarias INT AUTO_INCREMENT para máxima compatibilidad y rendimiento.
-- --------------------------------------------------------------------------------------

-- Tabla: users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL UNIQUE,
  username VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'cashier') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: products
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  price DECIMAL(15, 2) NOT NULL,
  cost_price DECIMAL(15, 2) DEFAULT 0.00,
  stock INT NOT NULL DEFAULT 0,
  unit_of_measure VARCHAR(50),
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_name (name),
  INDEX idx_products_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: customers
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  personal_id VARCHAR(50) UNIQUE,
  card_number VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_customers_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: orders
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL UNIQUE,
  order_number INT NOT NULL UNIQUE,
  timestamp DATETIME NOT NULL,
  customer_id INT,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  total_amount DECIMAL(15, 2) NOT NULL,
  status ENUM('pending', 'in-progress', 'ready', 'completed', 'cancelled') NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY fk_orders_customer_id (customer_id),
  CONSTRAINT orders_fk_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: order_items
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(15, 2) NOT NULL,
  total_price DECIMAL(15, 2) NOT NULL,
  KEY fk_order_items_order_id (order_id),
  KEY fk_order_items_product_id (product_id),
  CONSTRAINT order_items_fk_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT order_items_fk_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: sales
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL UNIQUE,
  timestamp DATETIME NOT NULL,
  operational_date DATE NOT NULL,
  origin ENUM('pos', 'order') NOT NULL,
  order_id INT,
  customer_id INT,
  customer_name VARCHAR(255),
  user_id INT NOT NULL,
  sub_total DECIMAL(15, 2) NOT NULL,
  discount DECIMAL(15, 2) DEFAULT 0.00,
  fees JSON,
  total_amount DECIMAL(15, 2) NOT NULL,
  payment_method ENUM('cash', 'transfer', 'invoice') NOT NULL,
  payment_details JSON NOT NULL,
  INDEX idx_sales_operational_date (operational_date),
  KEY fk_sales_order_id (order_id),
  KEY fk_sales_customer_id (customer_id),
  KEY fk_sales_user_id (user_id),
  CONSTRAINT sales_fk_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  CONSTRAINT sales_fk_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  CONSTRAINT sales_fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: sale_items
CREATE TABLE IF NOT EXISTS sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(15, 2) NOT NULL,
  total_price DECIMAL(15, 2) NOT NULL,
  KEY fk_sale_items_sale_id (sale_id),
  KEY fk_sale_items_product_id (product_id),
  CONSTRAINT sale_items_fk_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  CONSTRAINT sale_items_fk_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: invoice_payments
CREATE TABLE IF NOT EXISTS invoice_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL UNIQUE,
  invoice_sale_id INT NOT NULL,
  payment_timestamp DATETIME NOT NULL,
  operational_date DATE NOT NULL,
  amount_paid DECIMAL(15, 2) NOT NULL,
  method ENUM('cash', 'transfer') NOT NULL,
  reference VARCHAR(255),
  tip DECIMAL(15, 2) DEFAULT 0.00,
  KEY fk_invoice_payments_invoice_sale_id (invoice_sale_id),
  CONSTRAINT invoice_payments_fk_sale FOREIGN KEY (invoice_sale_id) REFERENCES sales(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: daily_closures
CREATE TABLE IF NOT EXISTS daily_closures (
  id INT AUTO_INCREMENT PRIMARY KEY,
  closure_date DATE NOT NULL UNIQUE,
  expected_cash DECIMAL(15, 2) NOT NULL,
  counted_cash DECIMAL(15, 2) NOT NULL,
  cash_difference DECIMAL(15, 2) NOT NULL,
  notes TEXT,
  total_revenue DECIMAL(15, 2) NOT NULL,
  total_cogs DECIMAL(15, 2) NOT NULL,
  gross_profit DECIMAL(15, 2) NOT NULL,
  total_transactions INT NOT NULL,
  cash_sales_amount DECIMAL(15, 2) NOT NULL,
  transfer_sales_amount DECIMAL(15, 2) NOT NULL,
  total_tips DECIMAL(15, 2) NOT NULL,
  invoice_payments_cash DECIMAL(15, 2) NOT NULL,
  invoice_payments_transfer DECIMAL(15, 2) NOT NULL,
  counted_cash_breakdown JSON
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: monthly_closures
CREATE TABLE IF NOT EXISTS monthly_closures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    year INT NOT NULL,
    month INT NOT NULL,
    generation_date DATETIME NOT NULL,
    total_revenue DECIMAL(15, 2) NOT NULL,
    total_cogs DECIMAL(15, 2) NOT NULL,
    gross_profit DECIMAL(15, 2) NOT NULL,
    total_transactions INT NOT NULL,
    total_tips DECIMAL(15, 2) NOT NULL,
    UNIQUE KEY uk_year_month (year, month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: audit_log
CREATE TABLE IF NOT EXISTS audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL UNIQUE,
  timestamp DATETIME NOT NULL,
  user_id INT NOT NULL,
  username VARCHAR(255) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id VARCHAR(255),
  description TEXT NOT NULL,
  INDEX idx_audit_log_timestamp (timestamp),
  KEY fk_audit_log_user_id (user_id),
  CONSTRAINT audit_log_fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: settings (Key-Value para configuraciones)
CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(255) PRIMARY KEY,
  setting_value TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;
