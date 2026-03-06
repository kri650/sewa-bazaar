const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const path = require('path')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { pool, query } = require('./db')

const app = express()
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

function createToken(user) {
  return jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

function getBearerToken(req) {
  const raw = req.headers.authorization || ''
  if (!raw.startsWith('Bearer ')) return null
  return raw.slice('Bearer '.length)
}

function extractUserId(req) {
  const token = getBearerToken(req)
  if (!token) return null
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    return payload.userId
  } catch (_err) {
    return null
  }
}

function requireAuth(req, res, next) {
  const token = getBearerToken(req)
  if (!token) return res.status(401).json({ error: 'authorization token required' })

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.userId = payload.userId
    return next()
  } catch (_err) {
    return res.status(401).json({ error: 'invalid or expired token' })
  }
}

async function getOrCreateActiveCart(userId) {
  const rows = await query(
    `SELECT id
     FROM carts
     WHERE user_id = ? AND status = 'active'
     ORDER BY id DESC
     LIMIT 1`,
    [userId]
  )

  if (rows.length > 0) return rows[0].id

  const result = await query('INSERT INTO carts (user_id, status) VALUES (?, ?)', [userId, 'active'])
  return result.insertId
}

async function fetchCartItems(cartId) {
  return query(
    `SELECT
      ci.product_id AS productId,
      ci.qty,
      p.name,
      p.price,
      p.unit,
      p.image
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = ?
     ORDER BY ci.id DESC`,
    [cartId]
  )
}

app.get('/health', async (req, res) => {
  try {
    await query('SELECT 1')
    res.json({ status: 'ok', time: new Date().toISOString() })
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message })
  }
})

