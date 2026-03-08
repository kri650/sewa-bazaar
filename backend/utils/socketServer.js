/**
 * Socket.io server — shared singleton.
 *
 * Rooms:
 *   "admins"              – all logged-in admin dashboard clients
 *   "delivery:<userId>"   – a specific delivery boy's device
 *   "user:<userId>"       – a specific customer's device (order tracking)
 *
 * Events emitted BY server:
 *   NEW_ORDER             → room: admins
 *   ORDER_ASSIGNED        → room: delivery:<id>  +  room: admins
 *   ORDER_STATUS_UPDATE   → room: user:<id>  +  room: admins
 */

const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'

let io = null

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    path: '/socket.io',
  })

  // ── Auth middleware ──────────────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token
    if (!token) return next(new Error('auth:token_required'))
    try {
      const payload = jwt.verify(token, JWT_SECRET)
      socket.data.userId   = payload.userId   || payload.adminId || null
      socket.data.role     = payload.role      || (payload.source === 'admin' ? 'admin' : 'customer')
      socket.data.source   = payload.source    || 'user'
      next()
    } catch (_) {
      next(new Error('auth:invalid_token'))
    }
  })

  io.on('connection', (socket) => {
    const { userId, role, source } = socket.data

    // Join appropriate rooms based on role
    if (source === 'admin' || role === 'admin') {
      socket.join('admins')
      console.log(`[Socket.io] Admin connected: socket=${socket.id}`)
    } else if (role === 'delivery') {
      socket.join(`delivery:${userId}`)
      console.log(`[Socket.io] Delivery boy ${userId} connected: socket=${socket.id}`)
    } else {
      socket.join(`user:${userId}`)
      console.log(`[Socket.io] Customer ${userId} connected: socket=${socket.id}`)
    }

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Socket ${socket.id} (role=${role}) disconnected`)
    })
  })

  console.log('[Socket.io] Server ready')
  return io
}

// ── Emit helpers ─────────────────────────────────────────────────────────────

/** Notify all admins: a new order was placed */
function notifyNewOrder(orderData) {
  if (!io) return
  io.to('admins').emit('NEW_ORDER', orderData)
}

/** Notify delivery boy: they have been assigned an order */
function notifyDeliveryAssigned(deliveryUserId, orderData) {
  if (!io) return
  io.to(`delivery:${deliveryUserId}`).emit('ORDER_ASSIGNED', orderData)
  io.to('admins').emit('ORDER_ASSIGNED', orderData)
}

/** Notify customer + admins: order status changed */
function notifyOrderStatusUpdate(customerUserId, orderData) {
  if (!io) return
  if (customerUserId) io.to(`user:${customerUserId}`).emit('ORDER_STATUS_UPDATE', orderData)
  io.to('admins').emit('ORDER_STATUS_UPDATE', orderData)
}

function getIO() { return io }

module.exports = {
  initSocket,
  notifyNewOrder,
  notifyDeliveryAssigned,
  notifyOrderStatusUpdate,
  getIO,
}
