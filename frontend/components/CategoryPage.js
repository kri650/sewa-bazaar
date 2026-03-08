import { useRouter } from 'next/router'
import { useState } from 'react'
import { useCart } from '../contexts/CartContext'

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
              <article className="productCard" key={routeId}>
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
