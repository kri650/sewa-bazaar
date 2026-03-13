/**
 * userDashController.js
 * ---------------------
 * Handles all User Dashboard API endpoints:
 *
 *   GET  /api/user/dashboard           — user profile
 *   GET  /api/user/addresses           — list saved addresses
 *   POST /api/user/addresses           — add a new address
 *   DELETE /api/user/addresses/:id     — remove an address
 *   GET  /api/user/orders              — order history with line items
 *
 * Wishlist endpoints already exist in orderController.js and are
 * NOT duplicated here.
 *
 * Auth: all routes require a valid JWT (req.userId set by requireAuth).
 */

const userModel        = require('../models/userModel')
const userAddressModel = require('../models/userAddressModel')
const { query }        = require('../config/db')

/* ------------------------------------------------------------------ */
/*  Dashboard – user profile                                           */
/* ------------------------------------------------------------------ */

/**
 * GET /api/user/dashboard
 * Returns the authenticated user's profile info.
 * If the user is not logged in the JWT middleware returns 401 first.
 */
async function getDashboard(req, res) {
  try {
    const user = await userModel.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'user not found' })

    return res.json({
      id:        user.id,
      name:      user.name,
      email:     user.email,
      phone:     user.phone,
      role:      user.role,
      createdAt: user.createdAt,
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

/* ------------------------------------------------------------------ */
/*  Address Management                                                 */
/* ------------------------------------------------------------------ */

/**
 * GET /api/user/addresses
 * Returns all saved addresses for the logged-in user.
 */
async function getAddresses(req, res) {
  try {
    const addresses = await userAddressModel.listByUser(req.userId)
    return res.json(addresses)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

/**
 * POST /api/user/addresses
 * Body: { full_name, phone, street, city, state, pincode, country? }
 * Adds a new address for the logged-in user.
 */
async function addAddress(req, res) {
  try {
    const { full_name, phone, street, city, state, pincode, country } = req.body || {}

    if (!full_name || !phone || !street || !city || !state || !pincode) {
      return res.status(400).json({
        error: 'full_name, phone, street, city, state and pincode are required',
      })
    }

    const id = await userAddressModel.createAddress({
      userId: req.userId,
      full_name,
      phone,
      street,
      city,
      state,
      pincode,
      country: country || 'India',
    })

    return res.status(201).json({ id, ok: true })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

/**
 * DELETE /api/user/addresses/:id
 * Removes an address.  Only the address owner can delete it.
 */
async function deleteAddress(req, res) {
  try {
    const address = await userAddressModel.findById(req.userId, req.params.id)
    if (!address) return res.status(404).json({ error: 'address not found' })

    await userAddressModel.deleteAddress(req.userId, req.params.id)
    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

/* ------------------------------------------------------------------ */
/*  Order History                                                      */
/* ------------------------------------------------------------------ */

/**
 * GET /api/user/orders
 * Returns the logged-in user's order history.
 * Each order includes its line items (product name, qty, price).
 *
 * Sample response:
 * [
 *   {
 *     orderId: 42,
 *     status: "delivered",
 *     total: 299.00,
 *     paymentMethod: "cod",
 *     orderDate: "2025-01-15T10:30:00.000Z",
 *     items: [
 *       { productName: "Organic Tomatoes", qty: 2, price: 49.50 }
 *     ]
 *   }
 * ]
 */
async function getOrders(req, res) {
  try {
    const rows = await query(
      `SELECT
         o.id                     AS order_id,
         o.status,
         o.total,
         o.payment_method         AS payment_method,
         o.payment_status         AS payment_status,
         o.payment_txn_id         AS payment_txn_id,
         o.delivery_type          AS delivery_type,
         o.expected_delivery_date AS expected_delivery_date,
         o.delivery_slot          AS delivery_slot,
         o.customer_name          AS customer_name,
         o.customer_phone         AS customer_phone,
         o.address_line1          AS address_line1,
         o.address_line2          AS address_line2,
         o.city,
         o.state,
         o.pincode,
         o.created_at             AS order_date,
         o.updated_at             AS updated_at,
         oi.product_id            AS product_id,
         oi.product_slug          AS product_slug,
         oi.product_name          AS product_name,
         oi.qty,
         oi.price
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = ?
       ORDER BY o.id DESC, oi.id ASC`,
      [req.userId]
    )

    const ordersMap = {}
    for (const row of rows) {
      if (!ordersMap[row.order_id]) {
        ordersMap[row.order_id] = {
          orderId:       row.order_id,
          status:        row.status,
          total:         row.total,
          paymentMethod: row.payment_method,
          paymentStatus: row.payment_status,
          paymentTxnId:  row.payment_txn_id,
          deliveryType:  row.delivery_type,
          expectedDeliveryDate: row.expected_delivery_date,
          deliverySlot:  row.delivery_slot,
          deliveryAddress: {
            name: row.customer_name,
            phone: row.customer_phone,
            line1: row.address_line1,
            line2: row.address_line2,
            city: row.city,
            state: row.state,
            pincode: row.pincode,
          },
          orderDate:     row.order_date,
          updatedAt:     row.updated_at,
          items:         [],
          events:        [],
        }
      }
      ordersMap[row.order_id].items.push({
        productId: row.product_id,
        productSlug: row.product_slug,
        productName: row.product_name,
        qty:         row.qty,
        price:       row.price,
      })
    }

    const orderIds = Object.keys(ordersMap).map((id) => Number(id))
    if (orderIds.length > 0) {
      const placeholders = orderIds.map(() => '?').join(',')
      const events = await query(
        `SELECT order_id, status, note, created_at
         FROM order_status_events
         WHERE order_id IN (${placeholders})
         ORDER BY created_at ASC`,
        orderIds
      )
      for (const ev of events) {
        const order = ordersMap[ev.order_id]
        if (order) {
          order.events.push({
            status: ev.status,
            notes: ev.note,
            createdAt: ev.created_at,
          })
        }
      }
    }

    return res.json(Object.values(ordersMap))
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

/* ------------------------------------------------------------------ */
/*  Order Details + Actions                                            */
/* ------------------------------------------------------------------ */

/**
 * GET /api/user/orders/:id
 * Returns a single order with items and status events.
 */
async function getOrderById(req, res) {
  try {
    const orderId = Number(req.params.id)
    if (Number.isNaN(orderId)) return res.status(400).json({ error: 'valid order id required' })

    const rows = await query(
      `SELECT
         o.id                     AS order_id,
         o.status,
         o.total,
         o.payment_method         AS payment_method,
         o.payment_status         AS payment_status,
         o.payment_txn_id         AS payment_txn_id,
         o.delivery_type          AS delivery_type,
         o.expected_delivery_date AS expected_delivery_date,
         o.delivery_slot          AS delivery_slot,
         o.customer_name          AS customer_name,
         o.customer_phone         AS customer_phone,
         o.address_line1          AS address_line1,
         o.address_line2          AS address_line2,
         o.city,
         o.state,
         o.pincode,
         o.created_at             AS order_date,
         o.updated_at             AS updated_at,
         oi.product_id            AS product_id,
         oi.product_slug          AS product_slug,
         oi.product_name          AS product_name,
         oi.qty,
         oi.price
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = ? AND o.id = ?
       ORDER BY oi.id ASC`,
      [req.userId, orderId]
    )

    if (rows.length === 0) return res.status(404).json({ error: 'order not found' })

    const first = rows[0]
    const order = {
      orderId:       first.order_id,
      status:        first.status,
      total:         first.total,
      paymentMethod: first.payment_method,
      paymentStatus: first.payment_status,
      paymentTxnId:  first.payment_txn_id,
      deliveryType:  first.delivery_type,
      expectedDeliveryDate: first.expected_delivery_date,
      deliverySlot:  first.delivery_slot,
      deliveryAddress: {
        name: first.customer_name,
        phone: first.customer_phone,
        line1: first.address_line1,
        line2: first.address_line2,
        city: first.city,
        state: first.state,
        pincode: first.pincode,
      },
      orderDate: first.order_date,
      updatedAt: first.updated_at,
      items: rows.map((row) => ({
        productId: row.product_id,
        productSlug: row.product_slug,
        productName: row.product_name,
        qty: row.qty,
        price: row.price,
      })),
      events: [],
    }

    const events = await query(
      `SELECT status, note, created_at
       FROM order_status_events
       WHERE order_id = ?
       ORDER BY created_at ASC`,
      [orderId]
    )
    order.events = events.map((ev) => ({
      status: ev.status,
      notes: ev.note,
      createdAt: ev.created_at,
    }))

    return res.json(order)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

/**
 * PUT /api/user/orders/:id/cancel
 * Cancels an order if it is still pending or confirmed.
 */
async function cancelOrder(req, res) {
  try {
    const orderId = Number(req.params.id)
    if (Number.isNaN(orderId)) return res.status(400).json({ error: 'valid order id required' })

    const rows = await query(
      `SELECT id, status
       FROM orders
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [orderId, req.userId]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'order not found' })

    const currentStatus = rows[0].status
    if (currentStatus !== 'pending' && currentStatus !== 'confirmed') {
      return res.status(400).json({ error: 'order cannot be cancelled at this stage' })
    }

    await query('UPDATE orders SET status = ? WHERE id = ?', ['cancelled', orderId])
    await query(
      `INSERT INTO order_status_events (order_id, status, note)
       VALUES (?, ?, ?)`,
      [orderId, 'cancelled', 'Cancelled by customer']
    )

    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

/* ------------------------------------------------------------------ */
/*  Checkout – resolve a saved address                                 */
/* ------------------------------------------------------------------ */

/**
 * GET /api/user/addresses/:id
 * Returns a single saved address by id (used during checkout to
 * pre-fill the order form with a chosen address).
 */
async function getAddress(req, res) {
  try {
    const address = await userAddressModel.findById(req.userId, req.params.id)
    if (!address) return res.status(404).json({ error: 'address not found' })
    return res.json(address)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

/**
 * PUT /api/user/addresses/:id/default
 * Marks an address as the default for the user.
 */
async function setAddressDefault(req, res) {
  try {
    const address = await userAddressModel.findById(req.userId, req.params.id)
    if (!address) return res.status(404).json({ error: 'address not found' })
    await userAddressModel.setDefault(req.userId, req.params.id)
    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

/**
 * PUT /api/user/addresses/:id
 * Updates an existing address.
 */
async function updateAddress(req, res) {
  try {
    const address = await userAddressModel.findById(req.userId, req.params.id)
    if (!address) return res.status(404).json({ error: 'address not found' })

    const { full_name, phone, street, city, state, pincode, country } = req.body || {}
    if (!full_name || !phone || !street || !city || !state || !pincode) {
      return res.status(400).json({ error: 'full_name, phone, street, city, state and pincode are required' })
    }

    await userAddressModel.updateAddress(req.userId, req.params.id, {
      full_name, phone, street, city, state, pincode, country: country || 'India',
    })
    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

module.exports = {
  getDashboard,
  getAddresses,
  getAddress,
  addAddress,
  deleteAddress,
  getOrders,
  getOrderById,
  cancelOrder,
  setAddressDefault,
  updateAddress,
}
