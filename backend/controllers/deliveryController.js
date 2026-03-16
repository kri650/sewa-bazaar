const deliveryModel = require('../models/deliveryModel')
const notificationModel = require('../models/notificationModel')
const { notifyOrderStatusUpdate } = require('../utils/socketServer')

function normalizeStatusInput(rawStatus) {
  const value = String(rawStatus || '').trim().toLowerCase()
  if (!value) return ''

  const map = {
    'picked up': 'picked_up',
    picked_up: 'picked_up',
    'out for delivery': 'out_for_delivery',
    out_for_delivery: 'out_for_delivery',
    delivered: 'delivered',
    assigned: 'assigned',
    ready_for_pickup: 'ready_for_pickup',
    'ready for pickup': 'ready_for_pickup',
  }

  return map[value] || value
}

/** GET /delivery/orders — all orders assigned to me */
async function getMyOrders(req, res) {
  try {
    const orders = await deliveryModel.getMyOrders(req.userId)
    return res.json(orders)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

/** GET /delivery/orders/:orderId/items */
async function getOrderItems(req, res) {
  try {
    const items = await deliveryModel.getOrderItems(Number(req.params.orderId))
    return res.json(items)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

/**
 * PUT /delivery/orders/:orderId/status
 * Body: { status: 'packed' | 'out_for_delivery' | 'delivered' }
 */
async function updateStatus(req, res) {
  try {
    const orderId = Number(req.params.orderId || req.body?.order_id || req.body?.orderId)
    const status = normalizeStatusInput(req.body?.status)

    if (!orderId || !status) return res.status(400).json({ error: 'order_id and status are required' })

    const result = await deliveryModel.updateOrderStatus(orderId, req.userId, status)

    if (!result.ok) {
      const code = result.reason === 'order_not_found_or_not_yours'
        ? 404
        : result.reason === 'status_persist_failed'
          ? 500
          : 400
      return res.status(code).json({ error: result.reason })
    }

    // Push real-time update to customer + admins via Socket.io
    notifyOrderStatusUpdate(result.customerUserId, {
      orderId,
      status,
      deliveryPartnerId: req.userId,
      updatedAt: new Date().toISOString(),
    })

    return res.json({ ok: true, orderId, status })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

async function getNotifications(req, res) {
  try {
    const notifications = await notificationModel.listNotificationsForUser(req.userId)
    return res.json({ notifications })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

module.exports = { getMyOrders, getOrderItems, updateStatus, getNotifications }
