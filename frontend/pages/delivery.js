import { useEffect, useRef, useState, useMemo } from 'react'
import { io } from 'socket.io-client'
import ActiveOrders from '../components/delivery/ActiveOrders'
import CompletedOrders from '../components/delivery/CompletedOrders'
import DeliveryNotification from '../components/delivery/DeliveryNotification'
import styles from '../styles/delivery.module.css'
import API_BASE_URL from '../lib/apiBase'

const API_BASE = API_BASE_URL || ''

const STATUS_LABELS = {
  placed:           { label: 'Placed',           color: '#6b7280', bg: '#f3f4f6', btnLabel: null,             btnColor: null },
  confirmed:        { label: 'Confirmed',         color: '#0369a1', bg: '#e0f2fe', btnLabel: null,             btnColor: null },
  packed:           { label: 'Packed',            color: '#7c3aed', bg: '#ede9fe', btnLabel: null,             btnColor: null },
  ready_for_pickup: { label: 'Assigned',          color: '#374151', bg: '#e5e7eb', btnLabel: 'Pick Up Order', btnColor: '#16a34a' },
  assigned:         { label: 'Assigned',          color: '#374151', bg: '#e5e7eb', btnLabel: 'Pick Up Order', btnColor: '#16a34a' },
  picked_up:        { label: 'Picked Up',         color: '#1d4ed8', bg: '#dbeafe', btnLabel: 'Out for Delivery', btnColor: '#f97316' },
  out_for_delivery: { label: 'Out for Delivery',  color: '#c2410c', bg: '#ffedd5', btnLabel: 'Mark Delivered', btnColor: '#2563eb' },
  delivered:        { label: 'Delivered',         color: '#15803d', bg: '#dcfce7', btnLabel: null,             btnColor: null },
  cancelled:        { label: 'Cancelled',         color: '#b91c1c', bg: '#fee2e2', btnLabel: null,             btnColor: null },
  pending:          { label: 'Pending',           color: '#b45309', bg: '#fff7e0', btnLabel: null,             btnColor: null },
}

function StatusBadge({ status }) {
  const s = STATUS_LABELS[status] || { label: status, color: '#6b7280', bg: '#f3f4f6' }
  return (
    <span style={{ background: s.bg, color: s.color, padding: '2px 9px', borderRadius: 3, fontSize: 11, fontWeight: 600, display: 'inline-block', letterSpacing: '0.2px' }}>
      {s.label}
    </span>
  )
}

