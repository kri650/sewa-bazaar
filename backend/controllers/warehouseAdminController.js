const bcrypt = require('bcryptjs')
const model = require('../models/warehouseAdminModel')
const { isCloudinaryConfigured, uploadBufferToCloudinary } = require('../utils/cloudinary')
const notificationModel = require('../models/notificationModel')
const { parsePricingInput, calculateFinalPrices } = require('../utils/pricing')

function parseBooleanLike(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value !== 'string') return false
  const normalized = value.trim().toLowerCase()
  return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on'
}

function validateFlashSale({ isFlashSale, flashSalePrice, flashSaleEndTime, originalPrice }) {
  if (!isFlashSale) {
    return {
      isFlashSale: false,
      flashSalePrice: null,
      flashSaleEndTime: null,
      error: null,
    }
  }

  const numericFlashPrice = Number(flashSalePrice)
  if (Number.isNaN(numericFlashPrice) || numericFlashPrice <= 0) {
    return {
      error: 'flashSalePrice must be a valid number greater than 0 when flash sale is enabled',
    }
  }
  if (numericFlashPrice >= Number(originalPrice)) {
    return {
      error: 'flashSalePrice must be less than original price',
    }
  }

  if (!flashSaleEndTime) {
    return {
      error: 'flashSaleEndTime is required when flash sale is enabled',
    }
  }

  const parsedEndTime = new Date(flashSaleEndTime)
  if (Number.isNaN(parsedEndTime.getTime())) {
    return {
      error: 'flashSaleEndTime must be a valid datetime',
    }
  }
  if (parsedEndTime.getTime() <= Date.now()) {
    return {
      error: 'flashSaleEndTime must be a future date',
    }
  }

  return {
    isFlashSale: true,
    flashSalePrice: numericFlashPrice,
    flashSaleEndTime: parsedEndTime,
    error: null,
  }
}

// Warehouse admins may only update to these 4 warehouse-side statuses.
// Delivery-side statuses (picked_up, out_for_delivery, delivered) are controlled by delivery partners.
const VALID_STATUSES = ['confirmed', 'packed', 'ready_for_pickup', 'assigned']
const DELIVERY_PARTNER_STATUSES = ['active', 'busy', 'offline']

const FRONTEND_CATEGORY_ALIASES = {
  'BEST DEAL': ['Best Deals'],
  'FRUITS & VEGETABLES': ['Fruits & Vegetables', 'Fruits and Vegetables', 'Fruits & Veg', 'Fruits', 'Vegetables'],
  'ATTA, RICE & GRAINS': ['Atta, Rice & Grains', 'Atta Rice & Grains', 'Grains'],
  'OIL & GHEE': ['Oil & Ghee'],
  'MILK & DAIRY': ['Milk & Dairy', 'Dairy'],
  'CHIPS & BISCUITS': ['Chips & Biscuits', 'Snacks'],
  'BATH & BODY': ['Bath & Body'],
  'SOAP & DETERGENTS': ['Soap & Detergents', 'Cleaning'],
  'BABY CARE': ['Baby Care'],
  'POOJA ESSENTIALS': ['Pooja Essentials', 'Pooja'],
  'BEVERAGES': ['Beverages'],
  'DRY FRUITS & NUTS': ['Dry Fruits & Nuts', 'Dry Fruits'],
}

const FRONTEND_CATEGORY_CANONICAL_NAME = {
  'BEST DEAL': 'Best Deals',
  'FRUITS & VEGETABLES': 'Fruits & Vegetables',
  'ATTA, RICE & GRAINS': 'Atta, Rice & Grains',
  'OIL & GHEE': 'Oil & Ghee',
  'MILK & DAIRY': 'Milk & Dairy',
  'CHIPS & BISCUITS': 'Chips & Biscuits',
  'BATH & BODY': 'Bath & Body',
  'SOAP & DETERGENTS': 'Soap & Detergents',
  'BABY CARE': 'Baby Care',
  'POOJA ESSENTIALS': 'Pooja Essentials',
  'BEVERAGES': 'Beverages',
  'DRY FRUITS & NUTS': 'Dry Fruits & Nuts',
}

function normalizeCategoryName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function slugifyCategoryName(value) {
  const slug = String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'category'
}

