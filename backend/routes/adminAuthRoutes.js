const express = require('express')
const adminAuthController = require('../controllers/adminAuthController')
const { requireAdminAuth } = require('../middleware/adminAuthMiddleware')

const router = express.Router()

router.post('/login', adminAuthController.login)
router.get('/me', requireAdminAuth, adminAuthController.me)

module.exports = router
