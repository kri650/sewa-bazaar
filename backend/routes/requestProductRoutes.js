const express = require('express')
const productController = require('../controllers/productController')

const router = express.Router()

router.post('/request-product', productController.requestProduct)

module.exports = router
