const { pool, query } = require('../config/db')
const { calculateDistanceKm } = require('../utils/distanceCalculator')

const COD_MIN_ORDER_AMOUNT = 200

const ORDER_STATUS_FLOW = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

/**
 * Find the nearest active warehouse. If enforceRadius is true, only warehouses
 * where distance <= max_radius are considered serviceable.
 */
async function findNearestWarehouse(userLat, userLng, { enforceRadius = true } = {}) {
  const warehouses = await query(
    `SELECT
       id,
       name,
       latitude,
       longitude,
       max_radius
     FROM warehouses
     WHERE status = 'active'`
  )

  let nearest = null
  let minDist = Infinity

  for (const wh of warehouses) {
    const dist = calculateDistanceKm(
      Number(userLat),
      Number(userLng),
      Number(wh.latitude),
      Number(wh.longitude)
    )

    const maxRadius = Number(wh.max_radius)
    const withinRadius = Number.isFinite(maxRadius) ? dist <= maxRadius : true
    if (enforceRadius && !withinRadius) continue

    if (dist < minDist) {
      minDist = dist
      nearest = { ...wh, distanceKm: Math.round(dist * 100) / 100 }
    }
  }

  return nearest
}

async function findWarehouseByAddress({ pincode, city, state }) {
  const safePincode = String(pincode || '').trim()
  const safeCity = String(city || '').trim()
  const safeState = String(state || '').trim()

  // 1) Try exact pincode match first (most reliable without geolocation).
  if (safePincode) {
    const rows = await query(
      `SELECT
         id,
         name,
         latitude,
         longitude,
         max_radius,
         pincode,
         city,
         state
       FROM warehouses
       WHERE status = 'active' AND pincode = ?
       ORDER BY id ASC
       LIMIT 1`,
      [safePincode]
    ).catch(() => [])

    if (rows.length > 0) return rows[0]

    // 1b) If exact pincode not configured on warehouses, try first 3-digit region match.
    if (safePincode.length >= 3) {
      const regionRows = await query(
        `SELECT
           id,
           name,
           latitude,
           longitude,
           max_radius,
           pincode,
           city,
           state
         FROM warehouses
         WHERE status = 'active'
           AND LEFT(TRIM(pincode), 3) = LEFT(TRIM(?), 3)
         ORDER BY id ASC
         LIMIT 1`,
        [safePincode]
      ).catch(() => [])

      if (regionRows.length > 0) return regionRows[0]
    }
  }

  // 2) Fall back to city/state exact match.
  if (safeCity && safeState) {
    const rows = await query(
      `SELECT
         id,
         name,
         latitude,
         longitude,
         max_radius,
         pincode,
         city,
         state
       FROM warehouses
       WHERE status = 'active'
         AND LOWER(TRIM(city)) = LOWER(TRIM(?))
         AND LOWER(TRIM(state)) = LOWER(TRIM(?))
       ORDER BY id ASC
       LIMIT 1`,
      [safeCity, safeState]
    ).catch(() => [])

    if (rows.length > 0) return rows[0]
  }

  // 3) Last resort by state when city naming differs (e.g., district/sub-city variance).
  if (safeState) {
    const rows = await query(
      `SELECT
         id,
         name,
         latitude,
         longitude,
         max_radius,
         pincode,
         city,
         state
       FROM warehouses
       WHERE status = 'active'
         AND LOWER(TRIM(state)) = LOWER(TRIM(?))
       ORDER BY id ASC
       LIMIT 1`,
      [safeState]
    ).catch(() => [])

    if (rows.length > 0) return rows[0]
  }

  return null
}

async function getOrCreateActiveCart(userId) {
  const rows = await query(
    `SELECT id
     FROM carts
     WHERE user_id = ? AND status = 'active'
     ORDER BY id DESC
     LIMIT 1`,
    [userId]
  )

  if (rows.length > 0) return rows[0].id

  const result = await query('INSERT INTO carts (user_id, status) VALUES (?, ?)', [userId, 'active'])
  return result.insertId
}

async function fetchCartItems(cartId) {
  return query(
    `SELECT
      ci.product_id AS productId,
      ci.qty,
      p.name,
      p.price,
      p.unit,
      p.image
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = ?
     ORDER BY ci.id DESC`,
    [cartId]
  )
}

async function addCartItem(userId, productId, qty) {
  const cartId = await getOrCreateActiveCart(userId)

  await query(
    `INSERT INTO cart_items (cart_id, product_id, qty)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty)`,
    [cartId, productId, qty]
  )

  return { cartId }
}

async function updateCartItemQty(userId, productId, qty) {
  const cartId = await getOrCreateActiveCart(userId)
  await query('UPDATE cart_items SET qty = ? WHERE cart_id = ? AND product_id = ?', [qty, cartId, productId])
  return { cartId }
}

async function removeCartItem(userId, productId) {
  const cartId = await getOrCreateActiveCart(userId)
  await query('DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?', [cartId, productId])
  return { cartId }
}

