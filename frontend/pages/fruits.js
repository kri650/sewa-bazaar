import Link from 'next/link'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import SiteHeader from '../components/SiteHeader'
import FilterBar from '../components/FilterBar'
import ProductCard from '../components/ProductCard'
import { useCart } from '../contexts/CartContext'

const products = [
  { id: 'apple', name: 'Red Apple', price: 180.00, size: '1 KG', brand: 'Fresho', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80' },
  { id: 'banana', name: 'Fresh Banana', price: 60.00, size: '1 DOZEN', brand: 'Farm Fresh', image: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=400&q=80' },
  { id: 'mango', name: 'Alphonso Mango', price: 210.00, size: '1 KG', brand: "Nature's Best", image: 'https://images.unsplash.com/photo-1605440846964-c6297a046b0c?w=400&q=80' },
  { id: 'orange', name: 'Fresh Orange', price: 120.00, size: '1 KG', brand: 'Farm Fresh', image: 'https://images.unsplash.com/photo-1580013759032-c96505e24c1f?w=400&q=80' },
  { id: 'grapes', name: 'Green Grapes', price: 95.00, size: '500 GM', brand: 'Farm Fresh', image: 'https://images.unsplash.com/photo-1599819177626-c2f9c9ca1a07?w=400&q=80' },
  { id: 'pomegranate', name: 'Pomegranate', price: 220.00, size: '1 KG', brand: 'Fresho', image: 'https://images.unsplash.com/photo-1580495165843-7396311f2bff?w=400&q=80' },
  { id: 'papaya', name: 'Fresh Papaya', price: 45.00, size: '1 PC', brand: "Nature's Best", image: 'https://images.unsplash.com/photo-1617112848923-cc2234396a8d?w=400&q=80' },
  { id: 'watermelon', name: 'Watermelon', price: 40.00, size: '1 KG', brand: 'Farm Fresh', image: 'https://images.unsplash.com/photo-1587049352846-4a222e784366?w=400&q=80' },
  { id: 'pineapple', name: 'Fresh Pineapple', price: 80.00, size: '1 PC', brand: "Nature's Best", image: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&q=80' },
  { id: 'kiwi', name: 'Kiwi Fruit', price: 150.00, size: '500 GM', brand: 'Fresho', image: 'https://images.unsplash.com/photo-1585059895524-72359e06133a?w=400&q=80' },
  { id: 'strawberry', name: 'Fresh Strawberry', price: 280.00, size: '500 GM', brand: 'Fresho', image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&q=80' },
  { id: 'guava', name: 'Pink Guava', price: 60.00, size: '500 GM', brand: 'Farm Fresh', image: 'https://images.unsplash.com/photo-1536511132770-e5058c7e8c46?w=400&q=80' },
  { id: 'lychee', name: 'Fresh Lychee', price: 180.00, size: '500 GM', brand: "Nature's Best", image: 'https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?w=400&q=80' },
  { id: 'dragon-fruit', name: 'Dragon Fruit', price: 220.00, size: '500 GM', brand: 'Fresho', image: 'https://images.unsplash.com/photo-1527325678964-54921661f888?w=400&q=80' },
  { id: 'avocado', name: 'Fresh Avocado', price: 280.00, size: '500 GM', brand: 'Fresho', image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&q=80' },
  { id: 'peach', name: 'Juicy Peach', price: 200.00, size: '500 GM', brand: "Nature's Best", image: 'https://images.unsplash.com/photo-1629828874514-d5e0c5b91859?w=400&q=80' },
  { id: 'plum', name: 'Fresh Plum', price: 180.00, size: '500 GM', brand: "Nature's Best", image: 'https://images.unsplash.com/photo-1596361004893-ee6cf199fcaf?w=400&q=80' },
  { id: 'pear', name: 'Green Pear', price: 160.00, size: '1 KG', brand: 'Farm Fresh', image: 'https://images.unsplash.com/photo-1568142091455-60dcb96fc253?w=400&q=80' },
  { id: 'cherry', name: 'Fresh Cherry', price: 480.00, size: '500 GM', brand: 'Fresho', image: 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=400&q=80' },
  { id: 'blueberry', name: 'Blueberries', price: 420.00, size: '250 GM', brand: 'Fresho', image: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400&q=80' },
]

const parseRupees = (price) => Number(String(price || '').replace(/[^\d.]/g, '')) || 0
const formatRupees = (amount) => `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function Fruits() {
  const { addToCart } = useCart()
  const router = useRouter()
  const [quantities, setQuantities] = useState(() => products.map(() => 1))
  const [filters, setFilters] = useState({
    sort: 'popularity',
    rating: null,
    priceRange: 'all',
    brand: 'all'
  })

  const changeQty = (index, delta) => {
    setQuantities((prev) => prev.map((qty, i) => i === index ? Math.max(1, qty + delta) : qty))
  }

  const handleProductClick = (product) => {
    const normalizedPrice = parseRupees(product.price)
    router.push({
      pathname: `/product/${product.id}`,
      query: {
        name: product.name || '',
        price: String(normalizedPrice),
        size: product.size || '',
        image: product.image || '',
        category: 'Fruits',
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

    // Apply rating filter
    if (filters.rating) {
      result = result.filter(product => (product.rating || 4) >= filters.rating)
    }

    // Apply brand filter
    if (filters.brand && filters.brand !== 'all') {
      result = result.filter(product => product.brand === filters.brand)
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
        break
    }

    return result
  }, [filters])

  return (
    <main className="pageShell">
      <div className="utilityBar">
        <div className="utilityBarInner">
          <div className="utilityLeft" />
          <div className="utilityRight">
            <a href="#" className="utilityItem">Track Your Order</a>
            <a href="#" className="utilityItem">Contact Us</a>
            <a href="#" className="utilityItem">FAQ&apos;s</a>
          </div>
        </div>
      </div>

      <SiteHeader />

      <section style={{ padding: '20px 20px', minHeight: '60vh' }}>
        <div className="container">
          <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', marginTop: '0', textAlign: 'center' }}>Fresh Fruits</h1>
          <p style={{ textAlign: 'center', marginBottom: '40px', fontSize: '1.1rem', color: '#666' }}>
            Farm-fresh fruits delivered to your doorstep
          </p>
          
          <div className="categoryContent">
            <FilterBar onFilterChange={setFilters} />
            
            <div className="productGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              {filteredProducts.map((item) => {
                const originalIndex = products.findIndex(p => p.id === item.id)
                return (
                  <ProductCard
                    key={item.id}
                    name={item.name}
                    price={item.price}
                    originalPrice={item.originalPrice}
                    discount={item.discount}
                    size={item.size}
                    image={item.image}
                    showQty={true}
                    qty={quantities[originalIndex] || 1}
                    onQtyChange={(delta) => changeQty(originalIndex, delta)}
                    onAdd={() => addToCart(item, quantities[originalIndex] || 1)}
                    onClick={() => handleProductClick(item)}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </section>

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
