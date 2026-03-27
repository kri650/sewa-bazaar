'use client'
import { useState, useEffect, useCallback } from 'react'
import { useWishlist } from '../contexts/WishlistContext'
import { useCart } from '../contexts/CartContext'
import ShopLayout from '../components/ShopLayout'
import Link from 'next/link'
import { resolveProductImage } from '../lib/productImage'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
console.log('[AccountPage] API Base URL:', API)
const TOKEN_KEY = 'sbUserToken'
const USER_KEY  = 'sbUserData'

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands',
  'Chandigarh','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
]

/* ── tiny helpers ─────────────────────────────────────────────────────── */
function formatRupees(amount) {
  const n = Number(amount) || 0
  return `Rs. ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function formatDateShort(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
function titleCase(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
function normalizeStatus(status) {
  if (status === 'accepted') return 'packed'
  if (status === 'placed') return 'pending'
  if (status === 'ready_for_pickup') return 'ready_for_pickup'
  if (status === 'assigned') return 'assigned'
  return status
}
function getToken() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(TOKEN_KEY) || ''
}
function authHead() {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}
function jsonHead() {
  return { 'Content-Type': 'application/json', ...authHead() }
}
async function apiFetch(path, opts = {}) {
  const r = await fetch(`${API}${path}`, opts)
  const data = await r.json()
  if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`)
  return data
}

/* ── STATUS BADGE ─────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const palette = {
    pending:          { bg: '#fff8e1', color: '#b45309' },
    confirmed:        { bg: '#e8f5e9', color: '#2e7d32' },
    packed:           { bg: '#e0f2fe', color: '#0f5b8a' },
    ready_for_pickup: { bg: '#fef9c3', color: '#854d0e' },
    assigned:         { bg: '#f3e8ff', color: '#6b21a8' },
    picked_up:        { bg: '#dbeafe', color: '#1d4ed8' },
    out_for_delivery: { bg: '#ede9fe', color: '#5b21b6' },
    delivered:        { bg: '#e3f2fd', color: '#1565c0' },
    cancelled:        { bg: '#fce4ec', color: '#c62828' },
  }
  const normalized = normalizeStatus(status)
  const s = palette[normalized] || { bg: '#f3f4f6', color: '#555' }
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '3px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
    }}>
      {titleCase(normalized || 'pending')}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════════════════ */
