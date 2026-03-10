/**
 * userModelExt.js
 * ---------------
 * Extends the existing user model with findByPhone().
 * Does NOT modify userModel.js — only adds new functionality.
 */

const { query } = require('../config/db')

async function findByPhone(phone) {
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
     WHERE phone = ?
     LIMIT 1`,
    [phone]
  )
  return rows[0] || null
}

module.exports = { findByPhone }
