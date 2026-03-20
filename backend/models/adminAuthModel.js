const { query } = require('../config/db')

async function findByEmail(email) {
  // First try the legacy `admins` table (some installs use a dedicated admins table)
  const adminRows = await query(
    `SELECT id, name, email, password AS passwordHash, created_at AS createdAt
     FROM admins WHERE email = ? LIMIT 1`,
    [email]
  )
  if (adminRows && adminRows.length > 0) return adminRows[0]

  // Fallback: look up admin users from the users table (other installs store admins in users.role)
  const rows = await query(
    `SELECT id, name, email, password AS passwordHash, created_at AS createdAt, role
     FROM users WHERE email = ? AND role IN ('admin','superadmin') LIMIT 1`,
    [email]
  )
  return rows[0] || null
}

async function findById(id) {
  // Try admins table first
  const adminRows = await query(
    `SELECT id, name, email, created_at AS createdAt
     FROM admins WHERE id = ? LIMIT 1`,
    [id]
  )
  if (adminRows && adminRows.length > 0) return adminRows[0]

  // Fallback to users table
  const rows = await query(
    `SELECT id, name, email, created_at AS createdAt, role
     FROM users WHERE id = ? AND role IN ('admin','superadmin') LIMIT 1`,
    [id]
  )
  return rows[0] || null
}

async function createAdmin({ name, email, passwordHash }) {
  const result = await query(
    `INSERT INTO admins (name, email, password) VALUES (?, ?, ?)`,
    [name, email, passwordHash]
  )
  return { id: result.insertId, name, email }
}

async function listAdmins() {
  return query(`SELECT id, name, email, created_at AS createdAt FROM admins ORDER BY id`)
}

module.exports = { findByEmail, findById, createAdmin, listAdmins }
