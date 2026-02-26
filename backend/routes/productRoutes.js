/**
 * Product Routes
 * Maps endpoints to controller functions
 */

const express = require('express');
const router = express.Router();
const { 
  getAllProducts, 
  getProductById, 
  getProductsByCategory,
  searchProducts 
} = require('../controllers/productController');

// GET /api/products - Get all products
router.get('/', getAllProducts);

// GET /api/products/search?q=query - Search products
router.get('/search', searchProducts);

// GET /api/products/category/:category - Get products by category
router.get('/category/:category', getProductsByCategory);

// GET /api/products/:id - Get product by ID
router.get('/:id', getProductById);

module.exports = router;

