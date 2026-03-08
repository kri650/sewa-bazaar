const express = require('express')
const productController = require('../controllers/productController')
const orderController = require('../controllers/orderController')
const { requireAuth } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')

const router = express.Router()

router.use(requireAuth, requireRole('admin'))

router.post('/products/add', productController.adminAddProduct)
router.put('/products/update', productController.adminUpdateProduct)
router.delete('/products/delete', productController.adminDeleteProduct)
router.get('/orders', orderController.adminGetOrders)
router.put('/orders/assign-delivery', orderController.adminAssignDeliveryPartner)
router.put('/orders/status', orderController.adminUpdateOrderStatus)

module.exports = router
