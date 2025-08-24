import mysql from 'mysql2/promise';

export const db = mysql.createPool({
  host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
  user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
  database:
    process.env.MYSQLDATABASE || process.env.DB_NAME || 'finance_system',
  port: Number(process.env.MYSQLPORT || 3306),
});
