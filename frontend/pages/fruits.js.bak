import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/router'
import SiteHeader from '../components/SiteHeader'
import { useCart } from '../contexts/CartContext'

const products = [
  { id: 'apple', name: 'Red Apple', price: 180.00, size: '1 KG', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80' },
  { id: 'banana', name: 'Fresh Banana', price: 60.00, size: '1 DOZEN', image: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=400&q=80' },
  { id: 'mango', name: 'Alphonso Mango', price: 210.00, size: '1 KG', image: 'https://images.unsplash.com/photo-1605440846964-c6297a046b0c?w=400&q=80' },
  { id: 'orange', name: 'Fresh Orange', price: 120.00, size: '1 KG', image: 'https://images.unsplash.com/photo-1580013759032-c96505e24c1f?w=400&q=80' },
  { id: 'grapes', name: 'Green Grapes', price: 95.00, size: '500 GM', image: 'https://images.unsplash.com/photo-1599819177626-c2f9c9ca1a07?w=400&q=80' },
  { id: 'pomegranate', name: 'Pomegranate', price: 220.00, size: '1 KG', image: 'https://images.unsplash.com/photo-1580495165843-7396311f2bff?w=400&q=80' },
  { id: 'papaya', name: 'Fresh Papaya', price: 45.00, size: '1 PC', image: 'https://images.unsplash.com/photo-1617112848923-cc2234396a8d?w=400&q=80' },
  { id: 'watermelon', name: 'Watermelon', price: 40.00, size: '1 KG', image: 'https://images.unsplash.com/photo-1587049352846-4a222e784366?w=400&q=80' },
  { id: 'pineapple', name: 'Fresh Pineapple', price: 80.00, size: '1 PC', image: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&q=80' },
  { id: 'kiwi', name: 'Kiwi Fruit', price: 150.00, size: '500 GM', image: 'https://images.unsplash.com/photo-1585059895524-72359e06133a?w=400&q=80' },
  { id: 'strawberry', name: 'Fresh Strawberry', price: 280.00, size: '500 GM', image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&q=80' },
  { id: 'guava', name: 'Pink Guava', price: 60.00, size: '500 GM', image: 'https://images.unsplash.com/photo-1536511132770-e5058c7e8c46?w=400&q=80' },
  { id: 'lychee', name: 'Fresh Lychee', price: 180.00, size: '500 GM', image: 'https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?w=400&q=80' },
  { id: 'dragon-fruit', name: 'Dragon Fruit', price: 220.00, size: '500 GM', image: 'https://images.unsplash.com/photo-1527325678964-54921661f888?w=400&q=80' },
  { id: 'avocado', name: 'Fresh Avocado', price: 280.00, size: '500 GM', image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&q=80' },
  { id: 'peach', name: 'Juicy Peach', price: 200.00, size: '500 GM', image: 'https://images.unsplash.com/photo-1629828874514-d5e0c5b91859?w=400&q=80' },
  { id: 'plum', name: 'Fresh Plum', price: 180.00, size: '500 GM', image: 'https://images.unsplash.com/photo-1596361004893-ee6cf199fcaf?w=400&q=80' },
  { id: 'pear', name: 'Green Pear', price: 160.00, size: '1 KG', image: 'https://images.unsplash.com/photo-1568142091455-60dcb96fc253?w=400&q=80' },
  { id: 'cherry', name: 'Fresh Cherry', price: 480.00, size: '500 GM', image: 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=400&q=80' },
  { id: 'blueberry', name: 'Blueberries', price: 420.00, size: '250 GM', image: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400&q=80' },
]

const parseRupees = (price) => Number(String(price || '').replace(/[^\d.]/g, '')) || 0
const formatRupees = (amount) => `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function Fruits() {
  const { addToCart } = useCart()
  const router = useRouter()
  const [quantities, setQuantities] = useState(() => products.map(() => 1))

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

  return (
    <main className="pageShell">
      <div className="promoStrip">
        <div className="promoStripInner">
          <p className="promoTitle">Special Offer!</p>
          <p className="promoSubtitle">Rewarding all customers with a 30% discount</p>
        </div>
      </div>

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
          
          <div className="productGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
            {products.map((item, index) => (
              <article className="productCard" key={item.id}>
                <div className="productImageWrap" onClick={() => handleProductClick(item)} style={{ cursor: 'pointer' }}>
                  <img src={item.image} alt={item.name} loading="lazy" />
                </div>
                <p className="productName" onClick={() => handleProductClick(item)} style={{ cursor: 'pointer' }}>{item.name}</p>
                <p className="productPrice">{formatRupees(parseRupees(item.price) * quantities[index])}</p>
                <span className="productSize">{item.size}</span>
                <div className="qtyRow">
                  <button type="button" onClick={() => changeQty(index, -1)}>-</button>
                  <span>{quantities[index]}</span>
                  <button type="button" onClick={() => changeQty(index, 1)}>+</button>
                </div>
                <button type="button" className="pickNowBtn" onClick={() => addToCart(item, quantities[index])}>
                  Add to Cart
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
