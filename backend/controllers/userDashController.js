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
         o.id             AS order_id,
         o.status,
         o.total,
         o.payment_method AS payment_method,
         o.created_at     AS order_date,
         oi.product_name,
         oi.qty,
         oi.price
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = ?
       ORDER BY o.id DESC`,
      [req.userId]
    )

    // Group line items under their parent order
    const ordersMap = {}
    for (const row of rows) {
      if (!ordersMap[row.order_id]) {
        ordersMap[row.order_id] = {
          orderId:       row.order_id,
          status:        row.status,
          total:         row.total,
          paymentMethod: row.payment_method,
          orderDate:     row.order_date,
          items:         [],
        }
      }
      ordersMap[row.order_id].items.push({
        productName: row.product_name,
        qty:         row.qty,
        price:       row.price,
      })
    }

    return res.json(Object.values(ordersMap))
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
  setAddressDefault,
  updateAddress,
}
