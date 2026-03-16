const express = require('express')
const warehouseAuthController = require('../controllers/warehouseAuthController')

const router = express.Router()

// POST /api/warehouse/login
router.post('/login', warehouseAuthController.login)

module.exports = router
