import { useRouter } from 'next/router'
import { useState, useMemo } from 'react'
import { useCart } from '../contexts/CartContext'
import { useDelivery } from '../contexts/DeliveryContext'
import ProductCard from './ProductCard'
import FilterBar from './FilterBar'

const parseRupees = (price) => Number(String(price ?? '').replace(/[^\d.]/g, '')) || 0
const formatRupees = (amount) =>
  `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

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
  const [quantities, setQuantities] = useState(() => products.map(() => 1))
  const [filters, setFilters] = useState({
    sort: 'popularity',
    rating: null,
    priceRange: 'all'
  })

  const changeQty = (index, delta) => {
    setQuantities((prev) =>
      prev.map((qty, i) => (i === index ? Math.max(1, qty + delta) : qty))
    )
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
    let result = [...products]

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
  }, [products, filters])

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
            {filteredProducts.map((product, index) => {
              const originalIndex = products.findIndex(p => p.id === product.id)
              const qty = quantities[originalIndex] || 1
              const routeId = getRouteId ? getRouteId(product) : String(product.id)
              const normalizedPrice = parseRupees(product.price)
              const normalizedSize = product.size || product.unit || ''

              return (
                <ProductCard
                  key={routeId}
                  name={product.name}
                  price={normalizedPrice}
                  originalPrice={product.originalPrice}
                  discount={product.discount}
                  size={normalizedSize}
                  image={product.image}
                  badge={deliveryBadge || product.badge || undefined}
                  showQty={true}
                  qty={qty}
                  onQtyChange={(delta) => changeQty(originalIndex, delta)}
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
