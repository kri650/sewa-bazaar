const { pool, query } = require('../config/db')

const ORDER_STATUS_ENUM = [
  'placed',
  'confirmed',
  'packed',
  'ready_for_pickup',
  'assigned',
  'picked_up',
  'out_for_delivery',
  'delivered',
  'cancelled',
]

const ORDER_STATUS_ENUM_SQL = ORDER_STATUS_ENUM.map((status) => `'${status}'`).join(',')

let deliveryStatusStorageVerified = false

async function resolveDeliveryAssignmentIds(executor, deliveryUserId) {
  const numericUserId = Number(deliveryUserId)
  if (!numericUserId || Number.isNaN(numericUserId)) return []

  const ids = new Set([numericUserId])

  const [userRows] = await executor.query(
    `SELECT email
     FROM users
     WHERE id = ? AND role = 'delivery'
     LIMIT 1`,
    [numericUserId]
  )

  const email = String(userRows?.[0]?.email || '').trim().toLowerCase()
  if (!email) return Array.from(ids)

  const [partnerRows] = await executor.query(
    `SELECT id
     FROM delivery_partners
     WHERE LOWER(TRIM(email)) = ?`,
    [email]
  )

  for (const row of partnerRows) {
    const partnerId = Number(row.id)
    if (partnerId && !Number.isNaN(partnerId)) ids.add(partnerId)
  }

  return Array.from(ids)
}

