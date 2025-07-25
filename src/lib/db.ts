'use server';
// src/lib/db.ts
import mysql from 'mysql2/promise';

// NOTE: These credentials are now read from environment variables.
// It is highly recommended to create a .env.local file in the root of your project
// and add your database credentials there. See the .env file for an example.
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // You might need to add flags for some cloud providers like PlanetScale
  // ssl: {"rejectUnauthorized":true}
};

/**
 * Creates and returns a new database connection.
 * It's crucial to close the connection after use.
 */
export async function getDbConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    // console.log("Database connection successful.");
    return connection;
  } catch (error) {
    console.error("Database connection failed:", error);
    if (error instanceof Error) {
        if ('code' in error && error.code === 'ETIMEDOUT') {
            throw new Error('Connection to the database timed out. Please check your DB_HOST in .env and ensure the database server is accessible and not blocked by a firewall.');
        }
        if ('code' in error && error.code === 'ECONNREFUSED') {
            throw new Error('Connection refused. Please check if your database server is running and the credentials in .env are correct.');
        }
    }
    throw new Error("Could not connect to the database. Verify all DB settings in your .env file.");
  }
}
