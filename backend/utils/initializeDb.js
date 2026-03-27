/**
 * Database initialization utility
 * Ensures all required tables and columns exist
 * Runs migrations on application startup
 */

const { query } = require('../config/db')
const fs = require('fs')
const path = require('path')

/**
 * Initialize database schema
 * Runs schema.sql and all migrations to ensure required tables and columns exist
 */
async function initializeDatabase() {
  try {
    console.log('[DB Init] Starting database initialization...')

    // First run the main schema to create all tables
    await runSchema()

    // Run flash sale migration
    await runMigration('flash_sale_products.sql')

    // Run other migrations
    await runMigration('products_discounts_coupons.sql')
    await runMigration('user_dashboard.sql')

    console.log('[DB Init] Database initialization completed successfully')
    return { ok: true, message: 'Database initialized' }
  } catch (error) {
    console.error('[DB Init] Database initialization failed:', error.message)
    return { ok: false, error: error.message }
  }
}

/**
 * Run the main schema file to create all required tables
 */
async function runSchema() {
  try {
    const filepath = path.join(__dirname, '..', 'schema.sql')
    if (!fs.existsSync(filepath)) {
      console.log('[DB Schema] schema.sql not found, skipping')
      return
    }

    const sql = fs.readFileSync(filepath, 'utf8')
    const statements = sql.split(';').filter(stmt => stmt.trim())

    for (const statement of statements) {
      if (statement.trim()) {
        await query(statement)
      }
    }
    console.log('[DB Schema] Main schema executed successfully')
  } catch (error) {
    console.error('[DB Schema] Error running schema.sql:', error.message)
    throw error
  }
}

/**
 * Run a migration file
 * @param {string} filename - Name of migration file in /migrations directory
 */
async function runMigration(filename) {
  try {
    const filepath = path.join(__dirname, '..', 'migrations', filename)
    if (!fs.existsSync(filepath)) {
      console.log(`[DB Migration] ${filename} not found, skipping`)
      return
    }

    const sql = fs.readFileSync(filepath, 'utf8')
    const statements = sql.split(';').filter(stmt => stmt.trim())

    for (const statement of statements) {
      if (statement.trim()) {
        await query(statement)
        console.log(`[DB Migration] Executed: ${filename}`)
      }
    }
  } catch (error) {
    console.error(`[DB Migration] Error running ${filename}:`, error.message)
    throw error
  }
}

/**
 * Check if a column exists in a table
 * @param {string} table - Table name
 * @param {string} column - Column name
 */
async function columnExists(table, column) {
  try {
    const rows = await query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [table, column]
    )
    return rows.length > 0
  } catch (error) {
    console.error(`[DB Check] Error checking column ${table}.${column}:`, error.message)
    return false
  }
}

/**
 * Check if a table exists
 * @param {string} table - Table name
 */
async function tableExists(table) {
  try {
    const rows = await query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
      [table]
    )
    return rows.length > 0
  } catch (error) {
    console.error(`[DB Check] Error checking table ${table}:`, error.message)
    return false
  }
}

module.exports = {
  initializeDatabase,
  runSchema,
  runMigration,
  columnExists,
  tableExists,
}
