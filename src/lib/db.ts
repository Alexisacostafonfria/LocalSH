// src/lib/db.ts
import mysql from 'mysql2/promise';

// NOTE: Replace these with your actual database credentials
// It's highly recommended to use environment variables for this (.env file)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'local_sales_hub',
  // You might need to add flags for some cloud providers like PlanetScale
  // ssl: {"rejectUnauthorized":true}
};

let connection: mysql.Connection | null = null;

export async function getDbConnection() {
  // This basic connection management is for demonstration.
  // In a production serverless environment, you might manage connections differently.
  if (connection && connection.connection.stream.readable) {
    return connection;
  }
  try {
    console.log("Creating new database connection...");
    connection = await mysql.createConnection(dbConfig);
    console.log("Database connection successful.");
    return connection;
  } catch (error) {
    console.error("Database connection failed:", error);
    throw new Error("Could not connect to the database.");
  }
}
