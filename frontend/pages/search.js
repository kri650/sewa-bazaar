 'use client'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import ShopLayout from '../components/ShopLayout'
import { useCart } from '../contexts/CartContext'
import allProducts from '../data/products'

export default function SearchPage() {
  const router = useRouter()
  const { q } = router.query || {}
  const [effectiveQuery, setEffectiveQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [quantities, setQuantities] = useState({})
  const { addToCart } = useCart()

  useEffect(() => {
    // Support both client-routed and full-page loads (static export)
    let query = q
    if (!query && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      query = params.get('q')
    }

    if (query) {
      setEffectiveQuery(String(query))
      const searchTerm = String(query).toLowerCase().trim()

      // Split into tokens. ALL tokens must match for a product to appear.
      // e.g. "ginger"  → only products containing "ginger"
      //      "organic ginger" → only products containing BOTH "organic" AND "ginger"
      //      "gi"  → products whose name/category contains "gi" (so Ginger matches)
      const tokens = searchTerm.split(/\s+/).filter(Boolean)

      const results = allProducts.filter(product => {
        const name = product.name.toLowerCase()
        const category = (product.category || '').toLowerCase()
        const searchable = name + ' ' + category

        // Every token must appear somewhere in name+category
        return tokens.every(t => searchable.includes(t))
      })

      setSearchResults(results)

      // Initialize quantities
      const initialQty = {}
      results.forEach(p => initialQty[p.id] = 1)
      setQuantities(initialQty)
    }
  }, [q])

  const updateQty = (id, delta) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta)
    }))
  }

  const handleProductClick = (product) => {
    router.push({
      pathname: `/product/${product.id}`,
      query: {
        name: product.name,
        price: product.price,
        size: product.unit,
        image: product.image,
        category: product.category,
      },
    })
  }

  return (
    <ShopLayout showHeader={true}>
      <div className="searchPage">
        <div className="searchHeader">
          <h1>Search Results</h1>
          {effectiveQuery && (
            <p className="searchQuery">
              Showing results for: <strong>"{effectiveQuery}"</strong>
            </p>
          )}
          <p className="resultCount">
            {searchResults.length} {searchResults.length === 1 ? 'product' : 'products'} found
          </p>
        </div>

        {searchResults.length === 0 ? (
          <div className="noResults">
            <div className="noResultsIcon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <h2>No products found</h2>
            <p>Try searching with different keywords</p>
          </div>
        ) : (
          <div className="product-grid">
            {searchResults.map((product) => {
              const currentQty = quantities[product.id] || 1
              const totalAmount = (product.price * currentQty).toFixed(2)

              return (
                <div className="product-item" key={product.id}>
                  <div
                    className="img-holder"
                    onClick={() => handleProductClick(product)}
                    style={{ cursor: 'pointer' }}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.parentElement.classList.add('img-missing')
                      }}
                    />
                  </div>

                  <h4
                    className="p-title"
                    onClick={() => handleProductClick(product)}
                    style={{ cursor: 'pointer' }}
                  >{product.name}</h4>
                  <div className="p-amount">Rs. {totalAmount}</div>
                  <div className="p-unit-badge">{product.unit}</div>

                  <div className="qty-picker">
                    <button onClick={(e) => { e.stopPropagation(); updateQty(product.id, -1) }}>-</button>
                    <input type="text" value={currentQty} readOnly />
                    <button onClick={(e) => { e.stopPropagation(); updateQty(product.id, 1) }}>+</button>
                  </div>

                  <button
                    className="add-to-cart-btn"
                    onClick={(e) => { e.stopPropagation(); addToCart(product, currentQty) }}
                  >
                    Add to Cart
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style jsx global>{`
        .searchPage {
          max-width: 1400px;
          margin: 0 auto;
          padding: 40px 5%;
          min-height: 60vh;
        }

        .searchHeader {
          text-align: center;
          margin-bottom: 50px;
        }

        .searchHeader h1 {
          font-size: 38px;
          font-weight: 800;
          color: #333;
          margin-bottom: 8px;
        }

        .searchQuery {
          font-size: 16px;
          color: #666;
          margin: 8px 0;
        }

        .searchQuery strong {
          color: #6aa333;
        }

        .resultCount {
          font-size: 14px;
          color: #999;
          margin: 5px 0 0;
        }

        .noResults {
          text-align: center;
          padding: 60px 20px;
        }

        .noResults h2 {
          font-size: 24px;
          color: #333;
          margin: 0 0 10px;
        }

        .noResults p {
          font-size: 16px;
          color: #666;
        }

        /* ── Product grid: identical to product pages ── */
        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 30px;
        }

        .product-item {
          border: 1px solid #f2f2f2;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          transition: all 0.3s ease;
          background: #fff;
        }

        .product-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.07);
        }

        .img-holder {
          height: 180px;
          background: #f8faf3;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 15px;
          overflow: hidden;
        }

        .img-holder img {
          max-height: 100%;
          max-width: 100%;
          object-fit: contain;
          transition: transform 0.3s ease;
        }

        .product-item:hover .img-holder img {
          transform: scale(1.06);
        }

        .img-holder.img-missing::after {
          content: '🌿';
          font-size: 52px;
          opacity: 0.35;
        }

        .p-title {
          font-size: 15px;
          font-weight: 600;
          color: #444;
          height: 40px;
          margin: 5px 0;
        }

        .p-amount {
          font-size: 18px;
          font-weight: 700;
          color: #111;
          margin-bottom: 6px;
        }

        .p-unit-badge {
          font-size: 11px;
          background: #f8f8f8;
          color: #888;
          padding: 4px 12px;
          border-radius: 4px;
          display: inline-block;
          align-self: center;
          margin-bottom: 20px;
          font-weight: bold;
        }

        .qty-picker {
          display: flex;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          overflow: hidden;
          align-self: center;
          margin-bottom: 15px;
        }

        .qty-picker button {
          background: #fff;
          border: none;
          padding: 8px 15px;
          cursor: pointer;
          font-size: 18px;
        }

        .qty-picker input {
          width: 40px;
          text-align: center;
          border-left: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
          border-top: none;
          border-bottom: none;
          font-weight: 600;
        }

        .add-to-cart-btn {
          background: #6aa333;
          color: #fff;
          border: none;
          padding: 12px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          margin-top: auto;
          transition: background 0.2s;
        }

        .add-to-cart-btn:hover {
          background: #5a8d2a;
        }

        @media (max-width: 768px) {
          .searchPage { padding: 30px 4%; }
          .searchHeader h1 { font-size: 28px; }
          .product-grid {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 15px;
          }
          .img-holder { height: 140px; }
          .p-title { font-size: 13px; height: 36px; }
          .p-amount { font-size: 15px; }
        }
      `}</style>
    </ShopLayout>
  )
}
