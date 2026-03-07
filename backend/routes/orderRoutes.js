const express = require('express')
const orderController = require('../controllers/orderController')
const { requireAuth } = require('../middleware/authMiddleware')

const router = express.Router()

router.post('/orders', orderController.createOrder)

router.get('/wishlist', requireAuth, orderController.getWishlist)
router.post('/wishlist', requireAuth, orderController.addWishlist)
router.delete('/wishlist/:productId', requireAuth, orderController.deleteWishlist)

router.get('/cart', requireAuth, orderController.getCart)
router.post('/cart/items', requireAuth, orderController.addCartItem)
router.patch('/cart/items/:productId', requireAuth, orderController.updateCartItem)
router.delete('/cart/items/:productId', requireAuth, orderController.deleteCartItem)

module.exports = router
