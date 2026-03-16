import Head from 'next/head'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'
import OrdersTable from '../components/warehouse/OrdersTable'
import styles from '../styles/warehouse.module.css'

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'

const STATUS_LABELS = {
  placed:           'Pending',
  confirmed:        'Confirmed',
  packed:           'Packed',
  ready_for_pickup: 'Ready for Pickup',
  assigned:         'Assigned',
  picked_up:        'Picked Up',
  out_for_delivery: 'Out for Delivery',
  delivered:        'Delivered',
  cancelled:        'Cancelled',
}

// Only these 4 statuses are selectable by warehouse admins.
const WAREHOUSE_ADMIN_STATUSES = ['confirmed', 'packed', 'ready_for_pickup', 'assigned']

// Statuses where the order is in delivery-partner or terminal territory — warehouse admin has no more actions.
const DELIVERY_OR_TERMINAL = new Set(['picked_up', 'out_for_delivery', 'delivered', 'cancelled'])

// Returns the list of statuses the warehouse admin can update an order TO.
function getWarehouseUpdateOptions(currentStatus) {
  if (DELIVERY_OR_TERMINAL.has(currentStatus)) return []
  // Show only the 4 warehouse statuses, excluding whichever is already set
  return WAREHOUSE_ADMIN_STATUSES.filter(s => s !== currentStatus)
}

const FRONTEND_CATEGORY_OPTIONS = [
  'BEST DEAL',
  'FRUITS & VEGETABLES',
  'ATTA, RICE & GRAINS',
  'OIL & GHEE',
  'MILK & DAIRY',
  'CHIPS & BISCUITS',
  'BATH & BODY',
  'SOAP & DETERGENTS',
  'BABY CARE',
  'POOJA ESSENTIALS',
  'BEVERAGES',
  'DRY FRUITS & NUTS',
]

const CATEGORY_NAME_ALIASES = {
  'BEST DEAL': ['Best Deals'],
  'FRUITS & VEGETABLES': ['Fruits & Vegetables', 'Fruits and Vegetables', 'Fruits & Veg', 'Fruits', 'Vegetables'],
  'ATTA, RICE & GRAINS': ['Atta, Rice & Grains', 'Atta Rice & Grains', 'Grains'],
  'OIL & GHEE': ['Oil & Ghee'],
  'MILK & DAIRY': ['Milk & Dairy', 'Dairy'],
  'CHIPS & BISCUITS': ['Chips & Biscuits', 'Snacks'],
  'BATH & BODY': ['Bath & Body'],
  'SOAP & DETERGENTS': ['Soap & Detergents', 'Cleaning'],
  'BABY CARE': ['Baby Care'],
  'POOJA ESSENTIALS': ['Pooja Essentials', 'Pooja'],
  'BEVERAGES': ['Beverages'],
  'DRY FRUITS & NUTS': ['Dry Fruits & Nuts', 'Dry Fruits'],
}

function normalizeCategoryName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

async function apiFetch(path, token, options = {}) {
  let response
  try {
    response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    })
  } catch (_err) {
    return { ok: false, status: 0, data: { error: 'Network error. Unable to reach backend.' } }
  }

  const text = await response.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch (_err) {
    data = null
  }

  return { ok: response.ok, status: response.status, data }
}

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusBadgeClass(status) {
  switch (status) {
    case 'placed':
      return styles.badgePlaced
    case 'confirmed':
      return styles.badgeConfirmed
    case 'packed':
      return styles.badgePacked
    case 'ready_for_pickup':
      return styles.badgeReady
    case 'assigned':
      return styles.badgeAssigned
    case 'picked_up':
      return styles.badgePickedUp
    case 'out_for_delivery':
      return styles.badgeTransit
    case 'delivered':
      return styles.badgeDelivered
    case 'cancelled':
      return styles.badgeCancelled
    default:
      return styles.badgeDefault
  }
}

