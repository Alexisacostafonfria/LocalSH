
-- src/lib/schema.sql

-- This file documents the SQL schema for the application.
-- It is intended for reference and for setting up the database initially.

-- Table for storing product information.
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

-- Table for storing customer information.
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_uuid VARCHAR(36) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    personal_id VARCHAR(100),
    card_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- NOTE: Other tables for Sales, Orders, etc., will be added here
-- as those modules are migrated.


    