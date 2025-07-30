
'use server';
// src/services/settingsService.ts
import { getDbConnection } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

/**
 * Retrieves a setting value from the database by its key.
 * @param key The key of the setting to retrieve.
 * @returns The setting value, or null if not found.
 */
export async function getSetting<T>(key: string): Promise<T | null> {
  const db = await getDbConnection();
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT setting_value FROM settings WHERE setting_key = ?',
      [key]
    );
    if (rows.length === 0) {
      return null;
    }
    // The value is stored as a JSON string (in a TEXT column), so we need to parse it.
    try {
        return JSON.parse(rows[0].setting_value);
    } catch (e) {
        // If it's not a valid JSON (e.g., a simple string was stored), return as is.
        return rows[0].setting_value;
    }
  } finally {
    await db.end();
  }
}

/**
 * Creates or updates a setting in the database.
 * @param key The key of the setting.
 * @param value The value of the setting.
 */
export async function setSetting<T>(key: string, value: T): Promise<void> {
  const db = await getDbConnection();
  try {
    const jsonValue = JSON.stringify(value);
    // Use INSERT ... ON DUPLICATE KEY UPDATE to handle both creation and update
    await db.execute(
      `INSERT INTO settings (setting_key, setting_value) 
       VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE setting_value = ?`,
      [key, jsonValue, jsonValue]
    );
  } finally {
    await db.end();
  }
}