function formatDate(v) {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d) ? '—' : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function normalizeDeliveryStage(status) {
  const raw = String(status || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

  if (!raw) return 'assigned'

  const canonical = {
    'ready': 'ready_for_pickup',
    'ready_for_pickup': 'ready_for_pickup',
    'accepted': 'assigned',
    'assign': 'assigned',
    'pickedup': 'picked_up',
    'picked_up': 'picked_up',
    'out_for_delivery': 'out_for_delivery',
    'outfordelivery': 'out_for_delivery',
    'delivered': 'delivered',
    'cancelled': 'cancelled',
    'canceled': 'cancelled',
  }[raw] || raw

  if (['placed', 'pending', 'confirmed', 'packed', 'ready_for_pickup', 'assigned'].includes(canonical)) {
    return 'assigned'
  }

  if (!['assigned', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled'].includes(canonical)) {
    return 'assigned'
  }

  return canonical
}

function statusPayloadValue(status) {
  return status
}

function buildAddressLine(order) {
  return [order?.addressLine1, order?.addressLine2, order?.city, order?.state, order?.pincode]
    .filter(Boolean)
    .join(', ')
}

function buildMapsUrl(order) {
  const lat = Number(order?.latitude ?? order?.lat)
  const lng = Number(order?.longitude ?? order?.lng)
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng)

  if (hasCoords) {
    return `https://maps.google.com/?q=${lat},${lng}`
  }

  const address = buildAddressLine(order)
  if (!address) return ''
  return `https://maps.google.com/?q=${encodeURIComponent(address)}`
}

export default function DeliveryDashboard() {
  const [token, setToken]         = useState('')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loginErr, setLoginErr]   = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [profile, setProfile]     = useState(null)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [isOnline, setIsOnline]   = useState(true)

  const [orders, setOrders]           = useState([])
  const [activeOrder, setActiveOrder] = useState(null)
  const [deliveryConfirmOrder, setDeliveryConfirmOrder] = useState(null)
  const [orderItems, setOrderItems]   = useState([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [updatingOrderId, setUpdatingOrderId] = useState(null)
  const [highlightedOrderId, setHighlightedOrderId] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  const [toasts, setToasts] = useState([])
  const socketRef = useRef(null)
  const audioContextRef = useRef(null)

  const isLoggedIn = Boolean(token && profile)

  const authH = useMemo(() => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token])

  // ── Restore session ──────────────────────────────────────────────────────
  useEffect(() => {
    const t = localStorage.getItem('deliveryToken') || ''
    if (t) { setToken(t); fetchProfile(t) } else { setSessionChecked(true) }
  }, [])

  async function fetchProfile(t) {
    try {
      const r = await fetch(`${API_BASE}/api/delivery/me`, {
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
    if (!profile || !token) return

    const socket = io(API_BASE || undefined, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    socket.on('connect', () => console.log('[Socket.io] Delivery connected, id:', socket.id))
    socket.on('connect_error', (err) => console.error('[Socket.io] connect_error:', err.message))

  const onNewDeliveryOrder = (order) => {
    addOrderToDashboard(order)
    fetchNotifications()
  }

    socket.on('ORDER_ASSIGNED', onNewDeliveryOrder)
    socket.on('new_delivery_order', onNewDeliveryOrder)
    socket.on('ORDER_STATUS_UPDATE', (payload) => {
      // play a short notification on status updates relevant to this delivery partner
      try { playNotificationSound() } catch (_) {}
      fetchNotifications()
    })

    return () => { socket.disconnect(); socketRef.current = null }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, token])

  useEffect(() => {
    if (!highlightedOrderId) return undefined
    const timer = window.setTimeout(() => setHighlightedOrderId(null), 3600)
    return () => window.clearTimeout(timer)
  }, [highlightedOrderId])

  function addToast(msg, type = 'info') {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000)
  }

  function dismissToast(id) {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  function playNotificationSound() {
    if (typeof window === 'undefined') return
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx()
      }
      const ctx = audioContextRef.current
      if (!ctx) return
      if (ctx.state === 'suspended') ctx.resume().catch(() => {})

      const now = ctx.currentTime

      // WhatsApp-style: two quick high-pitched pops
      const frequencies = [1400, 1800]
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + i * 0.12)

        gain.gain.setValueAtTime(0.0001, now + i * 0.12)
        gain.gain.exponentialRampToValueAtTime(0.18, now + i * 0.12 + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.09)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + i * 0.12)
        osc.stop(now + i * 0.12 + 0.1)
      })
    } catch (_) {}
  }

  function addOrderToDashboard(order) {
    const orderId = Number(order?.id || order?.orderId)
    if (!orderId) {
      fetchOrders(token)
      return
    }

    setHighlightedOrderId(orderId)
    addToast(`New Order Assigned #${orderId}`, 'info')
    playNotificationSound()

    // If socket payload has full order details, prepend it instantly; otherwise fetch latest list.
    if (order?.customerName || order?.addressLine1 || order?.status) {
      setOrders((prev) => {
        const exists = prev.some((row) => Number(row.id) === orderId)
        if (exists) {
          return prev.map((row) => (Number(row.id) === orderId ? { ...row, ...order, id: orderId } : row))
        }
        return [{ ...order, id: orderId }, ...prev]
      })
      return
    }

    fetchOrders(token)
  }

  async function fetchOrders(t = token) {
    try {
      const r = await fetch(`${API_BASE}/api/delivery/my-orders`, {
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      })
      const d = await r.json()
      setOrders(Array.isArray(d) ? d : [])
    } catch (_) {}
  }

  async function fetchNotifications(t = token) {
    if (!t) return
    setLoadingNotifications(true)
    try {
      const r = await fetch(`${API_BASE}/api/delivery/notifications`, {
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      })
      const d = await r.json()
      const list = Array.isArray(d) ? d : d?.notifications
      setNotifications(Array.isArray(list) ? list : [])
    } catch (_) {
      setNotifications([])
    } finally {
      setLoadingNotifications(false)
    }
  }

  useEffect(() => {
    if (profile) {
      fetchOrders()
      fetchNotifications()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  async function handleLogin(e) {
    e.preventDefault()
    setLoginErr('')
    setLoginLoading(true)
    try {
      const r = await fetch(`${API_BASE}/api/delivery/login`, {
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
      const r = await fetch(`${API_BASE}/api/delivery/orders/${order.id}/items`, { headers: authH })
      const d = await r.json()
      setOrderItems(Array.isArray(d) ? d : [])
    } catch (_) { setOrderItems([]) }
    finally { setLoadingItems(false) }
  }

  async function performStatusUpdate(orderId, newStatus) {
    const numericOrderId = Number(orderId)
    setUpdatingOrderId(numericOrderId)
    try {
      const r = await fetch(`${API_BASE}/api/delivery/update-status`, {
        method: 'PUT', headers: authH,
        body: JSON.stringify({ order_id: orderId, status: statusPayloadValue(newStatus) }),
      })
      const d = await r.json()
      if (!r.ok) {
        console.error('Status update failed:', d)
        addToast(d?.error || d?.reason || 'Update failed', 'error');
        return
      }
      const nextStatus = normalizeDeliveryStage(d?.status || newStatus)
      // Optimistically update UI immediately, then refresh list from server.
      setActiveOrder(prev => (prev && Number(prev.id) === numericOrderId ? { ...prev, status: nextStatus } : prev))
      setOrders(prev => prev.map(o => (Number(o.id) === numericOrderId ? { ...o, status: nextStatus } : o)))
      fetchOrders()
      addToast(`Status updated: ${STATUS_LABELS[nextStatus]?.label || nextStatus}`, 'success')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  function requestStatusUpdate(orderId, newStatus) {
    if (newStatus === 'delivered') {
      setDeliveryConfirmOrder({ orderId, newStatus })
      return
    }
    performStatusUpdate(orderId, newStatus)
  }

  function navigateToCustomer(order) {
    const mapsUrl = buildMapsUrl(order)
    if (!mapsUrl) {
      addToast('Customer address is not available for navigation.', 'error')
      return
    }
    window.open(mapsUrl, '_blank', 'noopener,noreferrer')
  }

  function logout() {
    socketRef.current?.disconnect()
    localStorage.removeItem('deliveryToken')
    setToken(''); setProfile(null); setOrders([]); setActiveOrder(null); setNotifications([])
  }

  function getActionButtons(status) {
    const stage = normalizeDeliveryStage(status)

    const make = (label, nextStatus, enabled, primary = false) => ({
      label,
      nextStatus,
      disabled: !enabled,
      primary,
    })

    if (stage === 'assigned') {
      return [
        make('Accept Order', 'assigned', true),
        make('Mark as Picked Up', 'picked_up', true, true),
        make('Out for Delivery', 'out_for_delivery', false),
        make('Mark as Delivered', 'delivered', false),
      ]
    }

    if (stage === 'picked_up') {
      return [
        make('Accept Order', 'assigned', false),
        make('Mark as Picked Up', 'picked_up', false),
        make('Out for Delivery', 'out_for_delivery', true, true),
        make('Mark as Delivered', 'delivered', false),
      ]
    }

    if (stage === 'out_for_delivery') {
      return [
        make('Accept Order', 'assigned', false),
        make('Mark as Picked Up', 'picked_up', false),
        make('Out for Delivery', 'out_for_delivery', false),
        make('Mark as Delivered', 'delivered', true, true),
      ]
    }

    return [
      make('Accept Order', 'assigned', false),
      make('Mark as Picked Up', 'picked_up', false),
      make('Out for Delivery', 'out_for_delivery', false),
      make('Mark as Delivered', 'delivered', false),
    ]
  }

  const activeOrders    = orders.filter(o => !['delivered','cancelled'].includes(o.status))
  const completedOrders = orders.filter(o => o.status === 'delivered')
  const earningsToday   = completedOrders.reduce((s, o) => s + Number(o.total || 0), 0)

  function getStatusStyle(status) {
    const s = STATUS_LABELS[status] || { color: '#6b7280', bg: '#f3f4f6' }
    return { background: s.bg, color: s.color }
  }

  const fullAddress = activeOrder ? buildAddressLine(activeOrder) : ''
  const activeOrderMapsUrl = activeOrder ? buildMapsUrl(activeOrder) : ''
  const activeOrderButtons = activeOrder ? getActionButtons(activeOrder.status) : []

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (!sessionChecked) return (
    <div className={styles.loadingPage}>
      <span>Loading…</span>
    </div>
  )

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  if (!isLoggedIn) return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <h1>Delivery Portal</h1>
          <p>Sewa Bazaar — Delivery Partner Access</p>
        </div>
        {loginErr && <div className={styles.errorMsg}>{loginErr}</div>}
        <form onSubmit={handleLogin}>
          <label>Email
            <input type="email" value={loginForm.email}
              onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
              placeholder="partner@sewabazaar.com" required />
          </label>
          <label>Password
            <input type="password" value={loginForm.password}
              onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
              placeholder="••••••••" required />
          </label>
          <button type="submit" className={styles.loginBtn} disabled={loginLoading}>
            {loginLoading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div>
            <div className={styles.headerTitle}>Delivery Dashboard</div>
            <div className={styles.headerSub}>{profile?.name}</div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button
            className={`${styles.onlineToggle} ${isOnline ? styles.onlineActive : styles.onlineInactive}`}
            onClick={() => setIsOnline(v => !v)}
          >
            <span className={styles.onlineDot} />
            {isOnline ? 'Online' : 'Offline'}
          </button>
          <button className={styles.refreshBtn} onClick={() => fetchOrders()}>Refresh</button>
          <button className={styles.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </header>

      <DeliveryNotification toasts={toasts} onDismiss={dismissToast} />

      <div className={styles.content}>
        <section className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricTop}>
              <span>Active Orders</span>
              <i className={styles.metricIcon}>AO</i>
            </div>
            <strong>{activeOrders.length}</strong>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricTop}>
              <span>Completed Today</span>
              <i className={styles.metricIcon}>CT</i>
            </div>
            <strong>{completedOrders.length}</strong>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricTop}>
              <span>Total Assigned</span>
              <i className={styles.metricIcon}>TA</i>
            </div>
            <strong>{orders.length}</strong>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricTop}>
              <span>Earnings Today</span>
              <i className={styles.metricIcon}>ET</i>
            </div>
            <strong>Rs. {earningsToday.toLocaleString('en-IN')}</strong>
          </div>
        </section>

        <section className={styles.notificationPanel}>
          <div className={styles.notificationHeader}>
            <div>
              <h3>Notifications</h3>
              <p>Recent order assignments</p>
            </div>
            <button
              type="button"
              className={styles.notificationRefresh}
              onClick={() => fetchNotifications()}
            >
              Refresh
            </button>
          </div>
          {loadingNotifications ? (
            <div className={styles.notificationLoading}>Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className={styles.notificationEmpty}>No notifications yet.</div>
          ) : (
            <ul className={styles.notificationList}>
              {notifications.map((note) => (
                <li
                  key={note.id}
                  className={`${styles.notificationItem} ${note.isRead ? '' : styles.notificationUnread}`}
                >
                  <div className={styles.notificationMessage}>{note.message}</div>
                  <div className={styles.notificationMeta}>
                    <span>{note.orderId ? `Order #${note.orderId}` : (note.type || 'Update')}</span>
                    <span>{formatDate(note.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <ActiveOrders
          orders={activeOrders}
          getStatusLabel={(status) => STATUS_LABELS[status]?.label || status}
          getStatusStyle={getStatusStyle}
          getActionButtons={getActionButtons}
          updatingOrderId={updatingOrderId}
          highlightedOrderId={highlightedOrderId}
          onOpenOrder={openOrder}
          onRunAction={requestStatusUpdate}
          onNavigateCustomer={navigateToCustomer}
        />

        <CompletedOrders
          orders={completedOrders}
          getStatusLabel={(status) => STATUS_LABELS[status]?.label || status}
          getStatusStyle={getStatusStyle}
          onOpenOrder={openOrder}
          onNavigateCustomer={navigateToCustomer}
        />

        {activeOrder ? (
          <div className={styles.modalBackdrop} onClick={() => { setActiveOrder(null); setOrderItems([]) }}>
            <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Order #{activeOrder.id}</h3>
                <button type="button" className={styles.modalCloseBtn} onClick={() => { setActiveOrder(null); setOrderItems([]) }}>
                  Close
                </button>
              </div>

              <div className={styles.modalMeta}>
                <StatusBadge status={activeOrder.status} />
                <span>{formatDate(activeOrder.createdAt)}</span>
                <span>Rs. {Number(activeOrder.total || 0).toLocaleString('en-IN')}</span>
                <span>{activeOrder.paymentMethod?.toUpperCase() || '—'}</span>
              </div>

              <div className={styles.section}>
                <h3>Customer</h3>
                <div className={styles.infoGrid}>
                  <div><span>Name</span><strong>{activeOrder.customerName || '—'}</strong></div>
                  <div><span>Phone</span><strong><a href={`tel:${activeOrder.customerPhone}`} className={styles.phoneLink}>{activeOrder.customerPhone || '—'}</a></strong></div>
                </div>
              </div>

              <div className={styles.section}>
                <h3>Full Address</h3>
                <div className={styles.address}>{fullAddress || '—'}</div>
                {activeOrderMapsUrl ? (
                  <a
                    href={activeOrderMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.mapLink}
                  >
                    Open in Google Maps &rarr;
                  </a>
                ) : null}
              </div>

              <div className={styles.section}>
                <h3>Items</h3>
                {loadingItems ? <p className={styles.loadingText}>Loading…</p> : (
                  <table className={styles.itemsTable}>
                    <thead>
                      <tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item, i) => (
                        <tr key={i}>
                          <td>{item.name}</td>
                          <td>{item.qty}</td>
                          <td>Rs. {Number(item.price || 0).toLocaleString('en-IN')}</td>
                          <td>Rs. {(Number(item.price || 0) * item.qty).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className={styles.section}>
                <h3>Quick Actions</h3>
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.secondaryActionBtn}
                    onClick={() => navigateToCustomer(activeOrder)}
                  >
                    Open in Google Maps
                  </button>
                  {activeOrderButtons.map((button) => (
                    <button
                      key={button.label}
                      type="button"
                      className={`${styles.workflowBtn} ${button.primary ? styles.workflowBtnPrimary : styles.workflowBtnSecondary}`}
                      disabled={updatingOrderId === activeOrder.id || button.disabled}
                      onClick={() => requestStatusUpdate(activeOrder.id, button.nextStatus)}
                    >
                      {updatingOrderId === activeOrder.id && button.primary ? 'Updating...' : button.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {deliveryConfirmOrder ? (
          <div className={styles.confirmBackdrop}>
            <div className={styles.confirmCard}>
              <h3>Confirm Delivery</h3>
              <p>
                Confirm this order has been delivered to the customer.
              </p>
              <div className={styles.confirmMeta}>Order #{deliveryConfirmOrder.orderId}</div>
              <div className={styles.confirmActions}>
                <button
                  type="button"
                  className={styles.confirmCancelBtn}
                  onClick={() => setDeliveryConfirmOrder(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.confirmOkBtn}
                  onClick={() => {
                    performStatusUpdate(deliveryConfirmOrder.orderId, deliveryConfirmOrder.newStatus)
                    setDeliveryConfirmOrder(null)
                  }}
                >
                  Yes, Mark Delivered
                </button>
              </div>
            </div>
          </div>
        ) : null}

      </div>
    </div>
  )
}
