const { query } = require('../config/db')

async function findByEmail(email) {
  const rows = await query(
    `SELECT
      id,
      name,
      email,
      phone,
      password AS passwordHash,
      latitude,
      longitude,
      role
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email]
  )
  return rows[0] || null
}

async function createUser({ name, email, phone, passwordHash, latitude, longitude, role = 'customer' }) {
  const result = await query(
    `INSERT INTO users (name, email, phone, password, latitude, longitude, role)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, email, phone, passwordHash, latitude, longitude, role]
  )
  return { id: result.insertId, name, email, phone, latitude, longitude, role }
}

async function findById(id) {
  const rows = await query(
    `SELECT
      id,
      name,
      email,
      phone,
      latitude,
      longitude,
      role,
      created_at AS createdAt
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [id]
  )
  return rows[0] || null
}

module.exports = {
  findByEmail,
  createUser,
  findById,
}
