// src/lib/db.ts
import mysql from 'mysql2/promise';

// This creates a connection pool, which is better for performance
// than creating a new connection for every query.
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: Number(process.env.MYSQL_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// We export the pool so we can use it in our API routes.
export default pool;
