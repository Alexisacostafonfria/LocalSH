
-- This file is for documentation and reference purposes.
-- It contains the SQL schema for the application's database tables.

-- =============================================
-- ========== PRODUCTS MODULE TABLES ===========
-- =============================================

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_uuid VARCHAR(36) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    unit_of_measure VARCHAR(50),
    description TEXT,
    image_url VARCHAR(2048),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- ========== CUSTOMERS MODULE TABLES ==========
-- =============================================

CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_uuid VARCHAR(36) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    address VARCHAR(255),
    personal_id VARCHAR(100),
    card_number VARCHAR(100), -- Storing as string to keep formatting/dashes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- =============================================
-- ============ SALES MODULE TABLES ============
-- =============================================

CREATE TABLE sales (
    sale_uuid VARCHAR(36) PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    operational_date DATE,
    origin VARCHAR(50) DEFAULT 'pos',
    customer_uuid VARCHAR(36),
    customer_name VARCHAR(255),
    sub_total DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    user_id VARCHAR(255),
    FOREIGN KEY (customer_uuid) REFERENCES customers(customer_uuid) ON DELETE SET NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_uuid VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    product_uuid VARCHAR(36) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (sale_uuid) REFERENCES sales(sale_uuid) ON DELETE CASCADE,
    FOREIGN KEY (product_uuid) REFERENCES products(product_uuid) ON DELETE RESTRICT
);

CREATE TABLE payment_details_cash (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_uuid VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    amount_received DECIMAL(10, 2) NOT NULL,
    change_given DECIMAL(10, 2) NOT NULL,
    tip DECIMAL(10, 2),
    FOREIGN KEY (sale_uuid) REFERENCES sales(sale_uuid) ON DELETE CASCADE
);

CREATE TABLE payment_details_transfer (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_uuid VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    reference VARCHAR(255),
    customer_name VARCHAR(255),
    personal_id VARCHAR(100),
    mobile_number VARCHAR(50),
    card_number VARCHAR(100),
    FOREIGN KEY (sale_uuid) REFERENCES sales(sale_uuid) ON DELETE CASCADE
);

CREATE TABLE payment_details_invoice (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_uuid VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    paid_date DATE,
    paid_amount DECIMAL(10, 2),
    paid_method VARCHAR(50),
    FOREIGN KEY (sale_uuid) REFERENCES sales(sale_uuid) ON DELETE CASCADE
);
