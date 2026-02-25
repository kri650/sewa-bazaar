/**
 * Product Controller
 * Handles product-related operations
 */

const { products } = require('../data/dummyData');

// Dummy product storage (in real app, this would be a database)
let productStore = [...products];

/**
 * Get all products
 * GET /api/products
 */
const getAllProducts = (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      message: 'Products retrieved successfully',
      data: productStore,
      total: productStore.length
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch products'
    });
  }
};

/**
 * Get product by ID
 * GET /api/products/:id
 */
const getProductById = (req, res) => {
  try {
    const { id } = req.params;
    const product = productStore.find(p => p.id === parseInt(id));

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Product retrieved successfully',
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch product'
    });
  }
};

/**
 * Get products by category
 * GET /api/products/category/:category
 */
const getProductsByCategory = (req, res) => {
  try {
    const { category } = req.params;
    const filteredProducts = productStore.filter(
      p => p.category.toLowerCase() === category.toLowerCase()
    );

    res.status(200).json({
      status: 'success',
      message: 'Products retrieved successfully',
      data: filteredProducts,
      total: filteredProducts.length
    });
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch products'
    });
  }
};

/**
 * Search products
 * GET /api/products/search?q=query
 */
const searchProducts = (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a search query'
      });
    }

    const searchTerm = q.toLowerCase();
    const filteredProducts = productStore.filter(
      p => 
        p.name.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm) ||
        p.category.toLowerCase().includes(searchTerm)
    );

    res.status(200).json({
      status: 'success',
      message: 'Search results',
      data: filteredProducts,
      total: filteredProducts.length
    });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to search products'
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  searchProducts
};