app.get('/products', async (req, res) => {
  try {
    const rows = await query(
      `SELECT
         p.id,
         p.name,
         p.price,
         p.unit,
         p.image,
         p.description,
         p.category_id AS categoryId,
         c.name AS category
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.is_active = 1
       ORDER BY p.id DESC`
    )

    res.json(rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/products/:id', async (req, res) => {
  try {
    const rows = await query(
      `SELECT
         p.id,
         p.name,
         p.price,
         p.unit,
         p.image,
         p.description,
         p.category_id AS categoryId,
         c.name AS category
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ?
       LIMIT 1`,
      [req.params.id]
    )

    if (rows.length === 0) return res.status(404).json({ error: 'product not found' })
    return res.json(rows[0])
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.post('/users/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body || {}

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' })
    }

    const exists = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [email])
    if (exists.length > 0) {
      return res.status(409).json({ error: 'email already registered' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const result = await query(
      'INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
      [name, email, phone || null, passwordHash]
    )

    const user = { id: result.insertId, name, email, phone: phone || null }
    const token = createToken(user)

    return res.status(201).json({ token, user })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.post('/users/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) return res.status(400).json({ error: 'email and password required' })

    const rows = await query(
      'SELECT id, name, email, phone, password_hash AS passwordHash FROM users WHERE email = ? LIMIT 1',
      [email]
    )

    if (rows.length === 0) return res.status(401).json({ error: 'invalid credentials' })

    const user = rows[0]
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'invalid credentials' })

    const token = createToken(user)
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.get('/users/me', requireAuth, async (req, res) => {
  try {
    const rows = await query('SELECT id, name, email, phone, created_at AS createdAt FROM users WHERE id = ? LIMIT 1', [req.userId])
    if (rows.length === 0) return res.status(404).json({ error: 'user not found' })
    return res.json(rows[0])
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.get('/wishlist', requireAuth, async (req, res) => {
  try {
    const rows = await query(
      `SELECT
         w.product_id AS productId,
         p.name,
         p.price,
         p.unit,
         p.image,
         p.description
       FROM wishlists w
       JOIN products p ON p.id = w.product_id
       WHERE w.user_id = ?
       ORDER BY w.id DESC`,
      [req.userId]
    )

    return res.json(rows)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.post('/wishlist', requireAuth, async (req, res) => {
  try {
    const { productId } = req.body || {}
    if (!productId) return res.status(400).json({ error: 'productId required' })

    const products = await query('SELECT id FROM products WHERE id = ? LIMIT 1', [productId])
    if (products.length === 0) return res.status(404).json({ error: 'product not found' })

    await query('INSERT IGNORE INTO wishlists (user_id, product_id) VALUES (?, ?)', [req.userId, productId])
    return res.status(201).json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.delete('/wishlist/:productId', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?', [req.userId, req.params.productId])
    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.get('/cart', requireAuth, async (req, res) => {
  try {
    const cartId = await getOrCreateActiveCart(req.userId)
    const items = await fetchCartItems(cartId)
    const total = items.reduce((sum, item) => sum + Number(item.price) * item.qty, 0)

    return res.json({ cartId, items, total })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.post('/cart/items', requireAuth, async (req, res) => {
  try {
    const { productId, qty } = req.body || {}
    const safeQty = Number(qty || 1)

    if (!productId || safeQty < 1) {
      return res.status(400).json({ error: 'productId and qty (>=1) are required' })
    }

    const product = await query('SELECT id FROM products WHERE id = ? LIMIT 1', [productId])
    if (product.length === 0) return res.status(404).json({ error: 'product not found' })

    const cartId = await getOrCreateActiveCart(req.userId)

    await query(
      `INSERT INTO cart_items (cart_id, product_id, qty)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty)`,
      [cartId, productId, safeQty]
    )

    return res.status(201).json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.patch('/cart/items/:productId', requireAuth, async (req, res) => {
  try {
    const safeQty = Number(req.body?.qty)
    if (safeQty < 1) return res.status(400).json({ error: 'qty must be >= 1' })

    const cartId = await getOrCreateActiveCart(req.userId)
    await query('UPDATE cart_items SET qty = ? WHERE cart_id = ? AND product_id = ?', [safeQty, cartId, req.params.productId])

    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.delete('/cart/items/:productId', requireAuth, async (req, res) => {
  try {
    const cartId = await getOrCreateActiveCart(req.userId)
    await query('DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?', [cartId, req.params.productId])
    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.post('/orders', async (req, res) => {
  const conn = await pool.getConnection()

  try {
    const userId = extractUserId(req)
    const {
      items,
      customer,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      paymentMethod,
    } = req.body || {}

    let effectiveItems = []
    let activeCartId = null

    if (Array.isArray(items) && items.length > 0) {
      effectiveItems = items.map((item) => ({ productId: Number(item.id || item.productId), qty: Number(item.qty || 1) }))
    } else if (userId) {
      const rows = await query(
        `SELECT c.id AS cartId, ci.product_id AS productId, ci.qty
         FROM carts c
         JOIN cart_items ci ON ci.cart_id = c.id
         WHERE c.user_id = ? AND c.status = 'active'`,
        [userId]
      )

      if (rows.length > 0) {
        activeCartId = rows[0].cartId
        effectiveItems = rows.map((row) => ({ productId: row.productId, qty: row.qty }))
      }
    }

    if (effectiveItems.length === 0) {
      conn.release()
      return res.status(400).json({ error: 'items required (or active cart for logged in user)' })
    }

    const productIds = effectiveItems.map((item) => item.productId)
    const placeholders = productIds.map(() => '?').join(',')
    const [products] = await conn.query(
      `SELECT id, name, price FROM products WHERE id IN (${placeholders})`,
      productIds
    )

    const productMap = new Map(products.map((p) => [Number(p.id), p]))

    const normalizedItems = effectiveItems.map((item) => {
      const prod = productMap.get(Number(item.productId))
      return {
        productId: Number(item.productId),
        qty: Number(item.qty || 1),
        name: prod ? prod.name : 'Unknown',
        price: prod ? Number(prod.price) : 0,
      }
    })

    const total = normalizedItems.reduce((sum, item) => sum + item.price * item.qty, 0)

    await conn.beginTransaction()

    const [orderResult] = await conn.query(
      `INSERT INTO orders (
        user_id,
        customer_name,
        customer_phone,
        customer_email,
        address_line1,
        address_line2,
        city,
        state,
        pincode,
        payment_method,
        total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        customer?.name || null,
        customer?.phone || null,
        customer?.email || null,
        addressLine1 || null,
        addressLine2 || null,
        city || null,
        state || null,
        pincode || null,
        paymentMethod || 'cod',
        total,
      ]
    )

    const orderId = orderResult.insertId

    for (const item of normalizedItems) {
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, product_name, qty, price)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.productId, item.name, item.qty, item.price]
      )
    }

    if (userId) {
      if (activeCartId) {
        await conn.query('DELETE FROM cart_items WHERE cart_id = ?', [activeCartId])
      }
      await conn.query("UPDATE carts SET status = 'ordered' WHERE user_id = ? AND status = 'active'", [userId])
    }

    await conn.commit()

    return res.status(201).json({
      id: orderId,
      createdAt: new Date().toISOString(),
      total,
      items: normalizedItems,
    })
  } catch (error) {
    await conn.rollback()
    return res.status(500).json({ error: error.message })
  } finally {
    conn.release()
  }
})

// Serve static public assets if present
const publicDir = path.join(__dirname, 'public')
app.use('/static', express.static(publicDir))

// Last-resort error handler
app.use((err, req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: err.message || 'internal server error' })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`organic-backend listening on http://localhost:${PORT}`)
})

module.exports = app
