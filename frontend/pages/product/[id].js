"use client";
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import ShopLayout from '../../components/ShopLayout';
import { useCart } from '../../contexts/CartContext';

// All product data from homepage
const allProducts = [
  // Fresh Vegetables
  { id: 'fresh-tomato', name: 'Fresh Tomato', price: 32.00, size: '500 GM', image: 'https://unsplash.com/photos/YfLRk4RtRcU/download?force=true', category: 'Vegetables', description: 'Farm-fresh tomatoes, rich in lycopene and perfect for salads, curries, and sauces. Handpicked daily from organic farms.' },
  { id: 'organic-potato', name: 'Organic Potato', price: 50.00, size: '1 KG', image: 'https://unsplash.com/photos/jJUuF4hqCQM/download?force=true', category: 'Vegetables', description: 'Premium quality organic potatoes, perfect for all your cooking needs. Rich in nutrients and free from chemicals.' },
  { id: 'green-capsicum', name: 'Green Capsicum', price: 42.00, size: '500 GM', image: 'https://unsplash.com/photos/3N_znw90QlU/download?force=true', category: 'Vegetables', description: 'Crisp and fresh green capsicum, loaded with vitamins and antioxidants. Great for stir-fries and salads.' },
  { id: 'red-onion', name: 'Red Onion', price: 52.00, size: '1 KG', image: 'https://unsplash.com/photos/SQ51rwKOi9s/download?force=true', category: 'Vegetables', description: 'Fresh red onions, essential for Indian cooking. Strong flavor and aroma, perfect for curries and gravies.' },
  { id: 'fresh-carrot', name: 'Fresh Carrot', price: 48.00, size: '500 GM', image: 'https://unsplash.com/photos/R198mTymEFQ/download?force=true', category: 'Vegetables', description: 'Sweet and crunchy carrots, packed with beta-carotene and vitamins. Great for salads, juices, and cooking.' },
  { id: 'cucumber', name: 'Cucumber', price: 36.00, size: '500 GM', image: 'https://unsplash.com/photos/puMz26-ub30/download?force=true', category: 'Vegetables', description: 'Refreshing and hydrating cucumbers, perfect for salads and raitas. Low in calories and high in water content.' },
  { id: 'bottle-gourd', name: 'Bottle Gourd', price: 44.00, size: '1 KG', image: 'https://unsplash.com/photos/jS02QWnPOAA/download?force=true', category: 'Vegetables', description: 'Fresh bottle gourd, known for its health benefits and cooling properties. Perfect for traditional Indian dishes.' },
  { id: 'lady-finger', name: 'Lady Finger', price: 40.00, size: '500 GM', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThiXMjOAHWxGVinoRCv4I0Wmo8tUQ39z-Y_4O0xgCsFHxJWQF6vipyVyReKd5ATUOTIRXdMr99vyvbcn5KfJZerlzD6gt7ps6IvVd2ltPJ&s=10', category: 'Vegetables', description: 'Tender and fresh okra (lady finger), rich in fiber and vitamins. Perfect for bhindi masala and stir-fries.' },
  { id: 'cauliflower', name: 'Cauliflower', price: 38.00, size: '1 PC', image: 'https://unsplash.com/photos/PT-GXFtQj-s/download?force=true', category: 'Vegetables', description: 'Fresh white cauliflower, versatile and nutritious. Great for curries, parathas, and healthy snacks.' },
  { id: 'cabbage', name: 'Cabbage', price: 30.00, size: '1 PC', image: 'https://unsplash.com/photos/5MU_4hPl67Y/download?force=true', category: 'Vegetables', description: 'Crisp green cabbage, loaded with vitamins K and C. Perfect for salads, sabzi, and momos.' },
  { id: 'spinach', name: 'Spinach', price: 25.00, size: '250 GM', image: 'https://unsplash.com/photos/4jpNPu7IW8k/download?force=true', category: 'Leafy Greens', description: 'Fresh organic spinach, rich in iron and nutrients. Perfect for palak paneer, soups, and smoothies.' },
  { id: 'beetroot', name: 'Beetroot', price: 40.00, size: '500 GM', image: 'https://unsplash.com/photos/eZBVfr8EpaA/download?force=true', category: 'Vegetables', description: 'Fresh beetroot, packed with antioxidants and fiber. Great for salads, juices, and healthy snacks.' },
  
  // Fruits
  { id: 'banana', name: 'Banana', price: 60.00, size: '1 DOZEN', image: 'https://unsplash.com/photos/Kl3467edwsE/download?force=true', category: 'Fruits', description: 'Fresh ripe bananas, rich in potassium and natural energy. Perfect for breakfast and snacks.' },
  { id: 'apple', name: 'Apple', price: 180.00, size: '1 KG', image: 'https://unsplash.com/photos/zLCR7RsxYGs/download?force=true', category: 'Fruits', description: 'Crisp and juicy red apples, packed with fiber and vitamins. An apple a day keeps the doctor away!' },
  { id: 'orange', name: 'Orange', price: 120.00, size: '1 KG', image: 'https://unsplash.com/photos/SOdyjl7A0Qk/download?force=true', category: 'Fruits', description: 'Sweet and tangy oranges, loaded with vitamin C. Perfect for fresh juice and healthy snacking.' },
  { id: 'pomegranate', name: 'Pomegranate', price: 220.00, size: '1 KG', image: 'https://unsplash.com/photos/XiWQbLEhFyo/download?force=true', category: 'Fruits', description: 'Ruby red pomegranates, rich in antioxidants. Enjoy the sweet-tart flavor and health benefits.' },
  { id: 'papaya', name: 'Papaya', price: 80.00, size: '1 KG', image: 'https://unsplash.com/photos/RC6RbCzw_lg/download?force=true', category: 'Fruits', description: 'Sweet and ripe papaya, rich in papain enzyme and vitamins. Great for digestion and skin health.' },
  { id: 'watermelon', name: 'Watermelon', price: 35.00, size: '1 KG', image: 'https://unsplash.com/photos/izi5AnlbRIA/download?force=true', category: 'Fruits', description: 'Juicy and refreshing watermelon, perfect for summer. Hydrating and naturally sweet.' },
  { id: 'grapes', name: 'Grapes', price: 95.00, size: '500 GM', image: 'https://unsplash.com/photos/KyFEImlFKQY/download?force=true', category: 'Fruits', description: 'Sweet green grapes, seedless and fresh. Perfect for snacking and fruit salads.' },
  { id: 'mango', name: 'Mango', price: 210.00, size: '1 KG', image: 'https://unsplash.com/photos/7iLlgS5o09c/download?force=true', category: 'Fruits', description: 'Premium Alphonso mangoes, the king of fruits. Sweet, juicy, and aromatic.' },
  { id: 'guava', name: 'Guava', price: 90.00, size: '1 KG', image: 'https://unsplash.com/photos/vUlr2F01z-o/download?force=true', category: 'Fruits', description: 'Fresh guavas, rich in vitamin C and dietary fiber. Great for health and immunity.' },
  { id: 'pineapple', name: 'Pineapple', price: 70.00, size: '1 PC', image: 'https://unsplash.com/photos/Cr9hZrpC1Oc/download?force=true', category: 'Fruits', description: 'Sweet and tangy pineapple, loaded with enzymes and vitamins. Perfect for desserts and smoothies.' },
  { id: 'muskmelon', name: 'Muskmelon', price: 55.00, size: '1 KG', image: 'https://unsplash.com/photos/PIybW7_fg1U/download?force=true', category: 'Fruits', description: 'Sweet and aromatic muskmelon, perfect for summer. Refreshing and hydrating.' },
  { id: 'kiwi', name: 'Kiwi', price: 140.00, size: '500 GM', image: 'https://unsplash.com/photos/wds9ue_gops/download?force=true', category: 'Fruits', description: 'Exotic kiwi fruits, rich in vitamin C and antioxidants. Tangy and delicious.' },
  
  // Other products (combos, best sellers, etc. - shortened for space)
  { id: 'seasonal-veg-combo', name: 'Seasonal Veg Combo', price: 199.00, size: '2 KG', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQL3Evx-3CrwP-gEBdpeUbxguBnZXuserSqzg&s', category: 'Combos', description: 'Curated selection of fresh seasonal vegetables. Great value pack for your daily cooking needs.' },
  { id: 'organic-apple-box', name: 'Organic Apple Box', price: 399.00, size: '2 KG', image: 'https://unsplash.com/photos/kbi-wnPrOMI/download?force=true', category: 'Fruits', description: 'Premium organic apples, crisp and sweet. Perfect for the whole family. 100% chemical-free.' },
  
  // Gourds and Pumpkin
  { id: '1', name: "Bottle Gourd", price: 40.00, size: "1 PC (Approx 1KG)", image: "data:image/jpeg;base64,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", category: 'Vegetables', description: 'Fresh bottle gourd delivered directly from farms, known for its cooling properties and health benefits.' },
  { id: '2', name: "Bitter Gourd", price: 60.00, size: "500 GM", image: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/...", category: 'Vegetables', description: 'Organically grown bitter gourd, rich in nutrients and perfect for healthy cooking.' },
  { id: '3', name: "Ridge Gourd", price: 55.00, size: "500 GM", image: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/...", category: 'Vegetables', description: 'Fresh ridge gourd, ideal for traditional dishes and known for its nutritional value.' },
  { id: '4', name: "Yellow Pumpkin", price: 45.00, size: "1 KG", image: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/...", category: 'Vegetables', description: 'Sweet and fresh yellow pumpkin, perfect for curries, soups, and healthy dishes.' },
  { id: '5', name: "Snake Gourd", price: 50.00, size: "500 GM", image: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/...", category: 'Vegetables', description: 'Fresh snake gourd, a nutritious vegetable perfect for traditional cooking.' },
  { id: '6', name: "Sponge Gourd", price: 48.00, size: "500 GM", image: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/...", category: 'Vegetables', description: 'Fresh sponge gourd, light and healthy vegetable for everyday cooking.' },
  { id: '7', name: "Ash Gourd", price: 35.00, size: "1 KG", image: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/...", category: 'Vegetables', description: 'Fresh ash gourd, known for its cooling properties and health benefits.' },
  { id: '8', name: "Ivy Gourd", price: 40.00, size: "500 GM", image: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/...", category: 'Vegetables', description: 'Fresh ivy gourd, perfect for stir-fries and traditional dishes.' },
];

// Sample reviews
const sampleReviews = [
  { id: 1, name: 'Priya Sharma', rating: 5, date: '2 days ago', comment: 'Excellent quality! Fresh and exactly as described. Will order again!', avatar: 'https://i.pravatar.cc/150?img=1' },
  { id: 2, name: 'Rajesh Kumar', rating: 5, date: '1 week ago', comment: 'Very fresh and delivered on time. Great service!', avatar: 'https://i.pravatar.cc/150?img=12' },
  { id: 3, name: 'Anita Desai', rating: 4, date: '2 weeks ago', comment: 'Good quality product. Packaging could be better.', avatar: 'https://i.pravatar.cc/150?img=5' },
  { id: 4, name: 'Amit Patel', rating: 5, date: '3 weeks ago', comment: 'Best organic produce! Highly recommended.', avatar: 'https://i.pravatar.cc/150?img=13' },
];

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    if (id) {
      const found = allProducts.find(p => p.id === id);
      if (found) {
        setProduct({
          ...found,
          inStock: true,
          reviews: sampleReviews,
          rating: 4.8,
          totalReviews: sampleReviews.length
        });
      }
      setLoading(false);
    }
  }, [id]);

  const updateQty = (delta) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      alert(`Added ${quantity} x ${product.name} to cart!`);
    }
  };

  const formatRupees = (amount) => `Rs. ${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < Math.floor(rating) ? '#ffc107' : '#ddd' }}>★</span>
    ));
  };

  if (loading) {
    return (
      <ShopLayout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading product...</p>
        </div>
      </ShopLayout>
    );
  }

  if (!product) {
    return (
      <ShopLayout>
        <div className="error-container">
          <h2>Product Not Found</h2>
          <p>Sorry, we couldn't find this product.</p>
          <button onClick={() => router.push('/')}>Back to Home</button>
        </div>
      </ShopLayout>
    );
  }

  const totalAmount = product.price * quantity;

  return (
    <ShopLayout>
      <div className="product-detail-page">
        <div className="product-detail-container">
          {/* Breadcrumb */}
          <div className="breadcrumb">
            <span onClick={() => router.push('/')}>Home</span>
            <span> / </span>
            <span>Products</span>
            <span> / </span>
            <span className="current">{product.name}</span>
          </div>

          {/* Main Product Section */}
          <div className="product-main-section">
            <div className="product-image-section">
              <img src={product.image} alt={product.name} className="main-product-image" />
            </div>

            <div className="product-info-section">
              <h1 className="product-title">{product.name}</h1>
              
              <div className="product-meta">
                <span className="category-badge">{product.category}</span>
                <span className="stock-badge in-stock">✓ In Stock</span>
              </div>

              {/* Rating */}
              <div className="product-rating">
                <div className="stars-large">
                  {renderStars(product.rating)}
                  <span className="rating-text">{product.rating} ({product.totalReviews} reviews)</span>
                </div>
              </div>

              <div className="product-price-section">
                <div className="price-info">
                  <span className="price">{formatRupees(totalAmount)}</span>
                  <span className="unit-info">{product.size}</span>
                </div>
                <div className="price-per-unit">
                  {formatRupees(product.price)} per {product.size}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="quantity-section">
                <label>Quantity:</label>
                <div className="qty-picker-large">
                  <button onClick={() => updateQty(-1)}>−</button>
                  <input type="text" value={quantity} readOnly />
                  <button onClick={() => updateQty(1)}>+</button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <button className="add-to-cart-btn-large" onClick={handleAddToCart}>
                  🛒 Add to Cart
                </button>
                <button className="buy-now-btn">Buy Now</button>
              </div>

              {/* Features */}
              <div className="product-features">
                <div className="feature-item">
                  <span className="feature-icon">🌱</span>
                  <div>
                    <strong>100% Organic</strong>
                    <p>Certified organic</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🚚</span>
                  <div>
                    <strong>Free Delivery</strong>
                    <p>Orders above Rs. 500</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✅</span>
                  <div>
                    <strong>Quality Assured</strong>
                    <p>Farm-fresh guarantee</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="product-tabs-section">
            <div className="tabs-header">
              <button 
                className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
                onClick={() => setActiveTab('description')}
              >
                Description
              </button>
              <button 
                className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                Reviews ({product.totalReviews})
              </button>
              <button 
                className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveTab('info')}
              >
                Additional Info
              </button>
            </div>

            <div className="tabs-content">
              {activeTab === 'description' && (
                <div className="tab-panel">
                  <h3>Product Description</h3>
                  <p>{product.description}</p>
                  <h4>Benefits:</h4>
                  <ul>
                    <li>100% Fresh and Organic</li>
                    <li>No Chemical Pesticides</li>
                    <li>Directly from Certified Farms</li>
                    <li>Rich in Essential Nutrients</li>
                  </ul>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="tab-panel reviews-panel">
                  <div className="reviews-summary">
                    <div className="rating-overview">
                      <div className="rating-number">{product.rating}</div>
                      <div className="rating-stars">{renderStars(product.rating)}</div>
                      <div className="rating-count">Based on {product.totalReviews} reviews</div>
                    </div>
                  </div>

                  <div className="reviews-list">
                    {product.reviews.map((review) => (
                      <div key={review.id} className="review-item">
                        <div className="review-header">
                          <img src={review.avatar} alt={review.name} className="review-avatar" />
                          <div className="review-info">
                            <div className="review-name">{review.name}</div>
                            <div className="review-meta">
                              <span className="review-stars">{renderStars(review.rating)}</span>
                              <span className="review-date">{review.date}</span>
                            </div>
                          </div>
                        </div>
                        <p className="review-comment">{review.comment}</p>
                      </div>
                    ))}
                  </div>

                  <button className="write-review-btn">Write a Review</button>
                </div>
              )}

              {activeTab === 'info' && (
                <div className="tab-panel">
                  <h3>Additional Information</h3>
                  <table className="info-table">
                    <tbody>
                      <tr>
                        <td><strong>Product ID:</strong></td>
                        <td>{product.id}</td>
                      </tr>
                      <tr>
                        <td><strong>Category:</strong></td>
                        <td>{product.category}</td>
                      </tr>
                      <tr>
                        <td><strong>Size:</strong></td>
                        <td>{product.size}</td>
                      </tr>
                      <tr>
                        <td><strong>Storage:</strong></td>
                        <td>Store in a cool, dry place</td>
                      </tr>
                      <tr>
                        <td><strong>Origin:</strong></td>
                        <td>India - Organic Farms</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <style jsx global>{`
          /* ============================================
             PROFESSIONAL PRODUCT DETAIL PAGE STYLING
             ============================================ */

          * {
            box-sizing: border-box;
          }

          .product-detail-page {
            max-width: 1400px;
            margin: 0 auto;
            padding: 24px 20px;
            background: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
          }

          .product-detail-container {
            background: #ffffff;
          }

          /* Breadcrumb Navigation */
          .breadcrumb {
            font-size: 13px;
            color: #565959;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 6px;
            font-weight: 400;
            letter-spacing: 0.2px;
          }

          .breadcrumb span {
            cursor: pointer;
            transition: color 0.15s ease;
          }

          .breadcrumb span:hover:not(.current) {
            color: #c45500;
            text-decoration: underline;
          }

          .breadcrumb .current {
            color: #0F1111;
            font-weight: 500;
            cursor: default;
          }

          /* Main Product Section */
          .product-main-section {
            display: grid;
            grid-template-columns: 45% 1fr;
            gap: 40px;
            padding: 20px 0;
            border-bottom: 1px solid #e7e7e7;
            margin-bottom: 40px;
          }

          .product-image-section {
            position: sticky;
            top: 80px;
            height: fit-content;
            padding: 20px;
            background: #ffffff;
            border: 1px solid #ddd;
            border-radius: 4px;
          }

          .main-product-image {
            width: 100%;
            height: auto;
            max-height: 600px;
            object-fit: contain;
            display: block;
          }

          .product-info-section {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .product-title {
            font-size: 28px;
            font-weight: 400;
            color: #0F1111;
            margin: 0;
            line-height: 1.3;
            letter-spacing: 0.3px;
          }

          /* Product Meta Information */
          .product-meta {
            display: flex;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;
          }

          .category-badge {
            padding: 4px 10px;
            background: #F0F2F2;
            color: #0F1111;
            font-size: 12px;
            font-weight: 500;
            border-radius: 2px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .stock-badge {
            padding: 4px 10px;
            font-size: 12px;
            font-weight: 600;
            border-radius: 2px;
          }

          .stock-badge.in-stock {
            background: #F0F8F7;
            color: #007600;
          }

          /* Rating Section */
          .product-rating {
            padding: 8px 0;
            border-bottom: 1px solid #e7e7e7;
          }

          .stars-large {
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .stars-large span {
            font-size: 20px;
            letter-spacing: 1px;
          }

          .rating-text {
            font-size: 14px !important;
            color: #007185;
            margin-left: 6px;
            cursor: pointer;
            text-decoration: none;
            font-weight: 400;
          }

          .rating-text:hover {
            color: #c45500;
            text-decoration: underline;
          }

          /* Price Section */
          .product-price-section {
            padding: 16px 0;
            border-bottom: 1px solid #e7e7e7;
          }

          .price-info {
            display: flex;
            align-items: baseline;
            gap: 8px;
            margin-bottom: 4px;
          }

          .price {
            font-size: 28px;
            font-weight: 400;
            color: #B12704;
            letter-spacing: -0.5px;
          }

          .unit-info {
            font-size: 13px;
            color: #565959;
            font-weight: 400;
          }

          .price-per-unit {
            font-size: 12px;
            color: #565959;
            margin-top: 2px;
          }

          /* Quantity Section */
          .quantity-section {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 0;
          }

          .quantity-section label {
            font-weight: 600;
            color: #0F1111;
            font-size: 14px;
          }

          .qty-picker-large {
            display: flex;
            align-items: center;
            border: 1px solid #D5D9D9;
            border-radius: 8px;
            background: #F0F2F2;
            overflow: hidden;
            box-shadow: 0 2px 5px rgba(15, 17, 17, 0.15);
          }

          .qty-picker-large button {
            width: 40px;
            height: 40px;
            border: none;
            background: #F0F2F2;
            color: #0F1111;
            font-size: 20px;
            font-weight: 400;
            cursor: pointer;
            transition: background 0.15s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .qty-picker-large button:hover {
            background: #E3E6E6;
          }

          .qty-picker-large button:active {
            background: #D5D9D9;
          }

          .qty-picker-large input {
            width: 50px;
            height: 40px;
            text-align: center;
            border: none;
            border-left: 1px solid #D5D9D9;
            border-right: 1px solid #D5D9D9;
            font-size: 16px;
            color: #0F1111;
            font-weight: 600;
            background: white;
          }

          /* Action Buttons */
          .action-buttons {
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 16px 0;
          }

          .add-to-cart-btn-large,
          .buy-now-btn {
            width: 100%;
            max-width: 300px;
            padding: 11px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
            border: 1px solid;
            text-align: center;
            letter-spacing: 0.2px;
          }

          .add-to-cart-btn-large {
            background: linear-gradient(to bottom, #f7dfa5, #f0c14b);
            border-color: #a88734 #9c7e31 #846a29;
            color: #0F1111;
            box-shadow: 0 1px 0 rgba(255,255,255,.4) inset;
          }

          .add-to-cart-btn-large:hover {
            background: linear-gradient(to bottom, #f5d78e, #eeb933);
            border-color: #a88734 #9c7e31 #846a29;
          }

          .add-to-cart-btn-large:active {
            background: #f0c14b;
            box-shadow: 0 1px 3px rgba(0,0,0,.2) inset;
          }

          .buy-now-btn {
            background: linear-gradient(to bottom, #f5af19, #f12711);
            border-color: #d5710c #c66908 #b65e06;
            color: #ffffff;
            box-shadow: 0 1px 0 rgba(255,255,255,.4) inset;
          }

          .buy-now-btn:hover {
            background: linear-gradient(to bottom, #f7b731, #e74c3c);
            border-color: #d5710c #c66908 #b65e06;
          }

          .buy-now-btn:active {
            background: #f12711;
            box-shadow: 0 1px 3px rgba(0,0,0,.2) inset;
          }

          /* Product Features */
          .product-features {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            padding: 16px;
            background: #F0F2F2;
            border: 1px solid #D5D9D9;
            border-radius: 4px;
            margin-top: 12px;
          }

          .feature-item {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 8px;
          }

          .feature-icon {
            font-size: 20px;
            flex-shrink: 0;
          }

          .feature-item strong {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #0F1111;
            margin-bottom: 2px;
          }

          .feature-item p {
            font-size: 12px;
            color: #565959;
            margin: 0;
            line-height: 1.4;
          }

          /* Tabs Section */
          .product-tabs-section {
            margin-top: 40px;
            padding-top: 20px;
          }

          .tabs-header {
            display: flex;
            gap: 0;
            border-bottom: 1px solid #e7e7e7;
            margin-bottom: 24px;
          }

          .tab-btn {
            padding: 12px 24px;
            background: none;
            border: none;
            font-size: 14px;
            font-weight: 500;
            color: #565959;
            cursor: pointer;
            transition: all 0.15s ease;
            border-bottom: 3px solid transparent;
            position: relative;
            letter-spacing: 0.2px;
          }

          .tab-btn:hover {
            color: #c45500;
          }

          .tab-btn.active {
            color: #c45500;
            border-bottom-color: #c45500;
            font-weight: 600;
          }

          .tabs-content {
            min-height: 300px;
          }

          .tab-panel {
            animation: fadeIn 0.3s ease;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .tab-panel h3 {
            font-size: 20px;
            font-weight: 600;
            color: #0F1111;
            margin: 0 0 16px 0;
            letter-spacing: 0.2px;
          }

          .tab-panel h4 {
            font-size: 16px;
            font-weight: 600;
            color: #0F1111;
            margin: 20px 0 12px 0;
          }

          .tab-panel p {
            font-size: 14px;
            line-height: 1.7;
            color: #0F1111;
            margin: 0 0 12px 0;
          }

          .tab-panel ul {
            list-style: none;
            padding: 0;
            margin: 12px 0;
          }

          .tab-panel li {
            padding: 10px 0 10px 28px;
            position: relative;
            color: #0F1111;
            font-size: 14px;
            line-height: 1.6;
            border-bottom: 1px solid #f0f0f0;
          }

          .tab-panel li:last-child {
            border-bottom: none;
          }

          .tab-panel li::before {
            content: '✓';
            position: absolute;
            left: 0;
            color: #067D62;
            font-weight: bold;
            font-size: 16px;
          }

          /* Reviews Panel */
          .reviews-panel {
            max-width: 1000px;
          }

          .reviews-summary {
            background: #F0F2F2;
            padding: 24px;
            border: 1px solid #D5D9D9;
            border-radius: 4px;
            margin-bottom: 24px;
          }

          .rating-overview {
            text-align: center;
          }

          .rating-number {
            font-size: 56px;
            font-weight: 400;
            color: #0F1111;
            letter-spacing: -1px;
            margin-bottom: 8px;
          }

          .rating-stars {
            font-size: 24px;
            margin-bottom: 8px;
            letter-spacing: 2px;
          }

          .rating-count {
            font-size: 14px;
            color: #565959;
          }

          .reviews-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
            margin-bottom: 24px;
          }

          .review-item {
            padding: 16px 20px;
            background: #ffffff;
            border: 1px solid #e7e7e7;
            border-radius: 4px;
            transition: border-color 0.15s ease;
          }

          .review-item:hover {
            border-color: #c7c7c7;
          }

          .review-header {
            display: flex;
            gap: 12px;
            margin-bottom: 12px;
          }

          .review-avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            object-fit: cover;
            border: 1px solid #e7e7e7;
          }

          .review-info {
            flex: 1;
          }

          .review-name {
            font-weight: 600;
            color: #0F1111;
            margin-bottom: 4px;
            font-size: 14px;
          }

          .review-meta {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .review-stars {
            font-size: 14px;
            letter-spacing: 1px;
          }

          .review-date {
            font-size: 12px;
            color: #565959;
          }

          .review-comment {
            font-size: 14px;
            color: #0F1111;
            line-height: 1.6;
            margin: 0;
          }

          .write-review-btn {
            padding: 10px 20px;
            background: linear-gradient(to bottom, #f7dfa5, #f0c14b);
            border: 1px solid #a88734;
            color: #0F1111;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
            box-shadow: 0 1px 0 rgba(255,255,255,.4) inset;
          }

          .write-review-btn:hover {
            background: linear-gradient(to bottom, #f5d78e, #eeb933);
          }

          /* Info Table */
          .info-table {
            width: 100%;
            max-width: 700px;
            border-collapse: collapse;
            margin: 16px 0;
          }

          .info-table tr {
            border-bottom: 1px solid #e7e7e7;
          }

          .info-table td {
            padding: 16px 12px;
            font-size: 14px;
            color: #0F1111;
          }

          .info-table td:first-child {
            width: 200px;
            font-weight: 600;
            color: #565959;
          }

          /* Loading and Error States */
          .loading-container,
          .error-container {
            text-align: center;
            padding: 100px 20px;
          }

          .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #FF9900;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .error-container h2 {
            font-size: 24px;
            font-weight: 400;
            color: #0F1111;
            margin-bottom: 12px;
          }

          .error-container p {
            font-size: 14px;
            color: #565959;
            margin-bottom: 20px;
          }

          .error-container button {
            padding: 10px 24px;
            background: linear-gradient(to bottom, #f7dfa5, #f0c14b);
            border: 1px solid #a88734;
            color: #0F1111;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.15s ease;
          }

          .error-container button:hover {
            background: linear-gradient(to bottom, #f5d78e, #eeb933);
          }

          /* Responsive Design */
          @media (max-width: 968px) {
            .product-detail-page {
              padding: 16px 12px;
            }

            .product-main-section {
              grid-template-columns: 1fr;
              gap: 24px;
            }

            .product-image-section {
              position: relative;
              top: 0;
            }

            .product-title {
              font-size: 22px;
            }

            .price {
              font-size: 24px;
            }

            .product-features {
              grid-template-columns: 1fr;
            }

            .action-buttons {
              align-items: stretch;
            }

            .add-to-cart-btn-large,
            .buy-now-btn {
              max-width: 100%;
            }

            .tabs-header {
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
            }

            .tab-btn {
              white-space: nowrap;
              padding: 12px 16px;
            }
          }

          @media (max-width: 640px) {
            .product-title {
              font-size: 18px;
            }

            .breadcrumb {
              font-size: 12px;
            }

            .feature-item {
              flex-direction: column;
              align-items: center;
              text-align: center;
            }
          }
        `}</style>
      </div>
    </ShopLayout>
  );
}
