const Razorpay = require('razorpay')
const crypto = require('crypto')

const orderModel = require('../models/orderModel')
const { extractUserId } = require('../middleware/authMiddleware')

function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

// POST /api/payment/create-order
// Creates a Razorpay order and returns the order ID + key for the frontend modal
async function createRazorpayOrder(req, res) {
  try {
    const amount = Number(req.body?.amount)

    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Valid amount (in INR) is required' })
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: 'Razorpay is not configured on the server' })
    }

    const razorpay = getRazorpay()
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Razorpay uses paise (1 INR = 100 paise)
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    })

    return res.json({
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    })
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to create payment order' })
  }
}

// POST /api/payment/verify
// Verifies the Razorpay payment signature and creates the order in the DB
async function verifyPayment(req, res) {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      cartItems,
      customer,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      deliveryType,
      estimatedTime,
      deliverySlot,
    } = req.body || {}

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ error: 'Payment data incomplete: missing razorpay fields' })
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: 'Razorpay is not configured on the server' })
    }

    // Verify HMAC-SHA256 signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`)
    const expectedSignature = hmac.digest('hex')

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ error: 'Payment verification failed: invalid signature' })
    }

    // Signature valid — create the order in DB
    const userId = extractUserId(req)

    const result = await orderModel.createOrder({
      userId,
      items: cartItems,
      customer,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      paymentMethod: 'online',
      paymentStatus: 'paid',
      paymentTxnId: razorpayPaymentId,
      deliveryType,
      estimatedTime,
      deliverySlot,
    })

    // Broadcast new-order notification to admin Socket.io clients
    try {
      const { notifyNewOrder } = require('../utils/socketServer')
      notifyNewOrder({
        orderId: result.id,
        total: result.total,
        customerName: customer?.name || null,
        createdAt: new Date().toISOString(),
      })
    } catch (_) {}

    return res.status(201).json({
      id: result.id,
      createdAt: new Date().toISOString(),
      total: result.total,
      paymentMethod: 'online',
      razorpayPaymentId,
    })
  } catch (error) {
    const status = error.statusCode || 500
    return res.status(status).json({ error: error.message })
  }
}

module.exports = { createRazorpayOrder, verifyPayment }