/** Get all orders assigned to this delivery partner */
async function getMyOrders(deliveryPartnerId) {
  const assignmentIds = await resolveDeliveryAssignmentIds(pool, deliveryPartnerId)
  if (assignmentIds.length === 0) return []

  const placeholders = assignmentIds.map(() => '?').join(', ')

  return query(
    `SELECT
      o.id,
      COALESCE(
        NULLIF(TRIM(o.customer_name), ''),
        (
          SELECT ua.full_name
          FROM user_addresses ua
          WHERE ua.user_id = o.user_id
          ORDER BY ua.is_default DESC, ua.id DESC
          LIMIT 1
        )
      ) AS customerName,
      COALESCE(
        NULLIF(TRIM(o.customer_phone), ''),
        (
          SELECT ua.phone
          FROM user_addresses ua
          WHERE ua.user_id = o.user_id
          ORDER BY ua.is_default DESC, ua.id DESC
          LIMIT 1
        )
      ) AS customerPhone,
      COALESCE(
        NULLIF(TRIM(o.address_line1), ''),
        (
          SELECT ua.street
          FROM user_addresses ua
          WHERE ua.user_id = o.user_id
          ORDER BY ua.is_default DESC, ua.id DESC
          LIMIT 1
        )
      ) AS addressLine1,
      NULLIF(TRIM(o.address_line2), '') AS addressLine2,
      COALESCE(
        NULLIF(TRIM(o.city), ''),
        (
          SELECT ua.city
          FROM user_addresses ua
          WHERE ua.user_id = o.user_id
          ORDER BY ua.is_default DESC, ua.id DESC
          LIMIT 1
        )
      ) AS city,
      COALESCE(
        NULLIF(TRIM(o.state), ''),
        (
          SELECT ua.state
          FROM user_addresses ua
          WHERE ua.user_id = o.user_id
          ORDER BY ua.is_default DESC, ua.id DESC
          LIMIT 1
        )
      ) AS state,
      COALESCE(
        NULLIF(TRIM(o.pincode), ''),
        (
          SELECT ua.pincode
          FROM user_addresses ua
          WHERE ua.user_id = o.user_id
          ORDER BY ua.is_default DESC, ua.id DESC
          LIMIT 1
        )
      ) AS pincode,
      COALESCE(NULLIF(o.total_amount, 0), NULLIF(o.total, 0), items.itemsTotal, 0) AS total,
      COALESCE(items.orderedItems, '') AS orderedItems,
      COALESCE(items.itemCount, 0) AS itemCount,
      o.status,
      o.payment_method AS paymentMethod,
      o.created_at AS createdAt
    FROM orders o
    LEFT JOIN (
      SELECT
        oi.order_id AS orderId,
        SUM(COALESCE(oi.qty, 0) * COALESCE(oi.price, 0)) AS itemsTotal,
        SUM(COALESCE(oi.qty, 0)) AS itemCount,
        GROUP_CONCAT(
          CONCAT(COALESCE(NULLIF(TRIM(oi.product_name), ''), 'Item'), ' x', COALESCE(oi.qty, 0))
          ORDER BY oi.id ASC
          SEPARATOR ', '
        ) AS orderedItems
      FROM order_items oi
      GROUP BY oi.order_id
    ) items ON items.orderId = o.id
    WHERE o.delivery_partner_id IN (${placeholders})
    ORDER BY o.created_at DESC`,
    assignmentIds
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

// Canonical delivery flow expected by both warehouse and delivery dashboards.
const DELIVERY_STATUS_FLOW = ['assigned', 'picked_up', 'out_for_delivery', 'delivered']

function parseEnumValues(columnType) {
  return Array.from(String(columnType || '').matchAll(/'([^']+)'/g), (match) => match[1])
}

function hasAllExpectedStatuses(columnType) {
  const currentValues = new Set(parseEnumValues(columnType))
  return ORDER_STATUS_ENUM.every((status) => currentValues.has(status))
}

async function ensureDeliveryStatusStorage(conn) {
  if (deliveryStatusStorageVerified) return

  const [columns] = await conn.query(
    `SELECT TABLE_NAME AS tableName, COLUMN_TYPE AS columnType
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND COLUMN_NAME = 'status'
       AND TABLE_NAME IN ('orders', 'order_status_history')`
  )

  const byTable = new Map(columns.map((column) => [column.tableName, column]))

  const ordersStatusColumn = byTable.get('orders')
  const historyStatusColumn = byTable.get('order_status_history')

  if (!ordersStatusColumn) {
    throw new Error('orders.status column not found')
  }

  if (!hasAllExpectedStatuses(ordersStatusColumn.columnType)) {
    await conn.query(
      `ALTER TABLE orders MODIFY COLUMN status ENUM(${ORDER_STATUS_ENUM_SQL}) NOT NULL DEFAULT 'placed'`
    )
  }

  if (historyStatusColumn && !hasAllExpectedStatuses(historyStatusColumn.columnType)) {
    await conn.query(
      `ALTER TABLE order_status_history MODIFY COLUMN status ENUM(${ORDER_STATUS_ENUM_SQL}) NOT NULL`
    )
  }

  deliveryStatusStorageVerified = true
}

function normalizeDeliveryStatus(status) {
  const raw = String(status || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

  if (!raw) return 'assigned'

  const canonical = {
    ready: 'ready_for_pickup',
    ready_for_pickup: 'ready_for_pickup',
    readyforpickup: 'ready_for_pickup',
    accepted: 'assigned',
    assign: 'assigned',
    assigned: 'assigned',
    pickedup: 'picked_up',
    picked_up: 'picked_up',
    outfordelivery: 'out_for_delivery',
    out_for_delivery: 'out_for_delivery',
    delivered: 'delivered',
    cancelled: 'cancelled',
    canceled: 'cancelled',
  }[raw] || raw

  // Treat every pre-delivery warehouse stage as the delivery "assigned" stage.
  if (['placed', 'pending', 'confirmed', 'packed', 'ready_for_pickup', 'assigned'].includes(canonical)) {
    return 'assigned'
  }

  return canonical
}

async function insertCodCollection(conn, orderId, deliveryPartnerId, amount) {
  try {
    await conn.query(
      `INSERT INTO cod_collections (order_id, delivery_partner_id, amount, status, collected_at)
       VALUES (?, ?, ?, 'pending', NOW())
       ON DUPLICATE KEY UPDATE
         delivery_partner_id = VALUES(delivery_partner_id),
         amount = VALUES(amount),
         collected_at = VALUES(collected_at)`,
      [orderId, deliveryPartnerId, amount]
    )
  } catch (error) {
    // Some deployments are missing the warehouse COD migration. Delivery completion
    // should still succeed even if this bookkeeping table is not present yet.
    if (error?.code === 'ER_NO_SUCH_TABLE') return
    throw error
  }
}

async function updateOrderStatus(orderId, deliveryPartnerId, newStatus) {
  const requested = normalizeDeliveryStatus(newStatus)

  if (!DELIVERY_STATUS_FLOW.includes(requested)) {
    return { ok: false, reason: 'invalid_status', received: newStatus, normalized: requested, allowed: DELIVERY_STATUS_FLOW }
  }

  const conn = await pool.getConnection()

  try {
    await ensureDeliveryStatusStorage(conn)
    await conn.beginTransaction()

    const assignmentIds = await resolveDeliveryAssignmentIds(conn, deliveryPartnerId)
    if (assignmentIds.length === 0) {
      await conn.rollback()
      return { ok: false, reason: 'order_not_found_or_not_yours' }
    }

    const placeholders = assignmentIds.map(() => '?').join(', ')

    const [rows] = await conn.query(
      `SELECT id, user_id AS userId, status, payment_method AS paymentMethod,
              COALESCE(total_amount, total) AS totalAmount,
              delivery_partner_id AS assignedDeliveryPartnerId
       FROM orders
       WHERE id = ? AND delivery_partner_id IN (${placeholders})
       LIMIT 1`,
      [orderId, ...assignmentIds]
    )

    if (rows.length === 0) {
      await conn.rollback()
      return { ok: false, reason: 'order_not_found_or_not_yours' }
    }

    const current = normalizeDeliveryStatus(rows[0].status)
    const currentIdx = DELIVERY_STATUS_FLOW.indexOf(current)
    const newIdx = DELIVERY_STATUS_FLOW.indexOf(requested)

    if (currentIdx === -1) {
      await conn.rollback()
      return { ok: false, reason: 'invalid_current_status', dbStatus: rows[0].status, normalized: current, allowed: DELIVERY_STATUS_FLOW }
    }

    if (newIdx < currentIdx || newIdx > currentIdx + 1) {
      await conn.rollback()
      return { ok: false, reason: 'invalid_status_transition', from: current, to: requested, allowed: DELIVERY_STATUS_FLOW }
    }

    // Persist canonical delivery status values to keep dashboards consistent.
    await conn.query('UPDATE orders SET status = ? WHERE id = ?', [requested, orderId])

    const [updatedRows] = await conn.query(
      'SELECT status FROM orders WHERE id = ? LIMIT 1',
      [orderId]
    )

    if (updatedRows[0]?.status !== requested) {
      await conn.rollback()
      return {
        ok: false,
        reason: 'status_persist_failed',
        requested,
        persisted: updatedRows[0]?.status ?? null,
      }
    }

    await conn.query(
      `INSERT INTO order_status_history (order_id, status) VALUES (?, ?)`,
      [orderId, requested]
    )

    if (requested === 'delivered') {
      await conn.query(
        `UPDATE delivery_partners SET status = 'active' WHERE id = ?`,
        [rows[0].assignedDeliveryPartnerId]
      )

      if (rows[0].paymentMethod === 'cod') {
        await insertCodCollection(conn, orderId, rows[0].assignedDeliveryPartnerId, Number(rows[0].totalAmount || 0))
      }
    }

    await conn.commit()

    return { ok: true, orderId, newStatus: requested, customerUserId: rows[0].userId }
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

module.exports = { getMyOrders, getOrderItems, updateOrderStatus, DELIVERY_STATUS_FLOW }
