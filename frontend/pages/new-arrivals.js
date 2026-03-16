import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import ShopLayout from '../components/ShopLayout'
import { useCart } from '../contexts/CartContext'
import { useDelivery } from '../contexts/DeliveryContext'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'

const parseRupees = (price) => {
  if (price == null) return 0
  if (typeof price === 'number') return Number.isFinite(price) ? price : 0
  const cleaned = String(price).replace(/[^\d.]/g, '')
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : 0
}
const formatRupees = (amount) =>
  `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function NewArrivals() {
  const { addToCart } = useCart()
  const { config, getDeliveryInfo, userLocation } = useDelivery()
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [quantities, setQuantities] = useState([])
  const [loading, setLoading] = useState(true)
  const [sewaMinutesMap, setSewaMinutesMap] = useState({}) // { [productId]: true/false }

  useEffect(() => {
    fetch(`${API_BASE}/products`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        if (Array.isArray(data)) {
          const normalized = data.map((p) => ({
            id: String(p.id),
            name: p.name || 'Product',
            price: parseRupees(p.price),
            size: p.unit || '',
            image: p.image || '',
            category: p.category || '',
            description: p.description || '',
            latitude: p.latitude || 0,
            longitude: p.longitude || 0,
            stockQuantity: Number(p.stockQuantity || 0),
            lowStock: Boolean(Number(p.lowStock || 0)),
          }))
          setProducts(normalized)
          setQuantities(normalized.map(() => 1))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!config) return
    if (!Array.isArray(products) || products.length === 0) {
      setSewaMinutesMap({})
      return
    }

    const compute = (uLat, uLng) => {
      const map = {}
      for (const p of products) {
        const info = getDeliveryInfo({
          lat: uLat,
          lng: uLng,
          plat: (p.latitude !== 0 || p.longitude !== 0) ? p.latitude : undefined,
          plng: (p.latitude !== 0 || p.longitude !== 0) ? p.longitude : undefined,
        })
        map[p.id] = Boolean(info?.sewa_minutes_eligible)
      }
      setSewaMinutesMap(map)
    }

    if (userLocation?.lat != null && userLocation?.lng != null) {
      compute(userLocation.lat, userLocation.lng)
      return
    }

    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => compute(pos.coords.latitude, pos.coords.longitude),
      () => {},
      { timeout: 8000, maximumAge: 300000 }
    )
  }, [config, products, userLocation, getDeliveryInfo])

  const changeQty = (index, delta) => {
    setQuantities((prev) => prev.map((q, i) => (i === index ? Math.max(1, q + delta) : q)))
  }

  const handleClick = (item) => {
    router.push({
      pathname: `/product/${item.id}`,
      query: {
        name: item.name,
        price: String(item.price),
        size: item.size,
        image: item.image,
        category: item.category,
        description: item.description,
      },
    })
  }

  return (
    <ShopLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px' }}>
        {/* Breadcrumb */}
        <nav style={{ fontSize: 13, color: '#777', marginBottom: 24 }}>
          <Link href="/" style={{ color: '#4caf50', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 6px' }}>/</span>
          <span style={{ color: '#333', fontWeight: 600 }}>New Arrivals</span>
        </nav>

        {/* Page heading */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#222', margin: 0 }}>New Arrivals</h1>
          <span style={{
            background: '#e53935', color: '#fff', fontSize: 11, fontWeight: 700,
            padding: '3px 10px', borderRadius: 20, letterSpacing: 0.5,
          }}>JUST ADDED</span>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 80, color: '#888', fontSize: 16 }}>
            Loading products…
          </div>
        )}

        {!loading && products.length === 0 && (
          <div style={{
            textAlign: 'center', padding: 80, background: '#fafafa',
            borderRadius: 12, border: '1px dashed #ddd',
          }}>
            <p style={{ fontSize: 18, color: '#aaa', margin: 0 }}>No new arrivals yet.</p>
            <p style={{ fontSize: 14, color: '#bbb', marginTop: 8 }}>Check back soon — the admin adds fresh products regularly.</p>
            <Link href="/" style={{
              display: 'inline-block', marginTop: 20, padding: '10px 24px',
              background: '#4caf50', color: '#fff', borderRadius: 8,
              textDecoration: 'none', fontWeight: 600, fontSize: 14,
            }}>Browse All Products</Link>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 24,
          }}>
            {products.map((item, index) => (
              <article key={item.id} style={{
                background: '#fff', borderRadius: 12,
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                transition: 'transform 0.18s, box-shadow 0.18s',
                cursor: 'pointer',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.13)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)' }}
              >
                {/* Image */}
                <div
                  onClick={() => handleClick(item)}
                  style={{ height: 180, overflow: 'hidden', background: '#f7f7f7', position: 'relative' }}
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      color: '#bbb', fontSize: 13,
                    }}>No image</div>
                  )}
                  {/* NEW badge */}
                  <span style={{
                    position: 'absolute', top: 10, left: 10,
                    background: '#e53935', color: '#fff',
                    fontSize: 10, fontWeight: 700, padding: '2px 8px',
                    borderRadius: 20, letterSpacing: 0.4,
                  }}>NEW</span>
                  {item.lowStock ? (
                    <span style={{
                      position: 'absolute', top: 10, right: 10,
                      background: '#f59e0b', color: '#111827',
                      fontSize: 10, fontWeight: 700, padding: '2px 8px',
                      borderRadius: 20, letterSpacing: 0.4,
                    }}>
                      Low Stock ({item.stockQuantity})
                    </span>
                  ) : null}
                </div>

                {/* Info */}
                <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Sewa Bazaar Minutes badge */}
                  {sewaMinutesMap[item.id] === true && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: 'linear-gradient(90deg, #064e3b, #047857)',
                      color: '#fff', fontSize: 10, fontWeight: 800,
                      padding: '3px 9px', borderRadius: 20,
                      marginBottom: 5, letterSpacing: 0.5, width: 'fit-content',
                    }}>
                      ⚡ Sewa Bazaar Minutes · 10 min
                    </div>
                  )}
                  {item.category && (
                    <span style={{ fontSize: 11, color: '#4caf50', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                      {item.category}
                    </span>
                  )}
                  <p
                    onClick={() => handleClick(item)}
                    style={{ fontSize: 14, fontWeight: 600, color: '#222', margin: '0 0 4px', lineHeight: 1.3 }}
                  >
                    {item.name}
                  </p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#e53935', margin: '0 0 4px' }}>
                    {formatRupees(parseRupees(item.price) * (quantities[index] || 1))}
                  </p>
                  {item.size && (
                    <span style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>{item.size}</span>
                  )}

                  {/* Qty row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' }}>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); changeQty(index, -1) }}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', border: '1.5px solid #4caf50',
                        background: '#fff', color: '#4caf50', fontSize: 16, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                      }}
                    >−</button>
                    <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 600, fontSize: 14 }}>
                      {quantities[index] || 1}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); changeQty(index, 1) }}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', border: '1.5px solid #4caf50',
                        background: '#fff', color: '#4caf50', fontSize: 16, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                      }}
                    >+</button>
                  </div>

                  {/* Add to Cart */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); addToCart(item, quantities[index] || 1) }}
                    style={{
                      marginTop: 'auto', padding: '9px 0', borderRadius: 8,
                      background: 'linear-gradient(135deg, #66bb6a, #43a047)',
                      color: '#fff', border: 'none', fontWeight: 700,
                      fontSize: 13, cursor: 'pointer', letterSpacing: 0.3,
                      transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88' }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                  >
                    Add to Cart
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </ShopLayout>
  )
}
