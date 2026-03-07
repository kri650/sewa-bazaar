import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'

/**
 * useSocket – connects to the backend Socket.io server.
 * @param {string|null} token  JWT token for authentication
 * @returns {{ socket, connected }}
 */
export function useSocket(token) {
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!token) return

    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    })

    socketRef.current = socket

    socket.on('connect',    () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('connect_error', (err) => {
      console.warn('[Socket.io] connect_error:', err.message)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      setConnected(false)
    }
  }, [token])

  return { socket: socketRef.current, connected }
}
