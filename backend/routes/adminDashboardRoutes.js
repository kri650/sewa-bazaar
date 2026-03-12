const express = require('express')
const productController = require('../controllers/productController')
const orderController = require('../controllers/orderController')
const { requireAuth } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')

const router = express.Router()

const adminGuard = [requireAuth, requireRole('admin')]

router.post('/products/add',             adminGuard, productController.adminAddProduct)
router.put('/products/update',           adminGuard, productController.adminUpdateProduct)
router.delete('/products/delete',        adminGuard, productController.adminDeleteProduct)
router.get('/orders',                    adminGuard, orderController.adminGetOrders)
router.put('/orders/assign-delivery',    adminGuard, orderController.adminAssignDeliveryPartner)
router.put('/orders/status',             adminGuard, orderController.adminUpdateOrderStatus)

module.exports = router
