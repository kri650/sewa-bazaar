const express = require('express')
const adminController = require('../controllers/adminController')
const warehouseController = require('../controllers/warehouseController')
const { productImageUpload } = require('../middleware/imageUploadMiddleware')

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
router.post('/products', productImageUpload.single('image'), adminController.createProduct)
router.put('/products/:productId', productImageUpload.single('image'), adminController.editProduct)
router.delete('/products', adminController.removeProduct)
router.delete('/products/:productId', adminController.removeProduct)
router.get('/product-requests', adminController.getProductRequests)
router.patch('/product-requests/:id/fulfilled', adminController.markProductRequestFulfilled)
router.delete('/product-requests/:id', adminController.deleteProductRequest)

// Warehouse / delivery config routes
router.get('/warehouses',           warehouseController.getWarehouses)
router.post('/warehouses',          warehouseController.saveWarehouse)
router.delete('/warehouses/:id',    warehouseController.deleteWarehouse)
router.get('/warehouses/:warehouseId/snapshot', adminController.getWarehouseSnapshot)

// Warehouse admin management (super admin)
router.get('/warehouse-admins',              adminController.listWarehouseAdmins)
router.post('/warehouse-admins',             adminController.createWarehouseAdmin)
router.patch('/warehouse-admins/:id/assign', adminController.updateWarehouseAdminWarehouse)

module.exports = router
