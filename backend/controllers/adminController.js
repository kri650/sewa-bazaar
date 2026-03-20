const adminModel = require('../models/adminModel')
const bcrypt = require('bcryptjs')
const warehouseAuthModel = require('../models/warehouseAuthModel')
const warehouseAdminModel = require('../models/warehouseAdminModel')

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
      const statusCode = result.reason === 'invalid_status_before_assignment' ? 400 : 404
      return res.status(statusCode).json({ error: result.reason })
    }
    // Push Socket.io notification to the delivery boy and admins
    try {
      const { notifyDeliveryAssigned, notifyOrderStatusUpdate } = require('../utils/socketServer')
      // include warehouseId so warehouse dashboards can filter relevant assignments
      notifyDeliveryAssigned(Number(deliveryPartnerId), {
        orderId,
        customerName: result.order.customerName,
        total: result.order.total,
        warehouseId: result.order.warehouseId,
        assignedAt: new Date().toISOString(),
      })

      // Also broadcast assignment as an order status update to admins and warehouse dashboards
      try {
        notifyOrderStatusUpdate(result.order?.userId, {
          orderId,
          status: 'assigned',
          warehouseId: result.order?.warehouseId,
          deliveryPartnerId: Number(deliveryPartnerId),
          deliveryPartnerName: result.order?.deliveryPartnerName || null,
          updatedAt: new Date().toISOString(),
        })
      } catch (_) {}
    } catch (_) {}
    try {
      const notificationModel = require('../models/notificationModel')
      await notificationModel.createNotification({
        userId: deliveryPartnerId,
        orderId,
        type: 'order_assigned',
        message: `New order #${orderId} has been assigned to you.`,
      })
    } catch (_) {}
    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// ── Warehouse Admin Management (Super Admin) ──────────────────────────────

async function listWarehouseAdmins(_req, res) {
  try {
    const rows = await adminModel.listWarehouseAdmins()
    return res.json(rows)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function createWarehouseAdmin(req, res) {
  try {
    const { name, email, password, warehouse_id } = req.body || {}

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'password must be at least 6 characters' })
    }

    const existing = await warehouseAuthModel.findByEmail(String(email).trim().toLowerCase())
    if (existing) {
      return res.status(409).json({ error: 'an account with this email already exists' })
    }

    const passwordHash = await bcrypt.hash(String(password), 12)
    const created = await warehouseAuthModel.createWarehouseAdmin({
      name:        String(name).trim(),
      email:       String(email).trim().toLowerCase(),
      passwordHash,
      warehouseId: warehouse_id ? Number(warehouse_id) : null,
    })

    return res.status(201).json({
      ok: true,
      admin: created,
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function updateWarehouseAdminWarehouse(req, res) {
  try {
    const adminId = Number(req.params.id)
    const warehouseId = Number(req.body?.warehouse_id)

    if (!adminId || Number.isNaN(adminId)) {
      return res.status(400).json({ error: 'valid warehouse admin id is required' })
    }

    if (!warehouseId || Number.isNaN(warehouseId)) {
      return res.status(400).json({ error: 'valid warehouse_id is required' })
    }

    const updated = await adminModel.updateWarehouseAdminWarehouse(adminId, warehouseId)
    if (!updated) return res.status(404).json({ error: 'warehouse admin not found' })

    return res.json({ ok: true, id: adminId, warehouse_id: warehouseId })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// ── Per-warehouse snapshot for super admin (overview + recent activity) ───

async function getWarehouseSnapshot(req, res) {
  try {
    const warehouseId = Number(req.params.warehouseId)

    if (!warehouseId || Number.isNaN(warehouseId)) {
      return res.status(400).json({ error: 'valid warehouseId is required' })
    }

    const [overview, orders, inventory, codCollections] = await Promise.all([
      warehouseAdminModel.getOverview(warehouseId),
      warehouseAdminModel.getWarehouseOrders(warehouseId, 'all'),
      warehouseAdminModel.getInventoryGrouped(warehouseId),
      warehouseAdminModel.getCodCollections(warehouseId),
    ])

    return res.json({
      warehouseId,
      overview,
      orders,
      inventory,
      codCollections,
    })
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
  listWarehouseAdmins,
  createWarehouseAdmin,
  updateWarehouseAdminWarehouse,
  getWarehouseSnapshot,
}
