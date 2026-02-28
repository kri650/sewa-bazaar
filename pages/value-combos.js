"use client";
import React, { useState } from "react";
import ShopLayout from './components/ShopLayout';

const valueCombos = [
  { id: 1, name: 'Family Veg Combo', price: 399.00, size: '5 KG', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600', description: 'Balanced selection of everyday vegetables for a family of 4.' },
  { id: 2, name: 'Breakfast Bundle', price: 249.00, size: 'Various', image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600', description: 'Cereal, milk alternatives and fresh fruits to start your day.' },
  { id: 3, name: 'Protein Pack', price: 499.00, size: 'Mixed', image: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=600', description: 'Nuts, pulses and protein-rich produce for active lifestyles.' },
  { id: 4, name: 'Weekly Pantry Saver', price: 599.00, size: 'Assorted', image: 'https://images.unsplash.com/photo-1506484334406-382bec6a1574?w=600', description: 'Staples and essentials to last the week.' },
  { id: 5, name: 'Veg + Fruit Combo', price: 449.00, size: 'Mixed', image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=600', description: 'A mix of fresh fruits and vegetables for balanced meals.' },
  { id: 6, name: 'Family Breakfast Pack', price: 349.00, size: 'Family Size', image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=600', description: 'Quick breakfast staples curated for families.' },
];

export default function ValueCombos() {
  // Independent quantity state for each combo pack
  const [quantities, setQuantities] = useState(
    valueCombos.reduce((acc, product) => ({ ...acc, [product.id]: 1 }), {})
  );

  const updateQty = (id, delta) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, prev[id] + delta)
    }));
  };

  return (
    <ShopLayout>
      <div className="category-page-container">
        {/* 🟢 Standard Centered Heading Section */}
        <div className="page-header">
          <h1 className="main-heading">Value Combos</h1>
          <p className="sub-heading">Smart bundles designed to help you save money while getting the highest quality farm-fresh nutrition.</p>
        </div>

        {/* 🟢 Product Grid */}
        <div className="product-grid">
          {valueCombos.map((item) => {
            const currentQty = quantities[item.id];
            // ⭐ LIVE PRICE CALCULATION: Numeric Price * Quantity
            const totalAmount = (item.price * currentQty).toFixed(2);

            return (
              <div className="product-card" key={item.id}>
                <div className="img-holder">
                  <img src={item.image} alt={item.name} />
                </div>
                
                <h4 className="p-title">{item.name}</h4>
                <div className="p-amount">Rs. {totalAmount}</div>
                <div className="p-unit-badge">{item.size}</div>

                {/* Quantity Picker */}
                <div className="qty-picker">
                  <button onClick={() => updateQty(item.id, -1)} aria-label="Decrease quantity">-</button>
                  <input type="text" value={currentQty} readOnly />
                  <button onClick={() => updateQty(item.id, 1)} aria-label="Increase quantity">+</button>
                </div>
                
                {/* Green Add to Cart Button */}
                <button className="add-to-cart-btn" onClick={() => console.log('Added:', item.name)}>
                  Add to Cart
                </button>
              </div>
            );
          })}
        </div>

        <style jsx global>{`
          body { 
            margin: 0; 
            font-family: 'Inter', sans-serif; 
            /* Removed background: #fff to keep footer background visible */
          }

          .category-page-container { 
            max-width: 1400px; 
            margin: 0 auto; 
            padding: 60px 5%; 
            min-height: 70vh; /* Pushes footer down */
          }

          .page-header { 
            text-align: center; 
            margin-bottom: 50px; 
          }

          .main-heading { 
            font-size: 36px; 
            font-weight: 800; 
            color: #333; 
            margin-bottom: 8px; 
          }

          .sub-heading {
            font-size: 15px;
            color: #777;
            max-width: 700px;
            margin: 0 auto;
          }

          .product-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); 
            gap: 30px; 
          }

          .product-card { 
            border: 1px solid #f2f2f2; 
            border-radius: 12px; 
            padding: 24px; 
            text-align: center; 
            display: flex; 
            flex-direction: column; 
            transition: all 0.3s ease;
            background: #fff;
          }

          .product-card:hover { 
            transform: translateY(-5px); 
            box-shadow: 0 12px 30px rgba(0,0,0,0.07); 
          }

          .img-holder { 
            height: 190px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            margin-bottom: 18px; 
          }
          .img-holder img { max-height: 100%; max-width: 100%; object-fit: contain; border-radius: 8px; }

          .p-title { font-size: 16px; font-weight: 600; color: #444; height: 40px; margin: 5px 0; }
          .p-amount { font-size: 18px; font-weight: 700; color: #111; margin-bottom: 6px; }

          .p-unit-badge { 
            font-size: 11px; 
            background: #f8f8f8;
            color: #888;
            padding: 4px 12px;
            border-radius: 4px;
            display: inline-block;
            align-self: center;
            margin-bottom: 22px;
            font-weight: bold;
          }

          .qty-picker { 
            display: flex; 
            border: 1px solid #e0e0e0; 
            border-radius: 6px; 
            overflow: hidden; 
            align-self: center; 
            margin-bottom: 18px; 
          }
          .qty-picker button { background: #fff; border: none; padding: 8px 15px; cursor: pointer; font-size: 18px; }
          .qty-picker input { width: 40px; text-align: center; border-left: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0; border-top: none; border-bottom: none; font-weight: 600; }

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
          .add-to-cart-btn:hover { background: #5a8d2a; }
        `}</style>
      </div>
    </ShopLayout>
  );
}