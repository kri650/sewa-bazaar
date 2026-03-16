const { query } = require('../config/db')

let deliveryPartnerPasswordColumnExists = null

async function hasDeliveryPartnerPasswordColumn() {
  if (deliveryPartnerPasswordColumnExists !== null) return deliveryPartnerPasswordColumnExists

  const rows = await query(
    `SELECT 1
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'delivery_partners'
       AND COLUMN_NAME = 'password'
     LIMIT 1`
  )

  deliveryPartnerPasswordColumnExists = rows.length > 0
  return deliveryPartnerPasswordColumnExists
}

async function findPartnerByEmail(email) {
  const includePassword = await hasDeliveryPartnerPasswordColumn()

  const rows = await query(
    `SELECT
       id,
       name,
       email,
       phone,
       ${includePassword ? 'password' : 'NULL'} AS passwordHash,
       warehouse_id AS warehouseId,
       status,
       created_at AS createdAt
     FROM delivery_partners
     WHERE LOWER(TRIM(email)) = ?
     LIMIT 1`,
    [String(email || '').trim().toLowerCase()]
  )

  return rows[0] || null
}

async function findPartnerById(id) {
  const rows = await query(
    `SELECT
       id,
       name,
       email,
       phone,
       warehouse_id AS warehouseId,
       status,
       created_at AS createdAt
     FROM delivery_partners
     WHERE id = ?
     LIMIT 1`,
    [Number(id)]
  )

  return rows[0] || null
}

module.exports = {
  findPartnerByEmail,
  findPartnerById,
}
