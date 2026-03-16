/**
 * Migration: Recreate warehouse_admins as a standalone auth table.
 *
 * The old table linked user_id → warehouse_id.
 * The new table is a self-contained auth table:
 *   id, name, email, password, warehouse_id (nullable), created_at
 *
 * Run: node backend/scripts/migrateWarehouseAdmins.js
 */

require('dotenv').config()
const mysql = require('mysql2/promise')

const dbConfig = {
  host:     process.env.DB_HOST     || 'auth-db2207.hstgr.io',
  user:     process.env.DB_USER     || 'u624747819_sewabazaar',
  password: process.env.DB_PASSWORD || 'Sewabazaar@6564',
  database: process.env.DB_NAME     || 'u624747819_sewabazaardb',
}

async function run() {
  const conn = await mysql.createConnection(dbConfig)
  console.log('Connected to DB')

  try {
    // Drop the old table (user_id + warehouse_id link table)
    await conn.execute(`DROP TABLE IF EXISTS warehouse_admins`)
    console.log('Dropped old warehouse_admins table')

    // Create the new standalone auth table
    await conn.execute(`
      CREATE TABLE warehouse_admins (
        id           INT          NOT NULL AUTO_INCREMENT,
        name         VARCHAR(100) NOT NULL,
        email        VARCHAR(150) NOT NULL,
        password     VARCHAR(255) NOT NULL,
        warehouse_id INT          NULL DEFAULT NULL,
        created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_wh_admin_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)
    console.log('Created new warehouse_admins table')

    console.log('\nMigration complete.')
    console.log('You can now create warehouse admin accounts via:')
    console.log('  POST /api/warehouse-admin')
    console.log('  Body: { "name": "...", "email": "...", "password": "..." }')
  } finally {
    await conn.end()
  }
}

run().catch(err => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})
