const { query } = require('../config/db')

async function createNotification({ userId, message, type = 'order_assigned', orderId = null }) {
  const safeUserId = Number(userId)
  if (!safeUserId || Number.isNaN(safeUserId)) {
    const err = new Error('valid userId is required to create notification')
    err.statusCode = 400
    throw err
  }

  const safeMessage = String(message || '').trim()
  if (!safeMessage) {
    const err = new Error('notification message is required')
    err.statusCode = 400
    throw err
  }

  const safeType = String(type || 'order_assigned').trim() || 'order_assigned'
  const safeOrderId = orderId != null ? Number(orderId) : null

  const result = await query(
    `INSERT INTO notifications (user_id, message, type, order_id, is_read)
     VALUES (?, ?, ?, ?, 0)`,
    [safeUserId, safeMessage, safeType, Number.isNaN(safeOrderId) ? null : safeOrderId]
  )

  return { id: result.insertId }
}

async function listNotificationsForUser(userId, { limit = 50 } = {}) {
  const safeUserId = Number(userId)
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50))

  if (!safeUserId || Number.isNaN(safeUserId)) return []

  return query(
    `SELECT
       id,
       user_id AS userId,
       message,
       type,
       order_id AS orderId,
       created_at AS createdAt,
       is_read AS isRead
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC, id DESC
     LIMIT ?`,
    [safeUserId, safeLimit]
  )
}

module.exports = {
  createNotification,
  listNotificationsForUser,
}
