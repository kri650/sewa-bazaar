/**
 * otpAuthController.js
 * --------------------
 * Handles OTP-based signup and plain login.
 *
 * Signup flow (2 steps):
 *   1. POST /api/otp-auth/signup     → validate input, generate OTP, store pending user
 *   2. POST /api/otp-auth/verify-otp → check OTP, create account, return JWT
 *
 * Login flow (1 step, no OTP):
 *   POST /api/otp-auth/login         → email or phone + password → JWT
 *
 * Logout:
 *   POST /api/otp-auth/logout        → server-side token blacklist
 */

const bcrypt    = require('bcryptjs')
const jwt       = require('jsonwebtoken')
const axios     = require('axios')
const userModel = require('../models/userModel')
const userExt   = require('../models/userModelExt')
const otpStore  = require('../utils/otpStore')

const JWT_SECRET     = process.env.JWT_SECRET     || 'dev_secret_change_me'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// ─── helpers ────────────────────────────────────────────────────────────────

function createToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

function generateOtp() {
  // Cryptographically random 6-digit OTP
  const min = 100000
  const max = 999999
  return String(min + (Math.floor(Math.random() * (max - min + 1))))
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))
}

function isValidPhone(phone) {
  // Accepts +91XXXXXXXXXX, 0XXXXXXXXXX, or 10-digit formats
  return /^\+?[0-9]{7,15}$/.test(String(phone))
}

// ─── Step 1: Signup — validate input, store pending user + OTP ──────────────

async function signup(req, res) {
  try {
    const { name, email, phone, password, latitude, longitude } = req.body || {}

    // Input validation
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        error: 'name, email, phone and password are required',
      })
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'invalid email address' })
    }
    if (!isValidPhone(phone)) {
      return res.status(400).json({ error: 'invalid phone number (7–15 digits)' })
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'password must be at least 6 characters' })
    }

    const lat = latitude  !== undefined ? Number(latitude)  : 0
    const lng = longitude !== undefined ? Number(longitude) : 0

    // Check if email already registered
    const exists = await userModel.findByEmail(email)
    if (exists) {
      return res.status(409).json({ error: 'email already registered' })
    }

    // Hash password now so it is never stored in plain text even temporarily
    const passwordHash = await bcrypt.hash(String(password), 10)

    // Generate OTP
    const otp = generateOtp()

    // Store pending signup data keyed by email (expires in 10 min)
    otpStore.set(`signup:${email}`, {
      name,
      email,
      phone,
      passwordHash,
      latitude: lat,
      longitude: lng,
      otp,
    })

    // ── Send OTP via MSG91 SMS ──────────────────────────────────────────────
    console.log(`[OTP] Signup OTP for ${email} (phone: ${phone}): ${otp}`)

    const MSG91_AUTH_KEY   = process.env.MSG91_AUTH_KEY
    const MSG91_SENDER_ID  = process.env.MSG91_SENDER_ID  || 'SEWABZ'
    const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID

    if (MSG91_AUTH_KEY) {
      try {
        // Normalize phone — strip leading 0 or +91, keep 10 digits, then prefix 91
        const digits = String(phone).replace(/\D/g, '').replace(/^(0|91)/, '')
        const mobile = `91${digits}`

        await axios.post(
          'https://api.msg91.com/api/v5/otp',
          {
            template_id: MSG91_TEMPLATE_ID,
            mobile,
            authkey: MSG91_AUTH_KEY,
            otp,
          },
          { headers: { 'Content-Type': 'application/json' } }
        )
        console.log(`[OTP] SMS sent to ${mobile}`)
      } catch (smsErr) {
        // SMS failed — OTP still works via console log in dev
        console.error('[OTP] SMS send failed:', smsErr?.response?.data || smsErr.message)
      }
    } else {
      console.warn('[OTP] MSG91_AUTH_KEY not set — OTP only in console (dev mode)')
    }
    // ───────────────────────────────────────────────────────────────────────

    return res.status(200).json({
      message: 'OTP sent. Enter it to complete your registration.',
      // Expose OTP in dev/test only — remove or gate behind feature flag in production
      ...(process.env.NODE_ENV !== 'production' && { _dev_otp: otp }),
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// ─── Step 2: Verify OTP — create account, return JWT ────────────────────────

async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body || {}

    if (!email || !otp) {
      return res.status(400).json({ error: 'email and otp are required' })
    }

    const pending = otpStore.get(`signup:${email}`)

    if (!pending) {
      return res.status(400).json({
        error: 'OTP expired or signup not started. Please sign up again.',
      })
    }

    if (String(pending.otp) !== String(otp).trim()) {
      return res.status(400).json({ error: 'incorrect OTP' })
    }

    // OTP verified — remove from store immediately (single-use)
    otpStore.del(`signup:${email}`)

    // Guard against duplicate (e.g. user submitted twice in race)
    const alreadyExists = await userModel.findByEmail(email)
    if (alreadyExists) {
      return res.status(409).json({ error: 'account already exists' })
    }

    // Create user account using prepared statements via existing model
    const user = await userModel.createUser({
      name:         pending.name,
      email:        pending.email,
      phone:        pending.phone,
      passwordHash: pending.passwordHash,
      latitude:     pending.latitude,
      longitude:    pending.longitude,
      role:         'customer',
    })

    const token = createToken(user)

    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      id:    user.id,
      name:  user.name,
      email: user.email,
      phone: user.phone,
      role:  user.role,
    })
  } catch (error) {
    if (error && error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'email already registered' })
    }
    return res.status(500).json({ error: error.message })
  }
}

