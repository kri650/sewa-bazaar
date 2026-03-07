const express = require('express')
const deliveryController = require('../controllers/deliveryController')
const { requireAuth } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')

const router = express.Router()

// All routes require a logged-in user with role = 'delivery'
router.use(requireAuth, requireRole('delivery'))

router.get('/orders',                      deliveryController.getMyOrders)
router.get('/orders/:orderId/items',       deliveryController.getOrderItems)
router.put('/orders/:orderId/status',      deliveryController.updateStatus)

module.exports = router