function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return undefined
    const timer = window.setTimeout(onClose, 3200)
    return () => window.clearTimeout(timer)
  }, [message, onClose])

  if (!message) return null

  return (
    <div className={`${styles.toast} ${message.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
      <strong>{message.type === 'success' ? 'Success' : 'Error'}</strong>
      <span>{message.text}</span>
    </div>
  )
}

function Modal({ open, title, onClose, children }) {
  if (!open) return null

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{title}</h3>
          <button type="button" className={styles.modalClose} onClick={onClose}>Close</button>
        </div>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>
  )
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const result = await apiFetch('/api/warehouse-admin/login', null, {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    }).catch(() => ({ ok: false, data: { error: 'Could not connect to backend' } }))

    setLoading(false)

    if (!result.ok) {
      setError(result.data?.error || 'Invalid credentials')
      return
    }

    if (!result.data?.token) {
      setError('Login succeeded but no token was returned')
      return
    }

    onLogin({
      token: result.data.token,
      name: result.data.name,
      adminId: result.data.admin_id ?? result.data.id ?? null,
      warehouseId: result.data.warehouse_id ?? result.data.warehouseId ?? null,
      warehouseName: result.data.warehouse_name ?? result.data.warehouseName ?? null,
      warehouseCity: result.data.warehouse_city ?? result.data.warehouseCity ?? null,
    })
  }

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <div className={styles.loginBrand}>
          <span className={styles.loginBrandIcon}>WH</span>
          <div>
            <strong>Warehouse Admin</strong>
            <p>Sewa Bazaar operations console</p>
          </div>
        </div>
        <h1 className={styles.loginTitle}>Sign in</h1>
        <p className={styles.loginSub}>Use your warehouse admin credentials to manage orders and stock.</p>
        <form onSubmit={handleSubmit} className={styles.formStack}>
          <label className={styles.field}>
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className={styles.field}>
            <span>Password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error ? <div className={styles.formError}>{error}</div> : null}
          <button type="submit" className={styles.primaryBtn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

function OverviewPanel({ token, warehouseId, onSwitchTab }) {
  const [metrics, setMetrics] = useState(null)
  const [orders, setOrders] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [metricsResult, ordersResult, lowStockResult] = await Promise.all([
      apiFetch(`/api/warehouse/overview/${warehouseId}`, token),
      apiFetch('/api/warehouse/orders', token),
      apiFetch('/api/warehouse/low-stock', token),
    ])

    if (metricsResult.ok) setMetrics(metricsResult.data)
    if (ordersResult.ok) setOrders((ordersResult.data?.orders || []).slice(0, 6))
    if (lowStockResult.ok) setLowStock(lowStockResult.data?.items || [])
    setLoading(false)
  }, [token, warehouseId])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return <div className={styles.loadingBlock}>Loading warehouse overview...</div>
  }

  const cards = [
    { label: 'Total Orders', value: metrics?.totalOrders || 0 },
    { label: 'Pending Orders', value: metrics?.pendingOrders || 0 },
    { label: 'Delivered Orders', value: metrics?.deliveredOrders || 0 },
    { label: 'Unassigned Orders', value: metrics?.unassignedOrders || 0 },
    { label: 'Products in Inventory', value: metrics?.productsInInventory || 0 },
    { label: 'Total Revenue', value: formatMoney(metrics?.totalRevenue || 0) },
  ]

  return (
    <div className={styles.panelStack}>
      <div className={styles.metricGrid}>
        {cards.map((card) => (
          <div key={card.label} className={styles.metricCard}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </div>
        ))}
      </div>

      {lowStock.length > 0 ? (
        <div className={styles.alertCard}>
          <div>
            <strong>Low Stock</strong>
            <p>{lowStock.length} inventory item(s) are below 10 units.</p>
          </div>
          <button type="button" className={styles.secondaryBtn} onClick={() => onSwitchTab('inventory')}>
            Review Inventory
          </button>
        </div>
      ) : null}

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h3>Recent Orders</h3>
            <p>Orders assigned to this warehouse</p>
          </div>
          <button type="button" className={styles.secondaryBtn} onClick={() => onSwitchTab('orders')}>
            Open Orders
          </button>
        </div>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Partner</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyCell}>No warehouse orders yet</td>
                </tr>
              ) : orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.customerName || '—'}</td>
                  <td>
                    <span className={`${styles.badge} ${statusBadgeClass(order.status)}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </td>
                  <td>{order.assignedPartnerName || 'Unassigned'}</td>
                  <td>{formatMoney(order.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function OrdersPanel({ token, warehouseId, notify }) {
  const [orders, setOrders] = useState([])
  const [partners, setPartners] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [statusBusyOrderId, setStatusBusyOrderId] = useState(null)
  const [partnerBusyOrderId, setPartnerBusyOrderId] = useState(null)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const [ordersResult, partnersResult] = await Promise.all([
      apiFetch('/api/warehouse/orders', token),
      apiFetch('/api/warehouse/delivery-partners', token),
    ])

    if (ordersResult.ok) setOrders(ordersResult.data?.orders || [])
    if (partnersResult.ok) {
      // Backend filters by active status, but we add defensive filtering just in case
      const allPartners = partnersResult.data?.partners || []
      const activePartners = allPartners.filter((partner) => partner.status === 'active' || !partner.status)
      setPartners(activePartners)
    }
    setLoading(false)
  }, [token, warehouseId])

  useEffect(() => {
    load()
  }, [load])

  const handleAssignPartner = async (orderId, deliveryPartnerId) => {
    if (!deliveryPartnerId) return
    setPartnerBusyOrderId(orderId)
    const result = await apiFetch('/api/warehouse/assign-delivery', token, {
      method: 'POST',
      body: JSON.stringify({ orderId, deliveryPartnerId: Number(deliveryPartnerId) }),
    })
    setPartnerBusyOrderId(null)

    if (!result.ok) {
      notify({ type: 'error', text: result.data?.error || 'Failed to assign delivery partner' })
      return
    }

    // Update order in local state immediately — assignment auto-advances status to 'assigned'
    const updatedOrders = orders.map((order) => {
      if (order.id === orderId) {
        return {
          ...order,
          assignedPartnerId: result.data?.deliveryPartnerId,
          assignedPartnerName: result.data?.deliveryPartnerName,
          status: 'assigned',
        }
      }
      return order
    })
    setOrders(updatedOrders)

    notify({ type: 'success', text: `Assigned delivery partner to order #${orderId}` })
  }

  const handleStatusUpdate = async (orderId, status) => {
    if (!status) return
    setStatusBusyOrderId(orderId)
    const previousOrders = orders
    setOrders((current) => current.map((order) => (
      order.id === orderId
        ? { ...order, status }
        : order
    )))

    const result = await apiFetch('/api/orders/update-status', token, {
      method: 'PUT',
      body: JSON.stringify({ order_id: orderId, status }),
    })
    setStatusBusyOrderId(null)

    if (!result.ok) {
      setOrders(previousOrders)
      notify({ type: 'error', text: result.data?.error || 'Failed to update order status' })
      return
    }

    notify({ type: 'success', text: `Order #${orderId} updated to ${STATUS_LABELS[status]}` })
  }

  const isStatusUpdating = useCallback((orderId) => statusBusyOrderId === orderId, [statusBusyOrderId])
  const isPartnerUpdating = useCallback((orderId) => partnerBusyOrderId === orderId, [partnerBusyOrderId])

  const visibleOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter
      const query = search.trim().toLowerCase()
      const matchesSearch = !query
        || String(order.id).includes(query)
        || String(order.customerName || '').toLowerCase().includes(query)
        || String(order.city || '').toLowerCase().includes(query)
      return matchesStatus && matchesSearch
    })
  }, [orders, search, statusFilter])

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h3>Orders</h3>
          <p>Only orders for this warehouse are shown</p>
        </div>
        <button type="button" className={styles.secondaryBtn} onClick={load}>Refresh</button>
      </div>
      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          placeholder="Search by order, customer, city"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select className={styles.selectInput} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="packed">Packed</option>
          <option value="ready_for_pickup">Ready for Pickup</option>
          <option value="assigned">Assigned</option>
        </select>
      </div>

      {loading ? (
        <div className={styles.loadingBlock}>Loading orders...</div>
      ) : (
        <OrdersTable
          orders={visibleOrders}
          partners={partners}
          statusLabels={STATUS_LABELS}
          getStatusOptions={getWarehouseUpdateOptions}
          isPartnerUpdating={isPartnerUpdating}
          isStatusUpdating={isStatusUpdating}
          formatDateTime={formatDateTime}
          onAssignPartner={handleAssignPartner}
          onStatusChange={handleStatusUpdate}
        />
      )}
    </div>
  )
}

