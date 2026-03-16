const express = require('express')
const productController = require('../controllers/productController')
const { searchActiveProducts } = require('../models/productModel')

const router = express.Router()

// Get all products
router.get('/', productController.listProducts)

// Search products by query string
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query
    if (!q) {
      return res.status(400).json({ success: false, error: 'Search query required' })
    }
    const products = await searchActiveProducts(q)
    res.status(200).json({ success: true, data: products })
  } catch (error) {
    console.error('Error searching products:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get single product by ID
router.get('/:id', productController.getProduct)

module.exports = router
