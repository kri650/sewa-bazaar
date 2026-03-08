import { useEffect, useRef, useState, useMemo } from 'react'
import { io } from 'socket.io-client'
import styles from '../styles/delivery.module.css'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'

const STATUS_FLOW = ['confirmed', 'accepted', 'picked_up', 'out_for_delivery', 'delivered']

const STATUS_LABELS = {
  confirmed:        { label: 'Confirmed',        icon: '✅', color: '#0369a1', bg: '#e0f2fe' },
  accepted:         { label: 'Accepted',          icon: '👍', color: '#a16207', bg: '#fef9c3' },
  picked_up:        { label: 'Picked Up',         icon: '📦', color: '#c2410c', bg: '#ffedd5' },
  out_for_delivery: { label: 'Out for Delivery',  icon: '🛵', color: '#1d4ed8', bg: '#dbeafe' },
  delivered:        { label: 'Delivered',         icon: '🎉', color: '#15803d', bg: '#dcfce7' },
  cancelled:        { label: 'Cancelled',         icon: '❌', color: '#b91c1c', bg: '#fee2e2' },
  pending:          { label: 'Pending',            icon: '⏳', color: '#b45309', bg: '#fff7e0' },
}

function Badge({ status }) {
  const s = STATUS_LABELS[status] || { label: status, icon: '•', color: '#6b7280', bg: '#f3f4f6' }
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
      {s.icon} {s.label}
    </span>
  )
}

