const { pool, query } = require('../config/db')

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

async function createOrder({ userId, items, customer, addressLine1, addressLine2, city, state, pincode, paymentMethod }) {
  const conn = await pool.getConnection()

  try {
    let effectiveItems = []
    let activeCartId = null

    if (Array.isArray(items) && items.length > 0) {
      effectiveItems = items.map((item) => ({ productId: Number(item.id || item.productId), qty: Number(item.qty || 1) }))
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
        effectiveItems = rows.map((row) => ({ productId: row.productId, qty: row.qty }))
      }
    }

    if (effectiveItems.length === 0) {
      const err = new Error('items required (or active cart for logged in user)')
      err.statusCode = 400
      throw err
    }

    const productIds = effectiveItems.map((item) => item.productId)
    const placeholders = productIds.map(() => '?').join(',')
    const [products] = await conn.query(`SELECT id, name, price FROM products WHERE id IN (${placeholders})`, productIds)

    const productMap = new Map(products.map((p) => [Number(p.id), p]))

    const normalizedItems = effectiveItems.map((item) => {
      const prod = productMap.get(Number(item.productId))
      return {
        productId: Number(item.productId),
        qty: Number(item.qty || 1),
        name: prod ? prod.name : 'Unknown',
        price: prod ? Number(prod.price) : 0,
      }
    })

    const total = normalizedItems.reduce((sum, item) => sum + item.price * item.qty, 0)

    await conn.beginTransaction()

    const [orderResult] = await conn.query(
      `INSERT INTO orders (
        user_id,
        customer_name,
        customer_phone,
        customer_email,
        address_line1,
        address_line2,
        city,
        state,
        pincode,
        payment_method,
        total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        customer?.name || null,
        customer?.phone || null,
        customer?.email || null,
        addressLine1 || null,
        addressLine2 || null,
        city || null,
        state || null,
        pincode || null,
        paymentMethod || 'cod',
        total,
      ]
    )

    const orderId = orderResult.insertId

    for (const item of normalizedItems) {
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, product_name, qty, price)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.productId, item.name, item.qty, item.price]
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
      o.total,
      o.delivery_partner_id AS deliveryPartnerId,
      dp.name AS deliveryPartnerName,
      o.created_at AS createdAt
     FROM orders o
     LEFT JOIN users dp ON dp.id = o.delivery_partner_id
     ORDER BY o.created_at DESC`
  )
}

async function assignDeliveryPartner(orderId, deliveryPartnerId) {
  const deliveryRows = await query(
    `SELECT id FROM users WHERE id = ? AND role = 'delivery' LIMIT 1`,
    [deliveryPartnerId]
  )
  if (deliveryRows.length === 0) return { ok: false, reason: 'delivery_not_found' }

  const result = await query(
    'UPDATE orders SET delivery_partner_id = ? WHERE id = ?',
    [deliveryPartnerId, orderId]
  )
  if (result.affectedRows === 0) return { ok: false, reason: 'order_not_found' }
  return { ok: true }
}

async function updateOrderStatus(orderId, status) {
  const result = await query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId])
  return result.affectedRows > 0
}

module.exports = {
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
