const orderModel = require('../models/orderModel')
const productModel = require('../models/productModel')
const { extractUserId } = require('../middleware/authMiddleware')

async function getWishlist(req, res) {
  try {
    const rows = await orderModel.listWishlist(req.userId)
    return res.json(rows)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function addWishlist(req, res) {
  try {
    const { productId } = req.body || {}
    if (!productId) return res.status(400).json({ error: 'productId required' })

    const exists = await productModel.exists(productId)
    if (!exists) return res.status(404).json({ error: 'product not found' })

    await orderModel.addWishlistItem(req.userId, productId)
    return res.status(201).json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function deleteWishlist(req, res) {
  try {
    await orderModel.removeWishlistItem(req.userId, req.params.productId)
    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function getCart(req, res) {
  try {
    const cartId = await orderModel.getOrCreateActiveCart(req.userId)
    const items = await orderModel.fetchCartItems(cartId)
    const total = items.reduce((sum, item) => sum + Number(item.price) * item.qty, 0)
    return res.json({ cartId, items, total })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function addCartItem(req, res) {
  try {
    const { productId, qty } = req.body || {}
    const safeQty = Number(qty || 1)

    if (!productId || safeQty < 1) {
      return res.status(400).json({ error: 'productId and qty (>=1) are required' })
    }

    const exists = await productModel.exists(productId)
    if (!exists) return res.status(404).json({ error: 'product not found' })

    await orderModel.addCartItem(req.userId, productId, safeQty)
    return res.status(201).json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function updateCartItem(req, res) {
  try {
    const safeQty = Number(req.body?.qty)
    if (safeQty < 1) return res.status(400).json({ error: 'qty must be >= 1' })

    await orderModel.updateCartItemQty(req.userId, req.params.productId, safeQty)
    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function deleteCartItem(req, res) {
  try {
    await orderModel.removeCartItem(req.userId, req.params.productId)
    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function createOrder(req, res) {
  try {
    const userId = extractUserId(req)

    const result = await orderModel.createOrder({
      userId,
      items: req.body?.items,
      customer: req.body?.customer,
      addressLine1: req.body?.addressLine1,
      addressLine2: req.body?.addressLine2,
      city: req.body?.city,
      state: req.body?.state,
      pincode: req.body?.pincode,
      paymentMethod: req.body?.paymentMethod,
    })

    // Broadcast new-order notification to all connected admin Socket.io clients
    try {
      const { notifyNewOrder } = require('../utils/socketServer')
      notifyNewOrder({
        orderId: result.id,
        total: result.total,
        customerName: req.body?.customer?.name || null,
        createdAt: new Date().toISOString(),
      })
    } catch (_) {}

    return res.status(201).json({
      id: result.id,
      createdAt: new Date().toISOString(),
      total: result.total,
      items: result.items,
    })
  } catch (error) {
    const status = error.statusCode || 500
    return res.status(status).json({ error: error.message })
  }
}

async function adminGetOrders(_req, res) {
  try {
    const rows = await orderModel.listOrdersForAdmin()
    return res.json(rows)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function adminAssignDeliveryPartner(req, res) {
  try {
    const orderId = Number(req.body?.orderId)
    const deliveryPartnerId = Number(req.body?.deliveryPartnerId)

    if (Number.isNaN(orderId) || Number.isNaN(deliveryPartnerId)) {
      return res.status(400).json({ error: 'orderId and deliveryPartnerId are required' })
    }

    const result = await orderModel.assignDeliveryPartner(orderId, deliveryPartnerId)
    if (!result.ok && result.reason === 'delivery_not_found') {
      return res.status(404).json({ error: 'delivery partner not found' })
    }
    if (!result.ok && result.reason === 'order_not_found') {
      return res.status(404).json({ error: 'order not found' })
    }

    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function adminUpdateOrderStatus(req, res) {
  try {
    const orderId = Number(req.body?.orderId)
    const status = String(req.body?.status || '').trim()
    const allowed = new Set(['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'])

    if (Number.isNaN(orderId) || !allowed.has(status)) {
      return res.status(400).json({ error: 'valid orderId and status are required' })
    }

    const updated = await orderModel.updateOrderStatus(orderId, status)
    if (!updated) return res.status(404).json({ error: 'order not found' })
    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

module.exports = {
  getWishlist,
  addWishlist,
  deleteWishlist,
  getCart,
  addCartItem,
  updateCartItem,
  deleteCartItem,
  createOrder,
  adminGetOrders,
  adminAssignDeliveryPartner,
  adminUpdateOrderStatus,
}
