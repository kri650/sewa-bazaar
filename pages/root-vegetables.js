"use client";
import React, { useState } from "react";

const products = [
  { id: 1, name: "Organic Beet Root", price: 25.00, unit: "250 GM", image: "data:image/jpeg;base64,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zp17DyXg6meg/sF7fhyGBzgQ11mNuC6NYGzBrO+g1Un7McI948RkaLyTYnpa8Lc472e1arjUNUEwAJEAATDWjYXPqVzybiPHDP8A5C3WYr5KA4ehFtYn7Qs1lCIG2vnClTfZ/XDpzMAG3ev5xZX6/YrFQABTI1+OI6Gy8+9cs/TxOktLgK7xAkO0s4f/AELhbLitCviKLqAaIqiOcEEGfKNeqysL2IxecSabG7nOXGPAAKa8C4IMO05qjqjjbM4AW5Abf8KuHjX7xNo8heu9+uc8J7M4ynEPdbSwt4KZ8OwuMaLu9YUrVQF6+3WbzLRUcJXac2WlmOrson1WfSbW+YU/qs9E2jbQ8T4ThqzclfD0yDvlHqHCC09QVHuC4V/C8UzDZ3PwmKcRRc67qVWC73RPzAgGHHlz1nlWmHCCJUZ7TiP2WkLuOIY4DeGSSfASJ6KExM/CUNKqvLF6RURUlVQEREBERAREQEREBERAREQWcRRzCFFONdjBWm/NTCFVExOnDuK+zGu0k0i4C+9teS1Z7B44bu9AvoSF592FMr/kl8/t7CcQPzuHgGrY4H2bYskF9R3mf1XcMgVQ0JtH5JQvgHY73MZnKXYehlEK+ihWZ2pCQqoiFIVYREBERAREQeXui653xDtfhqHEqjsTUNMUqLWMaWvdmL3Fxc2AdgRPVdFcJWO7AUyZLGk8y1pPqRKLROkUw3tBo1f4OHxlT/pougzpfRbOlxbFVAMmCe2d69VlPyhud30C34YgaiPGu4Xhq4l1eoHOdoxgimwTo2e8483E35DRbMIiIEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREH/2Q==" },
  { id: 2, name: "Organic Carrot", price: 32.00, unit: "250 GM", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSsTNLQ1OjCAAl7Z643QjxAx7z-r-9mc12BoA&s" },
  { id: 3, name: "Organic Onion", price: 52.00, unit: "1 KG", image: "data:image/jpeg;base64,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" },
  { id: 4, name: "Organic Radish", price: 22.00, unit: "250 GM", image: "data:image/jpeg;base64,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" },
  { id: 5, name: "Organic Sweet Potato", price: 40.00, unit: "500 GM", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQDUpweRO33-Ol92UqrWcih3n1AQYG-zejGA&s" },
  { id: 6, name: "Organic Potato", price: 38.00, unit: "1 KG", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwx2d7I9dOsvnS7eFadBvbv5SqAVATsCGHDQ&s" },
  { id: 7, name: "Organic Ginger", price: 45.00, unit: "100 GM", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSlOOp2F1ZxOp39ggnd_NLsrgSs8sO6Aw5-Pg&s" },
  { id: 8, name: "Organic Garlic", price: 60.00, unit: "200 GM", image: "data:image/jpeg;base64,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" },
];

export default function RootVegetablesPage() {
  // Independent quantity state for each root vegetable card
  const [quantities, setQuantities] = useState(
    products.reduce((acc, product) => ({ ...acc, [product.id]: 1 }), {})
  );

  const updateQty = (id, delta) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, prev[id] + delta)
    }));
  };

  return (
    <div className="root-page-layout">
      {/* 🟢 Centered Header Area */}
      <div className="header-section">
        <h1 className="header-title">Root Vegetables</h1>
        <p className="header-subtitle">Fresh, nutrient-dense root and tuber varieties delivered from the farm.</p>
      </div>

      {/* 🟢 Product Listing Grid */}
      <div className="product-grid">
        {products.map((p) => {
          const currentQty = quantities[p.id];
          const calculatedPrice = (p.price * currentQty).toFixed(2); // Dynamic amount calculation

          return (
            <div className="root-card" key={p.id}>
              <div className="image-holder">
                <img src={p.image} alt={p.name} />
              </div>
              
              <h4 className="p-title">{p.name}</h4>
              <div className="p-price">Rs. {calculatedPrice}</div>
              <div className="p-unit-tag">{p.unit}</div>

              {/* Quantity Picker */}
              <div className="qty-picker">
                <button onClick={() => updateQty(p.id, -1)}>-</button>
                <input type="text" value={currentQty} readOnly />
                <button onClick={() => updateQty(p.id, 1)}>+</button>
              </div>
              
              {/* Green "Add to Cart" button */}
              <button className="add-cart-btn">Add to Cart</button>
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        body { margin: 0; font-family: 'Inter', sans-serif; background: #fff; }

        .root-page-layout { 
          max-width: 1400px; 
          margin: 0 auto; 
          padding: 60px 5%; 
        }

        .header-section { 
          text-align: center; 
          margin-bottom: 50px; 
        }

        .header-title { 
          font-size: 34px; 
          font-weight: 800; 
          color: #333; 
          margin-bottom: 8px; 
        }

        .header-subtitle {
          font-size: 14px;
          color: #777;
        }

        .product-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); 
          gap: 30px; 
        }

        .root-card { 
          border: 1px solid #f2f2f2; 
          border-radius: 12px; 
          padding: 20px; 
          text-align: center; 
          display: flex; 
          flex-direction: column; 
          transition: all 0.3s ease;
          background: #fff;
        }

        .root-card:hover { 
          transform: translateY(-5px); 
          box-shadow: 0 12px 30px rgba(0,0,0,0.07); 
        }

        .image-holder { 
          height: 180px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          margin-bottom: 15px; 
        }

        .image-holder img { max-height: 100%; max-width: 100%; object-fit: contain; }

        .p-title { font-size: 15px; font-weight: 600; color: #444; height: 40px; margin: 5px 0; }
        .p-price { font-size: 18px; font-weight: 700; color: #111; margin-bottom: 6px; }

        .p-unit-tag { 
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

        .add-cart-btn { 
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

        .add-cart-btn:hover { background: #5a8d2a; }
      `}</style>
    </div>
  );
}