function DeliveryPartnersPanel({ token, warehouseId, notify }) {
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const result = await apiFetch('/api/warehouse/delivery-partners', token)
    if (result.ok) {
      setPartners(result.data?.partners || [])
    } else {
      notify({ type: 'error', text: result.data?.error || 'Failed to load delivery partners' })
    }
    setLoading(false)
  }, [token, warehouseId])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async (event) => {
    event.preventDefault()
    if (form.password !== form.confirmPassword) {
      notify({ type: 'error', text: 'Password and confirm password must match' })
      return
    }
    setSaving(true)
    const result = await apiFetch('/api/warehouse/delivery-partners', token, {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        warehouse_id: Number(warehouseId),
      }),
    })
    setSaving(false)

    if (!result.ok) {
      notify({ type: 'error', text: result.data?.error || 'Failed to add delivery partner' })
      return
    }

    notify({ type: 'success', text: 'Delivery partner added' })
    setForm({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
    setShowModal(false)
    load()
  }

  const handleStatusChange = async (partnerId, status) => {
    const result = await apiFetch(`/api/warehouse/delivery-partners/${partnerId}/status`, token, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })

    if (!result.ok) {
      notify({ type: 'error', text: result.data?.error || 'Failed to update delivery partner status' })
      return
    }

    notify({ type: 'success', text: `Delivery partner marked ${status}` })
    load()
  }

  return (
    <>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h3>Delivery Partners</h3>
            <p>Manage drivers available for this warehouse</p>
          </div>
          <button type="button" className={styles.primaryBtn} onClick={() => setShowModal(true)}>
            + Add Delivery Partner
          </button>
        </div>

        {loading ? (
          <div className={styles.loadingBlock}>Loading delivery partners...</div>
        ) : (
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {partners.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={styles.emptyCell}>No delivery partners yet</td>
                  </tr>
                ) : partners.map((partner) => (
                  <tr key={partner.id}>
                    <td>{partner.name}</td>
                    <td>{partner.email}</td>
                    <td>{partner.phone}</td>
                    <td>
                      <span className={`${styles.badge} ${
                        partner.status === 'active'
                          ? styles.badgeDelivered
                          : partner.status === 'busy'
                            ? styles.badgeTransit
                            : styles.badgeDefault
                      }`}>
                        {partner.status}
                      </span>
                    </td>
                    <td>
                      <select
                        className={styles.selectInput}
                        value={partner.status}
                        onChange={(event) => handleStatusChange(partner.id, event.target.value)}
                      >
                        <option value="active">active</option>
                        <option value="busy">busy</option>
                        <option value="offline">offline</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showModal} title="Add Delivery Partner" onClose={() => setShowModal(false)}>
        <form className={styles.formStack} onSubmit={handleCreate}>
          <label className={styles.field}>
            <span>Name</span>
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
          </label>
          <label className={styles.field}>
            <span>Email</span>
            <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
          </label>
          <label className={styles.field}>
            <span>Phone</span>
            <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} required />
          </label>
          <label className={styles.field}>
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              required
            />
          </label>
          <label className={styles.field}>
            <span>Confirm Password</span>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
              required
            />
          </label>
          <button type="submit" className={styles.primaryBtn} disabled={saving}>
            {saving ? 'Saving...' : 'Add Delivery Partner'}
          </button>
        </form>
      </Modal>
    </>
  )
}

function InventoryPanel({ token, warehouseId, notify }) {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [categoryOptions, setCategoryOptions] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCreateProductModal, setShowCreateProductModal] = useState(false)
  const [stockModal, setStockModal] = useState({ open: false, productId: '', mode: 'set', stock: '' })
  const [productForm, setProductForm] = useState({
    name: '',
    categoryName: '',
    price: '',
    unit: '',
    image: '',
    description: '',
    initialStock: '',
  })

  const categoryIdByFrontendName = useMemo(() => {
    const byNormalizedBackendName = new Map()
    categoryOptions.forEach((category) => {
      const normalized = normalizeCategoryName(category?.name)
      if (!normalized) return
      byNormalizedBackendName.set(normalized, Number(category.id))
    })

    const resolved = new Map()
    FRONTEND_CATEGORY_OPTIONS.forEach((frontendName) => {
      const candidates = [frontendName, ...(CATEGORY_NAME_ALIASES[frontendName] || [])]
      for (const candidate of candidates) {
        const categoryId = byNormalizedBackendName.get(normalizeCategoryName(candidate))
        if (categoryId) {
          resolved.set(frontendName, categoryId)
          break
        }
      }
    })

    return resolved
  }, [categoryOptions])

  const load = useCallback(async () => {
    setLoading(true)
    const [inventoryResult, lowStockResult] = await Promise.all([
      apiFetch('/api/warehouse/inventory', token),
      apiFetch('/api/warehouse/low-stock', token),
    ])

    if (inventoryResult.ok) {
      setCategories(inventoryResult.data?.categories || [])
      setProducts(inventoryResult.data?.products || [])
      setCategoryOptions(inventoryResult.data?.categoryOptions || [])
    }
    if (lowStockResult.ok) setLowStock(lowStockResult.data?.items || [])
    setLoading(false)
  }, [token, warehouseId])

  useEffect(() => {
    load()
  }, [load])

  const handleAddStock = async (event) => {
    event.preventDefault()
    const result = await apiFetch('/api/warehouse/inventory/add', token, {
      method: 'POST',
      body: JSON.stringify({
        productId: Number(stockModal.productId),
        stock: Number(stockModal.stock),
        warehouse_id: Number(warehouseId),
      }),
    })

    if (!result.ok) {
      notify({ type: 'error', text: result.data?.error || 'Failed to add stock' })
      return
    }

    notify({ type: 'success', text: 'Stock added to inventory' })
    setShowAddModal(false)
    setStockModal({ open: false, productId: '', mode: 'set', stock: '' })
    load()
  }

  const handleUpdateStock = async (event) => {
    event.preventDefault()
    const result = await apiFetch('/api/inventory/update', token, {
      method: 'PUT',
      body: JSON.stringify({
        productId: Number(stockModal.productId),
        stock: Number(stockModal.stock),
        mode: stockModal.mode,
      }),
    })

    if (!result.ok) {
      notify({ type: 'error', text: result.data?.error || 'Failed to update stock' })
      return
    }

    notify({ type: 'success', text: 'Inventory updated' })
    setStockModal({ open: false, productId: '', mode: 'set', stock: '' })
    load()
  }

  const handleCreateProduct = async (event) => {
    event.preventDefault()
    const selectedCategoryName = productForm.categoryName || null
    const selectedCategoryId = selectedCategoryName
      ? categoryIdByFrontendName.get(selectedCategoryName) || null
      : null

    const result = await apiFetch('/api/warehouse/products', token, {
      method: 'POST',
      body: JSON.stringify({
        name: productForm.name,
        categoryId: selectedCategoryId,
        categoryName: selectedCategoryName,
        price: Number(productForm.price),
        unit: productForm.unit || null,
        image: productForm.image || null,
        description: productForm.description || null,
        initialStock: productForm.initialStock ? Number(productForm.initialStock) : 0,
      }),
    })

    if (!result.ok) {
      notify({ type: 'error', text: result.data?.error || 'Failed to create product' })
      return
    }

    notify({ type: 'success', text: 'Product created and added to warehouse inventory' })
    setShowCreateProductModal(false)
    setProductForm({
      name: '',
      categoryName: '',
      price: '',
      unit: '',
      image: '',
      description: '',
      initialStock: '',
    })
    load()
  }

  return (
    <>
      {lowStock.length > 0 ? (
        <div className={styles.alertCard}>
          <div>
            <strong>Low Stock</strong>
            <p>{lowStock.map((item) => `${item.productName} (${item.stock})`).join(', ')}</p>
          </div>
        </div>
      ) : null}

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h3>Inventory</h3>
            <p>Grouped by category for this warehouse</p>
          </div>
          <div className={styles.inlineForm}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => setShowCreateProductModal(true)}
            >
              + Add Product
            </button>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => {
                setStockModal({ open: false, productId: '', mode: 'set', stock: '' })
                setShowAddModal(true)
              }}
            >
              + Add Stock
            </button>
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingBlock}>Loading inventory...</div>
        ) : categories.length === 0 ? (
          <div className={styles.emptyState}>
            <strong>No inventory data yet</strong>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => {
                setStockModal({ open: false, productId: '', mode: 'set', stock: '' })
                setShowAddModal(true)
              }}
            >
              Add Stock
            </button>
          </div>
        ) : (
          <div className={styles.inventoryGroups}>
            {categories.map((category) => (
              <div key={category.categoryId} className={styles.categoryCard}>
                <div className={styles.categoryHeader}>
                  <div>
                    <strong>Category: {category.categoryName}</strong>
                    <p>{category.products.length} product(s)</p>
                  </div>
                </div>
                <div className={styles.tableWrap}>
                  <table>
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Stock</th>
                        <th>Price</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.products.map((product) => (
                        <tr key={product.id}>
                          <td>{product.name}</td>
                          <td>{product.categoryName}</td>
                          <td>
                            <div className={styles.stockValue}>
                              <strong>{product.stock}</strong>
                              {product.lowStock ? <span className={styles.lowStockPill}>Low Stock</span> : null}
                            </div>
                          </td>
                          <td>{formatMoney(product.price)}</td>
                          <td>
                            <div className={styles.inlineForm}>
                              <button
                                type="button"
                                className={styles.secondaryBtnSmall}
                                onClick={() => setStockModal({ open: true, productId: product.id, mode: 'add', stock: '' })}
                              >
                                Add Stock
                              </button>
                              <button
                                type="button"
                                className={styles.secondaryBtnSmall}
                                onClick={() => setStockModal({ open: true, productId: product.id, mode: 'set', stock: String(product.stock) })}
                              >
                                Update Stock
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={showAddModal}
        title="Add Stock"
        onClose={() => {
          setShowAddModal(false)
          setStockModal({ open: false, productId: '', mode: 'set', stock: '' })
        }}
      >
        <form className={styles.formStack} onSubmit={handleAddStock}>
          <label className={styles.field}>
            <span>Product</span>
            <select
              value={stockModal.productId}
              onChange={(event) => setStockModal((current) => ({ ...current, productId: event.target.value, stock: current.stock || '' }))}
              required
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} {product.categoryName ? `(${product.categoryName})` : ''}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Stock</span>
            <input
              type="number"
              min="1"
              value={stockModal.stock}
              onChange={(event) => setStockModal((current) => ({ ...current, stock: event.target.value }))}
              required
            />
          </label>
          <button type="submit" className={styles.primaryBtn}>Add Stock</button>
        </form>
      </Modal>

      <Modal
        open={showCreateProductModal}
        title="Add Product To Category"
        onClose={() => setShowCreateProductModal(false)}
      >
        <form className={styles.formStack} onSubmit={handleCreateProduct}>
          <label className={styles.field}>
            <span>Product Name</span>
            <input
              value={productForm.name}
              onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </label>
          <label className={styles.field}>
            <span>Category</span>
            <select
              value={productForm.categoryName}
              onChange={(event) => setProductForm((current) => ({ ...current, categoryName: event.target.value }))}
              required
            >
              <option value="">Select category</option>
              {FRONTEND_CATEGORY_OPTIONS.map((categoryName) => (
                <option key={categoryName} value={categoryName}>
                  {categoryName}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Price</span>
            <input
              type="number"
              min="1"
              step="0.01"
              value={productForm.price}
              onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))}
              required
            />
          </label>
          <label className={styles.field}>
            <span>Unit</span>
            <input
              value={productForm.unit}
              onChange={(event) => setProductForm((current) => ({ ...current, unit: event.target.value }))}
              placeholder="kg, packet, piece"
            />
          </label>
          <label className={styles.field}>
            <span>Initial Stock</span>
            <input
              type="number"
              min="0"
              value={productForm.initialStock}
              onChange={(event) => setProductForm((current) => ({ ...current, initialStock: event.target.value }))}
            />
          </label>
          <label className={styles.field}>
            <span>Image URL (optional)</span>
            <input
              value={productForm.image}
              onChange={(event) => setProductForm((current) => ({ ...current, image: event.target.value }))}
            />
          </label>
          <label className={styles.field}>
            <span>Description (optional)</span>
            <textarea
              value={productForm.description}
              onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))}
              rows={3}
            />
          </label>
          <button type="submit" className={styles.primaryBtn}>Create Product</button>
        </form>
      </Modal>

      <Modal open={stockModal.open} title={stockModal.mode === 'add' ? 'Add Stock' : 'Update Stock'} onClose={() => setStockModal({ open: false, productId: '', mode: 'set', stock: '' })}>
        <form className={styles.formStack} onSubmit={handleUpdateStock}>
          <label className={styles.field}>
            <span>{stockModal.mode === 'add' ? 'Quantity to Add' : 'New Stock Value'}</span>
            <input
              type="number"
              min="0"
              value={stockModal.stock}
              onChange={(event) => setStockModal((current) => ({ ...current, stock: event.target.value }))}
              required
            />
          </label>
          <button type="submit" className={styles.primaryBtn}>
            {stockModal.mode === 'add' ? 'Add Stock' : 'Update Stock'}
          </button>
        </form>
      </Modal>
    </>
  )
}

