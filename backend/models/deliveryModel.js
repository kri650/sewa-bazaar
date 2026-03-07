const { query } = require('../config/db')

/** Get all orders assigned to this delivery partner */
async function getMyOrders(deliveryUserId) {
  return query(
    `SELECT
      o.id,
      o.customer_name  AS customerName,
      o.customer_phone AS customerPhone,
      o.address_line1  AS addressLine1,
      o.address_line2  AS addressLine2,
      o.city,
      o.state,
      o.pincode,
      o.total,
      o.status,
      o.payment_method AS paymentMethod,
      o.created_at     AS createdAt
    FROM orders o
    WHERE o.delivery_partner_id = ?
    ORDER BY o.created_at DESC`,
    [deliveryUserId]
  )
}

/** Get order items for a specific order */
async function getOrderItems(orderId) {
  return query(
    `SELECT
      oi.product_name AS name,
      oi.qty,
      oi.price
    FROM order_items oi
    WHERE oi.order_id = ?`,
    [orderId]
  )
}

/**
 * Delivery boy updates the order status.
 * Allowed transitions (in order):
 *   confirmed → accepted → picked_up → out_for_delivery → delivered
 */
const DELIVERY_STATUS_FLOW = ['confirmed', 'accepted', 'picked_up', 'out_for_delivery', 'delivered']

async function updateOrderStatus(orderId, deliveryUserId, newStatus) {
  if (!DELIVERY_STATUS_FLOW.includes(newStatus)) {
    return { ok: false, reason: 'invalid_status' }
  }

  const rows = await query(
    `SELECT id, user_id AS userId, status FROM orders
     WHERE id = ? AND delivery_partner_id = ? LIMIT 1`,
    [orderId, deliveryUserId]
  )
  if (rows.length === 0) return { ok: false, reason: 'order_not_found_or_not_yours' }

  const current = rows[0].status
  const currentIdx = DELIVERY_STATUS_FLOW.indexOf(current)
  const newIdx     = DELIVERY_STATUS_FLOW.indexOf(newStatus)

  // Must move forward (or allow same -> same for idempotency)
  if (newIdx < currentIdx) return { ok: false, reason: 'cannot_go_backwards' }

  await query('UPDATE orders SET status = ? WHERE id = ?', [newStatus, orderId])
  return { ok: true, orderId, newStatus, customerUserId: rows[0].userId }
}

module.exports = { getMyOrders, getOrderItems, updateOrderStatus, DELIVERY_STATUS_FLOW }
