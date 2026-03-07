const mysql = require('mysql2/promise')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const dbConfig = {
  host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306),
  user: process.env.DB_USER || process.env.MYSQL_USER || '',
  password: process.env.DB_PASS || process.env.MYSQL_PASSWORD || '',
  database: process.env.DB_NAME || process.env.MYSQL_DATABASE || '',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE || process.env.MYSQL_POOL_SIZE || 10),
  queueLimit: 0,
}

const pool = mysql.createPool(dbConfig)

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params)
  return rows
}

async function checkConnection() {
  try {
    const conn = await pool.getConnection()
    try {
      await conn.query('SELECT 1')
      return { ok: true }
    } finally {
      conn.release()
    }
  } catch (err) {
    return {
      ok: false,
      code: err && err.code ? err.code : 'UNKNOWN',
      message: err && err.message ? err.message : String(err),
    }
  }
}

module.exports = {
  pool,
  query,
  checkConnection,
  dbConfig,
}