function CodCollectionsPanel({ token, warehouseId }) {
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const result = await apiFetch('/api/warehouse/cod', token)
    if (result.ok) setCollections(result.data?.collections || [])
    setLoading(false)
  }, [token, warehouseId])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h3>COD Collections</h3>
          <p>Pending and settled cash collected by delivery partners</p>
        </div>
        <button type="button" className={styles.secondaryBtn} onClick={load}>Refresh</button>
      </div>
      {loading ? (
        <div className={styles.loadingBlock}>Loading COD collections...</div>
      ) : (
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Delivery Partner</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Collected At</th>
              </tr>
            </thead>
            <tbody>
              {collections.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyCell}>No COD collections found</td>
                </tr>
              ) : collections.map((entry) => (
                <tr key={entry.id}>
                  <td>#{entry.orderId}</td>
                  <td>{entry.customerName || '—'}</td>
                  <td>{entry.deliveryPartnerName || '—'}</td>
                  <td>{formatMoney(entry.amount)}</td>
                  <td>
                    <span className={`${styles.badge} ${entry.status === 'settled' ? styles.badgeDelivered : styles.badgeTransit}`}>
                      {entry.status}
                    </span>
                  </td>
                  <td>{formatDateTime(entry.collectedAt || entry.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function WarehouseDashboard() {
  const [token, setToken] = useState(null)
  const [adminName, setAdminName] = useState('')
  const [warehouseTitle, setWarehouseTitle] = useState('')
  const [warehouseId, setWarehouseId] = useState(null)
  const [adminId, setAdminId] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [toast, setToast] = useState(null)
  const [resolvingWarehouse, setResolvingWarehouse] = useState(false)
  const [warehouseResolveError, setWarehouseResolveError] = useState('')
  const [warehouseResolveTick, setWarehouseResolveTick] = useState(0)
  const [socketConnected, setSocketConnected] = useState(false)

  // Real-time notifications via Socket.io
  useEffect(() => {
    if (!token || !warehouseId) return undefined

    const socket = io(API, {
      path: '/socket.io',
      transports: ['websocket'],
      auth: { token },
    })

    socket.on('connect', () => {
      setSocketConnected(true)
    })

    socket.on('disconnect', () => {
      setSocketConnected(false)
    })

    // New order created and assigned to a warehouse
    socket.on('NEW_ORDER', (payload) => {
      if (!payload) return
      if (payload.warehouseId && String(payload.warehouseId) !== String(warehouseId)) return
      setToast({
        type: 'success',
        text: `New order #${payload.orderId || ''} created${payload.customerName ? ` for ${payload.customerName}` : ''}.`,
      })
    })

    // Order assigned to a delivery partner from this warehouse dashboard
    socket.on('ORDER_ASSIGNED', (payload) => {
      if (!payload) return
      if (payload.warehouseId && String(payload.warehouseId) !== String(warehouseId)) return
      setToast({
        type: 'success',
        text: `Order #${payload.orderId || ''} assigned to a delivery partner.`,
      })
    })

    return () => {
      socket.disconnect()
    }
  }, [token, warehouseId])

  const clearAuth = useCallback(() => {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem('warehouseToken')
    window.localStorage.removeItem('warehouseName')
    window.localStorage.removeItem('warehouse_title')
    window.localStorage.removeItem('warehouse_id')
    window.localStorage.removeItem('admin_id')
    setToken(null)
    setAdminName('')
    setWarehouseTitle('')
    setWarehouseId(null)
    setAdminId(null)
    setActiveTab('overview')
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedToken = window.localStorage.getItem('warehouseToken')
    const savedName = window.localStorage.getItem('warehouseName')
    const savedWarehouseTitle = window.localStorage.getItem('warehouse_title')
    const savedWarehouseId = window.localStorage.getItem('warehouse_id')
    const savedAdminId = window.localStorage.getItem('admin_id')
    if (savedToken) setToken(savedToken)
    if (savedName) setAdminName(savedName)
    if (savedWarehouseTitle) setWarehouseTitle(savedWarehouseTitle)
    if (savedWarehouseId) setWarehouseId(savedWarehouseId)
    if (savedAdminId) setAdminId(savedAdminId)
  }, [])

  // Self-heal for older logins: if token exists but warehouse_id is missing,
  // fetch it from a protected endpoint that derives it from warehouse_admins.
  useEffect(() => {
    if (!token || warehouseId || resolvingWarehouse) return

    let cancelled = false

    async function resolveWarehouseId() {
      setResolvingWarehouse(true)
      setWarehouseResolveError('')
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), 5000)

      try {
        const result = await apiFetch('/api/warehouse/me', token, { signal: controller.signal })
        if (cancelled) return

        // If token is invalid/expired, bounce back to login.
        if (result.status === 401 || result.status === 403) {
          setToast({ type: 'error', text: result.data?.error || 'Session expired. Please sign in again.' })
          clearAuth()
          return
        }

        if (result.ok) {
          if (result.data?.warehouse_id) {
            const nextWarehouseId = String(result.data.warehouse_id)
            window.localStorage.setItem('warehouse_id', nextWarehouseId)
            setWarehouseId(nextWarehouseId)
          }
          if (result.data?.warehouse_name) {
            const title = result.data.warehouse_city
              ? `${result.data.warehouse_name} (${result.data.warehouse_city})`
              : result.data.warehouse_name
            window.localStorage.setItem('warehouse_title', title)
            setWarehouseTitle(title)
          }
          if (!result.data?.warehouse_id && !result.data?.warehouse_name) {
            setWarehouseResolveError(
              result.data?.error || 'Unable to fetch warehouse assignment. Please retry or sign in again.'
            )
          }
          return
        }

        setWarehouseResolveError(
          result.data?.error || 'Unable to fetch warehouse assignment. Please retry or sign in again.'
        )
      } catch (_err) {
        if (!cancelled) {
          setWarehouseResolveError('Unable to reach backend. Please check the API server and retry.')
        }
      } finally {
        window.clearTimeout(timeoutId)
        if (!cancelled) setResolvingWarehouse(false)
      }
    }

    resolveWarehouseId()

    return () => {
      cancelled = true
    }
  }, [token, warehouseId, warehouseResolveTick, clearAuth])

  // If warehouse title is missing, fetch it (and confirm warehouse assignment).
  useEffect(() => {
    if (!token || warehouseTitle) return

    let cancelled = false

    async function resolveWarehouseTitle() {
      const result = await apiFetch('/api/warehouse/me', token)
      if (cancelled) return
      if (!result.ok) return

      if (result.data?.warehouse_id && !warehouseId) {
        const nextWarehouseId = String(result.data.warehouse_id)
        window.localStorage.setItem('warehouse_id', nextWarehouseId)
        setWarehouseId(nextWarehouseId)
      }

      if (result.data?.warehouse_name) {
        const title = result.data.warehouse_city
          ? `${result.data.warehouse_name} (${result.data.warehouse_city})`
          : result.data.warehouse_name
        window.localStorage.setItem('warehouse_title', title)
        setWarehouseTitle(title)
      }
    }

    resolveWarehouseTitle()

    return () => {
      cancelled = true
    }
  }, [token, warehouseTitle, warehouseId])

  const handleLogin = ({ token: nextToken, name, warehouseId: nextWarehouseId, adminId: nextAdminId, warehouseName, warehouseCity }) => {
    window.localStorage.setItem('warehouseToken', nextToken)
    window.localStorage.setItem('warehouseName', name || '')
    const title = warehouseName
      ? `${warehouseName}${warehouseCity ? ` (${warehouseCity})` : ''}`
      : ''
    if (title) window.localStorage.setItem('warehouse_title', title)
    if (nextWarehouseId != null) window.localStorage.setItem('warehouse_id', String(nextWarehouseId))
    if (nextAdminId != null) window.localStorage.setItem('admin_id', String(nextAdminId))
    setToken(nextToken)
    setAdminName(name || '')
    setWarehouseTitle(title)
    setWarehouseId(nextWarehouseId != null ? String(nextWarehouseId) : null)
    setAdminId(nextAdminId != null ? String(nextAdminId) : null)
    setWarehouseResolveError('')
  }

  const handleLogout = () => {
    clearAuth()
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'orders', label: 'Orders' },
    { id: 'delivery-partners', label: 'Delivery Partners' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'cod-collections', label: 'COD Collections' },
  ]

  if (!token) {
    return <LoginScreen onLogin={handleLogin} />
  }

  if (resolvingWarehouse && !warehouseId) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginCard}>
          <div className={styles.loadingBlock}>Loading warehouse assignment...</div>
        </div>
      </div>
    )
  }

  if (!warehouseId) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginCard}>
          <div className={styles.formError}>
            {warehouseResolveError
              ? warehouseResolveError
              : 'Your account is not assigned to a warehouse yet. Please ask an admin to set `warehouse_admins.warehouse_id`.'}
          </div>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => setWarehouseResolveTick((tick) => tick + 1)}
          >
            Retry
          </button>
          <button type="button" className={styles.primaryBtn} onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Warehouse Dashboard</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className={styles.dashboardShell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarBrand}>
            <strong>Sewa Bazaar</strong>
            <span>Warehouse Dashboard</span>
          </div>
          <div className={styles.sidebarUser}>
            <span>Signed in as</span>
            <strong>{adminName || 'Warehouse Admin'}</strong>
            {warehouseTitle && <span>{warehouseTitle}</span>}
          </div>
          <nav className={styles.sidebarNav}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`${styles.sidebarLink} ${activeTab === tab.id ? styles.sidebarLinkActive : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>Sign Out</button>
        </aside>

        <main className={styles.mainContent}>
          <div className={styles.topBar}>
            <div>
              <h1>{tabs.find((tab) => tab.id === activeTab)?.label}</h1>
              <p>Warehouse operations for orders, inventory, and delivery partners</p>
            </div>
            <div className={styles.metaText}>
              Realtime: {socketConnected ? 'connected' : 'offline'}
            </div>
          </div>
          <div className={styles.pageBody}>
            {activeTab === 'overview' ? <OverviewPanel token={token} warehouseId={warehouseId} onSwitchTab={setActiveTab} /> : null}
            {activeTab === 'orders' ? <OrdersPanel token={token} warehouseId={warehouseId} notify={setToast} /> : null}
            {activeTab === 'delivery-partners' ? <DeliveryPartnersPanel token={token} warehouseId={warehouseId} notify={setToast} /> : null}
            {activeTab === 'inventory' ? <InventoryPanel token={token} warehouseId={warehouseId} notify={setToast} /> : null}
            {activeTab === 'cod-collections' ? <CodCollectionsPanel token={token} warehouseId={warehouseId} /> : null}
          </div>
        </main>
      </div>

      <Toast message={toast} onClose={() => setToast(null)} />
    </>
  )
}
