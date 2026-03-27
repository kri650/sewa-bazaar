const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
console.log('[WarehouseAPI] API Base URL:', API)

async function authFetch(path, token, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  const text = await response.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch (_err) {
    data = null
  }

  return { ok: response.ok, status: response.status, data }
}

export async function fetchWarehouseStats(token) {
  return authFetch('/api/warehouse/dashboard-stats', token)
}

export async function fetchWarehouseOrders(token, warehouseId) {
  if (!warehouseId) throw new Error('warehouseId is required')
  return authFetch(`/api/warehouse/orders/${warehouseId}`, token)
}

export async function assignDeliveryPartner(token, { orderId, deliveryPartnerId }) {
  return authFetch('/api/warehouse/assign-delivery', token, {
    method: 'POST',
    body: JSON.stringify({ orderId, deliveryPartnerId }),
  })
}

export async function updateOrderStatus(token, { orderId, status }) {
  return authFetch(`/api/warehouse/orders/${orderId}/status`, token, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  })
}

export async function fetchInventory(token, warehouseId) {
  if (!warehouseId) throw new Error('warehouseId is required')
  return authFetch(`/api/warehouse/inventory/${warehouseId}`, token)
}

export async function fetchDeliveryPartners(token, warehouseId) {
  if (!warehouseId) throw new Error('warehouseId is required')
  return authFetch(`/api/warehouse/delivery-partners/${warehouseId}`, token)
}

export async function fetchLowStock(token) {
  return authFetch('/api/warehouse/low-stock', token)
}
