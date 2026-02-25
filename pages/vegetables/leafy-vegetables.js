"use client";
import React, { useState } from "react";

const products = [
  { name: "Organic Spring Onion", price: 35.00, unit: "250 GM", image: "https://images.unsplash.com/photo-1582515073490-dc6c9c8b1a63?w=600", stock: 1 },
  { name: "Alu Paan", price: 20.00, unit: "5 LEAVES BUNCH", image: "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=600", stock: 1 },
  { name: "Organic Mint", price: 19.00, unit: "1 BUNCH", image: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=600", stock: 1 },
  { name: "Organic Coriander", price: 39.00, unit: "1 BUNCH", image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600", stock: 1 },
  { name: "Organic Spinach", price: 32.00, unit: "1 BUNCH", image: "https://images.unsplash.com/photo-1584306670957-99e1e9c3f64f?w=600", stock: 1 },
  { name: "Organic Fenugreek / Methi", price: 49.00, unit: "1 BUNCH", image: "https://images.unsplash.com/photo-1633436375794-12b3b0e54796?w=600", stock: 1 },
  { name: "Organic Dill Leaves", price: 35.00, unit: "1 BUNCH", image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600", stock: 1 },
  { name: "Organic Lemongrass", price: 19.00, unit: "1 BUNCH", image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600", stock: 0 },
];

export default function LeafyVegetablesPage() {
  const [qty, setQty] = useState(products.map(() => 1));

  const updateQty = (i, d) => {
    setQty(q => q.map((v, idx) => (idx === i ? Math.max(1, v + d) : v)));
  };

  return (
    <div className="site-wrapper">
      {/* 🟢 STICKY NAVBAR WRAPPER */}
      <div className="sticky-nav-container">
        {/* Top Header */}
        <header className="main-header">
          <div className="header-inner">
            <div className="logo-section">
              <img src="/logo.png" alt="Sewa Bazaar" className="logo" />
              <div className="logo-text">Sewa <br/> <span>Bazaar</span></div>
            </div>

            <div className="search-bar">
              <input type="text" placeholder="Go organic" />
              <button className="search-btn">Search</button>
            </div>

            <div className="header-info">
               <p>🕒 Mon-Fri 8:00 AM - 20:00 PM Saturday Closed</p>
               <p className="phone">📞 (+800) 111 2020, (+700) 353 44 555</p>
            </div>
          </div>
        </header>

        {/* Green Category Bar */}
        <nav className="category-nav">
          <div className="nav-links">
            <span className="active">VEGETABLES</span>
            <span>HYDROPONIC VEGGIES</span>
            <span>FRUITS</span>
            <span>GROCERY</span>
            <span>BEVERAGES</span>
            <span>READY TO EAT</span>
            <span>BREAKFAST</span>
            <span>BAKERY</span>
            <span>SNACKS</span>
            <span>MANGOES</span>
          </div>
        </nav>
      </div>

      {/* 🟢 MAIN CONTENT AREA */}
      <main className="product-listing-page">
        <div className="page-header-text">
            <nav className="breadcrumb">Home / Vegetables / Leafy Vegetables</nav>
            <h1 className="title">Leafy Vegetables</h1>
        </div>

        {/* Product Grid */}
        <div className="grid">
          {products.map((p, i) => {
            const isSoldOut = p.stock === 0;
            return (
              <div className="product-card" key={p.name}>
                <div className="image-box">
                  <img src={p.image} alt={p.name} />
                </div>
                <h4 className="p-title">{p.name}</h4>
                <div className="p-price">Rs. {p.price.toFixed(2)}</div>
                <div className="p-unit">{p.unit}</div>

                {!isSoldOut ? (
                  <>
                    <div className="qty-selector">
                      <button onClick={() => updateQty(i, -1)}>-</button>
                      <input type="text" value={qty[i]} readOnly />
                      <button onClick={() => updateQty(i, 1)}>+</button>
                    </div>
                    <button className="pick-btn">PICK NOW</button>
                  </>
                ) : (
                  <button className="sold-btn" disabled>SOLD OUT</button>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <style jsx global>{`
        body { margin: 0; font-family: 'Inter', sans-serif; background: #fff; }

        /* Sticky Logic */
        .sticky-nav-container {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }

        /* Top White Header */
        .main-header { padding: 12px 5%; border-bottom: 1px solid #f0f0f0; }
        .header-inner { max-width: 1400px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
        
        .logo-section { display: flex; align-items: center; gap: 8px; }
        .logo { height: 45px; }
        .logo-text { font-weight: 800; font-size: 16px; color: #6aa333; line-height: 1; text-transform: uppercase; }
        .logo-text span { color: #333; }

        .search-bar { display: flex; flex: 0 1 450px; margin: 0 20px; }
        .search-bar input { flex: 1; padding: 10px 20px; border: 1px solid #ddd; border-radius: 25px 0 0 25px; outline: none; background: #f9f9f9; }
        .search-bar .search-btn { background: #111; color: white; border: none; padding: 0 25px; border-radius: 0 25px 25px 0; cursor: pointer; font-weight: bold; }

        .header-info { font-size: 11px; color: #666; text-align: right; line-height: 1.4; }
        .header-info .phone { font-weight: bold; color: #333; font-size: 12px; }

        /* Green Bar */
        .category-nav { background: #6aa333; color: white; padding: 12px 0; }
        .nav-links { max-width: 1400px; margin: 0 auto; display: flex; gap: 20px; padding: 0 5%; font-size: 11px; font-weight: bold; white-space: nowrap; overflow-x: auto; }
        .nav-links span { cursor: pointer; border-bottom: 2px solid transparent; }
        .nav-links span.active, .nav-links span:hover { color: #ffeb3b; border-bottom: 2px solid #ffeb3b; }

        /* Main Content */
        .product-listing-page { max-width: 1400px; margin: 40px auto; padding: 0 5%; }
        .page-header-text { margin-bottom: 30px; }
        .breadcrumb { font-size: 12px; color: #888; margin-bottom: 8px; }
        .title { font-size: 32px; font-weight: 800; color: #333; margin: 0; }

        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 25px; }

        .product-card { border: 1px solid #f1f1f1; border-radius: 12px; padding: 20px; text-align: center; display: flex; flex-direction: column; transition: 0.3s; background: #fff; }
        .product-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.06); }

        .image-box { height: 160px; display: flex; align-items: center; justify-content: center; margin-bottom: 15px; }
        .image-box img { max-height: 100%; max-width: 100%; object-fit: contain; }

        .p-title { font-size: 15px; font-weight: 600; color: #444; height: 38px; margin: 5px 0; overflow: hidden; }
        .p-price { font-size: 18px; font-weight: 700; color: #000; margin-bottom: 5px; }
        .p-unit { font-size: 10px; border: 1px solid #eee; padding: 2px 10px; border-radius: 4px; display: inline-block; align-self: center; margin-bottom: 15px; color: #999; font-weight: bold; }

        .qty-selector { display: flex; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; align-self: center; margin-bottom: 15px; }
        .qty-selector button { background: #fff; border: none; padding: 6px 14px; cursor: pointer; font-size: 18px; }
        .qty-selector input { width: 35px; text-align: center; border-left: 1px solid #ddd; border-right: 1px solid #ddd; border-top: none; border-bottom: none; outline: none; font-weight: 600; }

        .pick-btn { background: #f29132; color: #fff; border: none; padding: 12px; border-radius: 6px; font-weight: bold; font-size: 13px; cursor: pointer; margin-top: auto; }
        .sold-btn { background: #8bc34a; color: #fff; border: none; padding: 12px; border-radius: 6px; font-weight: bold; opacity: 0.7; margin-top: auto; cursor: not-allowed; }
      `}</style>
    </div>
  );
}