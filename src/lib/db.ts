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
