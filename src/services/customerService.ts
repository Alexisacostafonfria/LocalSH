
'use server';
// src/services/customerService.ts
import { getDbConnection } from '@/lib/db';
import { Customer } from '@/types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * Fetches all customers from the database.
 */
export async function getCustomers(): Promise<Customer[]> {
  const db = await getDbConnection();
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT id as db_id, customer_uuid as id, name, phone, email, address, personal_id as personalId, card_number as cardNumber FROM customers ORDER BY name ASC'
    );
    return rows as Customer[];
  } finally {
    await db.end();
  }
}

/**
 * Creates a new customer in the database and returns the full customer object including the new db_id.
 */
export async function createCustomer(customer: Omit<Customer, 'db_id'>): Promise<Customer> {
  const db = await getDbConnection();
  try {
    const { id, name, phone, email, address, personalId, cardNumber } = customer;
    const [result] = await db.execute<ResultSetHeader>(
      'INSERT INTO customers (customer_uuid, name, phone, email, address, personal_id, card_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, phone || null, email || null, address || null, personalId || null, cardNumber || null]
    );
    
    const insertedId = result.insertId;

    const [rows] = await db.execute<RowDataPacket[]>('SELECT id as db_id, customer_uuid as id, name, phone, email, address, personal_id as personalId, card_number as cardNumber FROM customers WHERE id = ?', [insertedId]);
    
    if (rows.length === 0) {
      throw new Error('Failed to retrieve newly created customer.');
    }
    
    return rows[0] as Customer;
  } finally {
    await db.end();
  }
}

/**
 * Updates an existing customer in the database.
 */
export async function updateCustomer(id: string, customerData: Partial<Customer>): Promise<Customer | null> {
    const db = await getDbConnection();
    try {
      const fields = Object.keys(customerData).filter(key => key !== 'id' && key !== 'db_id' && customerData[key as keyof typeof customerData] !== undefined);
      if (fields.length === 0) {
          const [rows] = await db.execute<RowDataPacket[]>('SELECT id as db_id, customer_uuid as id, name, phone, email, address, personal_id as personalId, card_number as cardNumber FROM customers WHERE customer_uuid = ?', [id]);
          return rows[0] as Customer || null;
      }

      const setClause = fields.map(field => {
        // Manual mapping for camelCase to snake_case
        if (field === 'personalId') return '`personal_id` = ?';
        if (field === 'cardNumber') return '`card_number` = ?';
        return `\`${field}\` = ?`;
      }).join(', ');

      const values = fields.map(field => customerData[field as keyof typeof customerData]);

      await db.execute(
          `UPDATE customers SET ${setClause} WHERE customer_uuid = ?`,
          [...values, id]
      );

      const [updatedRows] = await db.execute<RowDataPacket[]>('SELECT id as db_id, customer_uuid as id, name, phone, email, address, personal_id as personalId, card_number as cardNumber FROM customers WHERE customer_uuid = ?', [id]);
      return updatedRows[0] as Customer || null;
    } finally {
      await db.end();
    }
}

/**
 * Deletes a customer from the database.
 */
export async function deleteCustomer(id: string): Promise<void> {
    const db = await getDbConnection();
    try {
      // In a real app, you would add checks here to ensure you are not deleting a customer
      // who has outstanding invoices or a history of sales you want to preserve.
      await db.execute('DELETE FROM customers WHERE customer_uuid = ?', [id]);
    } finally {
      await db.end();
    }
}
