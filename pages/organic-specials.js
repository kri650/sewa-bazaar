"use client";
import React, { useState } from "react";
import ShopLayout from './components/ShopLayout';

const organicSpecials = [
  { id: 1, name: 'Organic Honey Jar', price: 299.00, size: '250 GM', image: 'data:image/jpeg;base64,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', description: 'Pure forest honey, unprocessed and full of natural enzymes.' },
  { id: 2, name: 'Cold-Pressed Mustard Oil', price: 399.00, size: '500 ML', image: 'data:image/jpeg;base64,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', description: 'Traditional wood-pressed oil, keeping nutrients intact.' },
  { id: 3, name: 'Handmade Aloe Vera Soap', price: 99.00, size: '100 GM', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwBTOGJs5Evka4o8m-NK_7Q2osGWY9A5P_BA&s', description: 'Chemical-free handmade soap with organic essential oils.' },
  { id: 4, name: 'Organic Desi Jaggery', price: 89.00, size: '250 GM', image: 'data:image/jpeg;base64,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', description: 'Traditional gur made from organic sugarcane juice.' },
];

export default function OrganicSpecials() {
  // Independent quantity state for each special item
  const [quantities, setQuantities] = useState(
    organicSpecials.reduce((acc, product) => ({ ...acc, [product.id]: 1 }), {})
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
        {/* 🟢 Standardized Centered Heading Section */}
        <div className="page-header">
          <h1 className="main-heading">Organic Specials</h1>
          <p className="sub-heading">Organic Specials: Curated speciality items for a healthier pantry and natural lifestyle.</p>
        </div>

        {/* 🟢 Product Grid */}
        <div className="product-grid">
          {organicSpecials.map((item) => {
            const currentQty = quantities[item.id];
            // ⭐ LIVE PRICE CALCULATION
            const totalAmount = (item.price * currentQty).toFixed(2);

            return (
              <div className="product-card" key={item.id}>
                <div className="img-holder">
                  <img src={item.image} alt={item.description || item.name} />
                </div>
                
                <h4 className="p-title">{item.name}</h4>
                <p className="p-description">{item.description}</p>
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
          /* Fix: Footer background visibility */
          body { 
            margin: 0; 
            font-family: 'Inter', sans-serif; 
          }

          .category-page-container { 
            max-width: 1400px; 
            margin: 0 auto; 
            padding: 60px 5%; 
            min-height: 70vh; 
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
            max-width: 800px;
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
            height: 200px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            margin-bottom: 15px; 
          }

          .img-holder img { 
            max-height: 100%; 
            max-width: 100%; 
            object-fit: contain; 
            border-radius: 8px;
          }

          .p-title { 
            font-size: 16px; 
            font-weight: 600; 
            color: #444; 
            height: 40px; 
            margin: 5px 0; 
          }

          .p-description {
            font-size: 13px;
            color: #666;
            margin: 6px 0 6px;
            min-height: 36px;
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

          .add-to-cart-btn:hover { background: #5a8d2a; }
        `}</style>
      </div>
    </ShopLayout>
  );
}