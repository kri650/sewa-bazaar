require('dotenv').config()
const express = require('express')
const http = require('http')
const cors = require('cors')
const morgan = require('morgan')
const path = require('path')

const { query, checkConnection, dbConfig } = require('./config/db')
const authRoutes           = require('./routes/authRoutes')
const adminAuthRoutes      = require('./routes/adminAuthRoutes')
const productRoutes        = require('./routes/productRoutes')
const orderRoutes          = require('./routes/orderRoutes')
const adminRoutes          = require('./routes/adminRoutes')
const adminDashboardRoutes = require('./routes/adminDashboardRoutes')
const deliveryRoutes       = require('./routes/deliveryRoutes')
const { requireAdminAuth } = require('./middleware/adminAuthMiddleware')
const { initSocket }       = require('./utils/socketServer')

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

app.use('/api/auth',       authRoutes)
app.use('/api/admin/auth', adminAuthRoutes)
app.use('/products',       productRoutes)
app.use('/',               orderRoutes)
app.use('/admin',          requireAdminAuth, adminRoutes)
app.use('/api',            adminDashboardRoutes)
app.use('/delivery',       deliveryRoutes)

const publicDir = path.join(__dirname, 'public')
app.use('/static', express.static(publicDir))

app.use((err, _req, res, _next) => {
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
