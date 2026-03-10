/**
 * userAddressModel.js
 * -------------------
 * Database queries for the user_addresses table.
 * All queries use prepared statements to prevent SQL injection.
 *
 * Does NOT modify any existing model files.
 */

const { query } = require('../config/db')

/**
 * Return all addresses that belong to a user.
 * Default address (is_default = 1) is listed first.
 */
async function listByUser(userId) {
  return query(
    `SELECT
       id,
       full_name,
       phone,
       street,
       city,
       state,
       pincode,
       country,
       is_default    AS isDefault,
       created_at    AS createdAt
     FROM user_addresses
     WHERE user_id = ?
     ORDER BY is_default DESC, id DESC`,
    [userId]
  )
}

/**
 * Fetch a single address, verifying it belongs to the requesting user.
 * Returns null when not found.
 */
async function findById(userId, addressId) {
  const rows = await query(
    `SELECT
       id,
       full_name,
       phone,
       street,
       city,
       state,
       pincode,
       country,
       is_default AS isDefault
     FROM user_addresses
     WHERE id = ? AND user_id = ?
     LIMIT 1`,
    [addressId, userId]
  )
  return rows[0] || null
}

/**
 * Insert a new address row.
 * Returns the auto-generated id.
 */
async function createAddress({ userId, full_name, phone, street, city, state, pincode, country }) {
  const result = await query(
    `INSERT INTO user_addresses (user_id, full_name, phone, street, city, state, pincode, country)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, full_name, phone, street, city, state, pincode, country]
  )
  return result.insertId
}

/**
 * Delete an address row.
 * The user_id check ensures a user can only delete their own addresses.
 */
async function deleteAddress(userId, addressId) {
  await query(
    'DELETE FROM user_addresses WHERE id = ? AND user_id = ?',
    [addressId, userId]
  )
}

module.exports = {
  listByUser,
  findById,
  createAddress,
  deleteAddress,
}
