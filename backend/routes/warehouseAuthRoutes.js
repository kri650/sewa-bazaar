const express = require('express')
const warehouseAuthController = require('../controllers/warehouseAuthController')

const router = express.Router()

// POST /api/warehouse-admin         → create a warehouse admin account
router.post('/', warehouseAuthController.create)

// POST /api/warehouse-admin/create  → same, explicit create endpoint
router.post('/create', warehouseAuthController.create)

// POST /api/warehouse-admin/login   → log in and receive a JWT
router.post('/login', warehouseAuthController.login)

module.exports = router