function formatDate(v) {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d) ? '—' : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function DeliveryDashboard() {
  const [token, setToken]         = useState('')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loginErr, setLoginErr]   = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [profile, setProfile]     = useState(null)
  const [sessionChecked, setSessionChecked] = useState(false)

  const [orders, setOrders]       = useState([])
  const [activeOrder, setActiveOrder] = useState(null)
  const [orderItems, setOrderItems]   = useState([])
  const [loadingItems, setLoadingItems] = useState(false)

  const [notification, setNotification] = useState(null)
  const socketRef = useRef(null)

  const isLoggedIn = Boolean(token && profile)

  const authH = useMemo(() => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token])

  // ── Restore session ──────────────────────────────────────────────────────
  useEffect(() => {
    const t = localStorage.getItem('deliveryToken') || ''
    if (t) {
      setToken(t)
      fetchProfile(t)
    } else {
      setSessionChecked(true)
    }
  }, [])

  async function fetchProfile(t) {
    try {
      const r = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      })
      if (!r.ok) { localStorage.removeItem('deliveryToken'); setSessionChecked(true); return }
      const d = await r.json()
      if (d.role !== 'delivery') { localStorage.removeItem('deliveryToken'); setSessionChecked(true); return }
      setProfile(d)
    } catch (_) {
    } finally {
      setSessionChecked(true)
    }
  }

  // ── Socket.io ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!profile || !token) return   // wait until profile is confirmed

    const socket = io(API_BASE, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    socket.on('connect', () => console.log('[Socket.io] Delivery connected, id:', socket.id))
    socket.on('connect_error', (err) => console.error('[Socket.io] connect_error:', err.message))

    // Admin assigned a new order to this delivery boy
    socket.on('ORDER_ASSIGNED', (data) => {
      console.log('[Socket.io] ORDER_ASSIGNED received:', data)
      showNotification(`🛵 New order assigned! Order #${data.orderId} — ₹${Number(data.total||0).toLocaleString('en-IN')}`)
      fetchOrders(token)
    })

    return () => { socket.disconnect(); socketRef.current = null }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, token])

  function showNotification(msg) {
    setNotification(msg)
    setTimeout(() => setNotification(null), 6000)
  }

  async function fetchOrders(t = token) {
    try {
      const r = await fetch(`${API_BASE}/delivery/orders`, {
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      })
      const d = await r.json()
      setOrders(Array.isArray(d) ? d : [])
    } catch (_) {}
  }

  useEffect(() => {
    if (profile) fetchOrders()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  async function handleLogin(e) {
    e.preventDefault()
    setLoginErr('')
    setLoginLoading(true)
    try {
      const r = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginForm.email.trim(), password: loginForm.password }),
      })
      const d = await r.json()
      if (!r.ok) { setLoginErr(d?.error || 'Login failed'); return }
      if (d.role !== 'delivery') { setLoginErr('This account is not a delivery partner'); return }
      localStorage.setItem('deliveryToken', d.token)
      setToken(d.token)
      setProfile(d)
    } catch (err) {
      setLoginErr(err.message || 'Connection failed')
    } finally {
      setLoginLoading(false)
    }
  }

  async function openOrder(order) {
    setActiveOrder(order)
    setLoadingItems(true)
    try {
      const r = await fetch(`${API_BASE}/delivery/orders/${order.id}/items`, { headers: authH })
      const d = await r.json()
      setOrderItems(Array.isArray(d) ? d : [])
    } catch (_) { setOrderItems([]) }
    finally { setLoadingItems(false) }
  }

  async function updateStatus(orderId, newStatus) {
    try {
      const r = await fetch(`${API_BASE}/delivery/orders/${orderId}/status`, {
        method: 'PUT', headers: authH,
        body: JSON.stringify({ status: newStatus }),
      })
      const d = await r.json()
      if (!r.ok) { alert(d?.error || 'Update failed'); return }
      // Refresh
      fetchOrders()
      // Update activeOrder status inline
      setActiveOrder(prev => prev ? { ...prev, status: newStatus } : prev)
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      showNotification(`Status updated to: ${STATUS_LABELS[newStatus]?.label || newStatus}`)
    } catch (err) {
      alert(err.message)
    }
  }

  function logout() {
    socketRef.current?.disconnect()
    localStorage.removeItem('deliveryToken')
    setToken(''); setProfile(null); setOrders([]); setActiveOrder(null)
  }

  function getNextStatus(current) {
    const idx = STATUS_FLOW.indexOf(current)
    if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null
    return STATUS_FLOW[idx + 1]
  }

  const activeOrders   = orders.filter(o => !['delivered','cancelled'].includes(o.status))
  const completedOrders= orders.filter(o => o.status === 'delivered')

  // ── LOADING (session check in progress) ───────────────────────────────────
  if (!sessionChecked) return (
    <div className={styles.loginPage}>
      <div style={{ textAlign: 'center', color: '#619233', fontSize: 18 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🛵</div>
        Loading…
      </div>
    </div>
  )

  // ── LOGIN SCREEN ──────────────────────────────────────────────────────────
  if (!isLoggedIn) return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <span style={{ fontSize: 40 }}>🛵</span>
          <div>
            <h1>Delivery Portal</h1>
            <p>Sewa Bazaar</p>
          </div>
        </div>
        {loginErr && <div className={styles.errorMsg}>{loginErr}</div>}
        <form onSubmit={handleLogin}>
          <label>Email
            <input type="email" value={loginForm.email}
              onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
              placeholder="your@email.com" required />
          </label>
          <label>Password
            <input type="password" value={loginForm.password}
              onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
              placeholder="••••••••" required />
          </label>
          <button type="submit" className={styles.loginBtn} disabled={loginLoading}>
            {loginLoading ? 'Signing in…' : '🛵 Sign In'}
          </button>
        </form>
      </div>
    </div>
  )

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* Top bar */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span style={{ fontSize: 24 }}>🛵</span>
          <div>
            <div className={styles.headerTitle}>Delivery Dashboard</div>
            <div className={styles.headerSub}>Welcome, {profile?.name}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className={styles.refreshBtn} onClick={() => fetchOrders()}>↻ Refresh</button>
          <button className={styles.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </header>

      {/* Notification banner */}
      {notification && (
        <div className={styles.notifBanner} onClick={() => setNotification(null)}>
          {notification}
        </div>
      )}

      <div className={styles.content}>
        {/* Order detail panel */}
        {activeOrder ? (
          <div className={styles.detailPanel}>
            <button className={styles.backBtn} onClick={() => { setActiveOrder(null); setOrderItems([]) }}>
              ← Back to Orders
            </button>
            <div className={styles.detailCard}>
              <div className={styles.detailTop}>
                <div>
                  <h2>Order #{activeOrder.id}</h2>
                  <Badge status={activeOrder.status} />
                </div>
                <div className={styles.detailMeta}>
                  <div>📅 {formatDate(activeOrder.createdAt)}</div>
                  <div>💰 ₹{Number(activeOrder.total||0).toLocaleString('en-IN')}</div>
                  <div>💳 {activeOrder.paymentMethod?.toUpperCase()}</div>
                </div>
              </div>

              {/* Customer info */}
              <div className={styles.section}>
                <h3>👤 Customer</h3>
                <div className={styles.infoGrid}>
                  <div><span>Name</span><strong>{activeOrder.customerName || '—'}</strong></div>
                  <div><span>Phone</span><strong>
                    <a href={`tel:${activeOrder.customerPhone}`} style={{ color: '#619233' }}>
                      {activeOrder.customerPhone || '—'}
                    </a>
                  </strong></div>
                </div>
              </div>

              {/* Delivery address */}
              <div className={styles.section}>
                <h3>📍 Delivery Address</h3>
                <div className={styles.address}>
                  {[activeOrder.addressLine1, activeOrder.addressLine2, activeOrder.city, activeOrder.state, activeOrder.pincode]
                    .filter(Boolean).join(', ')}
                </div>
                {activeOrder.city && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent([activeOrder.addressLine1, activeOrder.city, activeOrder.state].filter(Boolean).join(', '))}`}
                    target="_blank" rel="noopener noreferrer"
                    className={styles.mapLink}
                  >
                    🗺️ Open in Google Maps
                  </a>
                )}
              </div>

              {/* Items */}
              <div className={styles.section}>
                <h3>🛒 Items</h3>
                {loadingItems ? <p>Loading…</p> : (
                  <table className={styles.itemsTable}>
                    <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
                    <tbody>
                      {orderItems.map((item, i) => (
                        <tr key={i}>
                          <td>{item.name}</td>
                          <td>{item.qty}</td>
                          <td>₹{Number(item.price||0).toLocaleString('en-IN')}</td>
                          <td>₹{(Number(item.price||0)*item.qty).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Status flow action buttons */}
              {activeOrder.status !== 'delivered' && activeOrder.status !== 'cancelled' && (
                <div className={styles.section}>
                  <h3>🔄 Update Status</h3>
                  <div className={styles.statusFlow}>
                    {STATUS_FLOW.map((s, i) => {
                      const currentIdx = STATUS_FLOW.indexOf(activeOrder.status)
                      const isCurrent  = s === activeOrder.status
                      const isPast     = i < currentIdx
                      const isNext     = i === currentIdx + 1
                      return (
                        <div key={s} className={`${styles.flowStep} ${isCurrent ? styles.flowCurrent : ''} ${isPast ? styles.flowPast : ''}`}>
                          <div className={styles.flowDot}>{isPast ? '✓' : i + 1}</div>
                          <div className={styles.flowLabel}>{STATUS_LABELS[s]?.icon} {STATUS_LABELS[s]?.label}</div>
                          {isNext && (
                            <button className={styles.nextBtn} onClick={() => updateStatus(activeOrder.id, s)}>
                              Mark as {STATUS_LABELS[s]?.label} →
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {activeOrder.status === 'delivered' && (
                <div className={styles.deliveredBanner}>🎉 Order successfully delivered!</div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className={styles.statsRow}>
              <div className={styles.statCard}>
                <div className={styles.statNum}>{activeOrders.length}</div>
                <div className={styles.statLabel}>Active Orders</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNum}>{completedOrders.length}</div>
                <div className={styles.statLabel}>Delivered Today</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNum}>{orders.length}</div>
                <div className={styles.statLabel}>Total Assigned</div>
              </div>
            </div>

            {/* Active orders */}
            <div className={styles.section}>
              <h2>🚴 Active Orders ({activeOrders.length})</h2>
              {activeOrders.length === 0 ? (
                <div className={styles.emptyState}>No active orders right now.<br/>New orders will appear here instantly via Socket.io.</div>
              ) : (
                <div className={styles.orderGrid}>
                  {activeOrders.map(order => {
                    const next = getNextStatus(order.status)
                    return (
                      <div key={order.id} className={styles.orderCard} onClick={() => openOrder(order)}>
                        <div className={styles.orderCardTop}>
                          <span className={styles.orderId}>#{order.id}</span>
                          <Badge status={order.status} />
                        </div>
                        <div className={styles.orderCardName}>{order.customerName || 'Customer'}</div>
                        <div className={styles.orderCardAddr}>
                          📍 {[order.city, order.state].filter(Boolean).join(', ') || '—'}
                        </div>
                        <div className={styles.orderCardMeta}>
                          <span>₹{Number(order.total||0).toLocaleString('en-IN')}</span>
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                        {next && (
                          <button
                            className={styles.quickBtn}
                            onClick={e => { e.stopPropagation(); updateStatus(order.id, next) }}
                          >
                            {STATUS_LABELS[next]?.icon} Mark {STATUS_LABELS[next]?.label}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Completed orders */}
            {completedOrders.length > 0 && (
              <div className={styles.section}>
                <h2>✅ Completed Orders ({completedOrders.length})</h2>
                <div className={styles.orderGrid}>
                  {completedOrders.map(order => (
                    <div key={order.id} className={`${styles.orderCard} ${styles.orderCardDone}`} onClick={() => openOrder(order)}>
                      <div className={styles.orderCardTop}>
                        <span className={styles.orderId}>#{order.id}</span>
                        <Badge status={order.status} />
                      </div>
                      <div className={styles.orderCardName}>{order.customerName || 'Customer'}</div>
                      <div className={styles.orderCardMeta}>
                        <span>₹{Number(order.total||0).toLocaleString('en-IN')}</span>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
