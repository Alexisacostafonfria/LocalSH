
'use server';
// src/services/productService.ts
import { getDbConnection } from '@/lib/db';
import { Product } from '@/types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * Fetches all products from the database.
 * Now includes imageUrl and db_id.
 */
export async function getProducts(): Promise<Product[]> {
  const db = await getDbConnection();
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT id as db_id, product_uuid as id, name, category, price, cost_price as costPrice, stock, unit_of_measure as unitOfMeasure, description, image_url as imageUrl FROM products ORDER BY name ASC'
    );
    return rows as Product[];
  } finally {
    await db.end();
  }
}

/**
 * Creates a new product in the database.
 * Now includes imageUrl.
 */
export async function createProduct(product: Omit<Product, 'db_id'>): Promise<Product> {
  const db = await getDbConnection();
  try {
    const { id, name, category, price, costPrice, stock, unitOfMeasure, description, imageUrl } = product;
    const [result] = await db.execute<ResultSetHeader>(
      'INSERT INTO products (product_uuid, name, category, price, cost_price, stock, unit_of_measure, description, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, category, price, costPrice, stock, unitOfMeasure || null, description || null, imageUrl || null]
    );

    const insertedId = result.insertId;

    const [rows] = await db.execute<RowDataPacket[]>('SELECT id as db_id, product_uuid as id, name, category, price, cost_price as costPrice, stock, unit_of_measure as unitOfMeasure, description, image_url as imageUrl FROM products WHERE id = ?', [insertedId]);
    
    if (rows.length === 0) {
      throw new Error('Failed to retrieve newly created product.');
    }
    
    return rows[0] as Product;

  } finally {
    await db.end();
  }
}

/**
 * Updates an existing product in the database.
 * Now includes imageUrl.
 */
export async function updateProduct(id: string, productData: Partial<Product>): Promise<Product | null> {
    const db = await getDbConnection();
    try {
      const fields = Object.keys(productData).filter(key => key !== 'id' && key !== 'db_id' && productData[key as keyof typeof productData] !== undefined);
      if (fields.length === 0) {
          const [rows] = await db.execute<RowDataPacket[]>('SELECT id as db_id, product_uuid as id, name, category, price, cost_price as costPrice, stock, unit_of_measure as unitOfMeasure, description, image_url as imageUrl FROM products WHERE product_uuid = ?', [id]);
          return rows[0] as Product || null;
      }

      const setClause = fields.map(field => {
        // Manual mapping for camelCase to snake_case
        if (field === 'costPrice') return '`cost_price` = ?';
        if (field === 'unitOfMeasure') return '`unit_of_measure` = ?';
        if (field === 'imageUrl') return '`image_url` = ?';
        return `\`${field}\` = ?`;
      }).join(', ');

      const values = fields.map(field => productData[field as keyof typeof productData]);

      await db.execute(
          `UPDATE products SET ${setClause} WHERE product_uuid = ?`,
          [...values, id]
      );

      const [updatedRows] = await db.execute<RowDataPacket[]>('SELECT id as db_id, product_uuid as id, name, category, price, cost_price as costPrice, stock, unit_of_measure as unitOfMeasure, description, image_url as imageUrl FROM products WHERE product_uuid = ?', [id]);
      return updatedRows[0] as Product || null;
    } finally {
        await db.end();
    }
}

/**
 * Deletes a product from the database.
 */
export async function deleteProduct(id: string): Promise<void> {
    const db = await getDbConnection();
    try {
      // Before deleting the product, we could try to delete its image file from storage.
      // This requires getting the product details first to find the imageUrl.
      // For simplicity in this step, we are not deleting the image file from the local server.
      await db.execute('DELETE FROM products WHERE product_uuid = ?', [id]);
    } finally {
        await db.end();
    }
}
