import { useEffect, useRef, useMemo, useState } from 'react'
import { io } from 'socket.io-client'
import styles from '../styles/admin.module.css'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'

function formatDate(v) {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d) ? '—' : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function StatusBadge({ status }) {
  const map = {
    pending:          { bg: '#fff7e0', color: '#b45309',  label: 'Pending' },
    confirmed:        { bg: '#e0f2fe', color: '#0369a1',  label: 'Confirmed' },
    accepted:         { bg: '#fef9c3', color: '#a16207',  label: 'Accepted' },
    picked_up:        { bg: '#ffedd5', color: '#c2410c',  label: 'Picked Up' },
    out_for_delivery: { bg: '#dbeafe', color: '#1d4ed8',  label: 'Out for Delivery' },
    delivered:        { bg: '#dcfce7', color: '#15803d',  label: 'Delivered' },
    cancelled:        { bg: '#fee2e2', color: '#b91c1c',  label: 'Cancelled' },
    customer:         { bg: '#f0fdf4', color: '#16a34a',  label: 'Customer' },
    admin:            { bg: '#ede9fe', color: '#7c3aed',  label: 'Admin' },
    delivery:         { bg: '#fff7ed', color: '#ea580c',  label: 'Delivery' },
  }
  const s = map[status?.toLowerCase()] || { bg: '#f3f4f6', color: '#6b7280', label: status || '—' }
  return <span style={{ background: s.bg, color: s.color, padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>{s.label}</span>
}

export default function AdminPage() {
  const [token, setToken]           = useState('')
  const [role, setRole]             = useState('')
  const [loginForm, setLoginForm]   = useState({ email: '', password: '' })
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')
  const [activeTab, setActiveTab]   = useState('overview')

  const [orders, setOrders]             = useState([])
  const [users, setUsers]               = useState([])
  const [deliveryBoys, setDeliveryBoys] = useState([])
  const [products, setProducts]         = useState([])

  const [orderSearch, setOrderSearch]     = useState('')
  const [userSearch, setUserSearch]       = useState('')
  const [productSearch, setProductSearch] = useState('')

  const [newProduct, setNewProduct]       = useState({ name: '', price: '', unit: '', image: '', description: '', categoryId: '' })
  const [editingProduct, setEditingProduct] = useState(null)
  const [newPartner, setNewPartner]       = useState({ name: '', email: '', phone: '', password: '' })
  const [notifications, setNotifications] = useState([])
  const socketRef = useRef(null)

  const isAdmin = Boolean(token && role === 'admin')

  // ── Restore token on mount ───────────────────────────────────────────────
  useEffect(() => {
    const t = localStorage.getItem('authToken') || ''
    const r = localStorage.getItem('authUserRole') || ''
    if (t) { setToken(t); setRole(r) }
  }, [])

  // ── Socket.io connection for real-time notifications ─────────────────────
  useEffect(() => {
    if (!isAdmin || !token) return

    const socket = io(API_BASE, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    socket.on('connect',       () => console.log('[Socket.io] Admin connected'))
    socket.on('disconnect',    () => console.log('[Socket.io] Admin disconnected'))
    socket.on('connect_error', (e) => console.warn('[Socket.io]', e.message))

    socket.on('NEW_ORDER', (data) => {
      setNotifications(prev => [{
        id: Date.now(), orderId: data.orderId,
        total: data.total, customerName: data.customerName,
        createdAt: data.createdAt,
      }, ...prev].slice(0, 30))
      loadData()
    })

    socket.on('ORDER_STATUS_UPDATE', () => loadData())
    socket.on('ORDER_ASSIGNED',      () => loadData())

    return () => { socket.disconnect(); socketRef.current = null }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, token])

  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token])

  const flash = (msg, isErr = false) => {
    if (isErr) { setError(msg); setSuccess('') }
    else { setSuccess(msg); setError('') }
    setTimeout(() => { setError(''); setSuccess('') }, 4000)
  }

  const loadData = async () => {
    if (!isAdmin) return
    try {
      const [oR, uR, pR, dR] = await Promise.all([
        fetch(`${API_BASE}/admin/orders`,       { headers: authHeaders }),
        fetch(`${API_BASE}/admin/users`,         { headers: authHeaders }),
        fetch(`${API_BASE}/admin/products`,      { headers: authHeaders }),
        fetch(`${API_BASE}/admin/delivery-boys`, { headers: authHeaders }),
      ])
      const [o, u, p, d] = await Promise.all([oR.json(), uR.json(), pR.json(), dR.json()])
      setOrders(Array.isArray(o) ? o : [])
      setUsers(Array.isArray(u) ? u : [])
      setProducts(Array.isArray(p) ? p : [])
      setDeliveryBoys(Array.isArray(d) ? d : [])
    } catch (e) { flash(e.message || 'Failed to load data.', true) }
  }

  useEffect(() => { loadData() }, [isAdmin, token])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!loginForm.email || !loginForm.password) { setError('Email and password required.'); return }
    setLoading(true)
    try {
      const lr = await fetch(`${API_BASE}/api/admin/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginForm.email.trim(), password: loginForm.password }),
      })
      const ld = await lr.json()
      if (!lr.ok) { setError(ld?.error || 'Login failed.'); return }
      const t = ld?.token || ''
      if (!t) { setError('Token missing.'); return }

      const mr = await fetch(`${API_BASE}/api/admin/auth/me`, { headers: { Authorization: `Bearer ${t}` } })
      const md = await mr.json()
      if (!mr.ok || md?.role !== 'admin') { setError('Not an admin account.'); return }

      localStorage.setItem('authToken', t)
      localStorage.setItem('authUserRole', md.role)
      localStorage.setItem('authUserName', md.name || '')
      setToken(t); setRole(md.role)
      setLoginForm({ email: '', password: '' })
    } catch (e) { setError(e.message || 'Connection failed.') }
    finally { setLoading(false) }
  }

  const handleCreateProduct = async (e) => {
    e.preventDefault()
    try {
      const r = await fetch(`${API_BASE}/admin/products`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ name: newProduct.name.trim(), price: Number(newProduct.price), unit: newProduct.unit, image: newProduct.image, description: newProduct.description, categoryId: newProduct.categoryId ? Number(newProduct.categoryId) : null }),
      })
      const d = await r.json()
      if (!r.ok) { flash(d?.error || 'Failed.', true); return }
      flash('Product created!'); setNewProduct({ name: '', price: '', unit: '', image: '', description: '', categoryId: '' })
      await loadData()
    } catch (e) { flash(e.message, true) }
  }

  const handleDeleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return
    try {
      const r = await fetch(`${API_BASE}/admin/products/${id}`, { method: 'DELETE', headers: authHeaders })
      if (!r.ok) { flash('Delete failed.', true); return }
      flash('Product deleted.'); await loadData()
    } catch (e) { flash(e.message, true) }
  }

  const handleUpdateProduct = async (e) => {
    e.preventDefault()
    if (!editingProduct) return
    try {
      const r = await fetch(`${API_BASE}/admin/products/${editingProduct.id}`, {
        method: 'PUT', headers: authHeaders,
        body: JSON.stringify({
          name: editingProduct.name.trim(),
          price: Number(editingProduct.price),
          unit: editingProduct.unit,
          image: editingProduct.image,
          description: editingProduct.description,
          categoryId: editingProduct.categoryId ? Number(editingProduct.categoryId) : null,
        }),
      })
      const d = await r.json()
      if (!r.ok) { flash(d?.error || 'Update failed.', true); return }
      flash('Product updated!'); setEditingProduct(null); await loadData()
    } catch (e) { flash(e.message, true) }
  }

  const handleUpdateOrderStatus = async (id, status) => {
    try {
      const r = await fetch(`${API_BASE}/admin/orders/${id}/status`, {
        method: 'PUT', headers: authHeaders,
        body: JSON.stringify({ status }),
      })
      if (!r.ok) { flash('Update failed.', true); return }
      flash('Order status updated.'); await loadData()
    } catch (e) { flash(e.message, true) }
  }

  const handleAssignDelivery = async (orderId, deliveryPartnerId) => {
    if (!deliveryPartnerId) return
    try {
      const r = await fetch(`${API_BASE}/admin/orders/${orderId}/assign`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ deliveryPartnerId: Number(deliveryPartnerId) }),
      })
      const d = await r.json()
      if (!r.ok) { flash(d?.error || 'Assign failed.', true); return }
      flash('Delivery partner assigned!'); await loadData()
    } catch (e) { flash(e.message, true) }
  }

  const handleAddDeliveryPartner = async (e) => {
    e.preventDefault()
    try {
      const r = await fetch(`${API_BASE}/admin/delivery-boys`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify(newPartner),
      })
      const d = await r.json()
      if (!r.ok) { flash(d?.error || 'Failed to add partner.', true); return }
      flash('Delivery partner added!'); setNewPartner({ name: '', email: '', phone: '', password: '' }); await loadData()
    } catch (e) { flash(e.message, true) }
  }

  const handleRemoveDeliveryPartner = async (userId) => {
    if (!confirm('Remove this delivery partner?')) return
    try {
      const r = await fetch(`${API_BASE}/admin/delivery-boys/${userId}`, { method: 'DELETE', headers: authHeaders })
      if (!r.ok) { flash('Remove failed.', true); return }
      flash('Delivery partner removed.'); await loadData()
    } catch (e) { flash(e.message, true) }
  }

  const handleUpdateUserRole = async (id, newRole) => {
    try {
      const r = await fetch(`${API_BASE}/admin/users/${id}/role`, {
        method: 'PATCH', headers: authHeaders,
        body: JSON.stringify({ role: newRole }),
      })
      if (!r.ok) { flash('Role update failed.', true); return }
      flash('User role updated.'); await loadData()
    } catch (e) { flash(e.message, true) }
  }

  const logout = () => {
    socketRef.current?.disconnect()
    ['authToken','authUserRole','authUserName','authUserId','authUserEmail'].forEach(k => localStorage.removeItem(k))
    setToken(''); setRole(''); setOrders([]); setUsers([]); setProducts([]); setDeliveryBoys([]); setNotifications([])
  }

  // ── Stats ───────────────────────────────────────────────────────────────────
  const totalRevenue    = orders.reduce((s, o) => s + Number(o.total || 0), 0)
  const pendingOrders   = orders.filter(o => o.status === 'pending').length
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length

  // ── Filtered lists ───────────────────────────────────────────────────────────
  const filteredOrders   = orders.filter(o => !orderSearch || [o.id, o.customerName, o.city, o.status].join(' ').toLowerCase().includes(orderSearch.toLowerCase()))
  const filteredUsers    = users.filter(u => !userSearch || [u.name, u.email, u.role].join(' ').toLowerCase().includes(userSearch.toLowerCase()))
  const filteredProducts = products.filter(p => !productSearch || p.name?.toLowerCase().includes(productSearch.toLowerCase()))

  // ── TABS config ──────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'overview',      label: '📊 Overview' },
    { id: 'orders',        label: `🛒 Orders (${orders.length})` },
    { id: 'products',      label: `🌿 Products (${products.length})` },
    { id: 'users',         label: `👥 Users (${users.length})` },
    { id: 'delivery',      label: `🚴 Delivery Partners (${deliveryBoys.length})` },
    { id: 'notifications', label: `🔔 Notifications${notifications.length > 0 ? ` (${notifications.length})` : ''}` },
  ]

  // ───────────────────────────────────────────────────────────────────────────
  // LOGIN SCREEN
  // ───────────────────────────────────────────────────────────────────────────
  if (!isAdmin) return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <div className={styles.loginLogo}>
          <img src="/logo.png" alt="Sewa Bazaar" />
          <span>Admin Panel</span>
        </div>
        <h2>Sign in to continue</h2>
        {error && <p className={styles.errorMsg}>{error}</p>}
        <form onSubmit={handleLogin}>
          <label>Email
            <input type="email" value={loginForm.email} onChange={e => setLoginForm(p => ({...p, email: e.target.value}))} placeholder="admin@sewabazaar.com" />
          </label>
          <label>Password
            <input type="password" value={loginForm.password} onChange={e => setLoginForm(p => ({...p, password: e.target.value}))} placeholder="••••••••" />
          </label>
          <button type="submit" className={styles.loginBtn} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )

  // ───────────────────────────────────────────────────────────────────────────
  // DASHBOARD
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className={styles.dashPage}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <img src="/logo.png" alt="Sewa Bazaar" />
          <div><strong>Sewa Bazaar</strong><span>Admin</span></div>
        </div>
        <nav className={styles.sidebarNav}>
          {tabs.map(t => (
            <button key={t.id} className={activeTab === t.id ? styles.sidebarActive : ''} onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
        <button className={styles.logoutBtn} onClick={logout}>🚪 Logout</button>
      </aside>

      {/* Main content */}
      <main className={styles.dashMain}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <h1 className={styles.pageTitle}>{tabs.find(t => t.id === activeTab)?.label}</h1>
          <button className={styles.refreshBtn} onClick={loadData}>↻ Refresh</button>
        </div>

        {error   && <div className={styles.alertErr}>{error}</div>}
        {success && <div className={styles.alertOk}>{success}</div>}

        {/* ── Live new-order toast ── */}
        {notifications.length > 0 && activeTab !== 'notifications' && (
          <div
            onClick={() => setActiveTab('notifications')}
            style={{
              cursor: 'pointer',
              background: '#f0fdf4', border: '1px solid #86efac',
              borderRadius: 10, padding: '12px 20px',
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
              boxShadow: '0 2px 12px rgba(22,163,74,0.15)',
            }}
          >
            <span style={{fontSize:24}}>🛒</span>
            <div style={{flex:1}}>
              <strong style={{color:'#15803d'}}>
                {notifications.length} new order{notifications.length > 1 ? 's' : ''} received!
              </strong>
              <div style={{fontSize:13,color:'#6b7280'}}>Latest: Order #{notifications[0].orderId} — ₹{Number(notifications[0].total||0).toLocaleString('en-IN')}</div>
            </div>
            <span style={{fontSize:12,color:'#15803d',fontWeight:600}}>View →</span>
          </div>
        )}

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div>
            <div className={styles.statsRow}>
              <div className={styles.statCard}>
                <span className={styles.statIcon}>🛒</span>
                <div><div className={styles.statNum}>{orders.length}</div><div className={styles.statLabel}>Total Orders</div></div>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statIcon}>⏳</span>
                <div><div className={styles.statNum}>{pendingOrders}</div><div className={styles.statLabel}>Pending Orders</div></div>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statIcon}>✅</span>
                <div><div className={styles.statNum}>{deliveredOrders}</div><div className={styles.statLabel}>Delivered</div></div>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statIcon}>💰</span>
                <div><div className={styles.statNum}>₹{totalRevenue.toLocaleString('en-IN')}</div><div className={styles.statLabel}>Total Revenue</div></div>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statIcon}>👥</span>
                <div><div className={styles.statNum}>{users.length}</div><div className={styles.statLabel}>Registered Users</div></div>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statIcon}>🌿</span>
                <div><div className={styles.statNum}>{products.length}</div><div className={styles.statLabel}>Products</div></div>
              </div>
            </div>

            {/* Recent orders */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Recent Orders</h2>
              <div className={styles.tableWrap}>
                <table>
                  <thead><tr><th>ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {orders.slice(0, 8).map(o => (
                      <tr key={o.id}>
                        <td>#{o.id}</td><td>{o.customerName || '—'}</td>
                        <td>₹{Number(o.total||0).toLocaleString('en-IN')}</td>
                        <td><StatusBadge status={o.status} /></td>
                        <td>{formatDate(o.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── ORDERS ── */}
        {activeTab === 'orders' && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>All Orders</h2>
              <input className={styles.searchInput} placeholder="Search by name, city, status…" value={orderSearch} onChange={e => setOrderSearch(e.target.value)} />
            </div>
            <div className={styles.tableWrap}>
              <table>
                <thead><tr><th>ID</th><th>Customer</th><th>Phone</th><th>City</th><th>Total</th><th>Status</th><th>Payment</th><th>Delivery Partner</th><th>Date</th><th>Update Status</th><th>Assign Delivery</th></tr></thead>
                <tbody>
                  {filteredOrders.map(o => (
                    <tr key={o.id}>
                      <td>#{o.id}</td>
                      <td>{o.customerName || '—'}</td>
                      <td>{o.customerPhone || '—'}</td>
                      <td>{o.city || '—'}</td>
                      <td>₹{Number(o.total||0).toLocaleString('en-IN')}</td>
                      <td><StatusBadge status={o.status} /></td>
                      <td>{o.paymentMethod || '—'}</td>
                      <td>{o.deliveryPartnerName || <span style={{color:'#aaa'}}>Unassigned</span>}</td>
                      <td>{formatDate(o.createdAt)}</td>
                      <td>
                        <select className={styles.statusSelect} value={o.status} onChange={e => handleUpdateOrderStatus(o.id, e.target.value)}>
                          {['pending','confirmed','delivered','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td>
                        <select className={styles.statusSelect} defaultValue="" onChange={e => handleAssignDelivery(o.id, e.target.value)}>
                          <option value="" disabled>{o.deliveryPartnerName || 'Assign…'}</option>
                          {deliveryBoys.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && <tr><td colSpan={11} style={{textAlign:'center',color:'#aaa',padding:32}}>No orders found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── PRODUCTS ── */}
        {activeTab === 'products' && (
          <div className={styles.productsLayout}>
            {/* Edit product modal */}
            {editingProduct && (
              <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <div style={{background:'#fff',borderRadius:12,padding:32,minWidth:340,maxWidth:480,width:'100%',boxShadow:'0 8px 40px rgba(0,0,0,0.18)'}}>
                  <h2 style={{marginBottom:16}}>✏️ Edit Product</h2>
                  <form onSubmit={handleUpdateProduct} className={styles.productForm}>
                    <label>Name *<input value={editingProduct.name} onChange={e => setEditingProduct(p => ({...p, name: e.target.value}))} required /></label>
                    <label>Price (₹) *<input type="number" step="0.01" min="0" value={editingProduct.price} onChange={e => setEditingProduct(p => ({...p, price: e.target.value}))} required /></label>
                    <label>Unit<input value={editingProduct.unit || ''} onChange={e => setEditingProduct(p => ({...p, unit: e.target.value}))} placeholder="kg / piece / bunch" /></label>
                    <label>Image URL<input value={editingProduct.image || ''} onChange={e => setEditingProduct(p => ({...p, image: e.target.value}))} /></label>
                    <label>Category ID<input value={editingProduct.categoryId || ''} onChange={e => setEditingProduct(p => ({...p, categoryId: e.target.value}))} /></label>
                    <label>Description<textarea value={editingProduct.description || ''} onChange={e => setEditingProduct(p => ({...p, description: e.target.value}))} /></label>
                    <div style={{display:'flex',gap:10,marginTop:8}}>
                      <button type="submit" className={styles.addBtn} style={{flex:1}}>💾 Save Changes</button>
                      <button type="button" onClick={() => setEditingProduct(null)} style={{flex:1,padding:'10px 0',borderRadius:8,border:'1px solid #ddd',background:'#f3f4f6',cursor:'pointer'}}>Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Add New Product</h2>
              <form onSubmit={handleCreateProduct} className={styles.productForm}>
                <label>Name *<input value={newProduct.name} onChange={e => setNewProduct(p => ({...p, name: e.target.value}))} placeholder="e.g. Organic Tomatoes" required /></label>
                <label>Price (₹) *<input type="number" step="0.01" min="0" value={newProduct.price} onChange={e => setNewProduct(p => ({...p, price: e.target.value}))} placeholder="0.00" required /></label>
                <label>Unit<input value={newProduct.unit} onChange={e => setNewProduct(p => ({...p, unit: e.target.value}))} placeholder="kg / piece / bunch" /></label>
                <label>Image URL<input value={newProduct.image} onChange={e => setNewProduct(p => ({...p, image: e.target.value}))} placeholder="https://…" /></label>
                <label>Category ID<input value={newProduct.categoryId} onChange={e => setNewProduct(p => ({...p, categoryId: e.target.value}))} placeholder="1" /></label>
                <label>Description<textarea value={newProduct.description} onChange={e => setNewProduct(p => ({...p, description: e.target.value}))} placeholder="Short description…" /></label>
                <button type="submit" className={styles.addBtn}>+ Add Product</button>
              </form>
            </div>

            {/* Products table */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>All Products ({products.length})</h2>
                <input className={styles.searchInput} placeholder="Search products…" value={productSearch} onChange={e => setProductSearch(e.target.value)} />
              </div>
              <div className={styles.tableWrap}>
                <table>
                  <thead><tr><th>ID</th><th>Image</th><th>Name</th><th>Price</th><th>Unit</th><th>Active</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredProducts.map(p => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>{p.image ? <img src={p.image} alt={p.name} style={{width:40,height:40,objectFit:'cover',borderRadius:6}} /> : '—'}</td>
                        <td>{p.name}</td>
                        <td>₹{Number(p.price||0).toLocaleString('en-IN')}</td>
                        <td>{p.unit || '—'}</td>
                        <td>{p.isActive ? '✅' : '❌'}</td>
                        <td style={{display:'flex',gap:6}}>
                          <button className={styles.addBtn} style={{padding:'4px 12px',fontSize:12}} onClick={() => setEditingProduct({ id: p.id, name: p.name, price: p.price, unit: p.unit || '', image: p.image || '', description: p.description || '', categoryId: p.categoryId || '' })}>Edit</button>
                          <button className={styles.deleteBtn} onClick={() => handleDeleteProduct(p.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && <tr><td colSpan={7} style={{textAlign:'center',color:'#aaa',padding:32}}>No products found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {activeTab === 'users' && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>All Users</h2>
              <input className={styles.searchInput} placeholder="Search by name, email, role…" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
            </div>
            <div className={styles.tableWrap}>
              <table>
                <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th><th>Change Role</th></tr></thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td>{u.id}</td><td>{u.name}</td><td>{u.email}</td><td>{u.phone || '—'}</td>
                      <td><StatusBadge status={u.role} /></td>
                      <td>{formatDate(u.createdAt)}</td>
                      <td>
                        <select className={styles.statusSelect} value={u.role} onChange={e => handleUpdateUserRole(u.id, e.target.value)}>
                          {['customer','admin','delivery'].map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && <tr><td colSpan={7} style={{textAlign:'center',color:'#aaa',padding:32}}>No users found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── DELIVERY PARTNERS ── */}
        {activeTab === 'delivery' && (
          <div className={styles.productsLayout}>
            {/* Add Delivery Partner form */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>➕ Add Delivery Partner</h2>
              <form onSubmit={handleAddDeliveryPartner} className={styles.productForm}>
                <label>Name *<input value={newPartner.name} onChange={e => setNewPartner(p => ({...p, name: e.target.value}))} placeholder="Full name" required /></label>
                <label>Email *<input type="email" value={newPartner.email} onChange={e => setNewPartner(p => ({...p, email: e.target.value}))} placeholder="partner@email.com" required /></label>
                <label>Phone<input value={newPartner.phone} onChange={e => setNewPartner(p => ({...p, phone: e.target.value}))} placeholder="10-digit phone" /></label>
                <label>Password *<input type="password" value={newPartner.password} onChange={e => setNewPartner(p => ({...p, password: e.target.value}))} placeholder="Set a password" required /></label>
                <button type="submit" className={styles.addBtn}>+ Add Partner</button>
              </form>
            </div>

            {/* Delivery Partners table */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>All Delivery Partners ({deliveryBoys.length})</h2>
              <div className={styles.tableWrap}>
                <table>
                  <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th><th>Action</th></tr></thead>
                  <tbody>
                    {deliveryBoys.map(d => (
                      <tr key={d.id}>
                        <td>{d.id}</td><td>{d.name}</td><td>{d.email}</td>
                        <td>{d.phone || '—'}</td><td>{formatDate(d.createdAt)}</td>
                        <td><button className={styles.deleteBtn} onClick={() => handleRemoveDeliveryPartner(d.id)}>Remove</button></td>
                      </tr>
                    ))}
                    {deliveryBoys.length === 0 && <tr><td colSpan={6} style={{textAlign:'center',color:'#aaa',padding:32}}>No delivery partners yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {activeTab === 'notifications' && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>🔔 Real-time Order Notifications</h2>
              <button className={styles.refreshBtn} onClick={() => setNotifications([])}>Clear All</button>
            </div>
            {notifications.length === 0 ? (
              <div style={{textAlign:'center',color:'#aaa',padding:48}}>
                <div style={{fontSize:48}}>🔔</div>
                <p>No notifications yet.<br/>New orders will appear here in real-time via WebSocket.</p>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {notifications.map(n => (
                  <div key={n.id} style={{background:'#f0fdf4',border:'1px solid #86efac',borderRadius:10,padding:'14px 20px',display:'flex',alignItems:'center',gap:16}}>
                    <span style={{fontSize:28}}>🛒</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,color:'#15803d',fontSize:15}}>New Order #{n.orderId}</div>
                      {n.customerName && <div style={{color:'#374151',fontSize:13}}>Customer: {n.customerName}</div>}
                      <div style={{color:'#374151',fontSize:13}}>Total: ₹{Number(n.total||0).toLocaleString('en-IN')}</div>
                      <div style={{color:'#9ca3af',fontSize:12}}>{formatDate(n.createdAt)}</div>
                    </div>
                    <button className={styles.refreshBtn} onClick={() => { setActiveTab('orders'); setNotifications(prev => prev.filter(x => x.id !== n.id)) }}>View Orders</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
