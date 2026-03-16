const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const warehouseAuthModel = require('../models/warehouseAuthModel')
const { query } = require('../config/db')

const JWT_SECRET     = process.env.JWT_SECRET     || 'dev_secret_change_me'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// POST /api/warehouse-admin  OR  POST /api/warehouse-admin/create
async function create(req, res) {
  try {
    const { name, email, password, warehouse_id } = req.body || {}
    if (!name || !email || !password)
      return res.status(400).json({ error: 'name, email and password are required' })

    if (password.length < 6)
      return res.status(400).json({ error: 'password must be at least 6 characters' })

    const existing = await warehouseAuthModel.findByEmail(email.trim().toLowerCase())
    if (existing)
      return res.status(409).json({ error: 'an account with this email already exists' })

    const passwordHash = await bcrypt.hash(password, 12)
    const admin = await warehouseAuthModel.createWarehouseAdmin({
      name:        name.trim(),
      email:       email.trim().toLowerCase(),
      passwordHash,
      warehouseId: warehouse_id ? Number(warehouse_id) : null,
    })

    return res.status(201).json({
      message: 'Warehouse admin created successfully',
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

// POST /api/warehouse-admin/login
async function login(req, res) {
  try {
    const { email, password } = req.body || {}
    if (!email || !password)
      return res.status(400).json({ error: 'email and password are required' })

    const admin = await warehouseAuthModel.findByEmail(email.trim().toLowerCase())
    if (!admin)
      return res.status(401).json({ error: 'Invalid credentials' })

    // Support both bcrypt-hashed passwords and legacy plaintext passwords.
    // If stored value is not a bcrypt hash, bcrypt.compare may throw.
    let ok = false
    try {
      ok = await bcrypt.compare(String(password), String(admin.passwordHash || ''))
    } catch (_err) {
      ok = String(password) === String(admin.passwordHash || '')
    }
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign(
      {
        warehouseAdminId: admin.id,
        email: admin.email,
        role: 'warehouse_admin',
        warehouseId: admin.warehouseId || null,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    let warehouseName = null
    let warehouseCity = null

    if (admin.warehouseId) {
      try {
        const rows = await query(
          'SELECT name, city FROM warehouses WHERE id = ? LIMIT 1',
          [admin.warehouseId]
        )
        if (rows && rows.length) {
          warehouseName = rows[0].name || null
          warehouseCity = rows[0].city || null
        }
      } catch (_err) {
        // Non-fatal: login should still succeed even if warehouse lookup fails.
      }
    }

    return res.json({
      token,
      id:          admin.id,
      admin_id:    admin.id,
      name:        admin.name,
      email:       admin.email,
      warehouseId: admin.warehouseId || null,
      warehouse_id: admin.warehouseId || null,
      warehouseName,
      warehouse_name: warehouseName,
      warehouseCity,
      warehouse_city: warehouseCity,
      role:        'warehouse_admin',
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

module.exports = { create, login }
