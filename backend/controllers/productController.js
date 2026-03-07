const productModel = require('../models/productModel')

async function listProducts(req, res) {
  try {
    const rows = await productModel.listActiveProducts()
    res.json(rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

async function getProduct(req, res) {
  try {
    const row = await productModel.findById(req.params.id)
    if (!row) return res.status(404).json({ error: 'product not found' })
    return res.json(row)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function adminAddProduct(req, res) {
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

    const id = await productModel.createProduct({
      name: String(name).trim(),
      price: numericPrice,
      unit,
      image,
      description,
      categoryId: categoryId ? Number(categoryId) : null,
      latitude: lat,
      longitude: lng,
    })

    return res.status(201).json({ ok: true, id })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function adminUpdateProduct(req, res) {
  try {
    const { id, name, price, unit, image, description, categoryId, latitude, longitude, isActive } = req.body || {}
    const productId = Number(id)
    if (Number.isNaN(productId) || productId <= 0) {
      return res.status(400).json({ error: 'valid id is required' })
    }

    const updated = await productModel.updateProduct({
      id: productId,
      name: name === undefined ? null : String(name).trim(),
      price: price === undefined ? null : Number(price),
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
    return res.status(500).json({ error: error.message })
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
    return res.status(500).json({ error: error.message })
  }
}

module.exports = {
  listProducts,
  getProduct,
  adminAddProduct,
  adminUpdateProduct,
  adminDeleteProduct,
}
