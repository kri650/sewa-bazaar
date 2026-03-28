import { useRouter } from 'next/router'
import { useState, useMemo, useEffect } from 'react'
import { useCart } from '../contexts/CartContext'
import { useDelivery } from '../contexts/DeliveryContext'
import ProductCard from './ProductCard'
import FilterBar from './FilterBar'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
console.log('[CategoryPage] API Base URL:', API_BASE)

const parseRupees = (price) => Number(String(price ?? '').replace(/[^\d.]/g, '')) || 0
const formatRupees = (amount) =>
  `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const normalizeProductName = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const normalizeCategoryName = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const canonicalCategoryName = (value) =>
  normalizeCategoryName(value)
    .replace(/\band\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const CATEGORY_ALIASES = {
  'best deal': ['best deals'],
  'best deals': ['best deal'],
  'fruits and vegetables': ['fruits vegetables'],
  'fruits vegetables': ['fruits and vegetables'],
  'soap and detergents': ['cleaning'],
  'chips and biscuits': ['snacks'],
  'pooja essentials': ['pooja'],
  'dry fruits and nuts': ['dry fruits'],
}

function categoryMatches(pageCategory, productCategory) {
  const a = normalizeCategoryName(pageCategory)
  const b = normalizeCategoryName(productCategory)
  if (!a || !b) return false
  if (a === b) return true

  const canonicalA = canonicalCategoryName(a)
  const canonicalB = canonicalCategoryName(b)
  if (canonicalA && canonicalA === canonicalB) return true

  const aCandidates = new Set([a, ...(CATEGORY_ALIASES[a] || [])])
  const bCandidates = new Set([b, ...(CATEGORY_ALIASES[b] || [])])

  if (canonicalA) aCandidates.add(canonicalA)
  if (canonicalB) bCandidates.add(canonicalB)

  for (const candidate of aCandidates) {
    if (bCandidates.has(candidate)) return true
  }
  return false
}

export default function CategoryPage({
  title,
  description,
  category,
  products,
  getRouteId,
}) {
  const router = useRouter()
  const { addToCart } = useCart()
  const { userLocation, deliveryType, estimatedTime } = useDelivery()

  // Build delivery badge shown on every card when location is known
  const deliveryBadge = useMemo(() => {
    if (!userLocation || !deliveryType) return null
    if (deliveryType === 'fast') return `Delivery in ${estimatedTime}`
    return `Delivery ${estimatedTime}`
  }, [userLocation, deliveryType, estimatedTime])
  const [quantities, setQuantities] = useState({})
  const [stockMetaByName, setStockMetaByName] = useState({})
  const [liveProducts, setLiveProducts] = useState([])
  const [filters, setFilters] = useState({
    sort: 'popularity',
    rating: null,
    priceRange: 'all'
  })
  const [requestProduct, setRequestProduct] = useState(null)
  const [requestForm, setRequestForm] = useState({ userName: '', phone: '' })
  const [requestSubmitting, setRequestSubmitting] = useState(false)
  const [requestMessage, setRequestMessage] = useState('')

  const mergedProducts = useMemo(() => {
    const staticList = Array.isArray(products) ? products : []
    const liveList = Array.isArray(liveProducts)
      ? liveProducts.filter((product) => categoryMatches(category, product.category))
      : []

    const merged = [...staticList]
    const indexByName = new Map()
    merged.forEach((product, index) => {
      const key = normalizeProductName(product.name)
      if (key) indexByName.set(key, index)
    })

    for (const product of liveList) {
      const key = normalizeProductName(product.name)
      if (!key) continue
      const quantityValue =
        product.quantity === undefined || product.quantity === null || product.quantity === ''
          ? null
          : Number(product.quantity)
      const normalizedQuantity = Number.isFinite(quantityValue) ? quantityValue : null
      const liveNormalized = {
        id: String(product.id),
        name: product.name,
        price: Number(product.price || 0),
        size: normalizedQuantity ? `${normalizedQuantity} ${product.unit || ''}`.trim() : (product.unit || ''),
        quantity: normalizedQuantity,
        unit: product.unit || '',
        discountType: product.discountType || product.discount_type || 'none',
        discountValue: product.discountValue ?? product.discount_value ?? 0,
        isFlashSale: product.isFlashSale ?? product.is_flash_sale ?? false,
        flashSalePrice: product.flashSalePrice ?? product.flash_sale_price ?? null,
        flashSaleEndTime: product.flashSaleEndTime ?? product.flash_sale_end_time ?? null,
        image: product.image || '',
        category: product.category || category || '',
        description: product.description || '',
        lowStock: Boolean(Number(product.lowStock || 0)),
        stockQuantity: Number(product.stockQuantity || 0),
      }

      if (indexByName.has(key)) {
        const index = indexByName.get(key)
        merged[index] = {
          ...merged[index],
          ...liveNormalized,
        }
      } else {
        indexByName.set(key, merged.length)
        merged.push(liveNormalized)
      }
    }

    return merged
  }, [products, liveProducts, category])

  useEffect(() => {
    const next = {}
    mergedProducts.forEach((product) => {
      const key = getRouteId ? getRouteId(product) : String(product.id)
      next[key] = quantities[key] || 1
    })
    setQuantities(next)
  }, [mergedProducts])

  useEffect(() => {
    let cancelled = false

    fetch(`${API_BASE}/products`)
      .then((response) => (response.ok ? response.json() : []))
      .then((rows) => {
        if (cancelled || !Array.isArray(rows)) return
        const next = {}
        rows.forEach((row) => {
          const key = normalizeProductName(row?.name)
          if (!key) return
          next[key] = {
            stockQuantity: Number(row?.stockQuantity || 0),
            lowStock: Boolean(Number(row?.lowStock || 0)),
          }
        })
        setStockMetaByName(next)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    fetch(`${API_BASE}/products`)
      .then((response) => (response.ok ? response.json() : []))
      .then((rows) => {
        if (cancelled || !Array.isArray(rows)) return
        setLiveProducts(rows)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  const changeQty = (key, delta) => {
    setQuantities((prev) => ({
      ...prev,
      [key]: Math.max(1, (prev[key] || 1) + delta),
    }))
  }

  const openRequestModal = (product) => {
    if (!product) return
    setRequestProduct({
      id: product.id,
      name: product.name,
    })
    setRequestForm({ userName: '', phone: '' })
    setRequestMessage('')
  }

  const closeRequestModal = () => {
    setRequestProduct(null)
    setRequestSubmitting(false)
    setRequestMessage('')
  }

  const submitRequestProduct = async (e) => {
    e.preventDefault()
    if (!requestProduct) return

    const userName = String(requestForm.userName || '').trim()
    const phone = String(requestForm.phone || '').replace(/\D/g, '')

    if (!userName || !/^\d{10}$/.test(phone)) {
      setRequestMessage('Please enter your name and a valid 10-digit phone number.')
      return
    }

    setRequestSubmitting(true)
    setRequestMessage('')
    try {
      const res = await fetch(`${API_BASE}/api/request-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: Number(requestProduct.id) || null,
          productName: requestProduct.name,
          userName,
          phone,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setRequestMessage(data?.error || 'Could not submit your request. Please try again.')
        return
      }

      setRequestMessage('Request submitted successfully. We will notify you when it is available.')
      setTimeout(() => {
        closeRequestModal()
      }, 1200)
    } catch (_err) {
      setRequestMessage('Could not submit your request. Please try again.')
    } finally {
      setRequestSubmitting(false)
    }
  }

  const handleProductClick = (product, routeId) => {
    const normalizedPrice = parseRupees(product.price)
    const normalizedSize = product.size || product.unit || ''
    router.push({
      pathname: `/product/${routeId}`,
      query: {
        name: product.name || '',
        price: String(normalizedPrice),
        size: normalizedSize,
        image: product.image || '',
        category: category || '',
      },
    })
  }

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...mergedProducts]

    // Apply price range filter
    if (filters.priceRange !== 'all') {
      result = result.filter(product => {
        const price = parseRupees(product.price)
        switch (filters.priceRange) {
          case '0-50': return price < 50
          case '50-100': return price >= 50 && price < 100
          case '100-200': return price >= 100 && price < 200
          case '200+': return price >= 200
          default: return true
        }
      })
    }

    // Apply rating filter (mock - you can add real ratings to products later)
    if (filters.rating) {
      // For now, this is a placeholder - add rating property to products
      result = result.filter(product => (product.rating || 4) >= filters.rating)
    }

    // Apply sorting
    switch (filters.sort) {
      case 'price-low':
        result.sort((a, b) => parseRupees(a.price) - parseRupees(b.price))
        break
      case 'price-high':
        result.sort((a, b) => parseRupees(b.price) - parseRupees(a.price))
        break
      case 'discount':
        result.sort((a, b) => {
          const getDiscount = (p) => {
            if (p.discount) return parseFloat(p.discount)
            return 0
          }
          return getDiscount(b) - getDiscount(a)
        })
        break
      case 'popularity':
      default:
        // Keep original order for popularity (most purchased)
        break
    }

    return result
  }, [mergedProducts, filters])

  return (
    <main className="categoryMain">
      <div className="categoryInner">
        <header className="categoryHeader">
          <h1 className="categoryTitle">{title}</h1>
          {description ? <p className="categoryDescription">{description}</p> : null}
        </header>

        <div className="categoryContent">
          <FilterBar onFilterChange={setFilters} />
          
          <div className="productGrid categoryProductGrid">
            {filteredProducts.map((product) => {
              const routeId = getRouteId ? getRouteId(product) : String(product.id)
              const qty = quantities[routeId] || 1
              const normalizedPrice = parseRupees(product.price)
              const normalizedSize = product.quantity ? `${product.quantity} ${product.unit || ''}`.trim() : (product.size || product.unit || '')
              const stockMeta = stockMetaByName[normalizeProductName(product.name)]
              const hasStockQuantity =
                (product.stockQuantity !== undefined && product.stockQuantity !== null) ||
                (stockMeta?.stockQuantity !== undefined && stockMeta?.stockQuantity !== null)
              const stockQuantity = hasStockQuantity
                ? Number(product.stockQuantity ?? stockMeta?.stockQuantity ?? 0)
                : null
              const lowStockNote = (product.lowStock || stockMeta?.lowStock)
                ? `Low stock${(product.stockQuantity || stockMeta?.stockQuantity || 0) > 0 ? ` (${product.stockQuantity || stockMeta?.stockQuantity || 0} left)` : ''}`
                : undefined

              // Debug: Log product data to verify quantity exists
              console.log('[CategoryPage] Product data:', { 
                name: product.name, 
                quantity: product.quantity, 
                unit: product.unit, 
                normalizedSize 
              })

              return (
                <ProductCard
                  key={routeId}
                  id={product.id ?? routeId}
                  name={product.name}
                  price={normalizedPrice}
                  isFlashSale={product.isFlashSale}
                  flashSalePrice={product.flashSalePrice}
                  flashSaleEndTime={product.flashSaleEndTime}
                  originalPrice={product.originalPrice}
                  discount={product.discount}
                  discountType={product.discountType}
                  discountValue={product.discountValue}
                  description={product.description}
                  size={normalizedSize}
                  image={product.image}
                  badge={deliveryBadge || product.badge || undefined}
                  note={lowStockNote}
                  stockQuantity={stockQuantity}
                  showQty={true}
                  qty={qty}
                  onQtyChange={(delta) => changeQty(routeId, delta)}
                  onAdd={() => addToCart({ ...product, price: normalizedPrice, size: normalizedSize }, qty)}
                  onRequestProduct={() => openRequestModal(product)}
                  onClick={() => handleProductClick(product, routeId)}
                />
              )
            })}
          </div>
        </div>
      </div>

      {requestProduct && (
        <div className="requestModalOverlay" role="dialog" aria-modal="true">
          <div className="requestModalCard">
            <h3>Request Product</h3>
            <p className="requestModalSub">{requestProduct.name}</p>
            <form onSubmit={submitRequestProduct}>
              <label>
                Name
                <input
                  type="text"
                  value={requestForm.userName}
                  onChange={(e) => setRequestForm((prev) => ({ ...prev, userName: e.target.value }))}
                  placeholder="Enter your name"
                  required
                />
              </label>
              <label>
                Phone
                <input
                  type="tel"
                  value={requestForm.phone}
                  onChange={(e) => setRequestForm((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  placeholder="10-digit phone number"
                  required
                />
              </label>
              {requestMessage ? <p className="requestModalMsg">{requestMessage}</p> : null}
              <div className="requestModalActions">
                <button type="button" className="requestCancelBtn" onClick={closeRequestModal} disabled={requestSubmitting}>Cancel</button>
                <button type="submit" className="requestSubmitBtn" disabled={requestSubmitting}>
                  {requestSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .categoryContent {
          display: grid;
          grid-template-columns: 230px 1fr;
          gap: 15px;
          margin-top: 20px;
          align-items: start;
        }

        @media (max-width: 968px) {
          .categoryContent {
            grid-template-columns: 1fr;
          }
        }

        .requestModalOverlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 1000;
        }

        .requestModalCard {
          width: 100%;
          max-width: 420px;
          background: #fff;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.2);
        }

        .requestModalCard h3 {
          margin: 0 0 6px;
          font-size: 20px;
          color: #1f2937;
        }

        .requestModalSub {
          margin: 0 0 14px;
          color: #6b7280;
          font-size: 14px;
        }

        .requestModalCard label {
          display: block;
          margin-bottom: 12px;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }

        .requestModalCard input {
          display: block;
          width: 100%;
          margin-top: 6px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
        }

        .requestModalCard input:focus {
          border-color: #16a34a;
        }

        .requestModalMsg {
          margin: 0 0 12px;
          font-size: 13px;
          color: #b45309;
        }

        .requestModalActions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 6px;
        }

        .requestCancelBtn,
        .requestSubmitBtn {
          border: none;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .requestCancelBtn {
          background: #f3f4f6;
          color: #374151;
        }

        .requestSubmitBtn {
          background: #16a34a;
          color: #fff;
        }
      `}</style>
    </main>
  )
}
