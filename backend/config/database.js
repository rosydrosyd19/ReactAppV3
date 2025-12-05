const mariadb = require('mariadb');
require('dotenv').config();

// Create connection pool
const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'rosyd',
  password: process.env.DB_PASSWORD || 'rosyd1298',
  database: process.env.DB_NAME || 'reactappv3_db',
  connectionLimit: 10,
  acquireTimeout: 30000,
  connectTimeout: 10000
});

// Test connection
async function testConnection() {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('✅ Database connected successfully');
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    return false;
  } finally {
    if (conn) conn.release();
  }
}

// Get connection from pool
async function getConnection() {
  try {
    return await pool.getConnection();
  } catch (err) {
    console.error('Error getting database connection:', err);
    throw err;
  }
}

// Execute query helper
async function query(sql, params = []) {
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(sql, params);
    return result;
  } catch (err) {
    console.error('Query error:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

module.exports = {
  pool,
  testConnection,
  getConnection,
  query
};
