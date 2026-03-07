const { query } = require('../config/db')

async function findByEmail(email) {
  const rows = await query(
    `SELECT id, name, email, password AS passwordHash, created_at AS createdAt
     FROM admins WHERE email = ? LIMIT 1`,
    [email]
  )
  return rows[0] || null
}

async function findById(id) {
  const rows = await query(
    `SELECT id, name, email, created_at AS createdAt
     FROM admins WHERE id = ? LIMIT 1`,
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
