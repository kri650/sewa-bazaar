'use client'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import ShopLayout from '../components/ShopLayout'
import { useCart } from '../contexts/CartContext'

// Combined product database from all pages
const allProducts = [
  // Regular Vegetables
  { id: 'rv-1', name: "Fresh Tomato", price: 32.00, unit: "500 GM", category: "Regular Vegetables", image: "/images/tomato.jpg" },
  { id: 'rv-2', name: "Organic Potato", price: 50.00, unit: "1 KG", category: "Regular Vegetables", image: "/images/potato.jpg" },
  { id: 'rv-3', name: "Green Capsicum", price: 42.00, unit: "500 GM", category: "Regular Vegetables", image: "/images/capsicum.jpg" },
  { id: 'rv-4', name: "Red Onion", price: 52.00, unit: "1 KG", category: "Regular Vegetables", image: "/images/onion.jpg" },
  { id: 'rv-5', name: "Fresh Carrot", price: 48.00, unit: "500 GM", category: "Regular Vegetables", image: "/images/carrot.jpg" },
  { id: 'rv-6', name: "Cucumber", price: 36.00, unit: "500 GM", category: "Regular Vegetables", image: "/images/cucumber.jpg" },
  { id: 'rv-7', name: "Bottle Gourd (Lauki)", price: 44.00, unit: "1 KG", category: "Regular Vegetables", image: "/images/lauki.jpg" },
  { id: 'rv-8', name: "Lady Finger (Okra)", price: 40.00, unit: "500 GM", category: "Regular Vegetables", image: "/images/okra.jpg" },
  
  // Leafy Vegetables
  { id: 'lv-1', name: "Organic Spring Onion", price: 35.00, unit: "250 GM", category: "Leafy Vegetables", image: "/images/spring-onion.jpg" },
  { id: 'lv-2', name: "Alu Paan", price: 20.00, unit: "5 LEAVES BUNCH", category: "Leafy Vegetables", image: "/images/alu-paan.jpg" },
  { id: 'lv-3', name: "Organic Mint", price: 19.00, unit: "1 BUNCH", category: "Leafy Vegetables", image: "/images/mint.jpg" },
  { id: 'lv-4', name: "Organic Coriander", price: 39.00, unit: "1 BUNCH", category: "Leafy Vegetables", image: "/images/coriander.jpg" },
  { id: 'lv-5', name: "Organic Spinach", price: 32.00, unit: "1 BUNCH", category: "Leafy Vegetables", image: "/images/spinach.jpg" },
  { id: 'lv-6', name: "Organic Fenugreek / Methi", price: 49.00, unit: "1 BUNCH", category: "Leafy Vegetables", image: "/images/methi.jpg" },
  { id: 'lv-7', name: "Organic Dill Leaves", price: 35.00, unit: "1 BUNCH", category: "Leafy Vegetables", image: "/images/dill.jpg" },
  { id: 'lv-8', name: "Organic Lemongrass", price: 19.00, unit: "1 BUNCH", category: "Leafy Vegetables", image: "/images/lemongrass.jpg" },
]

export default function SearchPage() {
  const router = useRouter()
  const { q } = router.query
  const [searchResults, setSearchResults] = useState([])
  const [quantities, setQuantities] = useState({})
  const { addToCart } = useCart()

  useEffect(() => {
    if (q) {
      const searchTerm = q.toLowerCase()
      const results = allProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
      )
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

              return (
                <div key={product.id} className="productCard">
                  <div className="productImage">
                    <div className="imagePlaceholder">
                      <span>Fresh Organic</span>
                    </div>
                  </div>
                  
                  <div className="productInfo">
                    <span className="productCategory">{product.category}</span>
                    <h3 className="productName">{product.name}</h3>
                    <div className="productPrice">₹{totalAmount}</div>
                    <div className="productUnit">{product.unit}</div>

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
        }

        .imagePlaceholder {
          text-align: center;
          color: #999;
          font-size: 14px;
          padding: 20px;
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
