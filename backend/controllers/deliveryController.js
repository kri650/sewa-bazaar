const deliveryModel = require('../models/deliveryModel')
const { notifyOrderStatusUpdate } = require('../utils/socketServer')

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
 * Body: { status: 'accepted' | 'picked_up' | 'out_for_delivery' | 'delivered' }
 */
async function updateStatus(req, res) {
  try {
    const orderId = Number(req.params.orderId)
    const { status } = req.body || {}

    if (!status) return res.status(400).json({ error: 'status is required' })

    const result = await deliveryModel.updateOrderStatus(orderId, req.userId, status)

    if (!result.ok) {
      const code = result.reason === 'order_not_found_or_not_yours' ? 404 : 400
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

module.exports = { getMyOrders, getOrderItems, updateStatus }
