import React, { useState } from "react";
import { useRouter } from "next/router";
import ShopLayout from '../../components/ShopLayout';
import { useCart } from '../../contexts/CartContext';

const exoticProducts = [
  { id: 1, name: 'Rambutan Pack', price: 499.00, size: '500 GM', image: '/images/rambutan.jpg', description: 'Tropical rambutan with juicy flesh.' },
  { id: 2, name: 'Lychee Box', price: 549.00, size: '500 GM', image: '/images/lychee.jpg', description: 'Sweet and fragrant lychees.' },
  { id: 3, name: 'Mangosteen', price: 699.00, size: '500 GM', image: '/images/mangosteen.jpg', description: 'Exotic mangosteen with delicate tang.' },
  { id: 4, name: 'Longan', price: 429.00, size: '500 GM', image: '/images/longan.jpg', description: 'Sweet longan bites, great for snacking.' },
  { id: 5, name: 'Passion Fruit', price: 179.00, size: '6 pcs', image: '/images/passion-fruit.jpg', description: 'Tart and aromatic passion fruit.' },
  { id: 6, name: 'Starfruit (Carambola)', price: 229.00, size: '4 pcs', image: '/images/starfruit.jpg', description: 'Crunchy starfruit with a sweet-tart flavor.' },
];

export default function ExoticFruits() {
  const { addToCart } = useCart();
  const router = useRouter();
  
  const [quantities, setQuantities] = useState(
    exoticProducts.reduce((acc, product) => ({ ...acc, [product.id]: 1 }), {})
  );

  const updateQty = (id, delta) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, Math.min(10, prev[id] + delta))
    }));
  };

  const handleAddToCart = (product) => {
    const qty = quantities[product.id];
    addToCart({ ...product, quantity: qty });
    setQuantities(prev => ({ ...prev, [product.id]: 1 }));
  };

  return (
    <ShopLayout>
      <div className="categoryContainer">
        <div className="categoryHeader">
          <h1>Exotic Fruits</h1>
          <p className="categoryDescription">
            Handpicked exotic fruits sourced from reliable international growers — try something different today.
          </p>
        </div>

        <div className="productsGrid">
          {exoticProducts.map(product => (
            <div key={product.id} className="productCard">
              <div className="productImage">
                <img 
                  src={product.image} 
                  alt={product.name}
                  onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                />
              </div>
              <div className="productInfo">
                <h3 className="productName">{product.name}</h3>
                <p className="productDescription">{product.description}</p>
                <div className="productPrice">
                  ₹{product.price.toFixed(2)}
                  <span className="productUnit"> / {product.size}</span>
                </div>
                <div className="quantityControls">
                  <button onClick={() => updateQty(product.id, -1)}>−</button>
                  <input
                    type="number"
                    value={quantities[product.id]}
                    readOnly
                  />
                  <button onClick={() => updateQty(product.id, 1)}>+</button>
                </div>
                <button
                  className="addToCartBtn"
                  onClick={() => handleAddToCart(product)}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .categoryContainer {
          max-width: 1200px;
          margin: 2rem auto;
          padding: 2rem 1rem;
        }
        .categoryHeader {
          text-align: center;
          margin-bottom: 2rem;
        }
        .categoryHeader h1 {
          font-size: 2.5rem;
          color: #2c5f2d;
          margin-bottom: 0.5rem;
        }
        .categoryDescription {
          font-size: 1.1rem;
          color: #666;
        }
        .productsGrid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 2rem;
        }
        .productCard {
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          overflow: hidden;
          transition: box-shadow 0.3s ease;
          background: white;
          display: flex;
          flex-direction: column;
        }
        .productCard:hover {
          box-shadow: 0 4px 20px rgba(44,95,45,0.15);
        }
        .productImage {
          width: 100%;
          height: 250px;
          overflow: hidden;
          background: #f9f9f9;
        }
        .productImage img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        .productCard:hover .productImage img {
          transform: scale(1.05);
        }
        .productInfo {
          padding: 1.5rem;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .productName {
          font-size: 1.25rem;
          color: #2c5f2d;
          margin-bottom: 0.5rem;
        }
        .productDescription {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 1rem;
          flex: 1;
        }
        .productPrice {
          font-size: 1.5rem;
          color: #2c5f2d;
          font-weight: bold;
          margin-bottom: 1rem;
        }
        .productUnit {
          font-size: 0.9rem;
          color: #888;
        }
        .quantityControls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .quantityControls button {
          background: #2c5f2d;
          color: white;
          border: none;
          width: 35px;
          height: 35px;
          border-radius: 5px;
          font-size: 1.25rem;
          cursor: pointer;
          transition: background 0.3s ease;
        }
        .quantityControls button:hover {
          background: #1e4620;
        }
        .quantityControls input {
          width: 60px;
          text-align: center;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 1rem;
        }
        .addToCartBtn {
          width: 100%;
          padding: 0.75rem;
          background: #2c5f2d;
          color: white;
          border: none;
          border-radius: 5px;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.3s ease;
        }
        .addToCartBtn:hover {
          background: #1e4620;
        }
      `}</style>
    </ShopLayout>
  );
}
