const express = require('express')
const adminController = require('../controllers/adminController')

const router = express.Router()

router.get('/orders', adminController.getOrders)
router.put('/orders/:orderId/status', adminController.updateOrderStatus)
router.post('/orders/:orderId/assign', adminController.assignDelivery)

router.get('/users', adminController.getUsers)
router.patch('/users/:userId/role', adminController.updateUserRole)

router.get('/delivery-boys', adminController.getDeliveryBoys)
router.post('/delivery-boys', adminController.addDeliveryPartner)
router.delete('/delivery-boys/:userId', adminController.removeDeliveryPartner)

router.get('/products', adminController.getProducts)
router.post('/products', adminController.createProduct)
router.put('/products/:productId', adminController.editProduct)
router.delete('/products', adminController.removeProduct)
router.delete('/products/:productId', adminController.removeProduct)

module.exports = router