async function createCategoryAndReturnId(categoryName) {
  const baseSlug = slugifyCategoryName(categoryName)

  let nextSlug = baseSlug
  let attempt = 0

  while (attempt < 20) {
    try {
      const result = await query(
        `INSERT INTO categories (name, slug) VALUES (?, ?)`,
        [categoryName, nextSlug]
      )
      return Number(result.insertId)
    } catch (error) {
      if (error?.code !== 'ER_DUP_ENTRY') throw error
      attempt += 1
      nextSlug = `${baseSlug}-${attempt + 1}`
    }
  }

  throw new Error('Could not create unique category slug')
}

async function resolveCategoryId({ categoryId, categoryName }) {
  if (categoryId != null) return categoryId
  if (!categoryName) return null

  const categories = await model.listCategories()
  const byNormalizedName = new Map(
    categories.map((category) => [normalizeCategoryName(category.name), Number(category.id)])
  )

  const frontendKey = String(categoryName).trim().toUpperCase()
  const candidates = [categoryName, ...(FRONTEND_CATEGORY_ALIASES[frontendKey] || [])]

  for (const candidate of candidates) {
    const foundId = byNormalizedName.get(normalizeCategoryName(candidate))
    if (foundId) return foundId
  }

  const canonicalName = FRONTEND_CATEGORY_CANONICAL_NAME[frontendKey] || String(categoryName).trim()
  return createCategoryAndReturnId(canonicalName)
}

function assertSameWarehouse(req, res, requestedWarehouseId) {
  const requestWh = Number(requestedWarehouseId)
  const tokenWh = Number(req.warehouseId)

  if (!requestWh || Number.isNaN(requestWh)) {
    res.status(400).json({ error: 'valid warehouseId is required' })
    return false
  }
  if (!tokenWh || Number.isNaN(tokenWh)) {
    res.status(403).json({ error: 'warehouse not assigned to this admin' })
    return false
  }
  if (requestWh !== tokenWh) {
    res.status(403).json({ error: 'forbidden for requested warehouse' })
    return false
  }
  return true
}

