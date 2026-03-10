'use client'
import { useState, useEffect, useCallback } from 'react'
import ShopLayout from '../components/ShopLayout'

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'
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
    pending:   { bg: '#fff8e1', color: '#b45309' },
    confirmed: { bg: '#e8f5e9', color: '#2e7d32' },
    delivered: { bg: '#e3f2fd', color: '#1565c0' },
    cancelled: { bg: '#fce4ec', color: '#c62828' },
  }
  const s = palette[status] || { bg: '#f3f4f6', color: '#555' }
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '3px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
    }}>
      {status || 'pending'}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════════════════ */
export default function AccountPage() {
  const [token, setToken] = useState('')
  const [user, setUser]   = useState(null)
  const [tab, setTab]     = useState('overview')   // overview | addresses | orders
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

  /* orders */
  const [orders, setOrders]     = useState([])
  const [ordersLoaded, setOrdersLoaded] = useState(false)

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
      await apiFetch('/api/otp-auth/signup', {
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
      // Step 1 succeeded — show OTP input
      setPendingEmail(regForm.email.trim())
      setOtpStep(true)
      setOtpValue('')
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

  useEffect(() => { if (token && tab === 'addresses') loadAddresses() }, [token, tab, loadAddresses])

  const handleAddAddress = async (e) => {
    e.preventDefault()
    setAddrErr(''); setAddrLoading(true)
    try {
      await apiFetch('/api/user/addresses', {
        method: 'POST',
        headers: jsonHead(),
        body: JSON.stringify(addrForm),
      })
      setAddrForm({ full_name: '', phone: '', street: '', city: '', state: '', pincode: '' })
      setShowAddrForm(false)
      await loadAddresses()
      setSuccess('Address saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) { setAddrErr(err.message) }
    setAddrLoading(false)
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

  useEffect(() => { if (token && tab === 'orders' && !ordersLoaded) loadOrders() }, [token, tab, ordersLoaded, loadOrders])

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
                <h1>{authMode === 'login' ? 'Welcome back 👋' : 'Create your account'}</h1>
                <p>{authMode === 'login' ? 'Sign in to track orders & manage your profile' : 'Join thousands of happy customers'}</p>
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
                    {loading ? <span className="btnLoader">Signing in…</span> : 'Sign In →'}
                  </button>
                  <p className="authSwitch">
                    Don't have an account?{' '}
                    <button type="button" onClick={() => { setAuthMode('register'); setError(''); setOtpStep(false) }}>Create one</button>
                  </p>
                </form>
              ) : otpStep ? (
                /* ── OTP verification screen ── */
                <form onSubmit={handleVerifyOtp} className="authForm">
                  <div className="otpInfo">
                    <div className="otpIcon">📱</div>
                    <p>We've sent a 6-digit OTP to</p>
                    <strong>{pendingEmail}</strong>
                    <p className="otpNote">Check your email / phone. Enter the OTP below to verify your account.</p>
                  </div>
                  <div className="formFld">
                    <label>Enter OTP</label>
                    <input
                      className="otpInput"
                      type="text"
                      placeholder="_ _ _ _ _ _"
                      maxLength={6}
                      value={otpValue}
                      onChange={e => setOtpValue(e.target.value.replace(/\D/g, ''))}
                      required
                      autoFocus
                    />
                  </div>
                  <button type="submit" className="authPrimaryBtn" disabled={loading}>
                    {loading ? 'Verifying…' : 'Verify & Create Account →'}
                  </button>
                  <p className="authSwitch">
                    Wrong email?{' '}
                    <button type="button" onClick={() => { setOtpStep(false); setError('') }}>Go back</button>
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
                    {loading ? <span className="btnLoader">Creating account…</span> : 'Create Account →'}
                  </button>
                  <p className="authSwitch">
                    Already have an account?{' '}
                    <button type="button" onClick={() => { setAuthMode('login'); setError('') }}>Sign in</button>
                  </p>
                </form>
              )}

              {/* Trust badges */}
              <div className="authTrust">
                <span>🔒 Secure login</span>
                <span>🌱 100% Organic</span>
                <span>🚚 Fast Delivery</span>
              </div>

            </div>
          </div>

          <style jsx>{`
            /* ── Page ── */
            .authPage {
              min-height: calc(100vh - 70px);
              background: #f7f8f5;
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
    { key: 'overview',   label: 'Overview',    icon: '⊞' },
    { key: 'addresses',  label: 'My Addresses', icon: '⊙' },
    { key: 'orders',     label: 'My Orders',    icon: '☰' },
  ]

  return (
    <ShopLayout>
      <main className="dashPage">
        {success && <div className="globalSuccess">✓ {success}</div>}

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
                  <span className="sideNavIcon">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>

            <button className="sideLogout" onClick={handleLogout}>
              <span>↩</span> Sign Out
            </button>
          </aside>

          {/* ── MAIN CONTENT ── */}
          <div className="dashMain">

            {/* OVERVIEW */}
            {tab === 'overview' && (
              <div className="dashSection">
                <h2 className="sectionTitle">Account Overview</h2>

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
                        <span className="profileValue">{user?.phone || '—'}</span>
                      </div>
                      <div className="profileRow">
                        <span className="profileLabel">Account Type</span>
                        <span className="profileValue capitalize">{user?.role || 'customer'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="quickLinks">
                    <h4>Quick Actions</h4>
                    <button className="quickBtn" onClick={() => setTab('addresses')}>
                      <span className="quickIcon">📍</span>
                      <div>
                        <strong>Manage Addresses</strong>
                        <p>Add or remove delivery addresses</p>
                      </div>
                      <span className="quickArrow">›</span>
                    </button>
                    <button className="quickBtn" onClick={() => setTab('orders')}>
                      <span className="quickIcon">📦</span>
                      <div>
                        <strong>Order History</strong>
                        <p>Track and reorder your items</p>
                      </div>
                      <span className="quickArrow">›</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ADDRESSES */}
            {tab === 'addresses' && (
              <div className="dashSection">
                <div className="sectionHeader">
                  <h2 className="sectionTitle">My Addresses</h2>
                  {!showAddrForm && (
                    <button className="addBtn" onClick={() => { setShowAddrForm(true); setAddrErr('') }}>
                      + Add New Address
                    </button>
                  )}
                </div>

                {/* Add Address Form */}
                {showAddrForm && (
                  <div className="addrFormCard">
                    <h3>New Delivery Address</h3>
                    {addrErr && <div className="inlineErr"><span>⚠</span> {addrErr}</div>}
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
                          {addrLoading ? 'Saving…' : 'Save Address'}
                        </button>
                        <button type="button" className="cancelAddrBtn"
                          onClick={() => { setShowAddrForm(false); setAddrErr('') }}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Address list */}
                {addresses.length === 0 && !showAddrForm ? (
                  <div className="emptyState">
                    <div className="emptyIcon">📍</div>
                    <h3>No saved addresses</h3>
                    <p>Add a delivery address to get started.</p>
                    <button className="addBtn" onClick={() => setShowAddrForm(true)}>+ Add Address</button>
                  </div>
                ) : (
                  <div className="addrGrid">
                    {addresses.map(addr => (
                      <div key={addr.id} className="addrCard">
                        <div className="addrCardTop">
                          <div className="addrName">{addr.full_name}</div>
                          <button className="addrDelete" onClick={() => handleDeleteAddress(addr.id)}
                            title="Remove address">✕</button>
                        </div>
                        <p className="addrLine">{addr.street}</p>
                        <p className="addrLine">{addr.city}, {addr.state} — {addr.pincode}</p>
                        <p className="addrPhone">📞 {addr.phone}</p>
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
                    <div className="emptyIcon">📦</div>
                    <h3>No orders yet</h3>
                    <p>Your past orders will appear here once you place one.</p>
                  </div>
                ) : (
                  <div className="ordersList">
                    {orders.map(order => (
                      <div key={order.orderId} className="orderCard">
                        <div className="orderCardHeader">
                          <div className="orderMeta">
                            <span className="orderNum">Order #{order.orderId}</span>
                            <span className="orderDate">{new Date(order.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                          <div className="orderRight">
                            <StatusBadge status={order.status} />
                            <span className="orderTotal">₹{Number(order.total).toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="orderItems">
                          {order.items.map((item, i) => (
                            <div key={i} className="orderItem">
                              <span className="orderItemName">{item.productName}</span>
                              <span className="orderItemQty">× {item.qty}</span>
                              <span className="orderItemPrice">₹{Number(item.price).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="orderCardFooter">
                          <span className="paymentMethod">
                            {order.paymentMethod === 'online' ? '💳 Online Payment' : '💵 Cash on Delivery'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          .dashPage {
            background: #f1f3f6;
            min-height: calc(100vh - 120px);
            padding: 28px 0 60px;
          }
          .globalSuccess {
            background: #e8f5e9;
            border: 1px solid #a5d6a7;
            color: #2e7d32;
            text-align: center;
            padding: 10px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 4px;
          }
          .dashContainer {
            max-width: 1160px;
            margin: 0 auto;
            padding: 0 16px;
            display: grid;
            grid-template-columns: 260px 1fr;
            gap: 24px;
            align-items: start;
          }

          /* ── SIDEBAR ── */
          .dashSidebar {
            background: #fff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 12px rgba(0,0,0,0.06);
            position: sticky;
            top: 20px;
          }
          .sideProfile {
            background: linear-gradient(135deg, #619233 0%, #4a7125 100%);
            padding: 24px 20px;
            display: flex;
            align-items: center;
            gap: 14px;
          }
          .sideAvatar {
            width: 48px; height: 48px;
            background: rgba(255,255,255,0.25);
            border-radius: 50%;
            display: grid; place-items: center;
            font-size: 20px; font-weight: 700; color: #fff;
            flex-shrink: 0;
          }
          .sideUserInfo { overflow: hidden; }
          .sideUserInfo strong {
            display: block; color: #fff; font-size: 15px;
            font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          .sideUserInfo span { display: block; color: rgba(255,255,255,0.75); font-size: 12px; }
          .sideNav { padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
          .sideNavBtn {
            width: 100%; background: none; border: none; cursor: pointer;
            display: flex; align-items: center; gap: 10px;
            padding: 12px 20px; font-size: 14px; font-weight: 500; color: #444;
            text-align: left; transition: all 0.15s;
          }
          .sideNavBtn:hover { background: #f8faf5; color: #619233; }
          .sideNavBtn.active { background: #f0f7e8; color: #619233; font-weight: 700; border-right: 3px solid #619233; }
          .sideNavIcon { font-size: 16px; width: 20px; text-align: center; }
          .sideLogout {
            width: 100%; background: none; border: none; cursor: pointer;
            display: flex; align-items: center; gap: 10px;
            padding: 14px 20px; font-size: 14px; font-weight: 500;
            color: #e53935; transition: background 0.15s;
          }
          .sideLogout:hover { background: #fff5f5; }

          /* ── MAIN ── */
          .dashMain { min-width: 0; }
          .dashSection { background: #fff; border-radius: 10px; padding: 28px 28px 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
          .sectionTitle { margin: 0 0 24px; font-size: 20px; font-weight: 700; color: #212121; border-bottom: 2px solid #f0f0f0; padding-bottom: 14px; }
          .sectionHeader { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border-bottom: 2px solid #f0f0f0; padding-bottom: 14px; }
          .sectionHeader .sectionTitle { margin: 0; border: none; padding: 0; }

          /* OVERVIEW */
          .overviewGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .profileCard { border: 1px solid #e8f0de; border-radius: 8px; overflow: hidden; }
          .profileCardHeader { background: linear-gradient(135deg, #f0f7e8, #e8f0de); padding: 20px; display: flex; align-items: center; gap: 16px; }
          .bigAvatar { width: 60px; height: 60px; background: #619233; border-radius: 50%; display: grid; place-items: center; font-size: 26px; font-weight: 700; color: #fff; flex-shrink: 0; }
          .profileCardHeader h3 { margin: 0 0 4px; font-size: 18px; font-weight: 700; color: #212121; }
          .memberBadge { margin: 0; font-size: 12px; color: #619233; font-weight: 600; background: rgba(97,146,51,0.15); padding: 2px 10px; border-radius: 20px; display: inline-block; }
          .profileFields { padding: 16px 20px; }
          .profileRow { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f4f4f4; font-size: 14px; }
          .profileRow:last-child { border-bottom: none; }
          .profileLabel { color: #888; font-weight: 500; }
          .profileValue { color: #212121; font-weight: 600; }
          .capitalize { text-transform: capitalize; }
          .quickLinks { border: 1px solid #f0f0f0; border-radius: 8px; overflow: hidden; }
          .quickLinks h4 { margin: 0; background: #f8faf5; padding: 14px 18px; font-size: 14px; font-weight: 700; color: #444; border-bottom: 1px solid #f0f0f0; }
          .quickBtn { width: 100%; background: none; border: none; border-bottom: 1px solid #f5f5f5; cursor: pointer; display: flex; align-items: center; gap: 14px; padding: 16px 18px; text-align: left; transition: background 0.15s; }
          .quickBtn:last-child { border-bottom: none; }
          .quickBtn:hover { background: #f8faf5; }
          .quickIcon { font-size: 22px; flex-shrink: 0; }
          .quickBtn div strong { display: block; font-size: 14px; color: #212121; }
          .quickBtn div p { margin: 2px 0 0; font-size: 12px; color: #888; }
          .quickArrow { margin-left: auto; font-size: 20px; color: #619233; font-weight: 700; }

          /* ADDRESSES */
          .addBtn { background: #619233; color: #fff; border: none; padding: 9px 18px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
          .addBtn:hover { background: #4f7a29; }
          .addrFormCard { background: #f8faf5; border: 1.5px solid #d4e8b8; border-radius: 8px; padding: 22px; margin-bottom: 24px; }
          .addrFormCard h3 { margin: 0 0 16px; font-size: 16px; font-weight: 700; color: #333; }
          .inlineErr { margin-bottom: 14px; padding: 9px 12px; background: #fff2f2; border: 1px solid #fcc; border-radius: 6px; color: #c0392b; font-size: 13px; display: flex; gap: 8px; }
          .addrForm { display: flex; flex-direction: column; gap: 14px; }
          .addrRow2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
          .addrRow3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
          .fld { display: flex; flex-direction: column; gap: 5px; }
          .fld label { font-size: 12px; font-weight: 700; color: #555; text-transform: uppercase; letter-spacing: 0.4px; }
          .fld input, .fld select { padding: 9px 12px; border: 1.5px solid #d4d4d4; border-radius: 6px; font-size: 14px; color: #212121; background: #fff; outline: none; transition: border-color 0.2s; }
          .fld input:focus, .fld select:focus { border-color: #619233; }
          .addrFormActions { display: flex; gap: 12px; }
          .saveAddrBtn { background: #619233; color: #fff; border: none; padding: 10px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; }
          .saveAddrBtn:hover:not(:disabled) { background: #4f7a29; }
          .saveAddrBtn:disabled { opacity: 0.6; cursor: not-allowed; }
          .cancelAddrBtn { background: none; border: 1.5px solid #ddd; color: #555; padding: 10px 20px; border-radius: 6px; font-size: 14px; cursor: pointer; }
          .cancelAddrBtn:hover { border-color: #999; }
          .emptyState { text-align: center; padding: 50px 20px; }
          .emptyIcon { font-size: 48px; margin-bottom: 12px; }
          .emptyState h3 { margin: 0 0 8px; font-size: 18px; color: #212121; }
          .emptyState p { margin: 0 0 20px; color: #888; font-size: 14px; }
          .addrGrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
          .addrCard { border: 1.5px solid #e0e0e0; border-radius: 8px; padding: 18px; position: relative; transition: box-shadow 0.2s; }
          .addrCard:hover { box-shadow: 0 4px 16px rgba(97,146,51,0.12); border-color: #b8d98a; }
          .addrCardTop { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
          .addrName { font-size: 15px; font-weight: 700; color: #212121; }
          .addrDelete { background: none; border: none; cursor: pointer; color: #ccc; font-size: 14px; padding: 2px 4px; transition: color 0.2s; }
          .addrDelete:hover { color: #e53935; }
          .addrLine { margin: 0 0 4px; font-size: 13px; color: #555; }
          .addrPhone { margin: 8px 0 0; font-size: 13px; color: #619233; font-weight: 500; }

          /* ORDERS */
          .loadingMsg { text-align: center; padding: 40px; color: #888; font-size: 15px; }
          .ordersList { display: flex; flex-direction: column; gap: 16px; }
          .orderCard { border: 1.5px solid #e8e8e8; border-radius: 8px; overflow: hidden; }
          .orderCardHeader { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: #fafafa; border-bottom: 1px solid #f0f0f0; }
          .orderMeta { display: flex; flex-direction: column; gap: 3px; }
          .orderNum { font-size: 15px; font-weight: 700; color: #212121; }
          .orderDate { font-size: 12px; color: #888; }
          .orderRight { display: flex; align-items: center; gap: 14px; }
          .orderTotal { font-size: 16px; font-weight: 700; color: #619233; }
          .orderItems { padding: 12px 18px; }
          .orderItem { display: grid; grid-template-columns: 1fr auto auto; gap: 12px; align-items: center; padding: 7px 0; border-bottom: 1px solid #f8f8f8; font-size: 14px; color: #444; }
          .orderItem:last-child { border-bottom: none; }
          .orderItemName { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .orderItemQty { color: #888; }
          .orderItemPrice { font-weight: 600; color: #212121; }
          .orderCardFooter { padding: 10px 18px; background: #fafafa; border-top: 1px solid #f0f0f0; font-size: 12px; color: #777; }

          /* RESPONSIVE */
          @media (max-width: 900px) {
            .dashContainer { grid-template-columns: 1fr; }
            .dashSidebar { position: static; }
            .sideNav { display: flex; flex-wrap: wrap; padding: 0; }
            .sideNavBtn { flex: 1; justify-content: center; border-right: none; border-bottom: 3px solid transparent; }
            .sideNavBtn.active { border-right: none; border-bottom-color: #619233; }
            .overviewGrid { grid-template-columns: 1fr; }
          }
          @media (max-width: 600px) {
            .dashSection { padding: 20px 16px; }
            .addrRow2, .addrRow3 { grid-template-columns: 1fr; }
            .addrFormActions { flex-direction: column; }
          }
        `}</style>
      </main>
    </ShopLayout>
  )
}
