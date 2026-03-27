import { useRouter } from 'next/router'
import { useState, useEffect, useRef } from 'react'
import ShopLayout from '../components/ShopLayout'
import { useCart } from '../contexts/CartContext'
import allStaticProducts from '../data/products'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
console.log('[SearchPage] API Base URL:', API_BASE)
const normalizeProductName = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

export default function SearchPage() {
  const router = useRouter()
  const { q } = router.query
  const [searchResults, setSearchResults] = useState([])
  const [quantities, setQuantities] = useState({})
  const [liveProducts, setLiveProducts] = useState([])
  const [stockMetaByName, setStockMetaByName] = useState({})
  const allProductsRef = useRef([])
  const { addToCart } = useCart()

  const mergeProducts = (staticRows, liveRows) => {
    const merged = Array.isArray(staticRows) ? [...staticRows] : []
    const existingNames = new Set(merged.map((product) => normalizeProductName(product?.name)))

    if (Array.isArray(liveRows)) {
      liveRows.forEach((product) => {
        const key = normalizeProductName(product?.name)
        if (!key || existingNames.has(key)) return
        existingNames.add(key)
        merged.push({
          id: String(product.id),
          name: product.name || 'Product',
          price: Number(product.price || 0),
          size: product.quantity ? `${product.quantity} ${product.unit || ''}`.trim() : (product.unit || ''),
          unit: product.unit || '',
          image: product.image || '',
          category: product.category || '',
          description: product.description || '',
        })
      })
    }

    return merged
  }

  // Load static products on mount
  useEffect(() => {
    allProductsRef.current = mergeProducts(allStaticProducts, liveProducts)
    if (q) runFilter(q, allProductsRef.current)
  }, [liveProducts])

  useEffect(() => {
    let cancelled = false
    fetch(`${API_BASE}/products`)
      .then((response) => (response.ok ? response.json() : []))
      .then((rows) => {
        if (cancelled || !Array.isArray(rows)) return
        setLiveProducts(rows)
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

  const runFilter = (query, products) => {
    const tokens = String(query)
      .toLowerCase()
      .split(/\s+/)
      .map(t => t.trim())
      .filter(Boolean)

    const results = products.filter(product => {
      const haystack = [
        product.name,
        product.category,
        product.id,
        product.size || product.unit || '',
        product.description || '',
      ]
        .join(' ')
        .toLowerCase()
      return tokens.every(token => haystack.includes(token))
    })

    setSearchResults(results)
    const initialQty = {}
    results.forEach(p => (initialQty[p.id] = 1))
    setQuantities(initialQty)
  }

  useEffect(() => {
    if (!q) {
      setSearchResults([])
      setQuantities({})
      return
    }
    if (allProductsRef.current.length > 0) {
      runFilter(q, allProductsRef.current)
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
        size: product.quantity ? `${product.quantity} ${product.unit || ''}`.trim() : (product.unit || ''),
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
          {q && (
            <p className="searchQuery">
              Showing results for: <strong>"{q}"</strong>
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
          <div className="productGrid">
            {searchResults.map((product) => {
              const currentQty = quantities[product.id] || 1
              const totalAmount = (product.price * currentQty).toFixed(2)
              const imgSrc = product.image || product.imageUrl || null
              const stockMeta = stockMetaByName[normalizeProductName(product.name)]

              return (
                <div key={product.id} className="productCard">
                  <div className="productImage" onClick={() => handleProductClick(product)} style={{ cursor: 'pointer' }}>
                    {imgSrc ? (
                      <img src={imgSrc} alt={product.name} className="productImg" />
                    ) : (
                      <div className="imagePlaceholder">
                        <span>Fresh Organic</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="productInfo">
                    <span className="productCategory">{product.category}</span>
                    {stockMeta?.lowStock ? (
                      <div style={{
                        display: 'inline-block',
                        marginTop: 6,
                        marginBottom: 6,
                        background: '#fef3c7',
                        color: '#92400e',
                        border: '1px solid #fcd34d',
                        borderRadius: 999,
                        padding: '2px 8px',
                        fontSize: 11,
                        fontWeight: 700,
                      }}>
                        Low stock ({stockMeta.stockQuantity})
                      </div>
                    ) : null}
                    <h3 className="productName" onClick={() => handleProductClick(product)} style={{ cursor: 'pointer' }}>{product.name}</h3>
                    <div className="productPrice">₹{totalAmount}</div>
                    <div className="productUnit">{product.quantity ? `${product.quantity} ${product.unit || ''}`.trim() : (product.unit || product.size)}</div>

                    <div className="quantityControls">
                      <button onClick={() => updateQty(product.id, -1)}>−</button>
                      <input type="text" value={currentQty} readOnly />
                      <button onClick={() => updateQty(product.id, 1)}>+</button>
                    </div>

                    <button
                      className="addToCartBtn"
                      onClick={() => addToCart(product, currentQty)}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .searchPage {
          max-width: 1400px;
          margin: 0 auto;
          padding: 40px 20px;
          min-height: 60vh;
        }

        .searchHeader {
          text-align: center;
          margin-bottom: 40px;
        }

        .searchHeader h1 {
          font-size: 36px;
          font-weight: 800;
          color: #333;
          margin: 0 0 10px;
        }

        .searchQuery {
          font-size: 18px;
          color: #666;
          margin: 10px 0;
        }

        .searchQuery strong {
          color: #619233;
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

        .noResultsIcon {
          color: #ddd;
          margin-bottom: 20px;
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

        .productGrid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 30px;
        }

        .productCard {
          border: 1px solid #f2f2f2;
          border-radius: 12px;
          overflow: hidden;
          background: #fff;
          transition: all 0.3s ease;
        }

        .productCard:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.08);
        }

        .productImage {
          height: 200px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          display: grid;
          place-items: center;
          overflow: hidden;
        }

        .productImg {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .loadingState {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          color: #888;
          gap: 16px;
        }

        .spinner {
          width: 44px;
          height: 44px;
          border: 4px solid #e0e0e0;
          border-top-color: #619233;
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .productInfo {
          padding: 20px;
        }

        .productCategory {
          font-size: 12px;
          color: #619233;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .productName {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin: 8px 0;
          min-height: 48px;
          line-height: 1.5;
        }

        .productPrice {
          font-size: 20px;
          font-weight: 700;
          color: #111;
          margin: 10px 0 5px;
        }

        .productUnit {
          font-size: 12px;
          color: #888;
          background: #f8f8f8;
          padding: 4px 12px;
          border-radius: 4px;
          display: inline-block;
          margin-bottom: 15px;
        }

        .quantityControls {
          display: flex;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 15px;
          width: fit-content;
        }

        .quantityControls button {
          background: #fff;
          border: none;
          padding: 8px 15px;
          cursor: pointer;
          font-size: 18px;
          color: #333;
          transition: background 0.2s;
        }

        .quantityControls button:hover {
          background: #f5f5f5;
        }

        .quantityControls input {
          width: 50px;
          text-align: center;
          border: none;
          border-left: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
          font-weight: 600;
          color: #333;
        }

        .addToCartBtn {
          width: 100%;
          background: #619233;
          color: #fff;
          border: none;
          padding: 12px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .addToCartBtn:hover {
          background: #4f7a29;
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .searchPage {
            padding: 30px 15px;
          }

          .searchHeader h1 {
            font-size: 28px;
          }

          .productGrid {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 15px;
          }

          .productImage {
            height: 150px;
          }

          .productInfo {
            padding: 15px;
          }

          .productName {
            font-size: 14px;
            min-height: 40px;
          }

          .productPrice {
            font-size: 16px;
          }
        }
      `}</style>
    </ShopLayout>
  )
}
