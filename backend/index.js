require('dotenv').config()
const express = require('express')
const http = require('http')
const cors = require('cors')
const morgan = require('morgan')
const path = require('path')

const { query, checkConnection, dbConfig } = require('./config/db')
const authRoutes           = require('./routes/authRoutes')
const adminAuthRoutes      = require('./routes/adminAuthRoutes')
const otpAuthRoutes        = require('./routes/otpAuthRoutes')   // OTP signup + login
const productRoutes        = require('./routes/productRoutes')
const orderRoutes          = require('./routes/orderRoutes')
const adminRoutes          = require('./routes/adminRoutes')
const adminDashboardRoutes = require('./routes/adminDashboardRoutes')
const deliveryRoutes       = require('./routes/deliveryRoutes')
const userDashRoutes       = require('./routes/userDashRoutes')    // user dashboard
const paymentRoutes        = require('./routes/paymentRoutes')     // razorpay payment
const couponRoutes         = require('./routes/couponRoutes')
const warehouseAdminRoutes = require('./routes/warehouseAdminRoutes') // warehouse admin
const warehouseAuthRoutes  = require('./routes/warehouseAuthRoutes')  // warehouse admin auth
const warehouseRoutes      = require('./routes/warehouseRoutes')
const { requireAdminAuth } = require('./middleware/adminAuthMiddleware')
const { initSocket }       = require('./utils/socketServer')
const { initializeDatabase } = require('./utils/initializeDb')
const warehouseController  = require('./controllers/warehouseController')

const app = express()
const httpServer = http.createServer(app)

app.use(cors({ origin: '*' }))
app.use(morgan('dev'))
app.use(express.json())

app.get('/', (_req, res) => res.json({ app: 'organic-backend', status: 'running' }))

app.get('/health', async (_req, res) => {
  try {
    await query('SELECT 1')
    return res.json({ status: 'ok', time: new Date().toISOString() })
  } catch (error) {
    return res.status(500).json({ status: 'error', error: error.message })
  }
})

// Public warehouse metrics (global counts) used by dashboards/health widgets
app.get('/api/warehouse/metrics', async (_req, res) => {
  try {
    const [ordersRow] = await query('SELECT COUNT(*) AS total_orders FROM orders')
    const [productsRow] = await query('SELECT COUNT(*) AS total_products FROM products')
    const [usersRow] = await query('SELECT COUNT(*) AS total_users FROM users')

    return res.json({
      ok: true,
      total_orders: Number(ordersRow?.total_orders || 0),
      total_products: Number(productsRow?.total_products || 0),
      total_users: Number(usersRow?.total_users || 0),
    })
  } catch (err) {
    console.error('[api/warehouse/metrics] error:', err)
    return res.status(500).json({ ok: false, error: err.message })
  }
})

// Public delivery config used by frontend (warehouse list)
// New canonical route:
app.get('/api/delivery/get-config', warehouseController.getWarehouses)
// Backward-compatible alias for older frontend code:
app.get('/api/delivery-config', warehouseController.getWarehouses)

app.use('/api/auth',       authRoutes)
app.use('/api/admin/auth', adminAuthRoutes)
app.use('/api/otp-auth',   otpAuthRoutes)        // OTP signup + login
app.use('/api/warehouse-admin', warehouseAuthRoutes) // warehouse admin auth (public: login + create — MUST be before generic /api mounts)
app.use('/api/warehouse', warehouseRoutes) // warehouse admin login alias
app.use('/api/products',   productRoutes)  // Public products API
app.use('/api/coupons',    couponRoutes)
app.use('/products',       productRoutes)  // Backward compatibility
app.use('/',               orderRoutes)
app.use('/admin',          requireAdminAuth, adminRoutes)
app.use('/api/admin',      requireAdminAuth, adminRoutes)
app.use('/api',            adminDashboardRoutes)
// Mount delivery routes before generic /api routers that use router-level auth,
// otherwise public delivery login (/api/delivery/login) gets blocked.
app.use('/api/delivery',   deliveryRoutes)
app.use('/api',            userDashRoutes)          // user dashboard routes
app.use('/api',            paymentRoutes)           // payment: create-order, verify
app.use('/api',            warehouseAdminRoutes)    // warehouse admin routes (protected)
app.use('/delivery',       deliveryRoutes)

// MSG91 Widget webhook — called by MSG91 after OTP verified on their side
app.post('/otp/webhook', express.json(), (req, res) => {
  console.log('[MSG91 Webhook]', JSON.stringify(req.body))
  res.status(200).json({ success: true })
})

const publicDir = path.join(__dirname, 'public')
app.use('/static', express.static(publicDir))

app.use((err, _req, res, _next) => {
  if (err?.name === 'MulterError') {
    return res.status(400).json({ error: err.message || 'Invalid file upload' })
  }
  if (err?.message === 'Only image files are allowed') {
    return res.status(400).json({ error: err.message })
  }
  console.error(err)
  res.status(500).json({ error: err.message || 'internal server error' })
})

const PORT = process.env.PORT || 5000

async function startServer() {
  const maxRetries = Number(process.env.DB_STARTUP_RETRIES || 5)
  const delayMs    = Number(process.env.DB_STARTUP_DELAY_MS || 3000)

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await checkConnection()

    if (result.ok) {
      // Initialize database schema and run migrations
      const dbInitResult = await initializeDatabase()
      if (!dbInitResult.ok) {
        console.warn(`⚠️  Database initialization warning: ${dbInitResult.error}`)
        // Continue despite warning - migrations may have already been applied
      } else {
        console.log(`✅ Database schema initialized`)
      }

      initSocket(httpServer)
      httpServer.listen(PORT, () => {
        console.log(`✅ organic-backend  →  http://localhost:${PORT}`)
        console.log(`🔌 Socket.io ready  →  ws://localhost:${PORT}/socket.io`)
      })
      return
    }

    console.error(`DB check failed (attempt ${attempt}/${maxRetries}): [${result.code}] ${result.message}`)
    if (attempt < maxRetries) await new Promise((r) => setTimeout(r, delayMs))
  }

  console.error(`Failed to connect to DB after ${maxRetries} attempts (host=${dbConfig.host})`)
  process.exit(1)
}

startServer()
module.exports = app
