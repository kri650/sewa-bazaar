// Simple client-side cart store using localStorage.
// Keeps header count in sync via a custom event.

const CART_KEY = 'sewa_bazaar_cart'

const parseRupees = (price) => {
  if (price == null) return 0
  if (typeof price === 'number') return Number.isFinite(price) ? price : 0
  const cleaned = String(price).replace(/[^\d.]/g, '')
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : 0
}

const readCart = () => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(CART_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeCart = (items) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CART_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent('cart:updated', { detail: { items } }))
}

export const getCartCount = () => {
  const items = readCart()
  return items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
}

export const addToCart = (item, qty = 1) => {
  if (!item) return
  const safeQty = Math.max(1, Number(qty) || 1)
  const cart = readCart()
  const id = item.id ?? item.name ?? item.title ?? `${item.image || ''}-${item.price || ''}`
  const price = parseRupees(item.price ?? item.amount ?? item.rate)

  const existing = cart.find((entry) => entry.id === id)
  if (existing) {
    existing.qty += safeQty
  } else {
    cart.push({
      id,
      name: item.name ?? item.title ?? 'Item',
      price,
      qty: safeQty,
      size: item.size ?? item.unit ?? item.weight ?? '',
      image: item.image ?? '',
    })
  }

  writeCart(cart)
}
