const productModel = require('../models/productModel')

/**
 * List all active products
 * Returns products with stock and flash sale information
 */
async function listProducts(req, res) {
  try {
    const rows = await productModel.listActiveProducts()
    return res.json(rows)
  } catch (error) {
    console.error('[productController.listProducts] Error:', error.message)
    
    // Handle SQL errors gracefully
    if (error.message?.includes('Unknown column')) {
      return res.status(500).json({
        error: 'Database schema error',
        details: 'Required database columns are missing. Please run database migrations.',
        code: 'DB_SCHEMA_ERROR'
      })
    }
    
    return res.status(500).json({
      error: 'Failed to retrieve products',
      code: 'DB_ERROR'
    })
  }
}

/**
 * Get a single product by ID
 */
async function getProduct(req, res) {
  try {
    const productId = req.params.id
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' })
    }
    
    const row = await productModel.findById(productId)
    if (!row) {
      return res.status(404).json({ error: 'Product not found' })
    }
    
    return res.json(row)
  } catch (error) {
    console.error('[productController.getProduct] Error:', error.message)
    
    if (error.message?.includes('Unknown column')) {
      return res.status(500).json({
        error: 'Database schema error',
        details: 'Required database columns are missing. Please run database migrations.',
        code: 'DB_SCHEMA_ERROR'
      })
    }
    
    return res.status(500).json({
      error: 'Failed to retrieve product',
      code: 'DB_ERROR'
    })
  }
}

async function adminAddProduct(req, res) {
  try {
    const { name, price, quantity, unit, image, description, categoryId, latitude, longitude } = req.body || {}

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

    const id = await productModel.createProduct({
      name: String(name).trim(),
      price: numericPrice,
      quantity: quantity ? Number(quantity) : null,
      unit,
      image,
      description,
      categoryId: categoryId ? Number(categoryId) : null,
      latitude: lat,
      longitude: lng,
    })

    return res.status(201).json({ ok: true, id })
  } catch (error) {
    console.error('[productController.adminAddProduct] Error:', error.message)
    return res.status(500).json({ error: 'Failed to create product' })
  }
}

async function adminUpdateProduct(req, res) {
  try {
    const { id, name, price, quantity, unit, image, description, categoryId, latitude, longitude, isActive } = req.body || {}
    const productId = Number(id)
    if (Number.isNaN(productId) || productId <= 0) {
      return res.status(400).json({ error: 'valid id is required' })
    }

    const updated = await productModel.updateProduct({
      id: productId,
      name: name === undefined ? null : String(name).trim(),
      price: price === undefined ? null : Number(price),
      quantity: quantity === undefined || quantity === '' ? null : Number(quantity),
      unit: unit === undefined ? null : unit,
      image: image === undefined ? null : image,
      description: description === undefined ? null : description,
      categoryId: categoryId === undefined || categoryId === '' ? null : Number(categoryId),
      latitude: latitude === undefined || latitude === '' ? null : Number(latitude),
      longitude: longitude === undefined || longitude === '' ? null : Number(longitude),
      isActive: isActive === undefined ? null : Number(isActive ? 1 : 0),
    })

    if (!updated) return res.status(404).json({ error: 'product not found' })
    return res.json({ ok: true })
  } catch (error) {
    console.error('[productController.adminUpdateProduct] Error:', error.message)
    return res.status(500).json({ error: 'Failed to update product' })
  }
}

async function adminDeleteProduct(req, res) {
  try {
    const productId = Number(req.body?.id || req.query?.id)
    if (Number.isNaN(productId) || productId <= 0) {
      return res.status(400).json({ error: 'valid id is required' })
    }

    const deleted = await productModel.deleteProduct(productId)
    if (!deleted) return res.status(404).json({ error: 'product not found' })
    return res.json({ ok: true })
  } catch (error) {
    console.error('[productController.adminDeleteProduct] Error:', error.message)
    return res.status(500).json({ error: 'Failed to delete product' })
  }
}

module.exports = {
  listProducts,
  getProduct,
  adminAddProduct,
  adminUpdateProduct,
  adminDeleteProduct,
}
