const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const deliveryAuthModel = require('../models/deliveryAuthModel')
const userModel = require('../models/userModel')

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    let partner = await deliveryAuthModel.findPartnerByEmail(normalizedEmail)
    let source = 'delivery_partners'

    if (!partner || !partner.passwordHash) {
      const user = await userModel.findByEmail(normalizedEmail)
      if (user && user.role === 'delivery') {
        partner = {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          passwordHash: user.passwordHash,
          warehouseId: null,
          status: 'active',
          createdAt: user.createdAt || null,
        }
        source = 'users'
      }
    }

    if (!partner) return res.status(401).json({ error: 'Invalid credentials' })

    let ok = false
    try {
      ok = await bcrypt.compare(String(password), String(partner.passwordHash || ''))
    } catch (_err) {
      ok = String(password) === String(partner.passwordHash || '')
    }

    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

    const token = createToken({ userId: partner.id, email: partner.email, role: 'delivery' })

    return res.json({
      token,
      id: partner.id,
      name: partner.name,
      email: partner.email,
      phone: partner.phone,
      warehouseId: partner.warehouseId || null,
      status: partner.status || 'active',
      role: 'delivery',
      source,
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function me(req, res) {
  try {
    const tokenEmail = String(req.auth?.email || '').trim().toLowerCase()
    const deliveryPartner = await deliveryAuthModel.findPartnerById(req.userId)
    if (deliveryPartner && (!tokenEmail || deliveryPartner.email?.toLowerCase() === tokenEmail)) {
      return res.json({
        id: deliveryPartner.id,
        name: deliveryPartner.name,
        email: deliveryPartner.email,
        phone: deliveryPartner.phone,
        warehouseId: deliveryPartner.warehouseId || null,
        status: deliveryPartner.status || 'active',
        createdAt: deliveryPartner.createdAt || null,
        role: 'delivery',
        source: 'delivery_partners',
      })
    }

    const user = await userModel.findById(req.userId)
    if (!user || user.role !== 'delivery') return res.status(404).json({ error: 'user not found' })

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt || null,
      source: 'users',
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

module.exports = { login, me }
