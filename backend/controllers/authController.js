const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const userModel = require('../models/userModel')

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

function createToken(user) {
  return jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

async function signup(req, res) {
  try {
    const { name, email, phone, password, latitude, longitude } = req.body || {}

    if (!name || !email || !phone || !password || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        error: 'name, email, phone, password, latitude and longitude are required',
      })
    }

    const lat = Number(latitude)
    const lng = Number(longitude)
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ error: 'latitude and longitude must be valid numbers' })
    }

    const exists = await userModel.findByEmail(email)
    if (exists) return res.status(409).json({ error: 'email already registered' })

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await userModel.createUser({
      name,
      email,
      phone,
      passwordHash,
      latitude: lat,
      longitude: lng,
      role: 'customer',
    })
    const token = createToken(user)

    return res.status(201).json({
      token,
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      latitude: user.latitude,
      longitude: user.longitude,
      role: user.role,
    })
  } catch (error) {
    if (error && error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'email already registered' })
    }
    return res.status(500).json({ error: error.message })
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) return res.status(400).json({ error: 'email and password required' })

    const user = await userModel.findByEmail(email)
    if (!user) return res.status(401).json({ error: 'invalid credentials' })

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'invalid credentials' })

    const token = createToken(user)
    return res.json({
      token,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function me(req, res) {
  try {
    const user = await userModel.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'user not found' })
    return res.json(user)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

module.exports = {
  signup,
  login,
  me,
}
