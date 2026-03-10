import { useRouter } from 'next/router'
import { useState } from 'react'
import { useCart } from '../contexts/CartContext'
import styles from '../styles/product.module.css'
import { useDelivery } from '../contexts/DeliveryContext'

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
  const [quantities, setQuantities] = useState(() => products.map(() => 1))
  const { deliveryType, estimatedTime, estimatedMinutesMin, estimatedMinutesMax } = useDelivery()

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

  return (
    <main className="categoryMain">
      <div className="categoryInner">
        <header className="categoryHeader">
          <h1 className="categoryTitle">{title}</h1>
          {description ? <p className="categoryDescription">{description}</p> : null}
        </header>

        <div className="productGrid categoryProductGrid">
          {products.map((product, index) => {
            const qty = quantities[index]
            const routeId = getRouteId ? getRouteId(product) : String(product.id)
            const normalizedPrice = parseRupees(product.price)
            const normalizedSize = product.size || product.unit || ''

            return (
              <article className={styles.productCard || 'productCard'} key={routeId}>
                  {/* Delivery ETA badge – Flipkart style */}
                  {deliveryType && estimatedTime && (
                    <div className={styles.etaBadge || 'etaBadge'} style={{
                      background: deliveryType === 'fast' ? '#e6f9f0' : '#fff8e1',
                      color: deliveryType === 'fast' ? '#0a7c42' : '#b45309',
                      border: `1px solid ${deliveryType === 'fast' ? '#86efac' : '#fcd34d'}`,
                      borderRadius: 5,
                      padding: '3px 7px',
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'inline-block',
                      marginBottom: 4,
                    }}>
                      {deliveryType === 'fast'
                        ? `Delivery in ${estimatedTime}`
                        : `Delivery ${estimatedTime}`}
                    </div>
                  )}
                <div
                  className="productImageWrap"
                  onClick={() => handleProductClick(product, routeId)}
                  style={{ cursor: 'pointer' }}
                >
                  <img src={product.image} alt={product.name} loading="lazy" />
                </div>

                <p
                  className="productName"
                  onClick={() => handleProductClick(product, routeId)}
                  style={{ cursor: 'pointer' }}
                >
                  {product.name}
                </p>

                <p className="productPrice">{formatRupees(normalizedPrice * qty)}</p>
                <span className="productSize">{normalizedSize}</span>

                <div className="qtyRow">
                  <button type="button" onClick={() => changeQty(index, -1)}>
                    -
                  </button>
                  <span>{qty}</span>
                  <button type="button" onClick={() => changeQty(index, 1)}>
                    +
                  </button>
                </div>

                <button
                  type="button"
                  className="pickNowBtn"
                  onClick={() =>
                    addToCart(
                      {
                        ...product,
                        price: normalizedPrice,
                        size: normalizedSize,
                      },
                      qty
                    )
                  }
                >
                  Add to Cart
                </button>
              </article>
            )
          })}
        </div>
      </div>
    </main>
  )
}
