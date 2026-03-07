const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const adminAuthModel = require('../models/adminAuthModel')

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

async function login(req, res) {
  try {
    const { email, password } = req.body || {}
    if (!email || !password)
      return res.status(400).json({ error: 'email and password required' })

    const admin = await adminAuthModel.findByEmail(email.trim().toLowerCase())
    if (!admin)
      return res.status(401).json({ error: 'invalid credentials' })

    const ok = await bcrypt.compare(password, admin.passwordHash)
    if (!ok)
      return res.status(401).json({ error: 'invalid credentials' })

    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, source: 'admin' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    return res.json({ token, id: admin.id, name: admin.name, email: admin.email, role: 'admin' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

async function me(req, res) {
  try {
    const admin = await adminAuthModel.findById(req.adminId)
    if (!admin) return res.status(404).json({ error: 'admin not found' })
    return res.json({ ...admin, role: 'admin' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

module.exports = { login, me }
