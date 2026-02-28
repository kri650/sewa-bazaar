"use client";
import { useState } from 'react';
import ShopLayout from './components/ShopLayout';

const farmFreshProducts = [
  { id: 1, name: 'Farm Fresh Veg Combo', price: 199.00, size: '2 KG', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600', description: 'Seasonal vegetable combo with the freshest picks.' },
  { id: 2, name: 'Organic Greens Box', price: 149.00, size: '500 GM', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600', description: 'Baby spinach, lettuce and herbs for salads.' },
  { id: 3, name: 'Local Radish Pack', price: 69.00, size: '500 GM', image: 'https://images.unsplash.com/photo-1584306670957-99e1e9c3f64f?w=600', description: 'Crisp radishes with a peppery bite.' },
  { id: 4, name: 'Heirloom Tomatoes', price: 120.00, size: '500 GM', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600', description: 'Flavorful heirloom varieties for cooking.' },
  { id: 5, name: 'Organic Cucumber', price: 85.00, unit: '500 GM', image: 'https://images.unsplash.com/photo-1449339043519-7d3a95baf2d1?w=600', description: 'Crisp cucumbers, great for salads.' },
  { id: 6, name: 'Fresh Zucchini', price: 79.00, unit: '500 GM', image: 'https://images.unsplash.com/photo-1592394933325-10d7559893b3?w=600', description: 'Tender zucchinis, perfect for grilling.' },
];

export default function FarmFreshPicks() {
  // Independent quantity state for each product
  const [quantities, setQuantities] = useState(
    farmFreshProducts.reduce((acc, p) => ({ ...acc, [p.id]: 1 }), {})
  );

  const updateQty = (id, delta) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, prev[id] + delta)
    }));
  };

  return (
    <ShopLayout>
      <div className="farm-fresh-container">
        {/* 🟢 Centered Header (Same as your other pages) */}
        <div className="page-header">
          <h1 className="main-heading">Farm Fresh Picks</h1>
          <p className="sub-heading">Picked daily from local farms — freshness guaranteed.</p>
          <div className="explore-links">
             Explore: <a href="/farm-fresh-picks/vegetables">Vegetables</a> · <a href="/farm-fresh-picks/fruits">Fruits</a>
          </div>
        </div>

        {/* 🟢 Product Grid (Consistent Card Sizes) */}
        <div className="product-grid">
          {farmFreshProducts.map((p) => {
            const currentQty = quantities[p.id];
            // ⭐ LIVE PRICE CALCULATION: Price * Quantity
            const totalAmount = (p.price * currentQty).toFixed(2);

            return (
              <div className="product-card" key={p.id}>
                <div className="img-holder">
                  <img src={p.image} alt={p.name} />
                </div>
                
                <h4 className="p-title">{p.name}</h4>
                <div className="p-amount">Rs. {totalAmount}</div>
                <div className="p-unit-badge">{p.size || p.unit}</div>

                {/* Quantity Picker */}
                <div className="qty-picker">
                  <button onClick={() => updateQty(p.id, -1)}>-</button>
                  <input type="text" value={currentQty} readOnly />
                  <button onClick={() => updateQty(p.id, 1)}>+</button>
                </div>
                
                {/* Green Add to Cart Button */}
                <button className="add-to-cart-btn" onClick={() => console.log('Added:', p.name)}>
                  Add to Cart
                </button>
              </div>
            );
          })}
        </div>

        <style jsx global>{`
          .farm-fresh-container { 
            max-width: 1400px; 
            margin: 0 auto; 
            padding: 60px 5%; 
          }

          .page-header { text-align: center; margin-bottom: 50px; }
          .main-heading { font-size: 36px; font-weight: 800; color: #333; margin-bottom: 8px; }
          .sub-heading { font-size: 15px; color: #777; }
          .explore-links { margin-top: 15px; font-size: 14px; }
          .explore-links a { color: #6aa333; text-decoration: none; font-weight: 600; }

          .product-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); 
            gap: 30px; 
          }

          .product-card { 
            border: 1px solid #f2f2f2; 
            border-radius: 12px; 
            padding: 20px; 
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
            height: 180px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            margin-bottom: 15px; 
          }
          .img-holder img { max-height: 100%; max-width: 100%; object-fit: contain; }

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
  )
}