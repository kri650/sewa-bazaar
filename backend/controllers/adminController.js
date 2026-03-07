const adminModel = require('../models/adminModel')
const bcrypt = require('bcryptjs')

async function getOrders(_req, res) {
  try {
    const rows = await adminModel.listOrders()
    return res.json(rows)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function getUsers(_req, res) {
  try {
    const rows = await adminModel.listUsers()
    return res.json(rows)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function getDeliveryBoys(_req, res) {
  try {
    const rows = await adminModel.listDeliveryBoys()
    return res.json(rows)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function getProducts(_req, res) {
  try {
    const rows = await adminModel.listProducts()
    return res.json(rows)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function createProduct(req, res) {
  try {
    const { name, price, unit, image, description, categoryId, latitude, longitude } = req.body || {}

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'name and price are required' })
    }

    const numericPrice = Number(price)
    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ error: 'price must be a valid number greater than 0' })
    }

    const lat = latitude === undefined || latitude === '' ? 0 : Number(latitude)
    const lng = longitude === undefined || longitude === '' ? 0 : Number(longitude)
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ error: 'latitude and longitude must be valid numbers' })
    }

    const created = await adminModel.createProduct({
      name: String(name).trim(),
      price: numericPrice,
      unit,
      image,
      description,
      categoryId: categoryId ? Number(categoryId) : null,
      latitude: lat,
      longitude: lng,
    })
    return res.status(201).json(created)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function editProduct(req, res) {
  try {
    const productId = Number(req.params.productId)
    if (Number.isNaN(productId) || productId <= 0) {
      return res.status(400).json({ error: 'valid productId is required' })
    }
    const { name, price, unit, image, description, categoryId } = req.body || {}
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'name and price are required' })
    }
    const numericPrice = Number(price)
    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ error: 'price must be a valid number greater than 0' })
    }
    const updated = await adminModel.updateProduct(productId, {
      name: String(name).trim(), price: numericPrice, unit, image, description,
      categoryId: categoryId ? Number(categoryId) : null,
    })
    if (!updated) return res.status(404).json({ error: 'product not found' })
    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function removeProduct(req, res) {
  try {
    const rawProductId = req.params.productId || req.body?.productId
    const productId = Number(rawProductId)
    if (Number.isNaN(productId) || productId <= 0) {
      return res.status(400).json({ error: 'valid productId is required' })
    }

    const deleted = await adminModel.deleteProduct(productId)
    if (!deleted) return res.status(404).json({ error: 'product not found' })
    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function updateUserRole(req, res) {
  try {
    const userId = Number(req.params.userId)
    const role = String(req.body?.role || '').trim()
    const allowed = new Set(['customer', 'admin', 'delivery'])

    if (Number.isNaN(userId) || userId <= 0) {
      return res.status(400).json({ error: 'valid userId is required' })
    }
    if (!allowed.has(role)) {
      return res.status(400).json({ error: 'role must be one of customer, admin, delivery' })
    }

    const updated = await adminModel.updateUserRole(userId, role)
    if (!updated) return res.status(404).json({ error: 'user not found' })
    return res.json({ ok: true, userId, role })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function updateOrderStatus(req, res) {
  try {
    const orderId = parseInt(req.params.orderId, 10)
    const { status } = req.body
    const allowed = ['pending', 'confirmed', 'delivered', 'cancelled']
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${allowed.join(', ')}` })
    }
    const updated = await adminModel.updateOrderStatus(orderId, status)
    if (!updated) return res.status(404).json({ error: 'order not found' })
    return res.json({ ok: true, orderId, status })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// ── Delivery Partner Management ────────────────────────────────────────────

async function addDeliveryPartner(req, res) {
  try {
    const { name, email, phone, password } = req.body || {}
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' })
    }
    const passwordHash = await bcrypt.hash(String(password), 10)
    const partner = await adminModel.createDeliveryPartner({ name, email, phone, passwordHash })
    return res.status(201).json(partner)
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A user with this email already exists' })
    }
    return res.status(500).json({ error: error.message })
  }
}

async function removeDeliveryPartner(req, res) {
  try {
    const userId = Number(req.params.userId)
    if (Number.isNaN(userId) || userId <= 0) {
      return res.status(400).json({ error: 'valid userId is required' })
    }
    const deleted = await adminModel.deleteDeliveryPartner(userId)
    if (!deleted) return res.status(404).json({ error: 'delivery partner not found' })
    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function assignDelivery(req, res) {
  try {
    const orderId = Number(req.params.orderId)
    const { deliveryPartnerId } = req.body || {}
    if (Number.isNaN(orderId) || !deliveryPartnerId) {
      return res.status(400).json({ error: 'orderId and deliveryPartnerId are required' })
    }
    const result = await adminModel.assignOrderToDeliveryPartner(orderId, Number(deliveryPartnerId))
    if (!result.ok) {
      return res.status(404).json({ error: result.reason })
    }
    // Push Socket.io notification to the delivery boy and admins
    try {
      const { notifyDeliveryAssigned } = require('../utils/socketServer')
      notifyDeliveryAssigned(Number(deliveryPartnerId), {
        orderId,
        customerName: result.order.customerName,
        total: result.order.total,
        assignedAt: new Date().toISOString(),
      })
    } catch (_) {}
    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

module.exports = {
  getOrders,
  getUsers,
  getDeliveryBoys,
  getProducts,
  createProduct,
  editProduct,
  removeProduct,
  updateUserRole,
  updateOrderStatus,
  addDeliveryPartner,
  removeDeliveryPartner,
  assignDelivery,
}