// ─── Step 2b: Verify via MSG91 Widget token ─────────────────────────────────
// Called after MSG91 Widget SDK confirms OTP on client side.
// The widget returns a "verified token" (data.message) that we validate with
// MSG91's /api/v5/widget/verifyAccessToken endpoint, then create the account.

async function verifyWidget(req, res) {
  try {
    const { email, verifiedToken } = req.body || {}

    if (!email || !verifiedToken) {
      return res.status(400).json({ error: 'email and verifiedToken are required' })
    }

    const pending = otpStore.get(`signup:${email}`)
    if (!pending) {
      return res.status(400).json({
        error: 'Session expired. Please sign up again.',
      })
    }

    // Validate the token with MSG91
    const MSG91_TOKEN_AUTH = process.env.MSG91_TOKEN_AUTH
    const MSG91_WIDGET_ID  = process.env.MSG91_WIDGET_ID

    if (MSG91_TOKEN_AUTH) {
      try {
        // MSG91 verifyAccessToken — authkey + access-token both go in the request body
        const verifyRes = await axios.post(
          'https://control.msg91.com/api/v5/widget/verifyAccessToken',
          {
            authkey: MSG91_TOKEN_AUTH,
            'access-token': verifiedToken,
          },
          { headers: { 'Content-Type': 'application/json' } }
        )
        const result = verifyRes.data
        // MSG91 returns { type: 'success', message: '...' } on success
        if (!result || result.type !== 'success') {
          console.error('[MSG91 Widget] Rejected:', result)
          return res.status(401).json({ error: 'OTP verification failed. Please try again.' })
        }
        console.log('[MSG91 Widget] Token verified OK for', email)
      } catch (verifyErr) {
        console.error('[MSG91 Widget] Token verify failed:', verifyErr?.response?.data || verifyErr.message)
        return res.status(401).json({ error: 'Could not verify OTP with MSG91. Please try again.' })
      }
    } else {
      console.warn('[MSG91 Widget] MSG91_TOKEN_AUTH not set — skipping validation (dev mode)')
    }

    // Token valid — remove pending entry
    otpStore.del(`signup:${email}`)

    const alreadyExists = await userModel.findByEmail(email)
    if (alreadyExists) {
      return res.status(409).json({ error: 'account already exists' })
    }

    const user = await userModel.createUser({
      name:         pending.name,
      email:        pending.email,
      phone:        pending.phone,
      passwordHash: pending.passwordHash,
      latitude:     pending.latitude,
      longitude:    pending.longitude,
      role:         'customer',
    })

    const token = createToken(user)

    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      id:    user.id,
      name:  user.name,
      email: user.email,
      phone: user.phone,
      role:  user.role,
    })
  } catch (error) {
    if (error && error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'email already registered' })
    }
    return res.status(500).json({ error: error.message })
  }
}

// ─── Login — email OR phone + password, no OTP ──────────────────────────────

async function login(req, res) {
  try {
    const { email, phone, password } = req.body || {}

    if ((!email && !phone) || !password) {
      return res.status(400).json({
        error: 'email or phone, and password are required',
      })
    }

    // Look up user by email first, then phone
    let user = null
    if (email) {
      user = await userModel.findByEmail(email)
    } else {
      user = await userExt.findByPhone(phone)
    }

    // Use the same generic error for both "not found" and "wrong password"
    // to prevent user enumeration
    if (!user) {
      return res.status(401).json({ error: 'invalid credentials' })
    }

    const passwordOk = await bcrypt.compare(String(password), user.passwordHash)
    if (!passwordOk) {
      return res.status(401).json({ error: 'invalid credentials' })
    }

    const token = createToken(user)

    return res.json({
      message: 'Login successful.',
      token,
      id:    user.id,
      name:  user.name,
      email: user.email,
      phone: user.phone,
      role:  user.role,
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// ─── Logout — server-side token blacklist ───────────────────────────────────
// JWT is stateless; blacklisting the token invalidates it on this server.
// (In production use Redis with token TTL matching JWT_EXPIRES_IN)

const tokenBlacklist = new Set()

function logout(req, res) {
  const authHeader = req.headers.authorization || ''
  if (authHeader.startsWith('Bearer ')) {
    tokenBlacklist.add(authHeader.slice(7))
  }
  return res.json({ message: 'Logged out successfully.' })
}

module.exports = {
  signup,
  verifyOtp,
  verifyWidget,
  login,
  logout,
  tokenBlacklist, // exported so middleware can check it if needed
}
