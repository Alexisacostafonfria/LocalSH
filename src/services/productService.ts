'use server';
// src/services/productService.ts
import { getDbConnection } from '@/lib/db';
import { Product } from '@/types';
import { RowDataPacket } from 'mysql2';

/**
 * Fetches all products from the database.
 * Note: imageUrl is intentionally NOT selected as it's stored client-side.
 */
export async function getProducts(): Promise<Product[]> {
  const db = await getDbConnection();
  const [rows] = await db.execute<RowDataPacket[]>(
    'SELECT product_uuid as id, name, category, price, cost_price as costPrice, stock, unit_of_measure as unitOfMeasure, description FROM products ORDER BY name ASC'
  );
  return rows as Product[];
}

/**
 * Creates a new product in the database.
 * Note: imageUrl is not part of the product data saved to the DB.
 */
export async function createProduct(product: Omit<Product, 'imageUrl'>): Promise<Product> {
  const db = await getDbConnection();
  const { id, name, category, price, costPrice, stock, unitOfMeasure, description } = product;
  await db.execute(
    'INSERT INTO products (product_uuid, name, category, price, cost_price, stock, unit_of_measure, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, name, category, price, costPrice, stock, unitOfMeasure || null, description || null]
  );
  return product as Product;
}

/**
 * Updates an existing product in the database.
 * Note: imageUrl is not part of the product data saved to the DB.
 */
export async function updateProduct(id: string, productData: Partial<Omit<Product, 'imageUrl'>>): Promise<Product | null> {
    const db = await getDbConnection();
    
    // Dynamically build the SET part of the query to only update provided fields
    const fields = Object.keys(productData).filter(key => key !== 'id' && productData[key as keyof typeof productData] !== undefined);
    if (fields.length === 0) {
        // If no fields to update, fetch and return the current product
        const [rows] = await db.execute<RowDataPacket[]>('SELECT product_uuid as id, name, category, price, cost_price as costPrice, stock, unit_of_measure as unitOfMeasure, description FROM products WHERE product_uuid = ?', [id]);
        return rows[0] as Product || null;
    }

    const setClause = fields.map(field => `\`${field.replace(/([A-Z])/g, '_$1').toLowerCase()}\` = ?`).join(', ');
    const values = fields.map(field => productData[field as keyof typeof productData]);

    await db.execute(
        `UPDATE products SET ${setClause} WHERE product_uuid = ?`,
        [...values, id]
    );

    const [updatedRows] = await db.execute<RowDataPacket[]>('SELECT product_uuid as id, name, category, price, cost_price as costPrice, stock, unit_of_measure as unitOfMeasure, description FROM products WHERE product_uuid = ?', [id]);
    return updatedRows[0] as Product || null;
}

/**
 * Deletes a product from the database.
 */
export async function deleteProduct(id: string): Promise<void> {
    const db = await getDbConnection();
    await db.execute('DELETE FROM products WHERE product_uuid = ?', [id]);
}
