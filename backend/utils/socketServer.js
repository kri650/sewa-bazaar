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
const { query } = require('../config/db')

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
      socket.data.userId   = payload.userId   || payload.adminId || payload.warehouseAdminId || null
      socket.data.role     = payload.role      || (payload.source === 'admin' ? 'admin' : 'customer')
      socket.data.source   = payload.source    || 'user'
      next()
    } catch (_) {
      next(new Error('auth:invalid_token'))
    }
  })

  io.on('connection', (socket) => {
    const { userId, role, source } = socket.data
    const email = String(socket.handshake.auth?.email || socket.handshake.query?.email || '').trim().toLowerCase()

    // Join appropriate rooms based on role
    if (source === 'admin' || role === 'admin' || role === 'warehouse_admin') {
      socket.join('admins')
      console.log(`[Socket.io] Admin connected: socket=${socket.id}`)
    } else if (role === 'delivery') {
      socket.join(`delivery:${userId}`)
      if (email) socket.join(`delivery-email:${email}`)

      // Also join partner-id room when we can map delivery user email to delivery_partners.id.
      ;(async () => {
        try {
          if (!email) return
          const rows = await query(
            `SELECT id FROM delivery_partners WHERE LOWER(email) = ? LIMIT 1`,
            [email]
          )
          const partnerId = Number(rows?.[0]?.id || 0)
          if (partnerId) socket.join(`delivery-partner:${partnerId}`)
        } catch (_err) {
          // Non-fatal: room enrichment failed, base room join already done.
        }
      })()

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
  const payload = {
    ...orderData,
    id: Number(orderData?.id || orderData?.orderId) || null,
    orderId: Number(orderData?.orderId || orderData?.id) || null,
  }

  const emitForDeliveryRoom = (roomUserId) => {
    if (!roomUserId) return
    io.to(`delivery:${roomUserId}`).emit('ORDER_ASSIGNED', payload)
    io.to(`delivery:${roomUserId}`).emit('new_delivery_order', payload)
    io.to(`delivery-partner:${roomUserId}`).emit('ORDER_ASSIGNED', payload)
    io.to(`delivery-partner:${roomUserId}`).emit('new_delivery_order', payload)
  }

  const emitForDeliveryEmail = (email) => {
    const safeEmail = String(email || '').trim().toLowerCase()
    if (!safeEmail) return
    io.to(`delivery-email:${safeEmail}`).emit('ORDER_ASSIGNED', payload)
    io.to(`delivery-email:${safeEmail}`).emit('new_delivery_order', payload)
  }

  // Backward compatibility: some flows pass delivery_partner_id here.
  // Emit immediately to provided ID, then also resolve mapped users.id and emit there.
  emitForDeliveryRoom(Number(deliveryUserId))

  ;(async () => {
    try {
      const partnerId = Number(deliveryUserId)
      if (!partnerId || Number.isNaN(partnerId)) return

      const rows = await query(
        `SELECT u.id AS userId, dp.id AS partnerId, dp.email AS partnerEmail
         FROM delivery_partners dp
         LEFT JOIN users u ON u.email = dp.email AND u.role = 'delivery'
         WHERE dp.id = ?
         LIMIT 1`,
        [partnerId]
      )

      const mappedUserId = Number(rows?.[0]?.userId || 0)
      const mappedPartnerId = Number(rows?.[0]?.partnerId || 0)
      const mappedEmail = rows?.[0]?.partnerEmail || ''

      if (mappedUserId && mappedUserId !== partnerId) {
        emitForDeliveryRoom(mappedUserId)
      }
      if (mappedPartnerId && mappedPartnerId !== partnerId) {
        emitForDeliveryRoom(mappedPartnerId)
      }
      emitForDeliveryEmail(mappedEmail)
    } catch (_err) {
      // Ignore mapping failures; primary emit above has already run.
    }
  })()

  // New event alias for delivery dashboards expecting this naming.
  io.to('admins').emit('ORDER_ASSIGNED', payload)
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
