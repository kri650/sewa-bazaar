'use client'
import { useCart } from '../contexts/CartContext'
import ShopLayout from '../components/ShopLayout'
import Link from 'next/link'
import { useState } from 'react'

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart()
  const [checkoutStep, setCheckoutStep] = useState('cart') // cart, details, confirm

  const handleQuantityChange = (id, delta) => {
    const item = cart.find((i) => i.id === id)
    if (item) {
      updateQuantity(id, item.quantity + delta)
    }
  }

  const cartTotal = getCartTotal()
  const deliveryFee = cartTotal > 500 ? 0 : 50
  const platformFee = 7
  const discount = Math.round(cartTotal * 0.1) // 10% discount
  const finalTotal = cartTotal - discount + deliveryFee + platformFee

  if (cart.length === 0) {
    return (
      <ShopLayout>
        <main className="cartPage">
          <div className="emptyCart">
            <div className="emptyCartIcon">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
            </div>
            <h1>Your Cart is Empty</h1>
            <p>Start adding some fresh organic products!</p>
            <Link href="/" className="shopNowBtn">
              Shop Now
            </Link>
          </div>

          <style jsx>{`
            .cartPage {
              min-height: 60vh;
              display: grid;
              place-items: center;
              padding: 60px 20px;
            }

            .emptyCart {
              text-align: center;
              max-width: 500px;
            }

            .emptyCartIcon {
              margin-bottom: 20px;
              opacity: 0.3;
              color: #2c2c2c;
            }

            .emptyCart h1 {
              font-size: 32px;
              color: #2c2c2c;
              margin: 0 0 12px;
              font-family: 'Playfair Display', serif;
            }

            .emptyCart p {
              font-size: 18px;
              color: #666;
              margin: 0 0 30px;
            }

            .shopNowBtn {
              display: inline-block;
              background: #619233;
              color: #fff;
              padding: 14px 40px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: 600;
              transition: all 0.3s ease;
            }

            .shopNowBtn:hover {
              background: #4f7a29;
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(97, 146, 51, 0.3);
            }
          `}</style>
        </main>
      </ShopLayout>
    )
  }

  return (
    <ShopLayout>
      <main className="cartPage">
        <div className="cartContainer">
          <div className="cartContent">
            <section className="cartItems">
              <header className="cartItemsHeader">
                <h2>My Cart ({cart.length})</h2>
              </header>

              {cart.map((item) => {
                const price = parseFloat(String(item.price).replace(/[^\d.]/g, '')) || 0
                const itemTotal = price * item.quantity

                return (
                  <article key={item.id} className="cartItem">
                    <div className="itemImage">
                      {item.image ? (
                        <img src={item.image} alt={item.name} />
                      ) : (
                        <div className="noImage">No Image</div>
                      )}
                    </div>

                    <div className="itemDetails">
                      <h3>{item.name}</h3>
                      {item.size || item.unit ? (
                        <p className="itemSize">Size: {item.size || item.unit}</p>
                      ) : null}
                      
                      <div className="itemPricing">
                        <span className="discountedPrice">Rs. {price.toFixed(2)}</span>
                        <span className="originalPrice">Rs. {(price * 1.3).toFixed(2)}</span>
                        <span className="discountBadge">30% off</span>
                      </div>

                      <p className="deliveryInfo">
                        Delivery by {cartTotal > 500 ? 'Fri Mar 6' : 'Mon Mar 10'}
                      </p>
                    </div>

                    <div className="itemActions">
                      <div className="qtyControl">
                        <button
                          onClick={() => handleQuantityChange(item.id, -1)}
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <input type="text" value={item.quantity} readOnly />
                        <button
                          onClick={() => handleQuantityChange(item.id, 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <div className="itemButtons">
                        <button className="saveForLater">
                          Save for later
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="removeBtn"
                          aria-label="Remove item"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}

              {cart.length > 0 && (
                <div className="placeOrderMobile">
                  <button className="placeOrderBtn">
                    Place Order
                  </button>
                </div>
              )}
            </section>

            <aside className="priceDetails">
              <h3>Price Details</h3>
              
              <div className="priceRow">
                <span>Price ({cart.length} item{cart.length !== 1 ? 's' : ''})</span>
                <span>₹{cartTotal.toFixed(2)}</span>
              </div>

              <div className="priceRow discount">
                <span>Discount</span>
                <span className="greenText">− ₹{discount.toFixed(2)}</span>
              </div>

              <div className="priceRow">
                <span>Platform Fee</span>
                <span>₹{platformFee}</span>
              </div>

              <div className="priceRow">
                <span>Delivery Charges</span>
                {deliveryFee === 0 ? (
                  <span className="greenText strikethrough">
                    <span className="strike">₹50</span> FREE
                  </span>
                ) : (
                  <span>₹{deliveryFee}</span>
                )}
              </div>

              <hr className="priceDivider" />

              <div className="priceRow totalRow">
                <span>Total Amount</span>
                <span>₹{finalTotal.toFixed(2)}</span>
              </div>

              <div className="savingsMessage">
                <span className="checkIcon">✓</span> You will save ₹{discount.toFixed(2)} on this order
              </div>

              <div className="securityBadge">
                <svg className="shieldIcon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Safe and secure payments. Easy returns. 100% Authentic products.
              </div>
            </aside>
          </div>
        </div>

        <style jsx>{`
          .cartPage {
            background: #f1f3f6;
            min-height: 100vh;
            padding: 20px 0 60px;
          }

          .cartContainer {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 12px;
          }

          .cartContent {
            display: grid;
            grid-template-columns: 1fr 380px;
            gap: 16px;
            align-items: start;
          }

          .cartItems {
            background: #fff;
          }

          .cartItemsHeader {
            padding: 16px 20px;
            border-bottom: 1px solid #f0f0f0;
          }

          .cartItemsHeader h2 {
            margin: 0;
            font-size: 18px;
            font-weight: 500;
            color: #212121;
          }

          .cartItem {
            padding: 20px;
            border-bottom: 1px solid #f0f0f0;
            display: grid;
            grid-template-columns: 112px 1fr;
            gap: 16px;
          }

          .cartItem:last-child {
            border-bottom: none;
          }

          .itemImage {
            width: 112px;
            height: 150px;
            border: 1px solid #f0f0f0;
            border-radius: 2px;
            overflow: hidden;
            background: #fff;
            display: grid;
            place-items: center;
          }

          .itemImage img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .noImage {
            color: #999;
            font-size: 12px;
          }

          .itemDetails {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .itemDetails h3 {
            margin: 0;
            font-size: 16px;
            color: #212121;
            font-weight: 400;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .itemSize {
            margin: 0;
            color: #878787;
            font-size: 14px;
          }

          .itemPricing {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
          }

          .discountedPrice {
            font-size: 18px;
            font-weight: 500;
            color: #212121;
          }

          .originalPrice {
            font-size: 14px;
            color: #878787;
            text-decoration: line-through;
          }

          .discountBadge {
            font-size: 14px;
            color: #388e3c;
            font-weight: 500;
          }

          .deliveryInfo {
            margin: 4px 0 0;
            font-size: 14px;
            color: #212121;
          }

          .itemActions {
            grid-column: 1 / -1;
            display: flex;
            align-items: center;
            gap: 16px;
            margin-top: 12px;
          }

          .qtyControl {
            display: flex;
            align-items: center;
            gap: 0;
            border: 1px solid #c2c2c2;
            border-radius: 2px;
            overflow: hidden;
          }

          .qtyControl button {
            background: #fff;
            border: none;
            width: 32px;
            height: 32px;
            cursor: pointer;
            font-size: 20px;
            color: #212121;
            transition: background 0.2s;
            display: grid;
            place-items: center;
            font-weight: 300;
          }

          .qtyControl button:hover:not(:disabled) {
            background: #f5f5f5;
          }

          .qtyControl button:disabled {
            opacity: 0.3;
            cursor: not-allowed;
          }

          .qtyControl input {
            width: 46px;
            height: 32px;
            text-align: center;
            border: none;
            border-left: 1px solid #c2c2c2;
            border-right: 1px solid #c2c2c2;
            font-size: 14px;
            font-weight: 500;
            color: #212121;
          }

          .itemButtons {
            display: flex;
            gap: 24px;
          }

          .saveForLater,
          .removeBtn {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            color: #212121;
            display: flex;
            align-items: center;
            transition: color 0.2s;
          }

          .saveForLater:hover,
          .removeBtn:hover {
            color: #2874f0;
          }

          .placeOrderMobile {
            padding: 16px 20px;
            border-top: 1px solid #f0f0f0;
            background: #fff;
          }

          .placeOrderBtn {
            width: 100%;
            background: #619233;
            color: #fff;
            border: none;
            padding: 14px;
            border-radius: 2px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
          }

          .placeOrderBtn:hover {
            background: #4f7a29;
          }

          .priceDetails {
            background: #fff;
            padding: 24px;
            position: sticky;
            top: 20px;
          }

          .priceDetails h3 {
            margin: 0 0 20px;
            font-size: 16px;
            color: #878787;
            font-weight: 500;
            text-transform: uppercase;
          }

          .priceRow {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            font-size: 16px;
            color: #212121;
          }

          .priceRow.discount {
            margin-bottom: 16px;
          }

          .priceRow span:last-child {
            font-weight: 400;
          }

          .greenText {
            color: #388e3c;
            font-weight: 500;
          }

          .strikethrough {
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .strike {
            text-decoration: line-through;
            color: #878787;
            font-weight: 400;
          }

          .priceDivider {
            border: none;
            border-top: 1px dashed #e0e0e0;
            margin: 20px 0;
          }

          .totalRow {
            margin-bottom: 20px;
            font-size: 18px;
            font-weight: 500;
          }

          .savingsMessage {
            padding: 12px 16px;
            background: #f0f9ff;
            border: 1px solid #c7e9ff;
            border-radius: 2px;
            font-size: 14px;
            color: #388e3c;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
          }

          .checkIcon {
            font-size: 16px;
            background: #388e3c;
            color: #fff;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: grid;
            place-items: center;
            font-weight: bold;
          }

          .securityBadge {
            padding: 16px 0 0;
            border-top: 1px solid #f0f0f0;
            display: flex;
            align-items: flex-start;
            gap: 10px;
            font-size: 13px;
            color: #878787;
            line-height: 1.5;
          }

          .shieldIcon {
            flex-shrink: 0;
            color: #878787;
          }

          @media (max-width: 900px) {
            .cartContent {
              grid-template-columns: 1fr;
            }

            .priceDetails {
              position: static;
              order: -1;
            }

            .placeOrderMobile {
              display: block;
            }
          }

          @media (max-width: 600px) {
            .cartPage {
              padding: 10px 0 60px;
            }

            .cartItem {
              grid-template-columns: 80px 1fr;
              padding: 16px;
              gap: 12px;
            }

            .itemImage {
              width: 80px;
              height: 110px;
            }

            .itemDetails h3 {
              font-size: 14px;
            }

            .discountedPrice {
              font-size: 16px;
            }

            .itemActions {
              flex-direction: column;
              align-items: flex-start;
              gap: 12px;
            }

            .itemButtons {
              width: 100%;
              justify-content: space-between;
            }
          }
        `}</style>
      </main>
    </ShopLayout>
  )
}