async function listWishlist(userId) {
  return query(
    `SELECT
      w.product_id AS productId,
      p.name,
      p.price,
      p.unit,
      p.image,
      p.description
    FROM wishlists w
    JOIN products p ON p.id = w.product_id
    WHERE w.user_id = ?
    ORDER BY w.id DESC`,
    [userId]
  )
}

async function addWishlistItem(userId, productId) {
  await query('INSERT IGNORE INTO wishlists (user_id, product_id) VALUES (?, ?)', [userId, productId])
}

async function removeWishlistItem(userId, productId) {
  await query('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?', [userId, productId])
}

async function createOrder({ userId, items, customer, addressLine1, addressLine2, city, state, pincode, paymentMethod, userLat, userLng }) {
  const conn = await pool.getConnection()

  try {
    let effectiveItems = []
    let activeCartId = null

    if (Array.isArray(items) && items.length > 0) {
      effectiveItems = items.map((item) => ({
        productId: Number(item.id || item.productId) || null,
        slug: String(item.slug || item.id || item.productId || ''),
        qty: Number(item.qty || 1),
        name: item.name || null,
        price: item.price != null ? parseFloat(String(item.price).replace(/[^\d.]/g, '')) || 0 : null,
      }))
    } else if (userId) {
      const [rows] = await conn.query(
        `SELECT c.id AS cartId, ci.product_id AS productId, ci.qty
         FROM carts c
         JOIN cart_items ci ON ci.cart_id = c.id
         WHERE c.user_id = ? AND c.status = 'active'`,
        [userId]
      )

      if (rows.length > 0) {
        activeCartId = rows[0].cartId
        effectiveItems = rows.map((row) => ({ productId: row.productId, qty: row.qty, slug: String(row.productId) }))
      }
    }

    if (effectiveItems.length === 0) {
      const err = new Error('items required (or active cart for logged in user)')
      err.statusCode = 400
      throw err
    }

    const numericItems = effectiveItems.filter((i) => i.productId && !Number.isNaN(i.productId))
    let productMap = new Map()

    if (numericItems.length > 0) {
      const productIds = numericItems.map((i) => i.productId)
      const placeholders = productIds.map(() => '?').join(',')
      const [products] = await conn.query(
        `SELECT id, name, price FROM products WHERE id IN (${placeholders})`,
        productIds
      )
      productMap = new Map(products.map((p) => [Number(p.id), p]))
    }

    const normalizedItems = effectiveItems.map((item) => {
      const dbProd = item.productId ? productMap.get(Number(item.productId)) : null
      return {
        productId: dbProd ? Number(item.productId) : null,
        slug: item.slug || null,
        qty: Math.max(1, Number(item.qty || 1)),
        name: (dbProd ? dbProd.name : item.name) || 'Unknown',
        price: (dbProd ? Number(dbProd.price) : item.price) || 0,
      }
    })

    const total = normalizedItems.reduce((sum, item) => sum + item.price * item.qty, 0)
    const normalizedPaymentMethod = String(paymentMethod || 'cod').toLowerCase() === 'online' ? 'online' : 'cod'

    if (normalizedPaymentMethod === 'cod' && total < COD_MIN_ORDER_AMOUNT) {
      const err = new Error('COD available only for orders above Rs 200')
      err.statusCode = 400
      throw err
    }

    // Assign warehouse_id at order creation time so warehouse dashboards can filter correctly.
    // Prefer geolocation, then address mapping. Do not silently fall back to an unrelated warehouse.
    let effectiveUserLat = userLat
    let effectiveUserLng = userLng

    if ((effectiveUserLat == null || effectiveUserLng == null) && userId) {
      const [userRow] = await conn.query(
        `SELECT latitude, longitude FROM users WHERE id = ? LIMIT 1`,
        [userId]
      )
      const row = Array.isArray(userRow) && userRow.length ? userRow[0] : null
      if (row && (effectiveUserLat == null || effectiveUserLng == null)) {
        effectiveUserLat = row.latitude
        effectiveUserLng = row.longitude
      }
    }

    let assignedWarehouse = null
    if (effectiveUserLat != null && effectiveUserLng != null) {
      assignedWarehouse = await findNearestWarehouse(Number(effectiveUserLat), Number(effectiveUserLng), { enforceRadius: true })
    }

    if (!assignedWarehouse) {
      assignedWarehouse = await findWarehouseByAddress({ pincode, city, state })
    }

    if (!assignedWarehouse) {
      const err = new Error('No serviceable warehouse found for this delivery location')
      err.statusCode = 400
      throw err
    }

    await conn.beginTransaction()

    // Decrease stock from the assigned warehouse's inventory for each product.
    // Guard: if warehouse_inventory isn't set up yet (dev), don't block order creation.
    let hasWarehouseInventory = false
    if (assignedWarehouse) {
      const [invRows] = await conn.query(
        `SELECT 1 FROM warehouse_inventory WHERE warehouse_id = ? LIMIT 1`,
        [assignedWarehouse.id]
      )
      hasWarehouseInventory = Array.isArray(invRows) && invRows.length > 0
    }

    if (assignedWarehouse && hasWarehouseInventory && normalizedItems.length > 0) {
      for (const item of normalizedItems) {
        if (!item.productId) continue

        const qty = Number(item.qty || 0)
        if (!qty || qty <= 0) continue

        const [result] = await conn.query(
          `UPDATE warehouse_inventory
           SET stock_quantity = stock_quantity - ?
           WHERE product_id = ? AND warehouse_id = ? AND stock_quantity >= ?`,
          [qty, item.productId, assignedWarehouse.id, qty]
        )

        if (!result || result.affectedRows === 0) {
          const err = new Error(`insufficient stock for product ${item.productId}`)
          err.statusCode = 400
          throw err
        }
      }
    }

    const [orderResult] = await conn.query(
      `INSERT INTO orders (
        user_id,
        warehouse_id,
        status,
        customer_name,
        customer_phone,
        customer_email,
        address_line1,
        address_line2,
        city,
        state,
        pincode,
        payment_method,
        total,
        total_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        assignedWarehouse ? assignedWarehouse.id : null,
        'placed',
        customer?.name || null,
        customer?.phone || null,
        customer?.email || null,
        addressLine1 || null,
        addressLine2 || null,
        city || null,
        state || null,
        pincode || null,
        normalizedPaymentMethod,
        total,
        total,
      ]
    )

    const orderId = orderResult.insertId

    await conn.query(
      `INSERT INTO order_status_history (order_id, status) VALUES (?, ?)`,
      [orderId, 'placed']
    )

    for (const item of normalizedItems) {
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, product_slug, product_name, qty, price)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.productId || null, item.slug || null, item.name, item.qty, item.price]
      )
    }

    if (userId) {
      if (activeCartId) {
        await conn.query('DELETE FROM cart_items WHERE cart_id = ?', [activeCartId])
      }
      await conn.query("UPDATE carts SET status = 'ordered' WHERE user_id = ? AND status = 'active'", [userId])
    }

    await conn.commit()

    return {
      id: orderId,
      total,
      items: normalizedItems,
      warehouse: assignedWarehouse,
    }
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

async function listOrdersForAdmin() {
  return query(
    `SELECT
      o.id,
      o.user_id AS userId,
      o.customer_name AS customerName,
      o.customer_phone AS customerPhone,
      o.customer_email AS customerEmail,
      o.city,
      o.state,
      o.pincode,
      o.payment_method AS paymentMethod,
      o.status,
      COALESCE(o.total_amount, o.total) AS total,
      o.delivery_partner_id AS deliveryPartnerId,
      dp.name AS deliveryPartnerName,
      o.created_at AS createdAt
     FROM orders o
     LEFT JOIN delivery_partners dp ON dp.id = o.delivery_partner_id
     ORDER BY o.created_at DESC`
  )
}

async function assignDeliveryPartner(orderId, deliveryPartnerId) {
  const deliveryRows = await query(
    `SELECT id, status FROM delivery_partners WHERE id = ? LIMIT 1`,
    [deliveryPartnerId]
  )
  if (deliveryRows.length === 0) return { ok: false, reason: 'delivery_not_found' }
  if (deliveryRows[0].status !== 'active') return { ok: false, reason: 'delivery_not_available' }

  const orderRows = await query(`SELECT id, status FROM orders WHERE id = ? LIMIT 1`, [orderId])
  if (orderRows.length === 0) return { ok: false, reason: 'order_not_found' }

  const currentStatus = orderRows[0].status
  const nextStatus = 'assigned'

  await query(
    `UPDATE orders SET delivery_partner_id = ?, status = ? WHERE id = ?`,
    [deliveryPartnerId, nextStatus, orderId]
  )
  await query(`UPDATE delivery_partners SET status = 'busy' WHERE id = ?`, [deliveryPartnerId])

  if (nextStatus !== currentStatus) {
    await query(
      `INSERT INTO order_status_history (order_id, status) VALUES (?, ?)`,
      [orderId, nextStatus]
    )
  }

  return { ok: true }
}

async function updateOrderStatus(orderId, status) {
  const rows = await query(`SELECT id, status, delivery_partner_id AS deliveryPartnerId FROM orders WHERE id = ? LIMIT 1`, [orderId])
  if (rows.length === 0) return false

  const current = rows[0].status
  const allowed = ORDER_STATUS_FLOW[current] || []
  if (current !== status && !allowed.includes(status)) {
    const error = new Error(`invalid status transition: ${current} -> ${status}`)
    error.statusCode = 400
    throw error
  }

  await query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId])
  await query(`INSERT INTO order_status_history (order_id, status) VALUES (?, ?)`, [orderId, status])

  if ((status === 'delivered' || status === 'cancelled') && rows[0].deliveryPartnerId) {
    await query(`UPDATE delivery_partners SET status = 'active' WHERE id = ?`, [rows[0].deliveryPartnerId])
  }

  return true
}

module.exports = {
  findNearestWarehouse,
  getOrCreateActiveCart,
  fetchCartItems,
  addCartItem,
  updateCartItemQty,
  removeCartItem,
  listWishlist,
  addWishlistItem,
  removeWishlistItem,
  createOrder,
  listOrdersForAdmin,
  assignDeliveryPartner,
  updateOrderStatus,
}
