const express = require('express')
const { createRazorpayOrder, verifyPayment } = require('../controllers/paymentController')

const router = express.Router()

// POST /api/payment/create-order — creates a Razorpay order (returns orderId + key for frontend modal)
router.post('/payment/create-order', createRazorpayOrder)

// POST /api/payment/verify — verifies payment signature, then creates order in DB
router.post('/payment/verify', verifyPayment)

module.exports = router
