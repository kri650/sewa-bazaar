const dotenv = require('dotenv')
const path = require('path')
const mysql = require('mysql2/promise')

dotenv.config({ path: path.join(__dirname, '.env') })

const cfg = {
  host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306),
  user: process.env.DB_USER || process.env.MYSQL_USER || '',
  password: process.env.DB_PASS || process.env.MYSQL_PASSWORD || '',
  database: process.env.DB_NAME || process.env.MYSQL_DATABASE || '',
}

async function run() {
  console.log('DB Config (safe):', {
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    database: cfg.database,
    passwordPresent: Boolean(cfg.password),
  })

  let conn
  try {
    conn = await mysql.createConnection(cfg)
    const [rows] = await conn.query('SELECT 1 AS ok')
    console.log('DB CONNECTED:', rows)
    process.exit(0)
  } catch (err) {
    console.error('DB CONNECT ERROR:', {
      code: err && err.code,
      errno: err && err.errno,
      sqlState: err && err.sqlState,
      message: err && err.message,
    })
    process.exit(1)
  } finally {
    if (conn) await conn.end()
  }
}

run()
