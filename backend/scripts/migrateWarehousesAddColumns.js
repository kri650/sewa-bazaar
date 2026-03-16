/**
 * Migration: Add missing columns to warehouses table
 * Adds: address, city, state, pincode
 *
 * Run: npm run migrate:warehouses
 */
require('dotenv').config()
const mysql = require('mysql2/promise')

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '',
}

async function run() {
  let conn
  try {
    conn = await mysql.createConnection(dbConfig)
    console.log('Connected to DB\n')

    try {
      await conn.execute('ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS address TEXT NULL')
      console.log('✓ warehouses.address column added/verified')
    } catch (e) {
      console.log('⚠ warehouses.address:', e.message.slice(0, 80))
    }

    try {
      await conn.execute('ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS city VARCHAR(100) NULL')
      console.log('✓ warehouses.city column added/verified')
    } catch (e) {
      console.log('⚠ warehouses.city:', e.message.slice(0, 80))
    }

    try {
      await conn.execute('ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS state VARCHAR(100) NULL')
      console.log('✓ warehouses.state column added/verified')
    } catch (e) {
      console.log('⚠ warehouses.state:', e.message.slice(0, 80))
    }

    try {
      await conn.execute('ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS pincode VARCHAR(10) NULL')
      console.log('✓ warehouses.pincode column added/verified')
    } catch (e) {
      console.log('⚠ warehouses.pincode:', e.message.slice(0, 80))
    }

    // Verify table structure
    const [columns] = await conn.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'warehouses' AND TABLE_SCHEMA = ?`,
      [dbConfig.database]
    )
    
    const columnNames = columns.map(c => c.COLUMN_NAME)
    console.log('\n✓ Warehouses table columns:')
    console.log('  ' + columnNames.join(', '))

    const required = ['address', 'city', 'state', 'pincode']
    const missing = required.filter(c => !columnNames.includes(c))
    if (missing.length > 0) {
      console.log('\n⚠ WARNING: Missing columns:', missing.join(', '))
      process.exit(1)
    }

    console.log('\n✅ Warehouses schema migration complete')
    process.exit(0)
  } catch (err) {
    console.error('Migration failed:', err.message)
    process.exit(1)
  } finally {
    if (conn) await conn.end()
  }
}

run()
