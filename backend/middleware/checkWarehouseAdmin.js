const jwt = require('jsonwebtoken')
const { query } = require('../config/db')

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'

/**
 * Middleware: checkWarehouseAdmin
 *
 * 1. Verifies the Bearer JWT (issued by POST /api/warehouse-admin/login).
 * 2. Confirms role === 'warehouse_admin'.
 * 3. Looks up warehouse_admins by id to get warehouse_id.
 * 4. Attaches req.warehouseAdminId and req.warehouseId to the request.
 */
async function checkWarehouseAdmin(req, res, next) {
  const raw = req.headers.authorization || ''
  if (!raw.startsWith('Bearer '))
    return res.status(401).json({ error: 'authorization token required' })

  const token = raw.slice('Bearer '.length)

  let payload
  try {
    payload = jwt.verify(token, JWT_SECRET)
  } catch (_err) {
    return res.status(401).json({ error: 'invalid or expired token' })
  }

  if (payload.role !== 'warehouse_admin')
    return res.status(403).json({ error: 'forbidden: warehouse admin access required' })

  // Look up warehouse assignment from the standalone warehouse_admins table
  const rows = await query(
    `SELECT id, warehouse_id FROM warehouse_admins WHERE id = ? LIMIT 1`,
    [payload.warehouseAdminId]
  ).catch(() => [])

  if (rows.length === 0)
    return res.status(403).json({ error: 'forbidden: warehouse admin account not found' })

  req.warehouseAdminId = payload.warehouseAdminId
  req.warehouseId      = rows[0].warehouse_id || null
  return next()
}

module.exports = { checkWarehouseAdmin }
