import { useEffect, useRef, useMemo, useState } from 'react'
import { io } from 'socket.io-client'
import styles from '../styles/admin.module.css'

function DeliveryConfigEditor({ token }) {
  const EMPTY_FORM = {
    id: null, name: '', address: '', city: '', state: '', pincode: '',
    lat: '', lng: '', fast_radius_km: 10, max_radius_km: 50, status: 'active',
  }
  const [form, setForm]             = useState(EMPTY_FORM)
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading]       = useState(false)
  const [editingId, setEditingId]   = useState(null)
  const [msg, setMsg]               = useState({ text: '', type: '' })
  const [errors, setErrors]         = useState({})

  const [viewWarehouse, setViewWarehouse] = useState(null)
  const [viewData, setViewData]           = useState(null)
  const [viewLoading, setViewLoading]     = useState(false)
  const [viewError, setViewError]         = useState('')

  const apiBase   = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'
  const authHdrs  = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }

  // Safe JSON fetch helper: always returns { ok, data, errorMsg }
  async function safeFetch(url, opts = {}) {
    const res = await fetch(url, opts)
    const text = await res.text()
    let data = null
    try {
      data = JSON.parse(text)
    } catch (_) {
      console.error('[DeliveryConfigEditor] Non-JSON response from', url, ':', text.slice(0, 200))
      return { ok: false, data: null, errorMsg: 'Server returned an unexpected response. Check backend is running.' }
    }
    return { ok: res.ok, data, errorMsg: res.ok ? null : (data?.message || data?.error || `Error ${res.status}`) }
  }

  useEffect(() => {
    async function load() {
      const { ok, data, errorMsg } = await safeFetch(`${apiBase}/admin/warehouses`, { headers: authHdrs })
      if (ok && data?.data) {
        const wh = Array.isArray(data.data.warehouses) ? data.data.warehouses : []
        setWarehouses(wh)
        if (!wh.length && data.data.warehouse_lat) {
          setForm(f => ({ ...f, lat: data.data.warehouse_lat, lng: data.data.warehouse_lng, fast_radius_km: data.data.fast_radius_km || 10 }))
        }
      } else if (errorMsg) {
        setMsg({ text: errorMsg, type: 'error' })
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Warehouse name is required'
    if (!form.city.trim()) e.city = 'City is required'
    if (!/^\d{6}$/.test(String(form.pincode))) e.pincode = 'Pincode must be exactly 6 digits'
    if (form.lat === '' || isNaN(Number(form.lat))) e.lat = 'Valid latitude is required'
    else if (Number(form.lat) < -90 || Number(form.lat) > 90) e.lat = 'Latitude must be between -90 and 90'
    if (form.lng === '' || isNaN(Number(form.lng))) e.lng = 'Valid longitude is required'
    else if (Number(form.lng) < -180 || Number(form.lng) > 180) e.lng = 'Longitude must be between -180 and 180'
    if (!form.fast_radius_km || Number(form.fast_radius_km) <= 0) e.fast_radius_km = 'Must be a positive number'
    if (form.max_radius_km !== '' && Number(form.max_radius_km) <= 0) e.max_radius_km = 'Must be a positive number'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setLoading(true); setMsg({ text: '', type: '' })
    const { ok, data, errorMsg } = await safeFetch(`${apiBase}/admin/warehouses`, {
      method: 'POST',
      headers: authHdrs,
      body: JSON.stringify({
        ...form,
        lat: Number(form.lat), lng: Number(form.lng),
        fast_radius_km: Number(form.fast_radius_km),
        max_radius_km: Number(form.max_radius_km) || 50,
      }),
    })
    if (ok && data?.data) {
      setWarehouses(data.data.warehouses)
      setMsg({ text: data.message || (editingId ? '✓ Warehouse updated successfully' : '✓ Warehouse added successfully'), type: 'success' })
      setForm(EMPTY_FORM); setEditingId(null); setErrors({})
    } else {
      setMsg({ text: 'Error: ' + (errorMsg || 'Could not save'), type: 'error' })
    }
    setLoading(false)
  }

  const handleEdit = (w) => {
    setForm({ id: w.id, name: w.name, address: w.address || '', city: w.city, state: w.state || '',
      pincode: w.pincode, lat: w.lat, lng: w.lng, fast_radius_km: w.fast_radius_km,
      max_radius_km: w.max_radius_km || 50, status: w.status })
    setEditingId(w.id); setErrors({}); setMsg({ text: '', type: '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleView = async (w) => {
    setViewWarehouse(w)
    setViewData(null)
    setViewError('')
    setViewLoading(true)
    const { ok, data, errorMsg } = await safeFetch(`${apiBase}/admin/warehouses/${encodeURIComponent(w.id)}/snapshot`, {
      headers: authHdrs,
    })
    if (ok) {
      setViewData(data)
    } else {
      setViewError(errorMsg || 'Failed to load warehouse snapshot')
    }
    setViewLoading(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this warehouse?')) return
    const { ok, data, errorMsg } = await safeFetch(`${apiBase}/admin/warehouses/${encodeURIComponent(id)}`, {
      method: 'DELETE', headers: authHdrs,
    })
    if (ok && data?.data) {
      setWarehouses(data.data.warehouses)
      setMsg({ text: data.message || '✓ Warehouse deleted', type: 'success' })
      if (editingId === id) { setForm(EMPTY_FORM); setEditingId(null) }
    } else {
      setMsg({ text: 'Error: ' + (errorMsg || 'Could not delete'), type: 'error' })
    }
  }

  const cancelEdit = () => { setForm(EMPTY_FORM); setEditingId(null); setErrors({}); setMsg({ text: '', type: '' }) }

  const primaryWh  = warehouses.find(w => w.status === 'active') || warehouses[0]
  const previewR   = primaryWh ? Number(primaryWh.fast_radius_km) : Number(form.fast_radius_km) || 10
  const etaPreview = `Within ${previewR} km → Delivered in 20–40 min  |  Beyond ${previewR} km → Estimated 1–3 hrs`

  // Reusable style tokens
  const inp  = { padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, width: '100%', boxSizing: 'border-box' }
  const errI = { ...inp, borderColor: '#ef4444' }
  const lbl  = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600, color: '#374151' }
  const errT = { color: '#ef4444', fontSize: 12, marginTop: 2 }

  return (
    <div>
      {/* ── Notification banner ── */}
      {msg.text && (
        <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600,
          background: msg.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: msg.type === 'success' ? '#16a34a' : '#b91c1c',
          border: `1px solid ${msg.type === 'success' ? '#86efac' : '#fca5a5'}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {msg.text}
          <button onClick={() => setMsg({ text: '', type: '' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1, color: 'inherit', padding: '0 4px' }}>×</button>
        </div>
      )}

      {/* ── Warehouse Form ── */}
      <form onSubmit={handleSubmit}>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
              🏭 {editingId ? 'Edit Warehouse' : 'Add New Warehouse'}
            </h3>
            {editingId && (
              <button type="button" onClick={cancelEdit}
                style={{ background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer', color: '#374151' }}>
                Cancel Edit
              </button>
            )}
          </div>

          {/* Section 1 – Warehouse Location */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b',
              marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #e2e8f0' }}>
              📍 Warehouse Location
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
              <label style={{ ...lbl, gridColumn: 'span 2' }}>
                Warehouse Name *
                <input style={errors.name ? errI : inp} value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Main Warehouse – Kanpur" />
                {errors.name && <span style={errT}>{errors.name}</span>}
              </label>
              <label style={{ ...lbl, gridColumn: 'span 2' }}>
                Address
                <input style={inp} value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Street / Area" />
              </label>
              <label style={lbl}>
                City *
                <input style={errors.city ? errI : inp} value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="e.g. Kanpur" />
                {errors.city && <span style={errT}>{errors.city}</span>}
              </label>
              <label style={lbl}>
                State
                <input style={inp} value={form.state}
                  onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                  placeholder="e.g. Uttar Pradesh" />
              </label>
              <label style={lbl}>
                Pincode *
                <input style={errors.pincode ? errI : inp} value={form.pincode}
                  onChange={e => setForm(f => ({ ...f, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                  placeholder="208001" maxLength={6} />
                {errors.pincode && <span style={errT}>{errors.pincode}</span>}
              </label>
              <label style={lbl}>
                Latitude *
                <input type="number" step="0.0001" style={errors.lat ? errI : inp} value={form.lat}
                  onChange={e => setForm(f => ({ ...f, lat: e.target.value }))}
                  placeholder="26.4499" />
                {errors.lat && <span style={errT}>{errors.lat}</span>}
              </label>
              <label style={lbl}>
                Longitude *
                <input type="number" step="0.0001" style={errors.lng ? errI : inp} value={form.lng}
                  onChange={e => setForm(f => ({ ...f, lng: e.target.value }))}
                  placeholder="80.3319" />
                {errors.lng && <span style={errT}>{errors.lng}</span>}
              </label>
            </div>
          </div>

          {/* Section 2 – Delivery Settings */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b',
              marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #e2e8f0' }}>
              🚀 Delivery Settings
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
              <label style={lbl}>
                Fast Delivery Radius (km) *
                <input type="number" step="0.5" min="1" style={errors.fast_radius_km ? errI : inp}
                  value={form.fast_radius_km}
                  onChange={e => setForm(f => ({ ...f, fast_radius_km: e.target.value }))}
                  placeholder="10" />
                {errors.fast_radius_km && <span style={errT}>{errors.fast_radius_km}</span>}
              </label>
              <label style={lbl}>
                Max Delivery Radius (km)
                <input type="number" step="1" min="1" style={errors.max_radius_km ? errI : inp}
                  value={form.max_radius_km}
                  onChange={e => setForm(f => ({ ...f, max_radius_km: e.target.value }))}
                  placeholder="50" />
                {errors.max_radius_km && <span style={errT}>{errors.max_radius_km}</span>}
              </label>
              <label style={lbl}>
                Warehouse Status
                <select style={inp} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>
          </div>

          <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
            <button type="submit" disabled={loading}
              style={{ padding: '9px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8,
                fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Saving…' : editingId ? '✓ Update Warehouse' : '+ Add Warehouse'}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit}
                style={{ padding: '9px 24px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db',
                  borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>

      {/* ── ETA Preview ── */}
      <div style={{ marginBottom: 20, fontSize: 13, color: '#2563eb', background: '#eff6ff',
        padding: '10px 14px', borderRadius: 8, border: '1px solid #bfdbfe' }}>
        <strong>ETA Preview:</strong> {etaPreview}
      </div>

      {/* ── Warehouse List ── */}
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: '0 0 12px' }}>
          All Warehouses ({warehouses.length})
        </h3>
        {warehouses.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: 32,
            background: '#f9fafb', borderRadius: 8, border: '1px dashed #d1d5db' }}>
            No warehouses configured yet. Add one above.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  {['Warehouse Name', 'City', 'Pincode', 'Fast Radius', 'Max Radius', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700,
                      color: '#475569', whiteSpace: 'nowrap', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {warehouses.map((w, i) => (
                  <tr key={w.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 ? '#fafafa' : '#fff' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{w.name}</td>
                    <td style={{ padding: '10px 12px' }}>{w.city}</td>
                    <td style={{ padding: '10px 12px' }}>{w.pincode}</td>
                    <td style={{ padding: '10px 12px' }}>{w.fast_radius_km} km</td>
                    <td style={{ padding: '10px 12px' }}>{w.max_radius_km || 50} km</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                        background: w.status === 'active' ? '#dcfce7' : '#f3f4f6',
                        color: w.status === 'active' ? '#15803d' : '#6b7280' }}>
                        {w.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleEdit(w)}
                          style={{ padding: '4px 12px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                            borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          Edit
                        </button>
                        <button onClick={() => handleView(w)}
                          style={{ padding: '4px 12px', background: '#ecfdf5', color: '#16a34a', border: '1px solid #bbf7d0',
                            borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          View
                        </button>
                        <button onClick={() => handleDelete(w.id)}
                          style={{ padding: '4px 12px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5',
                            borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {viewWarehouse && (
        <div style={{ marginTop: 24, padding: 20, borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>
              📊 Warehouse Snapshot — {viewWarehouse.name} ({viewWarehouse.city})
            </h3>
            <button
              type="button"
              onClick={() => { setViewWarehouse(null); setViewData(null); setViewError('') }}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18 }}
            >
              ×
            </button>
          </div>
          {viewLoading && <p style={{ fontSize: 13, color: '#6b7280' }}>Loading snapshot…</p>}
          {viewError && <p style={{ fontSize: 13, color: '#b91c1c' }}>{viewError}</p>}
          {viewData && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1.8fr)', gap: 18, marginTop: 4 }}>
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10, marginBottom: 12 }}>
                  <StatTile label="Total Orders" value={viewData.overview?.totalOrders ?? 0} />
                  <StatTile label="Pending" value={viewData.overview?.pendingOrders ?? 0} />
                  <StatTile label="Delivered" value={viewData.overview?.deliveredOrders ?? 0} />
                  <StatTile label="Unassigned" value={viewData.overview?.unassignedOrders ?? 0} />
                  <StatTile label="Inventory Products" value={viewData.overview?.productsInInventory ?? 0} />
                  <StatTile label="Revenue" value={`₹${Number(viewData.overview?.totalRevenue || 0).toLocaleString('en-IN')}`} />
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  Showing live data from warehouse dashboard — orders, inventory and COD collections for this warehouse only.
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <h4 style={{ margin: '0 0 6px', fontSize: 13 }}>Recent Orders</h4>
                  <div style={{ maxHeight: 180, overflowY: 'auto', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          <th style={{ padding: '6px 8px', textAlign: 'left' }}>ID</th>
                          <th style={{ padding: '6px 8px', textAlign: 'left' }}>Customer</th>
                          <th style={{ padding: '6px 8px', textAlign: 'left' }}>Total</th>
                          <th style={{ padding: '6px 8px', textAlign: 'left' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(viewData.orders || []).slice(0, 6).map((o) => (
                          <tr key={o.id}>
                            <td style={{ padding: '6px 8px' }}>#{o.id}</td>
                            <td style={{ padding: '6px 8px' }}>{o.customerName || '—'}</td>
                            <td style={{ padding: '6px 8px' }}>₹{Number(o.total || 0).toLocaleString('en-IN')}</td>
                            <td style={{ padding: '6px 8px' }}>{o.status}</td>
                          </tr>
                        ))}
                        {(!viewData.orders || viewData.orders.length === 0) && (
                          <tr><td colSpan={4} style={{ padding: 10, textAlign: 'center', color: '#9ca3af' }}>No orders yet</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,1.1fr)', gap: 10 }}>
                  <div>
                    <h4 style={{ margin: '0 0 6px', fontSize: 13 }}>Inventory (categories)</h4>
                    <div style={{ maxHeight: 120, overflowY: 'auto', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', padding: 8 }}>
                      {(viewData.inventory || []).length === 0 && (
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>No inventory configured.</div>
                      )}
                      {(viewData.inventory || []).map((g) => (
                        <div key={g.categoryId || g.categoryName} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span>{g.categoryName || 'Uncategorized'}</span>
                          <span>{(g.products || []).length} items</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 6px', fontSize: 13 }}>Recent COD Collections</h4>
                    <div style={{ maxHeight: 120, overflowY: 'auto', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', padding: 8 }}>
                      {(viewData.codCollections || []).slice(0, 5).map((c) => (
                        <div key={c.id} style={{ fontSize: 12, marginBottom: 4 }}>
                          <div>Order #{c.orderId} — ₹{Number(c.amount || 0).toLocaleString('en-IN')}</div>
                          <div style={{ color: '#6b7280' }}>{c.status}</div>
                        </div>
                      ))}
                      {(!viewData.codCollections || viewData.codCollections.length === 0) && (
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>No COD records yet.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

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

function StatTile({ label, value }) {
  return (
    <div style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff' }}>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{value}</div>
    </div>
  )
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

  // Warehouse admin management state (super admin)
  const [warehouseAdmins, setWarehouseAdmins] = useState([])
  const [warehousesForAdmins, setWarehousesForAdmins] = useState([])
  const [waForm, setWaForm] = useState({ name: '', email: '', password: '', warehouse_id: '' })
  const [waLoading, setWaLoading] = useState(false)

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
      const [oR, uR, pR, dR, waR, whR] = await Promise.all([
        fetch(`${API_BASE}/admin/orders`,           { headers: authHeaders }),
        fetch(`${API_BASE}/admin/users`,            { headers: authHeaders }),
        fetch(`${API_BASE}/admin/products`,         { headers: authHeaders }),
        fetch(`${API_BASE}/admin/delivery-boys`,    { headers: authHeaders }),
        fetch(`${API_BASE}/admin/warehouse-admins`, { headers: authHeaders }),
        fetch(`${API_BASE}/admin/warehouses`,       { headers: authHeaders }),
      ])
      const [o, u, p, d, wa, wh] = await Promise.all([oR.json(), uR.json(), pR.json(), dR.json(), waR.json(), whR.json()])
      setOrders(Array.isArray(o) ? o : [])
      setUsers(Array.isArray(u) ? u : [])
      setProducts(Array.isArray(p) ? p : [])
      setDeliveryBoys(Array.isArray(d) ? d : [])
      setWarehouseAdmins(Array.isArray(wa) ? wa : [])
      const whList = wh?.data?.warehouses || []
      setWarehousesForAdmins(Array.isArray(whList) ? whList : [])
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

  const handleCreateWarehouseAdmin = async (e) => {
    e.preventDefault()
    if (!waForm.name || !waForm.email || !waForm.password) {
      flash('Name, email and password are required for warehouse admin.', true)
      return
    }
    setWaLoading(true)
    try {
      const r = await fetch(`${API_BASE}/admin/warehouse-admins`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: waForm.name.trim(),
          email: waForm.email.trim(),
          password: waForm.password,
          warehouse_id: waForm.warehouse_id ? Number(waForm.warehouse_id) : null,
        }),
      })
      const d = await r.json()
      if (!r.ok) {
        flash(d?.error || 'Failed to create warehouse admin.', true)
        return
      }
      flash('Warehouse admin created!')
      setWaForm({ name: '', email: '', password: '', warehouse_id: '' })
      await loadData()
    } catch (err) {
      flash(err.message || 'Failed to create warehouse admin.', true)
    } finally {
      setWaLoading(false)
    }
  }

  const handleAssignWarehouseToAdmin = async (id, warehouseId) => {
    if (!id || !warehouseId) return
    try {
      const r = await fetch(`${API_BASE}/admin/warehouse-admins/${id}/assign`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ warehouse_id: Number(warehouseId) }),
      })
      const d = await r.json()
      if (!r.ok) {
        flash(d?.error || 'Failed to assign warehouse.', true)
        return
      }
      flash('Warehouse assignment updated.')
      setWarehouseAdmins(prev => prev.map(a => (a.id === id ? { ...a, warehouseId: Number(warehouseId) } : a)))
    } catch (err) {
      flash(err.message || 'Failed to assign warehouse.', true)
    }
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
  { id: 'overview',         label: 'Overview' },
  { id: 'orders',           label: `Orders (${orders.length})` },
  { id: 'products',         label: `Products (${products.length})` },
  { id: 'users',            label: `Users (${users.length})` },
  { id: 'delivery',         label: `Delivery Partners (${deliveryBoys.length})` },
  { id: 'delivery-config',  label: 'Delivery Configuration' },
  { id: 'warehouse-admins', label: 'Warehouse Admins' },
  { id: 'notifications',    label: `Notifications${notifications.length > 0 ? ` (${notifications.length})` : ''}` },
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
  <button className={styles.logoutBtn} onClick={logout}>Logout</button>
      </aside>

      {/* Main content */}
      <main className={styles.dashMain}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <h1 className={styles.pageTitle}>{tabs.find(t => t.id === activeTab)?.label}</h1>
          <button className={styles.refreshBtn} onClick={loadData}>Refresh</button>
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
            <span style={{fontSize:24}} aria-hidden="true"></span>
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
                <span className={styles.statIcon} aria-hidden="true"></span>
                <div><div className={styles.statNum}>{orders.length}</div><div className={styles.statLabel}>Total Orders</div></div>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statIcon} aria-hidden="true"></span>
                <div><div className={styles.statNum}>{pendingOrders}</div><div className={styles.statLabel}>Pending Orders</div></div>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statIcon} aria-hidden="true"></span>
                <div><div className={styles.statNum}>{deliveredOrders}</div><div className={styles.statLabel}>Delivered</div></div>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statIcon} aria-hidden="true"></span>
                <div><div className={styles.statNum}>₹{totalRevenue.toLocaleString('en-IN')}</div><div className={styles.statLabel}>Total Revenue</div></div>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statIcon} aria-hidden="true"></span>
                <div><div className={styles.statNum}>{users.length}</div><div className={styles.statLabel}>Registered Users</div></div>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statIcon} aria-hidden="true"></span>
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

            {/* Delivery Config quick-link */}
            <div className={styles.card} style={{ marginTop: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <h2 className={styles.cardTitle} style={{ margin: 0 }}>Delivery Configuration</h2>
                <button
                  onClick={() => setActiveTab('delivery-config')}
                  style={{ padding: '6px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  Manage →
                </button>
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: '#6b7280' }}>
                Configure warehouse locations, delivery zones, and ETA settings.
              </p>
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
                  <h2 style={{marginBottom:16}}>Edit Product</h2>
                  <form onSubmit={handleUpdateProduct} className={styles.productForm}>
                    <label>Name *<input value={editingProduct.name} onChange={e => setEditingProduct(p => ({...p, name: e.target.value}))} required /></label>
                    <label>Price (₹) *<input type="number" step="0.01" min="0" value={editingProduct.price} onChange={e => setEditingProduct(p => ({...p, price: e.target.value}))} required /></label>
                    <label>Unit<input value={editingProduct.unit || ''} onChange={e => setEditingProduct(p => ({...p, unit: e.target.value}))} placeholder="kg / piece / bunch" /></label>
                    <label>Image URL<input value={editingProduct.image || ''} onChange={e => setEditingProduct(p => ({...p, image: e.target.value}))} /></label>
                    <label>Category ID<input value={editingProduct.categoryId || ''} onChange={e => setEditingProduct(p => ({...p, categoryId: e.target.value}))} /></label>
                    <label>Description<textarea value={editingProduct.description || ''} onChange={e => setEditingProduct(p => ({...p, description: e.target.value}))} /></label>
                    <div style={{display:'flex',gap:10,marginTop:8}}>
                      <button type="submit" className={styles.addBtn} style={{flex:1}}>Save Changes</button>
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
                        <td>{p.isActive ? 'Active' : 'Inactive'}</td>
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
              <h2 className={styles.cardTitle}>Add Delivery Partner</h2>
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

        {/* ── DELIVERY CONFIGURATION ── */}
        {activeTab === 'delivery-config' && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Delivery Configuration &amp; Warehouse Management</h2>
            <DeliveryConfigEditor token={token} />
          </div>
        )}

        {/* ── WAREHOUSE ADMINS ── */}
        {activeTab === 'warehouse-admins' && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Warehouse Admins</h2>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              Create admin accounts for each warehouse. When a warehouse admin logs in, their assigned warehouse dashboard will open automatically.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1.3fr) minmax(260px, 2fr)', gap: 24, marginTop: 20 }}>
              {/* Create form */}
              <form
                onSubmit={handleCreateWarehouseAdmin}
                className={styles.productForm}
                style={{ background: '#f9fafb', padding: 16, borderRadius: 10, border: '1px solid #e5e7eb' }}
              >
                <h3 style={{ marginTop: 0, marginBottom: 10, fontSize: 14 }}>Create Warehouse Admin</h3>
                <label>
                  Name *
                  <input
                    value={waForm.name}
                    onChange={(e) => setWaForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Warehouse Manager"
                    required
                  />
                </label>
                <label>
                  Email *
                  <input
                    type="email"
                    value={waForm.email}
                    onChange={(e) => setWaForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="admin@example.com"
                    required
                  />
                </label>
                <label>
                  Password *
                  <input
                    type="password"
                    value={waForm.password}
                    onChange={(e) => setWaForm((p) => ({ ...p, password: e.target.value }))}
                    placeholder="Set a password"
                    required
                  />
                </label>
                <label>
                  Assign Warehouse (optional)
                  <select
                    value={waForm.warehouse_id}
                    onChange={(e) => setWaForm((p) => ({ ...p, warehouse_id: e.target.value }))}
                  >
                    <option value="">Select warehouse…</option>
                    {warehousesForAdmins.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.city})
                      </option>
                    ))}
                  </select>
                </label>
                <button type="submit" className={styles.addBtn} disabled={waLoading}>
                  {waLoading ? 'Creating…' : '+ Create Warehouse Admin'}
                </button>
              </form>

              {/* List */}
              <div>
                <h3 style={{ marginTop: 0, marginBottom: 10, fontSize: 14 }}>
                  Existing Warehouse Admins ({warehouseAdmins.length})
                </h3>
                {warehouseAdmins.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      color: '#9ca3af',
                      padding: 24,
                      borderRadius: 8,
                      border: '1px dashed #e5e7eb',
                      background: '#f9fafb',
                    }}
                  >
                    No warehouse admins yet. Create one using the form.
                  </div>
                ) : (
                  <div className={styles.tableWrap}>
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Warehouse</th>
                          <th>Assign Warehouse</th>
                        </tr>
                      </thead>
                      <tbody>
                        {warehouseAdmins.map((a) => (
                          <tr key={a.id}>
                            <td>{a.id}</td>
                            <td>{a.name}</td>
                            <td>{a.email}</td>
                            <td>
                              {a.warehouseName ? (
                                `${a.warehouseName}${a.warehouseCity ? ` (${a.warehouseCity})` : ''}`
                              ) : (
                                <span style={{ color: '#f97316' }}>Not assigned</span>
                              )}
                            </td>
                            <td>
                              <select
                                className={styles.statusSelect}
                                value={a.warehouseId || ''}
                                onChange={(e) => handleAssignWarehouseToAdmin(a.id, e.target.value)}
                              >
                                <option value="">Select…</option>
                                {warehousesForAdmins.map((w) => (
                                  <option key={w.id} value={w.id}>
                                    {w.name} ({w.city})
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {activeTab === 'notifications' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Real-time Order Notifications</h2>
                <button className={styles.refreshBtn} onClick={() => setNotifications([])}>Clear All</button>
              </div>
              {notifications.length === 0 ? (
                <div style={{textAlign:'center',color:'#aaa',padding:48}}>
                  <div style={{fontSize:48}} aria-hidden="true"></div>
                  <p>No notifications yet.<br/>New orders will appear here in real-time via WebSocket.</p>
                </div>
              ) : (
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {notifications.map(n => (
                  <div key={n.id} style={{background:'#f0fdf4',border:'1px solid #86efac',borderRadius:10,padding:'14px 20px',display:'flex',alignItems:'center',gap:16}}>
                    <span style={{fontSize:28}} aria-hidden="true"></span>
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
