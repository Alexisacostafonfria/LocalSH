// src/lib/mysql.ts
import mysql from 'mysql2/promise';

// Valida que las variables de entorno esenciales estén presentes
if (!process.env.MYSQL_HOST || !process.env.MYSQL_USER || !process.env.MYSQL_DATABASE) {
  throw new Error("Variables de entorno de MySQL (HOST, USER, DATABASE) deben estar definidas");
}

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test de conexión inicial para feedback temprano en el servidor.
pool.getConnection()
  .then(conn => {
    console.log('MySQL - Conexión exitosa al pool.');
    conn.release();
  })
  .catch(err => {
    console.error('MySQL - Error al conectar con el pool de la base de datos:', err);
    // En un entorno de producción, podrías querer que la aplicación no inicie si no puede conectar a la BD.
    // process.exit(1);
  });

/**
 * Ejecuta una consulta SQL usando el pool de conexiones.
 * @param sql La sentencia SQL a ejecutar.
 * @param params Un array de parámetros para la consulta preparada.
 * @returns El resultado de la consulta.
 */
export async function query<T>(sql: string, params?: any[]): Promise<T> {
  const [results] = await pool.execute(sql, params);
  return results as T;
}

export default pool;
