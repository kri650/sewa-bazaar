const express = require('express')
const deliveryController = require('../controllers/deliveryController')
const deliveryAuthController = require('../controllers/deliveryAuthController')
const { requireAuth } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')

const router = express.Router()

// Public delivery auth routes
router.post('/login', deliveryAuthController.login)
router.get('/me', requireAuth, requireRole('delivery'), deliveryAuthController.me)

// All other routes require a logged-in user with role = 'delivery'
router.use(requireAuth, requireRole('delivery'))

router.get('/orders',                      deliveryController.getMyOrders)
router.get('/my-orders',                   deliveryController.getMyOrders)
router.get('/orders/:orderId/items',       deliveryController.getOrderItems)
router.put('/orders/:orderId/status',      deliveryController.updateStatus)
router.put('/update-status',               deliveryController.updateStatus)
router.get('/notifications',               deliveryController.getNotifications)

module.exports = router
