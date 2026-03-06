"use client";
import React, { useState } from "react";
import { useRouter } from "next/router";
import { useCart } from '../../contexts/CartContext';
import ShopLayout from '../../components/ShopLayout';

const products = [
  { id: 1, name: "Bottle Gourd", price: 40.00, unit: "1 PC" },
  { id: 2, name: "Bitter Gourd", price: 60.00, unit: "500 GM" },
  { id: 3, name: "Ridge Gourd", price: 55.00, unit: "500 GM" },
  { id: 4, name: "Yellow Pumpkin", price: 45.00, unit: "1 KG" },
  { id: 5, name: "Snake Gourd", price: 50.00, unit: "500 GM" },
  { id: 6, name: "Sponge Gourd", price: 48.00, unit: "500 GM" },
  { id: 7, name: "Ash Gourd", price: 35.00, unit: "1 KG" },
  { id: 8, name: "Ivy Gourd", price: 40.00, unit: "500 GM" },
];

export default function GourdsAndPumpkinPage() {
  const [quantities, setQuantities] = useState(
    products.reduce((acc, product) => ({ ...acc, [product.id]: 1 }), {})
  );
  const { addToCart } = useCart();
  const router = useRouter();

  const updateQty = (id, delta) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, prev[id] + delta)
    }));
  };

  const handleProductClick = (product) => {
    const productId = `gourd-${product.id}`;
    router.push({
      pathname: `/product/${productId}`,
      query: {
        name: product.name,
        price: String(product.price),
        size: product.unit,
        image: product.image,
        category: 'Gourds And Pumpkin',
      },
    });
  };

  return (
    <ShopLayout showHeader={true}>
      <div className="category-container">
        <div className="page-header">
          <h1 className="main-title">Gourds And Pumpkin</h1>
          <p className="sub-title">Fresh, nutrient-rich gourds and pumpkins</p>
        </div>

        <div className="product-grid">
          {products.map(p => (
            <div key={p.id} className="product-item">
              <div className="image-wrapper" onClick={() => handleProductClick(p)} style={{ cursor: 'pointer' }}>
                <div className="placeholder-image">{p.name}</div>
              </div>
              <div className="product-info">
                <h4 className="item-name" onClick={() => handleProductClick(p)} style={{ cursor: 'pointer' }}>{p.name}</h4>
                <p className="item-unit">{p.unit}</p>
                <p className="item-price">₹ {p.price.toFixed(2)}</p>
                <div className="quantity-controls">
                  <button onClick={(e) => { e.stopPropagation(); updateQty(p.id, -1); }}>−</button>
                  <span>{quantities[p.id]}</span>
                  <button onClick={(e) => { e.stopPropagation(); updateQty(p.id, 1); }}>+</button>
                </div>
                <button className="add-to-cart-btn" onClick={(e) => { e.stopPropagation(); addToCart({ ...p, quantity: quantities[p.id] }); }}>
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .category-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
          padding: 2rem;
        }
        
        .page-header {
          text-align: center;
          margin-bottom: 3rem;
          padding: 2rem;
          background: white;
          border-radius: 20px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }

        .main-title {
          font-size: 3rem;
          font-weight: 700;
          background: linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 1rem;
        }

        .sub-title {
          font-size: 1.2rem;
          color: #666;
          max-width: 600px;
          margin: 0 auto;
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 2rem;
          padding: 2rem 0;
        }

        .product-item {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .product-item:hover {
          transform: translateY(-10px);
          box-shadow: 0 12px 30px rgba(46, 125, 50, 0.2);
        }

        .image-wrapper {
          width: 100%;
          height: 250px;
          overflow: hidden;
          background: #f5f5f5;
          cursor: pointer;
        }

        .placeholder-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%);
          font-weight: 600;
          color: #2e7d32;
        }

        .product-info {
          padding: 1.5rem;
        }

        .item-name {
          font-size: 1.3rem;
          font-weight: 600;
          color: #2e7d32;
          margin-bottom: 0.5rem;
          cursor: pointer;
        }

        .item-name:hover {
          color: #1b5e20;
        }

        .item-unit {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .item-price {
          font-size: 1.5rem;
          font-weight: 700;
          color: #2e7d32;
          margin: 1rem 0;
        }

        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 1rem 0;
        }

        .quantity-controls button {
          width: 35px;
          height: 35px;
          border: 2px solid #2e7d32;
          background: white;
          color: #2e7d32;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1.2rem;
          transition: all 0.3s ease;
        }

        .quantity-controls button:hover {
          background: #2e7d32;
          color: white;
        }

        .quantity-controls span {
          font-size: 1.2rem;
          font-weight: 600;
          min-width: 30px;
          text-align: center;
        }

        .add-to-cart-btn {
          width: 100%;
          padding: 0.8rem;
          background: linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .add-to-cart-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 5px 15px rgba(46, 125, 50, 0.3);
        }

        @media (max-width: 768px) {
          .product-grid {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 1.5rem;
          }

          .main-title {
            font-size: 2rem;
          }
        }
      `}</style>
    </ShopLayout>
  );
}
