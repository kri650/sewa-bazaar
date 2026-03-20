import { useRouter } from 'next/router'
import { useState, useMemo, useEffect } from 'react'
import { useCart } from '../contexts/CartContext'
import { useDelivery } from '../contexts/DeliveryContext'
import ProductCard from './ProductCard'
import FilterBar from './FilterBar'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'

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

  const aCandidates = new Set([a, ...(CATEGORY_ALIASES[a] || [])])
  const bCandidates = new Set([b, ...(CATEGORY_ALIASES[b] || [])])

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

  const mergedProducts = useMemo(() => {
    const staticList = Array.isArray(products) ? products : []
    const liveList = Array.isArray(liveProducts)
      ? liveProducts.filter((product) => categoryMatches(category, product.category))
      : []

    const seenNames = new Set(staticList.map((product) => normalizeProductName(product.name)))
    const merged = [...staticList]

    for (const product of liveList) {
      const key = normalizeProductName(product.name)
      if (!key || seenNames.has(key)) continue
      seenNames.add(key)
      merged.push({
        id: String(product.id),
        name: product.name,
        price: Number(product.price || 0),
        size: product.unit || '',
        unit: product.unit || '',
        image: product.image || '',
        category: product.category || category || '',
        description: product.description || '',
        lowStock: Boolean(Number(product.lowStock || 0)),
        stockQuantity: Number(product.stockQuantity || 0),
      })
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
              const normalizedSize = product.size || product.unit || ''
              const stockMeta = stockMetaByName[normalizeProductName(product.name)]
              const lowStockNote = (product.lowStock || stockMeta?.lowStock)
                ? `Low stock${(product.stockQuantity || stockMeta?.stockQuantity || 0) > 0 ? ` (${product.stockQuantity || stockMeta?.stockQuantity || 0} left)` : ''}`
                : undefined

              return (
                <ProductCard
                  key={routeId}
                  id={product.id ?? routeId}
                  name={product.name}
                  price={normalizedPrice}
                  originalPrice={product.originalPrice}
                  discount={product.discount}
                  size={normalizedSize}
                  image={product.image}
                  badge={deliveryBadge || product.badge || undefined}
                  note={lowStockNote}
                  showQty={true}
                  qty={qty}
                  onQtyChange={(delta) => changeQty(routeId, delta)}
                  onAdd={() => addToCart({ ...product, price: normalizedPrice, size: normalizedSize }, qty)}
                  onClick={() => handleProductClick(product, routeId)}
                />
              )
            })}
          </div>
        </div>
      </div>

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
      `}</style>
    </main>
  )
}