async function getOverviewByWarehouseId(req, res) {
  try {
    if (!assertSameWarehouse(req, res, req.params.warehouseId)) return
    const overview = await model.getOverview(req.warehouseId)
    return res.json({ warehouseId: req.warehouseId, ...overview })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

async function getOrdersByWarehouseId(req, res) {
  try {
    if (!assertSameWarehouse(req, res, req.params.warehouseId)) return
    const status = req.query.status || null
    const orders = await model.getWarehouseOrders(req.warehouseId, status)
    return res.json({ warehouseId: req.warehouseId, orders })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

async function getOrders(req, res) {
  try {
    const status = req.query.status || null
    const orders = await model.getWarehouseOrders(req.warehouseId, status)
    return res.json({ warehouseId: req.warehouseId, orders })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

async function updateOrderStatus(req, res) {
  try {
    const orderId = Number(req.params.id || req.body?.order_id || req.body?.orderId)
    const status = String(req.body?.status || '').trim()

    if (!orderId || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `valid orderId and status required. Valid: ${VALID_STATUSES.join(', ')}`,
      })
    }

    const result = await model.updateOrderStatus(orderId, status, req.warehouseId, req.warehouseAdminId)
    if (!result.ok) {
      const statusCode = result.reason === 'invalid_status_transition' ? 400 : 404
      return res.status(statusCode).json({ error: result.reason.replace(/_/g, ' ') })
    }

    return res.json({
      ok: true,
      orderId,
      previousStatus: result.previousStatus,
      status,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

async function assignDelivery(req, res) {
  try {
    const orderId = Number(req.body?.orderId)
    const deliveryPartnerId = Number(req.body?.deliveryPartnerId)

    if (!orderId || !deliveryPartnerId) {
      return res.status(400).json({ error: 'orderId and deliveryPartnerId are required' })
    }

    const result = await model.assignDeliveryPartner(
      orderId,
      deliveryPartnerId,
      req.warehouseId,
      req.warehouseAdminId
    )

    if (!result.ok) {
      let statusCode = 404
      if (
        result.reason === 'delivery_partner_not_available' ||
        result.reason === 'invalid_status_before_assignment' ||
        result.reason.includes('cannot_assign')
      ) {
        statusCode = 400
      }
      return res.status(statusCode).json({ error: result.reason.replace(/_/g, ' ') })
    }

    // Push Socket.io notification to the delivery partner + admin dashboards
    try {
      const { notifyDeliveryAssigned } = require('../utils/socketServer')
      notifyDeliveryAssigned(Number(deliveryPartnerId), {
        orderId,
        warehouseId: Number(req.warehouseId) || null,
        assignedByWarehouseAdminId: Number(req.warehouseAdminId) || null,
        status: result.status,
        assignedAt: new Date().toISOString(),
      })
    } catch (_err) {}

    try {
      await notificationModel.createNotification({
        userId: deliveryPartnerId,
        orderId,
        type: 'order_assigned',
        message: `New order #${orderId} has been assigned to you.`,
      })
    } catch (_err) {}

    return res.json({
      ok: true,
      orderId,
      deliveryPartnerId,
      deliveryPartnerName: result.partnerName,
      status: result.status,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

async function getInventory(req, res) {
  try {
    const [categories, products, categoryOptions] = await Promise.all([
      model.getInventoryGrouped(req.warehouseId),
      model.listProductsForInventory(),
      model.listCategories(),
    ])

    return res.json({
      warehouseId: req.warehouseId,
      categories,
      products,
      categoryOptions,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

async function getInventoryByWarehouseId(req, res) {
  try {
    if (!assertSameWarehouse(req, res, req.params.warehouseId)) return

    const [categories, products, categoryOptions] = await Promise.all([
      model.getInventoryGrouped(req.warehouseId),
      model.listProductsForInventory(),
      model.listCategories(),
    ])

    return res.json({ warehouseId: req.warehouseId, categories, products, categoryOptions })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

async function createProduct(req, res) {
  try {
    const name = String(req.body?.name || '').trim()
    const price = Number(req.body?.price)
    const isFlashSale = parseBooleanLike(req.body?.isFlashSale)
    const flashSalePrice = req.body?.flashSalePrice
    const flashSaleEndTime = req.body?.flashSaleEndTime
    const quantity = req.body?.quantity != null ? Number(req.body.quantity) : null
    const unit = req.body?.unit != null ? String(req.body.unit).trim() : null
    const imageUrl = req.body?.imageUrl != null
      ? String(req.body.imageUrl).trim()
      : (req.body?.image != null ? String(req.body.image).trim() : '')
    let image = imageUrl || null
    const description = req.body?.description != null ? String(req.body.description).trim() : null
    const categoryId = req.body?.categoryId != null ? Number(req.body.categoryId) : null
    const categoryName = req.body?.categoryName != null ? String(req.body.categoryName).trim() : null
    const initialStock = req.body?.initialStock != null ? Number(req.body.initialStock) : 0

    if (req.file) {
      if (!isCloudinaryConfigured()) {
        return res.status(500).json({ error: 'Cloudinary is not configured on server' })
      }
      image = await uploadBufferToCloudinary(req.file.buffer, 'sewa-bazaar-products')
    }

    if (!name) {
      return res.status(400).json({ error: 'product name is required' })
    }
    if (Number.isNaN(price) || price <= 0) {
      return res.status(400).json({ error: 'price must be a valid number greater than 0' })
    }

    const flashSaleValidation = validateFlashSale({
      isFlashSale,
      flashSalePrice,
      flashSaleEndTime,
      originalPrice: price,
    })
    if (flashSaleValidation.error) {
      return res.status(400).json({ error: flashSaleValidation.error })
    }

    const pricingParse = parsePricingInput(req.body || {})
    if (pricingParse.error) {
      return res.status(400).json({ error: pricingParse.error })
    }

    const { discountType, discountValue } = pricingParse.data
    const priceSummary = calculateFinalPrices({
      originalPrice: price,
      discountType,
      discountValue,
      isFlashSale: flashSaleValidation.isFlashSale,
      flashSalePrice: flashSaleValidation.flashSalePrice,
      flashSaleEndTime: flashSaleValidation.flashSaleEndTime,
    })
    if (!image) {
      return res.status(400).json({ error: 'Upload image or provide image URL' })
    }
    if (categoryId != null && (Number.isNaN(categoryId) || categoryId <= 0)) {
      return res.status(400).json({ error: 'categoryId must be a valid category id' })
    }
    if (categoryName != null && !categoryName) {
      return res.status(400).json({ error: 'categoryName cannot be empty when provided' })
    }
    if (Number.isNaN(initialStock) || initialStock < 0) {
      return res.status(400).json({ error: 'initialStock must be 0 or greater' })
    }

    const resolvedCategoryId = await resolveCategoryId({ categoryId, categoryName })
    if ((categoryId != null || categoryName) && !resolvedCategoryId) {
      return res.status(400).json({ error: 'Category not found. Please sync frontend and backend categories.' })
    }

    const created = await model.createProductForWarehouse({
      warehouseId: req.warehouseId,
      name,
      price,
      quantity,
      unit,
      image,
      description,
      categoryId: resolvedCategoryId,
      initialStock,
      discountType,
      discountValue,
      isFlashSale: flashSaleValidation.isFlashSale,
      flashSalePrice: flashSaleValidation.flashSalePrice,
      flashSaleEndTime: flashSaleValidation.flashSaleEndTime,
    })

    return res.status(201).json({
      ok: true,
      ...created,
      ...priceSummary,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

async function updateProduct(req, res) {
  try {
    const productId = Number(req.params.productId)
    const name = String(req.body?.name || '').trim()
    const price = Number(req.body?.price)
    const isFlashSale = parseBooleanLike(req.body?.isFlashSale)
    const flashSalePrice = req.body?.flashSalePrice
    const flashSaleEndTime = req.body?.flashSaleEndTime
    const quantity = req.body?.quantity != null ? Number(req.body.quantity) : null
    const unit = req.body?.unit != null ? String(req.body.unit).trim() : null
    const imageUrl = req.body?.imageUrl != null
      ? String(req.body.imageUrl).trim()
      : (req.body?.image != null ? String(req.body.image).trim() : '')
    let image = imageUrl || null
    const description = req.body?.description != null ? String(req.body.description).trim() : null
    const categoryId = req.body?.categoryId != null ? Number(req.body.categoryId) : null
    const categoryName = req.body?.categoryName != null ? String(req.body.categoryName).trim() : null

    if (!productId || Number.isNaN(productId)) {
      return res.status(400).json({ error: 'valid productId is required' })
    }

    if (req.file) {
      if (!isCloudinaryConfigured()) {
        return res.status(500).json({ error: 'Cloudinary is not configured on server' })
      }
      image = await uploadBufferToCloudinary(req.file.buffer, 'sewa-bazaar-products')
    }

    if (!name) {
      return res.status(400).json({ error: 'product name is required' })
    }
    if (Number.isNaN(price) || price <= 0) {
      return res.status(400).json({ error: 'price must be a valid number greater than 0' })
    }

    const flashSaleValidation = validateFlashSale({
      isFlashSale,
      flashSalePrice,
      flashSaleEndTime,
      originalPrice: price,
    })
    if (flashSaleValidation.error) {
      return res.status(400).json({ error: flashSaleValidation.error })
    }

    const pricingParse = parsePricingInput(req.body || {})
    if (pricingParse.error) {
      return res.status(400).json({ error: pricingParse.error })
    }

    const { discountType, discountValue } = pricingParse.data
    const priceSummary = calculateFinalPrices({
      originalPrice: price,
      discountType,
      discountValue,
      isFlashSale: flashSaleValidation.isFlashSale,
      flashSalePrice: flashSaleValidation.flashSalePrice,
      flashSaleEndTime: flashSaleValidation.flashSaleEndTime,
    })

    if (categoryId != null && (Number.isNaN(categoryId) || categoryId <= 0)) {
      return res.status(400).json({ error: 'categoryId must be a valid category id' })
    }
    if (categoryName != null && !categoryName) {
      return res.status(400).json({ error: 'categoryName cannot be empty when provided' })
    }

    const resolvedCategoryId = await resolveCategoryId({ categoryId, categoryName })
    if ((categoryId != null || categoryName) && !resolvedCategoryId) {
      return res.status(400).json({ error: 'Category not found. Please sync frontend and backend categories.' })
    }

    const updated = await model.updateProductForWarehouse({
      warehouseId: req.warehouseId,
      productId,
      name,
      price,
      quantity,
      unit,
      image,
      description,
      categoryId: resolvedCategoryId,
      discountType,
      discountValue,
      isFlashSale: flashSaleValidation.isFlashSale,
      flashSalePrice: flashSaleValidation.flashSalePrice,
      flashSaleEndTime: flashSaleValidation.flashSaleEndTime,
    })

    if (!updated.ok) {
      const code = updated.reason === 'product_not_in_inventory' ? 404 : 400
      return res.status(code).json({ error: updated.reason.replace(/_/g, ' ') })
    }

    return res.json({
      ok: true,
      product: updated.product,
      ...priceSummary,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

async function addInventoryStock(req, res) {
  try {
    const productId = Number(req.body?.productId)
    const stock = Number(req.body?.stock)

    if (!productId || Number.isNaN(stock) || stock <= 0) {
      return res.status(400).json({ error: 'productId and stock (> 0) are required' })
    }

    const result = await model.addStock(productId, req.warehouseId, stock)
    if (!result.ok) return res.status(404).json({ error: result.reason.replace(/_/g, ' ') })

    return res.status(201).json({ ok: true, productId, stock })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

async function updateStock(req, res) {
  try {
    const productId = Number(req.params.productId)
    const stock = Number(req.body?.stock)
    const mode = req.body?.mode === 'add' ? 'add' : 'set'

    if (!productId || Number.isNaN(stock) || stock < 0) {
      return res.status(400).json({ error: 'productId and stock are required' })
    }

    const result = mode === 'add'
      ? await model.addStock(productId, req.warehouseId, stock)
      : await model.setStock(productId, req.warehouseId, stock)

    if (!result.ok) return res.status(404).json({ error: result.reason.replace(/_/g, ' ') })

    return res.json({ ok: true, productId, stock, mode })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

async function updateStockByBody(req, res) {
  try {
    const productId = Number(req.body?.productId)
    const stock = Number(req.body?.stock)
    const mode = req.body?.mode === 'add' ? 'add' : 'set'

    if (!productId || Number.isNaN(stock) || stock < 0) {
      return res.status(400).json({ error: 'productId and stock are required' })
    }

    const result = mode === 'add'
      ? await model.addStock(productId, req.warehouseId, stock)
      : await model.setStock(productId, req.warehouseId, stock)

    if (!result.ok) return res.status(404).json({ error: result.reason.replace(/_/g, ' ') })

    return res.json({ ok: true, productId, stock, mode })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

async function getLowStock(req, res) {
  try {
    const items = await model.getLowStockItems(req.warehouseId)
    return res.json({ warehouseId: req.warehouseId, items })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

async function getMetrics(req, res) {
  try {
    const metrics = await model.getMetrics(req.warehouseId)
    return res.json({ warehouseId: req.warehouseId, ...metrics })
  } catch (err) {
    console.error('[warehouse/metrics] error:', err)
    return res.status(500).json({ error: err.message })
  }
}

// Alias tailored to frontend requirement: /api/warehouse/dashboard-stats
// Shape: { totalOrders, pendingOrders, deliveredOrders, unassignedOrders, totalProductsInInventory, totalRevenue }
async function getDashboardStats(req, res) {
  try {
    const metrics = await model.getMetrics(req.warehouseId)

    return res.json({
      warehouseId: req.warehouseId,
      totalOrders: metrics.totalOrders,
      pendingOrders: metrics.pendingOrders,
      deliveredOrders: metrics.deliveredOrders,
      unassignedOrders: metrics.unassignedOrders,
      totalProductsInInventory: metrics.productsInInventory,
      totalRevenue: metrics.totalRevenue,
    })
  } catch (err) {
    console.error('[warehouse/dashboard-stats] error:', err)
    return res.status(500).json({ error: err.message })
  }
}

const { query } = require('../config/db')

async function getMe(req, res) {
  try {
    let adminName = null
    let warehouseName = null
    let warehouseCity = null

    try {
      const rows = await query(
        `SELECT wa.name AS adminName,
                wa.warehouse_id AS warehouseId,
                w.name AS warehouseName,
                w.city AS warehouseCity
         FROM warehouse_admins wa
         LEFT JOIN warehouses w ON w.id = wa.warehouse_id
         WHERE wa.id = ?
         LIMIT 1`,
        [req.warehouseAdminId]
      )
      if (rows && rows.length) {
        adminName     = rows[0].adminName || null
        warehouseName = rows[0].warehouseName || null
        warehouseCity = rows[0].warehouseCity || null
      }
    } catch (_err) {
      // If lookup fails, still return basic identifiers below.
    }

    return res.json({
      ok: true,
      admin_id: req.warehouseAdminId,
      admin_name: adminName,
      warehouse_id: req.warehouseId,
      warehouse_name: warehouseName,
      warehouse_city: warehouseCity,
    })
  } catch (err) {
    console.error('[warehouse/me] error:', err)
    return res.status(500).json({ error: err.message })
  }
}

async function getDeliveryPartners(req, res) {
  try {
    const partners = await model.listDeliveryPartners(req.warehouseId, { activeOnly: true })
    return res.json({ warehouseId: req.warehouseId, partners })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

async function getDeliveryPartnersByWarehouseId(req, res) {
  try {
    if (!assertSameWarehouse(req, res, req.params.warehouseId)) return
    const partners = await model.listDeliveryPartners(req.warehouseId, { activeOnly: true })
    return res.json({ warehouseId: req.warehouseId, partners })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

async function createDeliveryPartner(req, res) {
  try {
    const name = String(req.body?.name || '').trim()
    const email = String(req.body?.email || '').trim().toLowerCase()
    const phone = String(req.body?.phone || '').trim()
    const password = String(req.body?.password || '')
    const confirmPassword = String(req.body?.confirmPassword || req.body?.confirm_password || '')
    const requestedWarehouseId = req.body?.warehouse_id != null ? Number(req.body?.warehouse_id) : null

    if (!name || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({ error: 'name, email, phone, password and confirm password are required' })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'password and confirm password must match' })
    }

    if (!req.warehouseId) {
      return res.status(403).json({ error: 'warehouse not assigned to this admin' })
    }

    if (requestedWarehouseId != null && requestedWarehouseId !== Number(req.warehouseId)) {
      return res.status(403).json({ error: 'forbidden for requested warehouse' })
    }

    const existing = await model.findDeliveryPartnerByEmail(email)
    if (existing) {
      return res.status(409).json({ error: 'delivery partner email already exists' })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const partner = await model.createDeliveryPartner({
      name,
      email,
      phone,
      passwordHash,
      warehouseId: req.warehouseId,
    })

    return res.status(201).json({ ok: true, partner })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'delivery partner email already exists' })
    }
    const status = err.statusCode || 500
    return res.status(status).json({ error: err.message })
  }
}

async function updateDeliveryPartnerStatus(req, res) {
  try {
    const deliveryPartnerId = Number(req.params.id)
    const status = String(req.body?.status || '').trim().toLowerCase()

    if (!deliveryPartnerId || !DELIVERY_PARTNER_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'valid delivery partner id and status are required' })
    }

    const result = await model.updateDeliveryPartnerStatus(deliveryPartnerId, req.warehouseId, status)
    if (!result.ok) return res.status(404).json({ error: result.reason.replace(/_/g, ' ') })

    return res.json({ ok: true, deliveryPartnerId, status })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

async function getCodCollections(req, res) {
  try {
    const collections = await model.getCodCollections(req.warehouseId)
    return res.json({ warehouseId: req.warehouseId, collections })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

async function getCodCollectionsByWarehouseId(req, res) {
  try {
    if (!assertSameWarehouse(req, res, req.params.warehouseId)) return
    const collections = await model.getCodCollections(req.warehouseId)
    return res.json({ warehouseId: req.warehouseId, collections })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

module.exports = {
  addInventoryStock,
  assignDelivery,
  createDeliveryPartner,
  getCodCollections,
  getCodCollectionsByWarehouseId,
  getDeliveryPartners,
  getDeliveryPartnersByWarehouseId,
  getInventory,
  getInventoryByWarehouseId,
  getLowStock,
  getMe,
  getMetrics,
  getDashboardStats,
  createProduct,
  updateProduct,
  getOverviewByWarehouseId,
  getOrders,
  getOrdersByWarehouseId,
  updateDeliveryPartnerStatus,
  updateOrderStatus,
  updateStock,
  updateStockByBody,
}