export default function AccountPage() {
  const [token, setToken] = useState('')
  const [user, setUser]   = useState(null)
  const [tab, setTab]     = useState('overview')   // overview | addresses | orders | wishlist
  const [authMode, setAuthMode] = useState('login') // login | register
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  /* auth forms */
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [regForm, setRegForm]     = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [otpStep, setOtpStep]     = useState(false)   // true = waiting for OTP
  const [otpValue, setOtpValue]   = useState('')
  const [pendingEmail, setPendingEmail] = useState('')

  /* addresses */
  const [addresses, setAddresses]   = useState([])
  const [showAddrForm, setShowAddrForm] = useState(false)
  const [addrForm, setAddrForm]     = useState({ full_name: '', phone: '', street: '', city: '', state: '', pincode: '' })
  const [addrErr, setAddrErr]       = useState('')
  const [addrLoading, setAddrLoading] = useState(false)
  const [editingAddrId, setEditingAddrId] = useState(null)  // null = adding, id = editing

  /* orders */
  const [orders, setOrders]     = useState([])
  const [ordersLoaded, setOrdersLoaded] = useState(false)
  const [trackOrder, setTrackOrder] = useState(null)

  /* profile from API */
  const [profile, setProfile] = useState(null)
  const [profileLoaded, setProfileLoaded] = useState(false)

  /* restore session */
  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY) || ''
    const u = localStorage.getItem(USER_KEY)
    if (t && u) { setToken(t); setUser(JSON.parse(u)) }
  }, [])

  /* ── AUTH ─────────────────────────────────────────────────────────── */
  const handleLogin = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const d = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginForm.email.trim(), password: loginForm.password }),
      })
      localStorage.setItem(TOKEN_KEY, d.token)
      localStorage.setItem(USER_KEY, JSON.stringify(d))
      setToken(d.token); setUser(d)
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (regForm.password !== regForm.confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      const resp = await apiFetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regForm.name.trim(),
          email: regForm.email.trim(),
          phone: regForm.phone.trim(),
          password: regForm.password,
          latitude: 0,
          longitude: 0,
        }),
      })
      // Step 1 succeeded — backend sent OTP via SMS, show OTP input
      setPendingEmail(regForm.email.trim())
      setOtpStep(true)
      setOtpValue('')
      setSuccess(resp.message || 'OTP sent to your phone!')
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const d = await apiFetch('/api/otp-auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail, otp: otpValue.trim() }),
      })
      localStorage.setItem(TOKEN_KEY, d.token)
      localStorage.setItem(USER_KEY, JSON.stringify(d))
      setToken(d.token); setUser(d)
      setOtpStep(false)
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(''); setUser(null); setAddresses([]); setOrders([])
    setTab('overview')
  }

  /* ── ADDRESSES ────────────────────────────────────────────────────── */
  const loadAddresses = useCallback(async () => {
    try {
      const d = await apiFetch('/api/user/addresses', { headers: authHead() })
      setAddresses(d)
    } catch (_) {}
  }, [])

  /* ── load profile from API ────────────────────────────────────────── */
  const loadProfile = useCallback(async () => {
    try {
      const d = await apiFetch('/api/user/dashboard', { headers: authHead() })
      setProfile(d)
      setProfileLoaded(true)
      // Merge into user state so overview always has fresh data
      setUser(prev => prev ? { ...prev, ...d } : d)
      // Also update localStorage so next reload has fresh data
      const stored = localStorage.getItem(USER_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          localStorage.setItem(USER_KEY, JSON.stringify({ ...parsed, ...d }))
        } catch (_) {}
      }
    } catch (err) {
      setProfileLoaded(true)
      // If token is invalid/expired, auto-logout
      if (err.message && (err.message.includes('401') || err.message.includes('token') || err.message.includes('authorization'))) {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setToken(''); setUser(null)
      }
    }
  }, [])

  /* Load everything when user is logged in */
  useEffect(() => {
    if (token) {
      loadProfile()
      loadAddresses()
    }
  }, [token, loadProfile, loadAddresses])

  useEffect(() => { if (token && tab === 'addresses') loadAddresses() }, [token, tab, loadAddresses])

  // wishlist
  const { items: wishlistItems, remove: removeFromWishlist } = useWishlist()
  const { addToCart } = useCart()

  const handleAddAddress = async (e) => {
    e.preventDefault()
    setAddrErr(''); setAddrLoading(true)
    try {
      if (editingAddrId) {
        // Update existing address
        await apiFetch(`/api/user/addresses/${editingAddrId}`, {
          method: 'PUT',
          headers: jsonHead(),
          body: JSON.stringify(addrForm),
        })
        setSuccess('Address updated!')
      } else {
        // Create new address
        await apiFetch('/api/user/addresses', {
          method: 'POST',
          headers: jsonHead(),
          body: JSON.stringify(addrForm),
        })
        setSuccess('Address saved successfully!')
      }
      setAddrForm({ full_name: '', phone: '', street: '', city: '', state: '', pincode: '' })
      setShowAddrForm(false)
      setEditingAddrId(null)
      await loadAddresses()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) { setAddrErr(err.message) }
    setAddrLoading(false)
  }

  const handleEditAddress = (addr) => {
    setAddrForm({
      full_name: addr.full_name,
      phone: addr.phone,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    })
    setEditingAddrId(addr.id)
    setShowAddrForm(true)
    setAddrErr('')
  }

  const handleSetDefault = async (id) => {
    try {
      await apiFetch(`/api/user/addresses/${id}/default`, { method: 'PUT', headers: authHead() })
      await loadAddresses()
      setSuccess('Default address updated!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) { alert(err.message) }
  }

  const handleDeleteAddress = async (id) => {
    if (!confirm('Remove this address?')) return
    try {
      await apiFetch(`/api/user/addresses/${id}`, { method: 'DELETE', headers: authHead() })
      setAddresses((prev) => prev.filter((a) => a.id !== id))
    } catch (err) { alert(err.message) }
  }

  /* ── ORDERS ───────────────────────────────────────────────────────── */
  const loadOrders = useCallback(async () => {
    try {
      const d = await apiFetch('/api/user/orders', { headers: authHead() })
      setOrders(d); setOrdersLoaded(true)
    } catch (_) { setOrdersLoaded(true) }
  }, [])

  useEffect(() => { if (token && !ordersLoaded) loadOrders() }, [token, ordersLoaded, loadOrders])

  const handleReorder = (order) => {
    if (!order?.items || order.items.length === 0) return
    order.items.forEach((item) => {
      const id = item.productId || item.productSlug || item.productName
      if (!id) return
      addToCart({
        id,
        name: item.productName,
        price: item.price,
        image: resolveProductImage({ name: item.productName, image: item.image }),
      }, Number(item.qty || 1))
    })
    setSuccess('Items added to cart for reorder.')
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleCancelOrder = async (orderId) => {
    if (!confirm('Cancel this order?')) return
    try {
      await apiFetch(`/api/user/orders/${orderId}/cancel`, { method: 'PUT', headers: authHead() })
      setOrders((prev) => prev.map((o) => (o.orderId === orderId ? { ...o, status: 'cancelled' } : o)))
      setSuccess('Order cancelled.')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDownloadInvoice = (order) => {
    if (typeof window === 'undefined') return
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return
    const addr = order?.deliveryAddress || {}
    const itemsHtml = (order?.items || []).map((item) => (
      `<tr>
         <td>${item.productName}</td>
         <td style="text-align:right;">${item.qty}</td>
         <td style="text-align:right;">Rs. ${Number(item.price).toFixed(2)}</td>
       </tr>`
    )).join('')

    win.document.write(`
      <html>
        <head>
          <title>Invoice #${order.orderId}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111; padding: 24px; }
            h1 { font-size: 20px; margin: 0 0 6px; }
            .muted { color: #666; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border-bottom: 1px solid #ddd; padding: 8px 6px; font-size: 12px; }
            th { text-align: left; background: #f6f7f9; }
            .total { font-weight: 700; text-align: right; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>Invoice</h1>
          <div class="muted">Order #${order.orderId} - ${formatDateShort(order.orderDate)}</div>
          <h3 style="margin-top:16px;">Delivery Address</h3>
          <div>${addr.name || ''}</div>
          <div>${addr.line1 || ''}${addr.line2 ? `, ${addr.line2}` : ''}</div>
          <div>${addr.city || ''}, ${addr.state || ''} ${addr.pincode || ''}</div>
          <div>Phone: ${addr.phone || ''}</div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align:right;">Qty</th>
                <th style="text-align:right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="total">Total: Rs. ${Number(order.total || 0).toFixed(2)}</div>
        </body>
      </html>
    `)
    win.document.close()
    win.focus()
    win.print()
  }

  const TRACKING_STEPS = [
    { key: 'pending', label: 'Order Placed' },
    { key: 'confirmed', label: 'Order Confirmed' },
    { key: 'packed', label: 'Packed' },
    { key: 'out_for_delivery', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' },
  ]

  const getStepIndex = (status) => {
    const normalized = normalizeStatus(status)
    const idx = TRACKING_STEPS.findIndex((s) => s.key === normalized)
    return idx === -1 ? 0 : idx
  }

  /* ══════════════════════ RENDER ════════════════════════════════════ */

  /* ── NOT LOGGED IN ───── */
  if (!token) {
    return (
      <ShopLayout showHeader={true}>
        <main className="authPage">

          {/* ── Centered card ── */}
          <div className="authRight">
            <div className="authFormWrap">

              {/* Logo + brand */}
              <div className="authBrand">
                <img src="/logo.png" alt="Sewa Bazaar" className="authBrandLogo" />
                <span className="authBrandName">Sewa Bazaar</span>
              </div>

              <div className="authHeader">
                <h1>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
                <p>{authMode === 'login' ? 'Sign in to track orders and manage your profile' : 'Create an account to manage your orders'}</p>
              </div>

              <div className="authTabs">
                <button
                  className={authMode === 'login' ? 'authTab active' : 'authTab'}
                  onClick={() => { setAuthMode('login'); setError('') }}
                >Sign In</button>
                <button
                  className={authMode === 'register' ? 'authTab active' : 'authTab'}
                  onClick={() => { setAuthMode('register'); setError('') }}
                >Register</button>
              </div>

              {error && (
                <div className="authError">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}

              {authMode === 'login' ? (
                <form onSubmit={handleLogin} className="authForm">
                  <div className="formFld">
                    <label>Email Address</label>
                    <div className="inputWrap">
                      <svg className="inputIcon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      <input type="email" placeholder="you@email.com" value={loginForm.email}
                        onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="formFld">
                    <label>Password</label>
                    <div className="inputWrap">
                      <svg className="inputIcon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      <input type="password" placeholder="••••••••" value={loginForm.password}
                        onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} required />
                    </div>
                  </div>
                  <button type="submit" className="authPrimaryBtn" disabled={loading}>
                    {loading ? <span className="btnLoader">Signing in…</span> : 'Sign In'}
                  </button>
                  <p className="authSwitch">
                    Don't have an account?{' '}
                    <button type="button" onClick={() => { setAuthMode('register'); setError(''); setOtpStep(false) }}>Create one</button>
                  </p>
                </form>
              ) : otpStep ? (
                /* ── OTP Verification Screen ── */
                <form onSubmit={handleVerifyOtp} className="authForm">
                  {/* Header */}
                  <div style={{ textAlign: 'center', marginBottom: 8 }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%',
                      background: '#2f6f3e',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 14px', boxShadow: '0 4px 14px rgba(97,146,51,0.3)',
                    }}>
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                        <line x1="12" y1="18" x2="12.01" y2="18"/>
                      </svg>
                    </div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', margin: '0 0 4px' }}>
                      Verify your phone
                    </h2>
                    <p style={{ fontSize: 13, color: '#888', margin: 0, lineHeight: 1.5 }}>
                      We sent a 6-digit OTP to <strong style={{ color: '#333' }}>{regForm.phone}</strong>
                    </p>
                  </div>

                  {error && (
                    <div className="authError">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {error}
                    </div>
                  )}

                  {success && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 14px', background: '#f0fdf4',
                      border: '1px solid #bbf7d0', borderLeft: '4px solid #22c55e',
                      borderRadius: 8, color: '#15803d', fontSize: 13, marginBottom: 4,
                    }}>
                      {success}
                    </div>
                  )}

                  {/* OTP Input */}
                  <div className="formFld">
                    <label>Enter OTP</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="● ● ● ● ● ●"
                      value={otpValue}
                      onChange={e => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: 10,
                        fontSize: 22,
                        fontWeight: 700,
                        textAlign: 'center',
                        letterSpacing: 14,
                        color: '#1a1a1a',
                        background: '#fafafa',
                        outline: 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        boxSizing: 'border-box',
                      }}
                      onFocus={e => { e.target.style.borderColor = '#619233'; e.target.style.boxShadow = '0 0 0 3px rgba(97,146,51,0.12)'; e.target.style.background = '#fff' }}
                      onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; e.target.style.background = '#fafafa' }}
                    />
                  </div>

                  {/* Verify Button */}
                  <button type="submit" className="authPrimaryBtn" disabled={loading || otpValue.length < 4}>
                    {loading ? <span className="btnLoader">Verifying…</span> : 'Verify and Create Account'}
                  </button>

                  {/* Resend */}
                  <div style={{ textAlign: 'center', marginTop: 4 }}>
                    <button
                      type="button"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#619233', fontWeight: 600, fontSize: 13,
                        textDecoration: 'underline', textUnderlineOffset: 2,
                      }}
                      disabled={loading}
                      onClick={async () => {
                        setError(''); setLoading(true)
                        try {
                          await apiFetch('/api/otp-auth/signup', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              name: regForm.name.trim(),
                              email: regForm.email.trim(),
                              phone: regForm.phone.trim(),
                              password: regForm.password,
                              latitude: 0, longitude: 0,
                            }),
                          })
                          setSuccess('New OTP sent!')
                          setTimeout(() => setSuccess(''), 3000)
                        } catch (err) { setError(err.message) }
                        setLoading(false)
                      }}
                    >
                      Resend OTP
                    </button>
                  </div>

                  {/* Timer / info text */}
                  <p style={{ textAlign: 'center', fontSize: 12, color: '#aaa', margin: '8px 0 0' }}>
                    Didn't receive? Check your SMS inbox or tap Resend OTP.
                  </p>

                  {/* Go back */}
                  <p className="authSwitch">
                    Wrong number?{' '}
                    <button type="button" onClick={() => { setOtpStep(false); setOtpValue(''); setError('') }}>Go back</button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="authForm">
                  <div className="formFld">
                    <label>Full Name</label>
                    <div className="inputWrap">
                      <svg className="inputIcon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <input type="text" placeholder="Your full name" value={regForm.name}
                        onChange={e => setRegForm(p => ({ ...p, name: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="formRow2">
                    <div className="formFld">
                      <label>Email Address</label>
                      <div className="inputWrap">
                        <svg className="inputIcon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        <input type="email" placeholder="you@email.com" value={regForm.email}
                          onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))} required />
                      </div>
                    </div>
                    <div className="formFld">
                      <label>Phone Number</label>
                      <div className="inputWrap">
                        <svg className="inputIcon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.64 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.07 6.07l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        <input type="tel" placeholder="10-digit mobile" value={regForm.phone}
                          onChange={e => setRegForm(p => ({ ...p, phone: e.target.value }))} required />
                      </div>
                    </div>
                  </div>
                  <div className="formRow2">
                    <div className="formFld">
                      <label>Password</label>
                      <div className="inputWrap">
                        <svg className="inputIcon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        <input type="password" placeholder="Create password" value={regForm.password}
                          onChange={e => setRegForm(p => ({ ...p, password: e.target.value }))} required />
                      </div>
                    </div>
                    <div className="formFld">
                      <label>Confirm Password</label>
                      <div className="inputWrap">
                        <svg className="inputIcon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        <input type="password" placeholder="Re-enter password" value={regForm.confirmPassword}
                          onChange={e => setRegForm(p => ({ ...p, confirmPassword: e.target.value }))} required />
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="authPrimaryBtn" disabled={loading}>
                    {loading ? <span className="btnLoader">Creating account…</span> : 'Create Account'}
                  </button>
                  <p className="authSwitch">
                    Already have an account?{' '}
                    <button type="button" onClick={() => { setAuthMode('login'); setError('') }}>Sign in</button>
                  </p>
                </form>
              )}

              {/* Trust badges */}
              <div className="authTrust">
                <span>Secure login</span>
                <span>Quality products</span>
                <span>Reliable delivery</span>
              </div>

            </div>
          </div>

          <style jsx>{`
            /* ── Page ── */
            .authPage {
              min-height: calc(100vh - 70px);
              background: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 40px 16px;
            }

            /* ── Card ── */
            .authRight {
              width: 100%;
              max-width: 480px;
            }
            .authFormWrap {
              background: #fff;
              border-radius: 16px;
              border: 1px solid #e8ede0;
              box-shadow: 0 4px 24px rgba(97,146,51,0.08);
              padding: 40px 40px 32px;
            }

            /* ── Brand ── */
            .authBrand {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
              margin-bottom: 24px;
            }
            .authBrandLogo { width: 40px; height: 40px; object-fit: contain; }
            .authBrandName {
              font-size: 20px;
              font-weight: 800;
              color: #619233;
              letter-spacing: -0.3px;
            }

            /* ── Divider under brand ── */
            .authBrand::after {
              display: none;
            }

            /* ── Header ── */
            .authHeader { margin-bottom: 22px; text-align: center; }
            .authHeader h1 {
              font-size: 22px;
              font-weight: 800;
              color: #1a1a1a;
              margin: 0 0 6px;
            }
            .authHeader p { font-size: 13px; color: #888; margin: 0; }

            /* ── Tabs ── */
            .authTabs {
              display: flex;
              background: #f3f4f6;
              border-radius: 10px;
              padding: 4px;
              margin-bottom: 22px;
            }
            .authTab {
              flex: 1;
              background: none;
              border: none;
              padding: 9px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              color: #888;
              border-radius: 8px;
              transition: all 0.18s;
            }
            .authTab.active {
              background: #fff;
              color: #619233;
              box-shadow: 0 1px 6px rgba(0,0,0,0.1);
            }

            /* ── Error ── */
            .authError {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 10px 14px;
              background: #fff5f5;
              border: 1px solid #fdd;
              border-left: 4px solid #e53935;
              border-radius: 8px;
              color: #c0392b;
              font-size: 13px;
              margin-bottom: 16px;
            }

            /* ── Form ── */
            .authForm { display: flex; flex-direction: column; gap: 15px; }
            .formRow2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .formFld { display: flex; flex-direction: column; gap: 5px; }
            .formFld label {
              font-size: 11px;
              font-weight: 700;
              color: #555;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .inputWrap { position: relative; display: flex; align-items: center; }
            .inputIcon { position: absolute; left: 12px; color: #bbb; pointer-events: none; }
            .inputWrap input {
              width: 100%;
              padding: 11px 14px 11px 38px;
              border: 1.5px solid #e5e7eb;
              border-radius: 9px;
              font-size: 14px;
              color: #1a1a1a;
              background: #fafafa;
              outline: none;
              transition: border-color 0.2s, box-shadow 0.2s;
              box-sizing: border-box;
            }
            .inputWrap input:focus {
              border-color: #619233;
              background: #fff;
              box-shadow: 0 0 0 3px rgba(97,146,51,0.1);
            }

            /* ── Button ── */
            .authPrimaryBtn {
              width: 100%;
              background: linear-gradient(135deg, #619233 0%, #4f7a29 100%);
              color: #fff;
              border: none;
              padding: 13px;
              border-radius: 9px;
              font-size: 15px;
              font-weight: 700;
              cursor: pointer;
              transition: all 0.2s;
              margin-top: 4px;
              box-shadow: 0 4px 14px rgba(97,146,51,0.3);
              letter-spacing: 0.2px;
            }
            .authPrimaryBtn:hover:not(:disabled) {
              transform: translateY(-1px);
              box-shadow: 0 6px 18px rgba(97,146,51,0.4);
            }
            .authPrimaryBtn:disabled { opacity: 0.6; cursor: not-allowed; }

            /* ── Switch ── */
            .authSwitch { text-align: center; font-size: 13px; color: #888; margin: 0; }
            .authSwitch button {
              background: none; border: none; cursor: pointer;
              color: #619233; font-weight: 700; font-size: 13px;
              padding: 0; text-decoration: underline; text-underline-offset: 2px;
            }

            /* ── Trust badges ── */
            .authTrust {
              display: flex;
              justify-content: center;
              gap: 20px;
              margin-top: 24px;
              padding-top: 20px;
              border-top: 1px solid #f0f0f0;
              flex-wrap: wrap;
            }
            .authTrust span {
              font-size: 12px;
              color: #888;
              font-weight: 500;
            }

            /* ── OTP screen ── */
            .otpInfo {
              text-align: center;
              padding: 8px 0 4px;
            }
            .otpIcon { font-size: 36px; margin-bottom: 10px; }
            .otpInfo p { font-size: 14px; color: #666; margin: 0 0 4px; }
            .otpInfo strong { font-size: 15px; color: #1a1a1a; font-weight: 700; }
            .otpNote { font-size: 12px; color: #aaa; margin-top: 8px !important; }
            .otpSpinner {
              text-align: center;
              font-size: 14px;
              color: #619233;
              padding: 8px 0;
              font-weight: 600;
            }
            .otpInput {
              width: 100%;
              padding: 14px;
              border: 2px solid #e5e7eb;
              border-radius: 10px;
              font-size: 24px;
              font-weight: 700;
              text-align: center;
              letter-spacing: 12px;
              color: #1a1a1a;
              background: #fafafa;
              outline: none;
              transition: border-color 0.2s, box-shadow 0.2s;
              box-sizing: border-box;
            }
            .otpInput:focus {
              border-color: #619233;
              background: #fff;
              box-shadow: 0 0 0 3px rgba(97,146,51,0.1);
            }

            /* ── Responsive ── */
            @media (max-width: 520px) {
              .authFormWrap { padding: 28px 20px 24px; }
              .formRow2 { grid-template-columns: 1fr; }
              .authTrust { gap: 12px; }
            }
          `}</style>
        </main>
      </ShopLayout>
    )
  }

  /* ── LOGGED IN – DASHBOARD ─── */
  const sideNavItems = [
    { key: 'overview',   label: 'Overview' },
    { key: 'orders',     label: 'My Orders' },
    { key: 'addresses',  label: 'Addresses' },
    { key: 'wishlist',   label: 'Wishlist' },
  ]

  return (
    <ShopLayout>
      <main className="dashPage">
        {success && <div className="globalSuccess">{success}</div>}

        <div className="dashContainer">
          {/* ── SIDEBAR ── */}
          <aside className="dashSidebar">
            <div className="sideProfile">
              <div className="sideAvatar">{(user?.name || 'U')[0].toUpperCase()}</div>
              <div className="sideUserInfo">
                <strong>{user?.name}</strong>
                <span>{user?.email}</span>
              </div>
            </div>

            <nav className="sideNav">
              {sideNavItems.map(item => (
                <button
                  key={item.key}
                  className={tab === item.key ? 'sideNavBtn active' : 'sideNavBtn'}
                  onClick={() => setTab(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <button className="sideLogout" onClick={handleLogout}>
              Sign Out
            </button>
          </aside>

          {/* ── MAIN CONTENT ── */}
          <div className="dashMain">

            {/* OVERVIEW */}
            {tab === 'overview' && (
              <div className="dashSection">
                <h2 className="sectionTitle">Account Overview</h2>

                {/* Stats Row */}
                <div className="statsRow">
                  <div className="statCard">
                    <div className="statNum">{orders.length}</div>
                    <div className="statLabel">Orders</div>
                  </div>
                  <div className="statCard">
                    <div className="statNum">{addresses.length}</div>
                    <div className="statLabel">Addresses</div>
                  </div>
                  <div className="statCard">
                    <div className="statNum">{wishlistItems.length}</div>
                    <div className="statLabel">Wishlist</div>
                  </div>
                  <div className="statCard">
                    <div className="statNum">{orders.filter(o => o.status === 'delivered').length}</div>
                    <div className="statLabel">Delivered</div>
                  </div>
                </div>

                <div className="overviewGrid">
                  <div className="profileCard">
                    <div className="profileCardHeader">
                      <div className="bigAvatar">{(user?.name || 'U')[0].toUpperCase()}</div>
                      <div>
                        <h3>{user?.name}</h3>
                        <p className="memberBadge">Sewa Bazaar Member</p>
                      </div>
                    </div>
                    <div className="profileFields">
                      <div className="profileRow">
                        <span className="profileLabel">Email</span>
                        <span className="profileValue">{user?.email}</span>
                      </div>
                      <div className="profileRow">
                        <span className="profileLabel">Phone</span>
                        <span className="profileValue">{user?.phone || '-'}</span>
                      </div>
                      <div className="profileRow">
                        <span className="profileLabel">Account Type</span>
                        <span className="profileValue capitalize">{user?.role || 'customer'}</span>
                      </div>
                      <div className="profileRow">
                        <span className="profileLabel">Member Since</span>
                        <span className="profileValue">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="quickLinks">
                    <h4>Quick Actions</h4>
                    <button className="quickBtn" onClick={() => setTab('addresses')}>
                      <div>
                        <strong>Manage Addresses</strong>
                        <p>{addresses.length > 0 ? `${addresses.length} saved address${addresses.length > 1 ? 'es' : ''}` : 'Add or remove delivery addresses'}</p>
                      </div>
                      <span className="quickArrow">View</span>
                    </button>
                    <button className="quickBtn" onClick={() => setTab('orders')}>
                      <div>
                        <strong>Order History</strong>
                        <p>{orders.length > 0 ? `${orders.length} order${orders.length > 1 ? 's' : ''} placed` : 'Track and reorder your items'}</p>
                      </div>
                      <span className="quickArrow">View</span>
                    </button>
                    <button className="quickBtn" onClick={() => setTab('wishlist')}>
                      <div>
                        <strong>My Wishlist</strong>
                        <p>{wishlistItems.length > 0 ? `${wishlistItems.length} item${wishlistItems.length > 1 ? 's' : ''} saved` : 'Save products for later'}</p>
                      </div>
                      <span className="quickArrow">View</span>
                    </button>
                  </div>
                </div>

                {/* Recent Orders */}
                {orders.length > 0 && (
                  <div className="recentSection">
                    <div className="recentHeader">
                      <h3>Recent Orders</h3>
                      <button className="viewAllBtn" onClick={() => setTab('orders')}>View All</button>
                    </div>
                    <div className="recentOrders">
                      {orders.slice(0, 3).map(order => (
                        <div key={order.orderId} className="recentOrderCard">
                          <div className="recentOrderLeft">
                            <span className="recentOrderNum">#{order.orderId}</span>
                            <span className="recentOrderDate">
                              {new Date(order.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                          <div className="recentOrderMid">
                            <span className="recentOrderItems">
                              {order.items.map(i => i.productName).join(', ')}
                            </span>
                          </div>
                          <div className="recentOrderRight">
                            <StatusBadge status={order.status} />
                            <span className="recentOrderTotal">₹{Number(order.total).toFixed(0)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ADDRESSES */}
            {tab === 'addresses' && (
              <div className="dashSection">
                <div className="sectionHeader">
                  <h2 className="sectionTitle">My Addresses</h2>
                  {!showAddrForm && (
                    <button className="addBtn" onClick={() => {
                      setShowAddrForm(true); setAddrErr(''); setEditingAddrId(null)
                      setAddrForm({ full_name: '', phone: '', street: '', city: '', state: '', pincode: '' })
                    }}>
                      + Add New Address
                    </button>
                  )}
                </div>

                {/* Add / Edit Address Form */}
                {showAddrForm && (
                  <div className="addrFormCard">
                    <h3>{editingAddrId ? 'Edit Address' : 'New Delivery Address'}</h3>
                    {addrErr && <div className="inlineErr">{addrErr}</div>}
                    <form onSubmit={handleAddAddress} className="addrForm">
                      <div className="addrRow2">
                        <div className="fld">
                          <label>Full Name *</label>
                          <input type="text" placeholder="Recipient name" value={addrForm.full_name}
                            onChange={e => setAddrForm(p => ({ ...p, full_name: e.target.value }))} required />
                        </div>
                        <div className="fld">
                          <label>Phone Number *</label>
                          <input type="tel" placeholder="10-digit mobile" value={addrForm.phone}
                            onChange={e => setAddrForm(p => ({ ...p, phone: e.target.value }))} required
                            pattern="[6-9][0-9]{9}" title="Valid 10-digit Indian mobile" />
                        </div>
                      </div>
                      <div className="fld">
                        <label>Street Address *</label>
                        <input type="text" placeholder="House No., Building, Street name" value={addrForm.street}
                          onChange={e => setAddrForm(p => ({ ...p, street: e.target.value }))} required />
                      </div>
                      <div className="addrRow3">
                        <div className="fld">
                          <label>City *</label>
                          <input type="text" placeholder="City" value={addrForm.city}
                            onChange={e => setAddrForm(p => ({ ...p, city: e.target.value }))} required />
                        </div>
                        <div className="fld">
                          <label>State *</label>
                          <select value={addrForm.state}
                            onChange={e => setAddrForm(p => ({ ...p, state: e.target.value }))} required>
                            <option value="">Select State</option>
                            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="fld">
                          <label>Pincode *</label>
                          <input type="text" placeholder="6-digit" value={addrForm.pincode}
                            onChange={e => setAddrForm(p => ({ ...p, pincode: e.target.value }))} required
                            pattern="[0-9]{6}" title="Valid 6-digit pincode" />
                        </div>
                      </div>
                      <div className="addrFormActions">
                        <button type="submit" className="saveAddrBtn" disabled={addrLoading}>
                          {addrLoading ? 'Saving…' : editingAddrId ? 'Update Address' : 'Save Address'}
                        </button>
                        <button type="button" className="cancelAddrBtn"
                          onClick={() => { setShowAddrForm(false); setAddrErr(''); setEditingAddrId(null) }}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Address list */}
                {addresses.length === 0 && !showAddrForm ? (
                  <div className="emptyState">
                    <div className="emptyIcon">Addresses</div>
                    <h3>No saved addresses</h3>
                    <p>Add a delivery address to get started.</p>
                    <button className="addBtn" onClick={() => setShowAddrForm(true)}>+ Add Address</button>
                  </div>
                ) : (
                  <div className="addrGrid">
                    {addresses.map(addr => (
                      <div key={addr.id} className={`addrCard${addr.isDefault ? ' addrCardDefault' : ''}`}>
                        <div className="addrCardTop">
                          <div className="addrNameWrap">
                            <div className="addrName">{addr.full_name}</div>
                            {addr.isDefault ? (
                              <span className="defaultBadge">Default</span>
                            ) : null}
                          </div>
                          <button className="addrDelete" onClick={() => handleDeleteAddress(addr.id)}
                            title="Remove address">Remove</button>
                        </div>
                        <p className="addrLine">{addr.street}</p>
                        <p className="addrLine">{addr.city}, {addr.state} — {addr.pincode}</p>
                        <p className="addrPhone">{addr.phone}</p>
                        <div className="addrCardActions">
                          {!addr.isDefault && (
                            <button className="addrActionBtn" onClick={() => handleSetDefault(addr.id)}>
                              Set as Default
                            </button>
                          )}
                          <button className="addrActionBtn addrEditBtn" onClick={() => handleEditAddress(addr)}>
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ORDERS */}
            {tab === 'orders' && (
              <div className="dashSection">
                <h2 className="sectionTitle">Order History</h2>

                {!ordersLoaded ? (
                  <div className="loadingMsg">Loading orders…</div>
                ) : orders.length === 0 ? (
                  <div className="emptyState">
                    <div className="emptyIcon">Orders</div>
                    <h3>No orders yet</h3>
                    <p>Your past orders will appear here once you place one.</p>
                  </div>
                ) : (
                  <div className="ordersList">
                    {orders.map(order => {
                      const stepIndex = getStepIndex(order.status)
                      const deliveryTypeLabel = order.deliveryType === 'fast'
                        ? 'Fast Delivery Available'
                        : order.deliveryType === 'standard'
                          ? 'Standard Delivery'
                          : 'Delivery'
                      const expectedDate = formatDateShort(order.expectedDeliveryDate || order.orderDate)
                      const deliverySlot = order.deliverySlot || (order.deliveryType === 'fast' ? '2-4 Hours' : '10:00 AM - 12:00 PM')
                      return (
                        <div key={order.orderId} className="orderCard">
                          <div className="orderCardHeader">
                            <div className="orderMeta">
                              <Link href={`/order/${order.orderId}`} className="orderNumLink">
                                Order #{order.orderId}
                              </Link>
                              <span className="orderDate">{formatDateShort(order.orderDate)}</span>
                            </div>
                            <div className="orderRight">
                              <StatusBadge status={order.status} />
                              <span className="orderTotal">₹{Number(order.total).toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="orderSummaryGrid">
                            <div className="orderSummaryBlock">
                              <div className="summaryLabel">Expected Delivery</div>
                              <div className="summaryValue">{expectedDate}</div>
                              <div className="summaryMeta">{deliveryTypeLabel} - {deliverySlot}</div>
                            </div>
                            <div className="orderSummaryBlock">
                              <div className="summaryLabel">Payment</div>
                              <div className="summaryValue">{order.paymentMethod === 'online' ? 'Razorpay' : 'Cash on Delivery'}</div>
                              <div className="summaryMeta">
                                Status: {titleCase(order.paymentStatus || (order.paymentMethod === 'online' ? 'paid' : 'pending'))}
                                {order.paymentTxnId ? ` - ${order.paymentTxnId}` : ''}
                              </div>
                            </div>
                            <div className="orderSummaryBlock">
                              <div className="summaryLabel">Delivery Address</div>
                              <div className="summaryValue">{order.deliveryAddress?.name || 'Customer'}</div>
                              <div className="summaryMeta">
                                {order.deliveryAddress?.line1 || ''}{order.deliveryAddress?.line2 ? `, ${order.deliveryAddress.line2}` : ''}
                                {order.deliveryAddress?.city ? `, ${order.deliveryAddress.city}` : ''}{order.deliveryAddress?.state ? `, ${order.deliveryAddress.state}` : ''}
                                {order.deliveryAddress?.pincode ? ` ${order.deliveryAddress.pincode}` : ''}
                              </div>
                            </div>
                          </div>

                          <div className="orderTracking">
                            <div className="trackBar">
                              {TRACKING_STEPS.map((step, idx) => {
                                const isDone = idx <= stepIndex
                                return (
                                  <div key={step.key} className={`trackStep ${isDone ? 'done' : ''}`}>
                                    <div className="trackDot"></div>
                                    <div className="trackLabel">{step.label}</div>
                                  </div>
                                )
                              })}
                              <div className="trackLine" style={{ width: `${(stepIndex / (TRACKING_STEPS.length - 1)) * 100}%` }}></div>
                            </div>
                          </div>

                          <div className="orderItems">
                            {order.items.map((item, i) => (
                              <div key={i} className="orderItem">
                                <span className="orderItemName">{item.productName}</span>
                                <span className="orderItemQty">x {item.qty}</span>
                                <span className="orderItemPrice">₹{Number(item.price).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>

                          <div className="orderCardFooter">
                            <div className="orderActions">
                              <button className="orderActionBtn" onClick={() => setTrackOrder(order)}>Track Order</button>
                              {(order.status === 'pending' || order.status === 'confirmed') && (
                                <button className="orderActionBtn danger" onClick={() => handleCancelOrder(order.orderId)}>Cancel Order</button>
                              )}
                              <button className="orderActionBtn" onClick={() => handleReorder(order)}>Reorder</button>
                              <button className="orderActionBtn" onClick={() => handleDownloadInvoice(order)}>Download Invoice</button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* WISHLIST */}
            {tab === 'wishlist' && (
              <div className="dashSection">
                <div className="sectionHeader">
                  <h2 className="sectionTitle">My Wishlist</h2>
                  <span style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>{wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''}</span>
                </div>
                {wishlistItems.length === 0 ? (
                  <div className="emptyState">
                    <div className="emptyIcon">Wishlist</div>
                    <h3>Your wishlist is empty</h3>
                    <p>Save products to review them later.</p>
                    <button className="addBtn" onClick={() => window.location.href = '/'}>Browse Products</button>
                  </div>
                ) : (
                  <div className="wishGrid">
                    {wishlistItems.map(item => (
                      <div key={item.id} className="wishCard">
                        <div className="wishImgWrap">
                          <img
                            src={resolveProductImage({ name: item.name, image: item.image })}
                            alt={item.name}
                            onError={e => { e.target.src = '/product-images/grocery.svg' }}
                          />
                          <button className="wishRemoveBtn" onClick={() => removeFromWishlist(item.id)} title="Remove">Remove</button>
                        </div>
                        <div className="wishBody">
                          <p className="wishName">{item.name}</p>
                          {item.size && <span className="wishSize">{item.size}</span>}
                          <p className="wishPrice">{formatRupees(item.price)}</p>
                          <button className="wishCartBtn" onClick={() => { addToCart(item, 1); removeFromWishlist(item.id); setSuccess('Moved to cart!'); setTimeout(() => setSuccess(''), 3000) }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                            Move to Cart
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {trackOrder && (
          <div className="trackModalWrap" onClick={() => setTrackOrder(null)}>
            <div className="trackModal" onClick={(e) => e.stopPropagation()}>
              <div className="trackModalHeader">
                <div>
                  <h3>Order #{trackOrder.orderId}</h3>
                  <p>{formatDateShort(trackOrder.orderDate)}</p>
                </div>
                <button className="trackClose" onClick={() => setTrackOrder(null)}>Close</button>
              </div>
              <div className="trackTimeline">
                {(trackOrder.events && trackOrder.events.length > 0 ? trackOrder.events : TRACKING_STEPS.slice(0, getStepIndex(trackOrder.status) + 1).map((s) => ({
                  status: s.key,
                  notes: s.label,
                  createdAt: trackOrder.orderDate,
                }))).map((ev, idx) => (
                  <div key={`${ev.status}-${idx}`} className="trackRow">
                    <div className="trackTime">{formatDateShort(ev.createdAt)} {new Date(ev.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="trackStatus">{titleCase(normalizeStatus(ev.status))}</div>
                    <div className="trackNote">{ev.notes || titleCase(normalizeStatus(ev.status))}</div>
                  </div>
                ))}
              </div>
              <div className="trackModalActions">
                <Link href={`/order/${trackOrder.orderId}`} className="orderActionBtn">
                  View Order Details
                </Link>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          .dashPage {
            background: #fff;
            min-height: calc(100vh - 70px);
            padding: 32px 0 60px;
          }
          .globalSuccess {
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 999;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            color: #0f172a;
            text-align: center;
            padding: 12px 28px;
            font-size: 14px;
            font-weight: 600;
            border-radius: 8px;
            box-shadow: 0 6px 22px rgba(15,23,42,0.08);
            animation: slideDown 0.3s ease;
          }
          @keyframes slideDown {
            from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
          .dashContainer {
            max-width: 1120px;
            margin: 0 auto;
            padding: 0 20px;
            display: grid;
            grid-template-columns: 240px 1fr;
            gap: 28px;
            align-items: start;
          }

          /* ── SIDEBAR ── */
          .dashSidebar {
            background: #fff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 1px 6px rgba(15,23,42,0.06);
            position: sticky;
            top: 90px;
            border: 1px solid #e6e8ec;
          }
          .sideProfile {
            background: #f8fafc;
            padding: 20px 18px;
            display: flex;
            align-items: center;
            gap: 12px;
            border-bottom: 1px solid #eef2f7;
          }
          .sideAvatar {
            width: 44px; height: 44px;
            background: #0f172a;
            border-radius: 50%;
            display: grid; place-items: center;
            font-size: 16px; font-weight: 700; color: #fff;
            flex-shrink: 0;
          }
          .sideUserInfo { overflow: hidden; }
          .sideUserInfo strong {
            display: block; color: #0f172a; font-size: 14px;
            font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          .sideUserInfo span { display: block; color: #64748b; font-size: 11px; margin-top: 2px; }
          .sideNav { padding: 8px 0; }
          .sideNavBtn {
            width: 100%; background: none; border: none; cursor: pointer;
            display: flex; align-items: center; gap: 10px;
            padding: 11px 18px; font-size: 13.5px; font-weight: 500; color: #555;
            text-align: left; transition: all 0.15s;
            border-left: 3px solid transparent;
          }
          .sideNavBtn:hover { background: #f8fafc; color: #0f172a; }
          .sideNavBtn.active {
            background: #f1f5f9; color: #0f172a; font-weight: 700;
            border-left-color: #0f172a;
          }
          .sideLogout {
            width: 100%; background: none; border: none; cursor: pointer;
            display: flex; align-items: center; gap: 10px;
            padding: 13px 18px; font-size: 13.5px; font-weight: 500;
            color: #b42318; transition: background 0.15s;
            border-top: 1px solid #eef2f7;
          }
          .sideLogout:hover { background: #fff7f7; }

          /* ── MAIN ── */
          .dashMain { min-width: 0; }
          .dashSection {
            background: #fff;
            border-radius: 10px;
            padding: 28px 28px 32px;
            box-shadow: 0 1px 6px rgba(15,23,42,0.06);
            border: 1px solid #e6e8ec;
          }
          .sectionTitle {
            margin: 0 0 20px;
            font-size: 18px;
            font-weight: 700;
            color: #1a1a1a;
            border-bottom: none;
            padding-bottom: 0;
          }
          .sectionHeader {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 14px;
            border-bottom: 1.5px solid #f0f0f0;
          }
          .sectionHeader .sectionTitle { margin: 0; border: none; padding: 0; }

          /* OVERVIEW */
          .statsRow {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 14px;
            margin-bottom: 24px;
          }
          .statCard {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 18px 14px;
            text-align: center;
            transition: border-color 0.2s, box-shadow 0.2s;
          }
          .statCard:hover {
            border-color: #cbd5e1;
            box-shadow: 0 6px 16px rgba(15,23,42,0.08);
          }
          .statNum { font-size: 24px; font-weight: 800; color: #0f172a; line-height: 1; }
          .statLabel { font-size: 12px; color: #64748b; font-weight: 500; margin-top: 4px; }
          .overviewGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .profileCard { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
          .profileCardHeader { background: #f8fafc; padding: 20px; display: flex; align-items: center; gap: 16px; border-bottom: 1px solid #eef2f7; }
          .bigAvatar { width: 56px; height: 56px; background: #0f172a; border-radius: 50%; display: grid; place-items: center; font-size: 22px; font-weight: 700; color: #fff; flex-shrink: 0; }
          .profileCardHeader h3 { margin: 0 0 4px; font-size: 18px; font-weight: 700; color: #212121; }
          .memberBadge { margin: 0; font-size: 12px; color: #0f172a; font-weight: 600; background: #e2e8f0; padding: 2px 10px; border-radius: 20px; display: inline-block; }
          .profileFields { padding: 16px 20px; }
          .profileRow { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f4f4f4; font-size: 14px; }
          .profileRow:last-child { border-bottom: none; }
          .profileLabel { color: #64748b; font-weight: 500; }
          .profileValue { color: #212121; font-weight: 600; }
          .capitalize { text-transform: capitalize; }
          .quickLinks { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
          .quickLinks h4 { margin: 0; background: #f8fafc; padding: 14px 18px; font-size: 14px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #eef2f7; }
          .quickBtn { width: 100%; background: none; border: none; border-bottom: 1px solid #f1f5f9; cursor: pointer; display: flex; align-items: center; gap: 14px; padding: 16px 18px; text-align: left; transition: background 0.15s; }
          .quickBtn:last-child { border-bottom: none; }
          .quickBtn:hover { background: #f8fafc; }
          .quickBtn div strong { display: block; font-size: 14px; color: #212121; }
          .quickBtn div p { margin: 2px 0 0; font-size: 12px; color: #64748b; }
          .quickArrow { margin-left: auto; font-size: 12px; color: #64748b; font-weight: 600; letter-spacing: 0.04em; }

          /* Recent Orders on Overview */
          .recentSection {
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1.5px solid #f0f0f0;
          }
          .recentHeader {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 14px;
          }
          .recentHeader h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 700;
            color: #1a1a1a;
          }
          .viewAllBtn {
            background: none;
            border: 1px solid transparent;
            color: #0f172a;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            transition: background 0.15s, border-color 0.15s;
          }
          .viewAllBtn:hover { background: #f8fafc; border-color: #e2e8f0; }
          .recentOrders {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .recentOrderCard {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 14px 16px;
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            transition: border-color 0.2s;
          }
          .recentOrderCard:hover { border-color: #cbd5e1; }
          .recentOrderLeft {
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 60px;
          }
          .recentOrderNum {
            font-size: 14px;
            font-weight: 700;
            color: #212121;
          }
          .recentOrderDate {
            font-size: 11px;
            color: #888;
          }
          .recentOrderMid {
            flex: 1;
            min-width: 0;
          }
          .recentOrderItems {
            font-size: 13px;
            color: #555;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .recentOrderRight {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-shrink: 0;
          }
          .recentOrderTotal {
            font-size: 15px;
            font-weight: 700;
            color: #0f172a;
          }

          /* ADDRESSES */
          .addBtn { background: #0f172a; color: #fff; border: none; padding: 9px 18px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
          .addBtn:hover { background: #111827; }
          .addrFormCard { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 22px; margin-bottom: 24px; }
          .addrFormCard h3 { margin: 0 0 16px; font-size: 16px; font-weight: 700; color: #333; }
          .inlineErr { margin-bottom: 14px; padding: 9px 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; color: #b42318; font-size: 13px; }
          .addrForm { display: flex; flex-direction: column; gap: 14px; }
          .addrRow2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
          .addrRow3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
          .fld { display: flex; flex-direction: column; gap: 5px; }
          .fld label { font-size: 12px; font-weight: 700; color: #555; text-transform: uppercase; letter-spacing: 0.4px; }
          .fld input, .fld select { padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; color: #212121; background: #fff; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
          .fld input:focus, .fld select:focus { border-color: #0f172a; box-shadow: 0 0 0 3px rgba(15,23,42,0.08); }
          .addrFormActions { display: flex; gap: 12px; }
          .saveAddrBtn { background: #0f172a; color: #fff; border: none; padding: 10px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; }
          .saveAddrBtn:hover:not(:disabled) { background: #111827; }
          .saveAddrBtn:disabled { opacity: 0.6; cursor: not-allowed; }
          .cancelAddrBtn { background: none; border: 1px solid #cbd5e1; color: #334155; padding: 10px 20px; border-radius: 6px; font-size: 14px; cursor: pointer; }
          .cancelAddrBtn:hover { border-color: #94a3b8; }
          .emptyState { text-align: center; padding: 50px 20px; }
          .emptyIcon { font-size: 12px; margin-bottom: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #64748b; font-weight: 700; }
          .emptyState h3 { margin: 0 0 8px; font-size: 18px; color: #212121; }
          .emptyState p { margin: 0 0 20px; color: #64748b; font-size: 14px; }
          .addrGrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
          .addrCard { border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; position: relative; transition: box-shadow 0.2s, border-color 0.2s; background: #fff; }
          .addrCard:hover { box-shadow: 0 6px 18px rgba(15,23,42,0.08); border-color: #cbd5e1; }
          .addrCardDefault { border-color: #0f172a; background: #f8fafc; }
          .addrCardDefault:hover { border-color: #0f172a; }
          .addrCardTop { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
          .addrNameWrap { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
          .addrName { font-size: 15px; font-weight: 700; color: #212121; }
          .defaultBadge { display: inline-flex; align-items: center; gap: 3px; background: #0f172a; color: #fff; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px; letter-spacing: 0.3px; }
          .addrDelete { background: none; border: none; cursor: pointer; color: #64748b; font-size: 12px; padding: 2px 4px; transition: color 0.2s; }
          .addrDelete:hover { color: #b42318; }
          .addrLine { margin: 0 0 4px; font-size: 13px; color: #555; }
          .addrPhone { margin: 8px 0 0; font-size: 13px; color: #0f172a; font-weight: 600; }
          .addrCardActions { display: flex; gap: 10px; margin-top: 12px; border-top: 1px solid #eee; padding-top: 12px; }
          .addrActionBtn { background: none; border: 1px solid #cbd5e1; color: #334155; font-size: 12px; font-weight: 600; padding: 5px 12px; border-radius: 5px; cursor: pointer; transition: all 0.2s; }
          .addrActionBtn:hover { border-color: #0f172a; color: #0f172a; background: #f8fafc; }
          .addrEditBtn { border-color: #d4d4d4; }

          /* ORDERS */
          .loadingMsg { text-align: center; padding: 40px; color: #888; font-size: 15px; }
          .ordersList { display: flex; flex-direction: column; gap: 16px; }
          .orderCard { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
          .orderCardHeader { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: #f8fafc; border-bottom: 1px solid #eef2f7; }
          .orderMeta { display: flex; flex-direction: column; gap: 3px; }
          .orderNumLink { font-size: 15px; font-weight: 700; color: #212121; text-decoration: none; }
          .orderNumLink:hover { text-decoration: underline; }
          .orderDate { font-size: 12px; color: #888; }
          .orderRight { display: flex; align-items: center; gap: 14px; }
          .orderTotal { font-size: 16px; font-weight: 700; color: #0f172a; }
          .orderSummaryGrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 16px 18px; background: #fff; border-bottom: 1px solid #eef2f7; }
          .orderSummaryBlock { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 12px; background: #fafafa; }
          .summaryLabel { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; font-weight: 700; }
          .summaryValue { margin-top: 6px; font-size: 14px; font-weight: 700; color: #1f2937; }
          .summaryMeta { margin-top: 4px; font-size: 12px; color: #6b7280; line-height: 1.4; }
          .orderTracking { padding: 10px 18px 6px; background: #fff; border-bottom: 1px solid #eef2f7; }
          .trackBar { position: relative; display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; align-items: center; }
          .trackLine { position: absolute; height: 2px; left: 0; top: 12px; background: #1f2937; z-index: 0; transition: width 0.2s; }
          .trackStep { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
          .trackDot { width: 10px; height: 10px; border-radius: 50%; background: #cbd5e1; }
          .trackStep.done .trackDot { background: #1f2937; }
          .trackLabel { font-size: 11px; color: #6b7280; font-weight: 600; }
          .trackStep.done .trackLabel { color: #1f2937; }
          .orderItems { padding: 12px 18px; }
          .orderItem { display: grid; grid-template-columns: 1fr auto auto; gap: 12px; align-items: center; padding: 7px 0; border-bottom: 1px solid #f8f8f8; font-size: 14px; color: #444; }
          .orderItem:last-child { border-bottom: none; }
          .orderItemName { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .orderItemQty { color: #888; }
          .orderItemPrice { font-weight: 600; color: #212121; }
          .orderCardFooter { padding: 12px 18px; background: #f8fafc; border-top: 1px solid #eef2f7; }
          .orderActions { display: flex; flex-wrap: wrap; gap: 10px; }
          .orderActionBtn {
            background: #fff;
            border: 1px solid #cbd5e1;
            color: #1f2937;
            padding: 7px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s;
          }
          .orderActionBtn:hover { border-color: #1f2937; color: #111827; }
          .orderActionBtn.danger { border-color: #fecaca; color: #b91c1c; }
          .orderActionBtn.danger:hover { border-color: #b91c1c; }

          .trackModalWrap {
            position: fixed; inset: 0; background: rgba(15, 23, 42, 0.35);
            display: grid; place-items: center; z-index: 999;
          }
          .trackModal {
            width: min(720px, 92vw);
            background: #fff;
            border-radius: 10px;
            box-shadow: 0 16px 40px rgba(15,23,42,0.2);
            border: 1px solid #e5e7eb;
            padding: 20px;
          }
          .trackModalHeader { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eef2f7; padding-bottom: 12px; }
          .trackModalHeader h3 { margin: 0; font-size: 16px; font-weight: 700; color: #111827; }
          .trackModalHeader p { margin: 4px 0 0; font-size: 12px; color: #6b7280; }
          .trackClose { background: none; border: 1px solid #cbd5e1; padding: 6px 10px; border-radius: 6px; font-size: 12px; cursor: pointer; }
          .trackTimeline { margin-top: 14px; display: grid; gap: 10px; }
          .trackRow { display: grid; grid-template-columns: 120px 160px 1fr; gap: 10px; font-size: 12px; padding: 8px 10px; border: 1px solid #eef2f7; border-radius: 6px; }
          .trackTime { color: #6b7280; }
          .trackStatus { font-weight: 700; color: #111827; }
          .trackNote { color: #334155; }
          .trackModalActions { margin-top: 14px; display: flex; justify-content: flex-end; }

          /* WISHLIST */
          .wishGrid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 18px;
          }
          .wishCard {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            overflow: hidden;
            transition: box-shadow 0.2s, border-color 0.2s;
          }
          .wishCard:hover {
            box-shadow: 0 8px 24px rgba(15,23,42,0.12);
            border-color: #cbd5e1;
          }
          .wishImgWrap {
            position: relative;
            background: #f8fafc;
            padding: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            aspect-ratio: 1;
          }
          .wishImgWrap img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            border-radius: 6px;
          }
          .wishRemoveBtn {
            position: absolute;
            top: 8px;
            right: 8px;
            padding: 4px 8px;
            border-radius: 6px;
            border: none;
            background: rgba(0,0,0,0.06);
            color: #999;
            font-size: 11px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s, color 0.2s;
          }
          .wishRemoveBtn:hover {
            background: #fee2e2;
            color: #e53935;
          }
          .wishBody {
            padding: 14px 14px 16px;
          }
          .wishName {
            margin: 0 0 4px;
            font-size: 14px;
            font-weight: 600;
            color: #212121;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .wishSize {
            display: inline-block;
            font-size: 11px;
            color: #64748b;
            background: #f1f5f9;
            padding: 2px 8px;
            border-radius: 4px;
            margin-bottom: 6px;
          }
          .wishPrice {
            margin: 0 0 10px;
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
          }
          .wishCartBtn {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            background: #0f172a;
            color: #fff;
            border: none;
            padding: 9px 14px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.2s, transform 0.15s;
          }
          .wishCartBtn:hover {
            opacity: 0.92;
            transform: translateY(-1px);
          }

          /* RESPONSIVE */
          @media (max-width: 900px) {
            .dashContainer { grid-template-columns: 1fr; gap: 16px; }
            .dashSidebar { position: static; }
            .sideProfile { padding: 16px; }
            .sideNav { display: flex; flex-wrap: wrap; padding: 4px 0; }
            .sideNavBtn {
              flex: 1; min-width: 0; justify-content: center;
              padding: 10px 8px; font-size: 12px;
              border-left: none; border-bottom: 3px solid transparent;
            }
            .sideNavBtn.active { border-left: none; border-bottom-color: #619233; background: transparent; }
            .sideLogout { justify-content: center; border-top: none; }
            .overviewGrid { grid-template-columns: 1fr; }
            .statsRow { grid-template-columns: repeat(2, 1fr); }
            .wishGrid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
            .orderSummaryGrid { grid-template-columns: 1fr; }
            .trackRow { grid-template-columns: 1fr; }
          }
          @media (max-width: 600px) {
            .dashPage { padding: 16px 0 40px; }
            .dashContainer { padding: 0 12px; }
            .dashSection { padding: 20px 16px; border-radius: 10px; }
            .addrRow2, .addrRow3 { grid-template-columns: 1fr; }
            .addrFormActions { flex-direction: column; }
            .wishGrid { grid-template-columns: 1fr 1fr; gap: 10px; }
            .wishBody { padding: 10px 10px 14px; }
            .wishName { font-size: 13px; }
            .wishPrice { font-size: 14px; }
            .orderActions { flex-direction: column; align-items: stretch; }
            .orderActionBtn { width: 100%; text-align: center; }
          }
        `}</style>
      </main>
    </ShopLayout>
  )
}
