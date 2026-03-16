const { query } = require('../config/db')

async function findByEmail(email) {
  const rows = await query(
    `SELECT id, name, email, password AS passwordHash, warehouse_id AS warehouseId, created_at AS createdAt
     FROM warehouse_admins WHERE email = ? LIMIT 1`,
    [email]
  )
  return rows[0] || null
}

async function findById(id) {
  const rows = await query(
    `SELECT id, name, email, warehouse_id AS warehouseId, created_at AS createdAt
     FROM warehouse_admins WHERE id = ? LIMIT 1`,
    [id]
  )
  return rows[0] || null
}

async function createWarehouseAdmin({ name, email, passwordHash, warehouseId = null }) {
  const result = await query(
    `INSERT INTO warehouse_admins (name, email, password, warehouse_id) VALUES (?, ?, ?, ?)`,
    [name, email, passwordHash, warehouseId]
  )
  return { id: result.insertId, name, email, warehouseId }
}

module.exports = { findByEmail, findById, createWarehouseAdmin }
