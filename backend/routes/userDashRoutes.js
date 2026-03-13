/**
 * userDashRoutes.js
 * -----------------
 * Registers all User Dashboard API routes.
 * All routes are protected by requireAuth (JWT must be present).
 *
 * Mounted at /api in index.js, so full paths are:
 *
 *   GET    /api/user/dashboard          – profile info
 *   GET    /api/user/orders             – order history
 *   GET    /api/user/addresses          – list saved addresses
 *   POST   /api/user/addresses          – add a new address
 *   GET    /api/user/addresses/:id      – get one address (checkout)
 *   DELETE /api/user/addresses/:id      – remove an address
 *
 * Wishlist routes already exist in orderRoutes.js:
 *   GET    /wishlist
 *   POST   /wishlist
 *   DELETE /wishlist/:productId
 */

const express           = require('express')
const userDashController = require('../controllers/userDashController')
const { requireAuth }   = require('../middleware/authMiddleware')

const router = express.Router()

// Protect every route in this file with JWT auth
router.use(requireAuth)

// ── Dashboard ─────────────────────────────────────────────────────────
router.get('/user/dashboard', userDashController.getDashboard)

// ── Address Management ────────────────────────────────────────────────
router.get('/user/addresses',     userDashController.getAddresses)
router.post('/user/addresses',    userDashController.addAddress)
router.get('/user/addresses/:id', userDashController.getAddress)    // checkout
router.put('/user/addresses/:id', userDashController.updateAddress)
router.put('/user/addresses/:id/default', userDashController.setAddressDefault)
router.delete('/user/addresses/:id', userDashController.deleteAddress)

// ── Order History ─────────────────────────────────────────────────────
router.get('/user/orders', userDashController.getOrders)
router.get('/user/orders/:id', userDashController.getOrderById)
router.put('/user/orders/:id/cancel', userDashController.cancelOrder)

module.exports = router
