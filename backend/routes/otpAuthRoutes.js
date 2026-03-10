/**
 * otpAuthRoutes.js
 * ----------------
 * New auth routes with OTP signup and plain login.
 * Mounted at /api/otp-auth in index.js.
 *
 * Endpoints:
 *   POST /api/otp-auth/signup      — Step 1: submit details, get OTP
 *   POST /api/otp-auth/verify-otp  — Step 2: submit OTP, create account
 *   POST /api/otp-auth/login       — Login with email/phone + password (no OTP)
 *   POST /api/otp-auth/logout      — Invalidate token server-side
 */

const express           = require('express')
const otpAuthController = require('../controllers/otpAuthController')

const router = express.Router()

// Signup — Step 1: validate input, store pending user, send OTP
router.post('/signup', otpAuthController.signup)

// Signup — Step 2: verify OTP and create account
router.post('/verify-otp', otpAuthController.verifyOtp)

// Login — no OTP required
router.post('/login', otpAuthController.login)

// Logout — blacklists the JWT token server-side
router.post('/logout', otpAuthController.logout)

module.exports = router
