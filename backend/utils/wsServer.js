/**
 * WebSocket server — shared singleton.
 *
 * Usage:
 *   const { initWS, broadcastToAdmins } = require('./utils/wsServer')
 *   initWS(httpServer)                          // call once on startup
 *   broadcastToAdmins({ type: 'NEW_ORDER', ... }) // call from anywhere
 */

const { WebSocketServer } = require('ws')

let wss = null

/**
 * Attach the WebSocket server to an existing HTTP server.
 * @param {import('http').Server} httpServer
 */
function initWS(httpServer) {
  wss = new WebSocketServer({ server: httpServer, path: '/ws' })

  wss.on('connection', (ws, req) => {
    console.log('[WS] Admin client connected from', req.socket.remoteAddress)

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw)
        // ping/pong keep-alive
        if (msg.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }))
      } catch (_) {}
    })

    ws.on('close', () => {
      console.log('[WS] Admin client disconnected')
    })

    // Send a welcome confirmation immediately
    ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Admin WebSocket connected' }))
  })

  console.log('[WS] WebSocket server ready on /ws')
  return wss
}

/**
 * Broadcast a JSON message to ALL connected admin clients.
 * @param {object} payload
 */
function broadcastToAdmins(payload) {
  if (!wss) return
  const data = JSON.stringify(payload)
  wss.clients.forEach((client) => {
    if (client.readyState === 1 /* OPEN */) {
      client.send(data)
    }
  })
}

module.exports = { initWS, broadcastToAdmins }
