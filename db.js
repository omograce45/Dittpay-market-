// db.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,       // e.g. metro.proxy.rlwy.net
  user: process.env.DB_USER,       // usually "root"
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,   // e.g. railway
  port: process.env.DB_PORT,       // e.g. 55713
  waitForConnections: true,
  connectionLimit: 10,
});

// ✅ Export as default (so it works with "import db from './db.js'")
export default pool;
