'use client'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import ShopLayout from '../components/ShopLayout'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { useDelivery } from '../contexts/DeliveryContext'
import { resolveProductImage } from '../lib/productImage'
import { toast } from 'react-hot-toast'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
console.log('[CartPage] API Base URL:', API_BASE)

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart()
  const { add: addToWishlist } = useWishlist()
  const { deliveryType, estimatedTime } = useDelivery()
  const [checkoutStep, setCheckoutStep] = useState('cart') // cart | details | success
  const [orderResult, setOrderResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [savedAddresses, setSavedAddresses] = useState([])
  const [selectedAddrId, setSelectedAddrId] = useState('new') // 'new' or address id
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'cod',
  })
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [couponSuccess, setCouponSuccess] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)

  // Pre-fill from logged-in user session
  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = localStorage.getItem('sbUserData')
    if (!raw) return
    try {
      const u = JSON.parse(raw)
      setForm(prev => ({
        ...prev,
        fullName: prev.fullName || u.name || '',
        email:    prev.email    || u.email || '',
        phone:    prev.phone    || u.phone || '',
      }))
    } catch (_) {}
  }, [])

  // Fetch saved addresses when entering checkout
  const fetchSavedAddresses = useCallback(async () => {
    if (typeof window === 'undefined') return
    const token = localStorage.getItem('sbUserToken') || localStorage.getItem('authToken') || ''
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/api/user/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setSavedAddresses(data)
      // Auto-select default address
      const defaultAddr = data.find(a => a.isDefault)
      if (defaultAddr) {
        setSelectedAddrId(String(defaultAddr.id))
        applyAddress(defaultAddr)
      } else if (data.length > 0) {
        setSelectedAddrId(String(data[0].id))
        applyAddress(data[0])
      }
    } catch (_) {}
  }, [])

  useEffect(() => {
    if (checkoutStep === 'details') fetchSavedAddresses()
  }, [checkoutStep, fetchSavedAddresses])

  const applyAddress = (addr) => {
    setForm(prev => ({
      ...prev,
      fullName: addr.full_name || prev.fullName,
      phone:    addr.phone     || prev.phone,
      addressLine1: addr.street || '',
      addressLine2: '',
      city:    addr.city    || '',
      state:   addr.state   || '',
      pincode: addr.pincode || '',
    }))
  }

  const handleAddressSelect = (addrId) => {
    setSelectedAddrId(addrId)
    if (addrId === 'new') {
      // Clear address fields for manual entry, keep name/phone/email
      setForm(prev => ({
        ...prev,
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
      }))
    } else {
      const addr = savedAddresses.find(a => String(a.id) === addrId)
      if (addr) applyAddress(addr)
    }
  }

  const handleQuantityChange = (id, delta) => {
    const item = cart.find((i) => i.id === id)
    if (item) {
      updateQuantity(id, item.quantity + delta)
    }
  }

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const getItemUnitPrice = (item) => {
    const numeric = Number(item?.price)
    if (!Number.isNaN(numeric)) return numeric
    return parseFloat(String(item?.price || '').replace(/[^\d.]/g, '')) || 0
  }

  const handleApplyCoupon = async () => {
    const code = String(couponCode || '').trim().toUpperCase()
    setCouponError('')
    setCouponSuccess('')

    if (!code) {
      setCouponError('Enter a coupon code')
      return
    }
    if (!cart.length) {
      setCouponError('Your cart is empty')
      return
    }

    setCouponLoading(true)
    try {
      const items = cart.map((item) => ({
        productId: Number(item.id),
        qty: Number(item.quantity || 0),
        price: getItemUnitPrice(item),
      }))

      const res = await fetch(`${API_BASE}/api/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, items }),
      })
      const data = await res.json()

      if (!res.ok || !data?.valid) {
        setAppliedCoupon(null)
        setCouponError('Invalid coupon')
        return
      }

      setAppliedCoupon({
        code,
        discountAmount: Number(data.discountAmount || 0),
      })
      setCouponSuccess('Coupon Applied')
      setCouponError('')
    } catch (_err) {
      setAppliedCoupon(null)
      setCouponError('Invalid coupon')
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
    setCouponSuccess('')
  }

  const getAuthHeader = () => {
    if (typeof window === 'undefined') return {}
    const token = localStorage.getItem('sbUserToken') // check local storage for token
    if (!token) return {}
    return { 'Authorization': `Bearer ${token}` }
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    setOrderError('')
    setLoading(true)

    // Check login
    if (typeof window !== 'undefined' && !localStorage.getItem('sbUserToken')) {
      toast.error('Please log in to place an order')
      setLoading(false)
      // Optional: redirect to login or show modal
      return
    }

    const cartItems = cart.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      qty: item.quantity,
    }))
    const customer = { name: form.fullName, phone: form.phone, email: form.email }
    const addressPayload = {
      addressLine1: form.addressLine1,
      addressLine2: form.addressLine2,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
    }
    const normalizedDeliveryType = deliveryType === 'fast' ? 'fast' : deliveryType === 'normal' ? 'standard' : null
    const deliveryPayload = {
      deliveryType: normalizedDeliveryType,
      estimatedTime: estimatedTime || null,
      deliverySlot: normalizedDeliveryType ? (normalizedDeliveryType === 'fast' ? (estimatedTime ? `Within ${estimatedTime}` : '2-4 Hours') : '10:00 AM - 12:00 PM') : null,
    }

    try {
      if (form.paymentMethod === 'cod') {
        const res = await fetch(`${API_BASE}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify({ items: cartItems, customer, ...addressPayload, paymentMethod: 'cod', ...deliveryPayload }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Order placement failed')
        clearCart()
        setOrderResult({ ...data, paymentMethod: 'cod' })
        setCheckoutStep('success')
        setLoading(false)
      } else {
        // Online — create Razorpay order on server
        const createRes = await fetch(`${API_BASE}/api/payment/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify({ amount: finalTotal }),
        })
        const createData = await createRes.json()
        if (!createRes.ok) throw new Error(createData.error || 'Failed to initiate payment')

        if (!window.Razorpay) {
          throw new Error('Razorpay SDK not loaded. Please refresh and try again.')
        }

        const rzpOptions = {
          key: createData.keyId,
          amount: createData.amount,
          currency: createData.currency,
          name: 'Sewa Bazaar',
          description: `Order of ${cart.length} item${cart.length !== 1 ? 's' : ''}`,
          order_id: createData.razorpayOrderId,
          prefill: { name: form.fullName, email: form.email, contact: form.phone },
          theme: { color: '#619233' },
          handler: async (response) => {
            try {
              const verifyRes = await fetch(`${API_BASE}/api/payment/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  cartItems,
                  customer,
                  ...addressPayload,
                  ...deliveryPayload,
                }),
              })
              const verifyData = await verifyRes.json()
              if (!verifyRes.ok) throw new Error(verifyData.error || 'Payment verification failed')
              clearCart()
              setOrderResult({ ...verifyData })
              setCheckoutStep('success')
            } catch (err) {
              setOrderError(err.message)
            }
            setLoading(false)
          },
          modal: { ondismiss: () => setLoading(false) },
        }

        const rzp = new window.Razorpay(rzpOptions)
        rzp.on('payment.failed', (response) => {
          setOrderError(`Payment failed: ${response.error.description}`)
          setLoading(false)
        })
        rzp.open()
        // loading stays true until modal handler/dismiss
        return
      }
    } catch (err) {
      setOrderError(err.message)
      setLoading(false)
    }
  }

  const cartTotal = getCartTotal()
  const deliveryFee = cartTotal > 500 ? 0 : 50
  const platformFee = 7
  const discount = Math.round(cartTotal * 0.1) // 10% product discount
  const discountedSubtotal = Math.max(0, cartTotal - discount)
  const couponDiscount = Math.min(discountedSubtotal, Number(appliedCoupon?.discountAmount || 0))
  const finalTotal = discountedSubtotal - couponDiscount + deliveryFee + platformFee

  if (cart.length === 0 && checkoutStep !== 'success') {
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

  // ── Order Success ──────────────────────────────────────────────────────────
  if (checkoutStep === 'success') {
    return (
      <ShopLayout>
        <main className="successPage">
          <div className="successCard">
            <div className="successIconWrap">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1>Order Placed Successfully!</h1>
            <p className="successSub">
              Thank you for shopping with Sewa Bazaar. Your order is confirmed.
            </p>
            <div className="successDetails">
              <div className="successRow">
                <span>Order ID</span>
                <strong>#{orderResult?.id}</strong>
              </div>
              <div className="successRow">
                <span>Total Paid</span>
                <strong>₹{Number(orderResult?.total || 0).toFixed(2)}</strong>
              </div>
              <div className="successRow">
                <span>Payment</span>
                <strong>{orderResult?.paymentMethod === 'online' ? 'Online (Razorpay)' : 'Cash on Delivery'}</strong>
              </div>
              {orderResult?.razorpayPaymentId && (
                <div className="successRow">
                  <span>Payment ID</span>
                  <strong className="paymentId">{orderResult.razorpayPaymentId}</strong>
                </div>
              )}
            </div>
            <Link href="/" className="continueBtn">Continue Shopping</Link>
          </div>

          <style jsx>{`
            .successPage { min-height: 70vh; display: grid; place-items: center; padding: 60px 20px; background: #fff; }
            .successCard { background: #fff; border-radius: 12px; padding: 48px 40px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
            .successIconWrap { width: 80px; height: 80px; border-radius: 50%; background: #619233; display: grid; place-items: center; margin: 0 auto 24px; }
            .successCard h1 { font-size: 26px; color: #212121; margin: 0 0 10px; font-family: 'Playfair Display', serif; }
            .successSub { color: #666; font-size: 15px; margin: 0 0 28px; }
            .successDetails { background: #f8faf5; border: 1px solid #e4edd8; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px; text-align: left; }
            .successRow { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; font-size: 15px; color: #444; border-bottom: 1px solid #eee; }
            .successRow:last-child { border-bottom: none; }
            .successRow strong { color: #212121; }
            .paymentId { font-size: 12px; word-break: break-all; }
            .continueBtn { display: inline-block; background: #619233; color: #fff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; transition: background 0.2s; }
            .continueBtn:hover { background: #4f7a29; }
          `}</style>
        </main>
      </ShopLayout>
    )
  }

  // ── Checkout / Details Step ────────────────────────────────────────────────
  if (checkoutStep === 'details') {
    const INDIAN_STATES = [
      'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
      'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
      'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
      'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
      'Uttar Pradesh','Uttarakhand','West Bengal',
      'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
      'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
    ]
    return (
      <ShopLayout>
        <main className="checkoutPage">
          <div className="checkoutContainer">
            <button className="backBtn" onClick={() => setCheckoutStep('cart')}>
              ← Back to Cart
            </button>
            <div className="checkoutLayout">
              {/* Delivery form */}
              <section className="checkoutForm">
                <h2>Delivery Details</h2>

                {/* Saved addresses picker */}
                {savedAddresses.length > 0 && (
                  <div className="savedAddrSection">
                    <h3 className="savedAddrTitle">📍 Select a Delivery Address</h3>
                    <div className="savedAddrList">
                      {savedAddresses.map(addr => (
                        <label
                          key={addr.id}
                          className={`savedAddrOption${selectedAddrId === String(addr.id) ? ' savedAddrSelected' : ''}`}
                        >
                          <input
                            type="radio"
                            name="savedAddr"
                            value={String(addr.id)}
                            checked={selectedAddrId === String(addr.id)}
                            onChange={() => handleAddressSelect(String(addr.id))}
                          />
                          <div className="savedAddrInfo">
                            <div className="savedAddrHead">
                              <strong>{addr.full_name}</strong>
                              {addr.isDefault ? <span className="savedAddrDefault">Default</span> : null}
                            </div>
                            <p>{addr.street}, {addr.city}, {addr.state} — {addr.pincode}</p>
                            <p className="savedAddrPhone">📞 {addr.phone}</p>
                          </div>
                        </label>
                      ))}
                      <label
                        className={`savedAddrOption savedAddrNew${selectedAddrId === 'new' ? ' savedAddrSelected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="savedAddr"
                          value="new"
                          checked={selectedAddrId === 'new'}
                          onChange={() => handleAddressSelect('new')}
                        />
                        <div className="savedAddrInfo">
                          <strong>+ Use a New Address</strong>
                          <p>Enter address details manually below</p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                <form onSubmit={handlePlaceOrder}>
                  <div className="formRow2">
                    <div className="formGroup">
                      <label htmlFor="fullName">Full Name *</label>
                      <input id="fullName" name="fullName" type="text" value={form.fullName} onChange={handleFormChange} placeholder="Your full name" required />
                    </div>
                    <div className="formGroup">
                      <label htmlFor="phone">Phone Number *</label>
                      <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleFormChange} placeholder="10-digit mobile" required pattern="[6-9][0-9]{9}" title="Enter a valid 10-digit Indian mobile number" />
                    </div>
                  </div>
                  <div className="formGroup">
                    <label htmlFor="email">Email Address</label>
                    <input id="email" name="email" type="email" value={form.email} onChange={handleFormChange} placeholder="For order confirmation (optional)" />
                  </div>
                  <div className="formGroup">
                    <label htmlFor="addressLine1">Address Line 1 *</label>
                    <input id="addressLine1" name="addressLine1" type="text" value={form.addressLine1} onChange={handleFormChange} placeholder="House/Flat No., Building, Street" required />
                  </div>
                  <div className="formGroup">
                    <label htmlFor="addressLine2">Address Line 2</label>
                    <input id="addressLine2" name="addressLine2" type="text" value={form.addressLine2} onChange={handleFormChange} placeholder="Area, Landmark (optional)" />
                  </div>
                  <div className="formRow3">
                    <div className="formGroup">
                      <label htmlFor="city">City *</label>
                      <input id="city" name="city" type="text" value={form.city} onChange={handleFormChange} placeholder="City" required />
                    </div>
                    <div className="formGroup">
                      <label htmlFor="state">State *</label>
                      <select id="state" name="state" value={form.state} onChange={handleFormChange} required>
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((s) => (<option key={s} value={s}>{s}</option>))}
                      </select>
                    </div>
                    <div className="formGroup">
                      <label htmlFor="pincode">Pincode *</label>
                      <input id="pincode" name="pincode" type="text" value={form.pincode} onChange={handleFormChange} placeholder="6-digit" required pattern="[0-9]{6}" title="Enter a valid 6-digit pincode" />
                    </div>
                  </div>
                  <div className="paymentSection">
                    <h3>Payment Method</h3>
                    <div className="paymentOptions">
                      <label className={`paymentOption ${form.paymentMethod === 'cod' ? 'selected' : ''}`}>
                        <input type="radio" name="paymentMethod" value="cod" checked={form.paymentMethod === 'cod'} onChange={handleFormChange} />
                        <div className="paymentOptionContent">
                          <span className="paymentIcon">COD</span>
                          <div><strong>Cash on Delivery</strong><p>Pay when your order arrives</p></div>
                        </div>
                      </label>
                      <label className={`paymentOption ${form.paymentMethod === 'online' ? 'selected' : ''}`}>
                        <input type="radio" name="paymentMethod" value="online" checked={form.paymentMethod === 'online'} onChange={handleFormChange} />
                        <div className="paymentOptionContent">
                          <span className="paymentIcon">ONLINE</span>
                          <div><strong>Pay Online</strong><p>UPI, Cards, Net Banking via Razorpay</p></div>
                        </div>
                      </label>
                    </div>
                  </div>
                  {orderError && <div className="errorMsg">⚠ {orderError}</div>}
                  <button type="submit" className="submitOrderBtn" disabled={loading}>
                    {loading ? 'Processing…' : form.paymentMethod === 'cod' ? 'Place Order (COD)' : 'Pay Now with Razorpay'}
                  </button>
                </form>
              </section>
              {/* Order summary sidebar */}
              <aside className="checkoutSummary">
                <h3>Order Summary</h3>
                <div className="summaryItems">
                  {cart.map((item) => {
                    const price = parseFloat(String(item.price).replace(/[^\d.]/g, '')) || 0
                    return (
                      <div key={item.id} className="summaryItem">
                        <span className="summaryItemName">{item.name}</span>
                        <span className="summaryItemQty">× {item.quantity}</span>
                        <span className="summaryItemPrice">₹{(price * item.quantity).toFixed(2)}</span>
                      </div>
                    )
                  })}
                </div>
                <hr className="summaryDivider" />
                <div className="summaryRow"><span>Subtotal</span><span>₹{cartTotal.toFixed(2)}</span></div>
                <div className="summaryRow green"><span>Discount (10%)</span><span>−₹{discount.toFixed(2)}</span></div>
                {couponDiscount > 0 ? <div className="summaryRow green"><span>Coupon Discount</span><span>−₹{couponDiscount.toFixed(2)}</span></div> : null}
                <div className="summaryRow"><span>Delivery</span><span>{deliveryFee === 0 ? <span className="green">FREE</span> : `₹${deliveryFee}`}</span></div>
                <div className="summaryRow"><span>Platform Fee</span><span>₹{platformFee}</span></div>
                <hr className="summaryDivider" />
                <div className="summaryRow total"><span>Total</span><strong>₹{finalTotal.toFixed(2)}</strong></div>
              </aside>
            </div>
          </div>

          <style jsx>{`
            .checkoutPage { background: #fff; min-height: 100vh; padding: 24px 0 60px; }
            .checkoutContainer { max-width: 1100px; margin: 0 auto; padding: 0 16px; }
            .backBtn { background: none; border: none; cursor: pointer; font-size: 15px; color: #619233; font-weight: 600; padding: 0 0 16px; display: flex; align-items: center; gap: 4px; }
            .backBtn:hover { color: #4f7a29; }
            .checkoutLayout { display: grid; grid-template-columns: 1fr 320px; gap: 20px; align-items: start; }
            .checkoutForm { background: #fff; border-radius: 12px; border: 1px solid #e8e8e8; padding: 28px 28px 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
            .checkoutForm h2 { margin: 0 0 24px; font-size: 20px; color: #212121; font-weight: 600; }
            .formGroup { margin-bottom: 16px; }
            .formGroup label { display: block; font-size: 13px; font-weight: 600; color: #444; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.4px; }
            .formGroup input, .formGroup select { width: 100%; padding: 11px 14px; border: 1.5px solid #d4d4d4; border-radius: 6px; font-size: 15px; color: #212121; background: #fafafa; box-sizing: border-box; transition: border-color 0.2s; outline: none; }
            .formGroup input:focus, .formGroup select:focus { border-color: #619233; background: #fff; }
            .formRow2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .formRow3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
            .paymentSection { margin-top: 28px; }
            .paymentSection h3 { font-size: 16px; font-weight: 600; color: #212121; margin: 0 0 14px; }
            .paymentOptions { display: flex; flex-direction: column; gap: 10px; }
            .paymentOption { display: flex; align-items: center; padding: 14px 18px; border: 1.5px solid #e0e0e0; border-radius: 8px; cursor: pointer; transition: border-color 0.2s, background 0.2s; }
            .paymentOption input[type="radio"] { margin-right: 14px; accent-color: #619233; width: 18px; height: 18px; flex-shrink: 0; }
            .paymentOption.selected { border-color: #619233; background: #f8faf5; }
            .paymentOptionContent { display: flex; align-items: center; gap: 12px; }
            .paymentIcon {
              background: #f1f5f9;
              border: 1px solid #e2e8f0;
              color: #334155;
              border-radius: 6px;
              padding: 6px 8px;
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 0.06em;
            }
            .paymentOptionContent strong { display: block; font-size: 15px; color: #212121; }
            .paymentOptionContent p { margin: 2px 0 0; font-size: 13px; color: #666; }
            .errorMsg { margin: 16px 0; padding: 12px 16px; background: #fff2f2; border: 1px solid #fcc; border-radius: 6px; color: #c0392b; font-size: 14px; }
            .submitOrderBtn { width: 100%; margin-top: 24px; background: linear-gradient(135deg, #619233 0%, #4f7a29 100%); color: #fff; border: none; padding: 15px; border-radius: 8px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s; letter-spacing: 0.3px; box-shadow: 0 4px 14px rgba(97,146,51,0.35); }
            .submitOrderBtn:hover:not(:disabled) { background: linear-gradient(135deg, #4f7a29 0%, #3d6b1a 100%); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(97,146,51,0.45); }
            .submitOrderBtn:disabled { opacity: 0.6; cursor: not-allowed; }
            .checkoutSummary { background: #fff; border-radius: 12px; border: 1px solid #e8e8e8; padding: 20px 20px 24px; position: sticky; top: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
            .checkoutSummary h3 { margin: 0 0 16px; font-size: 15px; font-weight: 600; color: #878787; text-transform: uppercase; }
            .summaryItem { display: grid; grid-template-columns: 1fr auto auto; gap: 8px; align-items: center; padding: 6px 0; font-size: 14px; color: #444; border-bottom: 1px solid #f0f0f0; }
            .summaryItemName { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .summaryItemQty { color: #888; }
            .summaryItemPrice { font-weight: 500; color: #212121; }
            .summaryDivider { border: none; border-top: 1px dashed #e0e0e0; margin: 12px 0; }
            .summaryRow { display: flex; justify-content: space-between; font-size: 15px; color: #444; padding: 5px 0; }
            .summaryRow.total { font-size: 17px; font-weight: 600; color: #212121; padding-top: 8px; }
            .green { color: #388e3c; font-weight: 500; }

            /* Saved address picker */
            .savedAddrSection { margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px dashed #e0e0e0; }
            .savedAddrTitle { font-size: 15px; font-weight: 600; color: #212121; margin: 0 0 14px; }
            .savedAddrList { display: flex; flex-direction: column; gap: 10px; }
            .savedAddrOption { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; border: 2px solid #e8e8e8; border-radius: 8px; cursor: pointer; transition: all 0.2s; background: #fff; }
            .savedAddrOption:hover { border-color: #b8d98a; background: #fcfdf9; }
            .savedAddrSelected { border-color: #619233 !important; background: #f8faf5 !important; }
            .savedAddrOption input[type="radio"] { margin-top: 3px; accent-color: #619233; width: 18px; height: 18px; flex-shrink: 0; }
            .savedAddrInfo { flex: 1; min-width: 0; }
            .savedAddrHead { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap; }
            .savedAddrHead strong { font-size: 15px; color: #212121; }
            .savedAddrDefault { background: #619233; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 10px; letter-spacing: 0.3px; text-transform: uppercase; }
            .savedAddrInfo p { margin: 0; font-size: 13px; color: #555; line-height: 1.5; }
            .savedAddrPhone { color: #619233 !important; font-weight: 500; margin-top: 2px !important; }
            .savedAddrNew { border-style: dashed; }
            .savedAddrNew strong { color: #619233; font-size: 14px; }
            .savedAddrNew p { font-size: 12px; color: #888; }

            @media (max-width: 860px) { .checkoutLayout { grid-template-columns: 1fr; } .checkoutSummary { position: static; order: -1; } .formRow2 { grid-template-columns: 1fr; } .formRow3 { grid-template-columns: 1fr 1fr; } }
            @media (max-width: 480px) { .formRow3 { grid-template-columns: 1fr; } .checkoutForm { padding: 20px 16px; } }
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
                const rawDiscount = Number(String(item.discount || '').replace(/[^\d.]/g, ''))
                const saleLabel = item.isFlashSaleActive ? 'Flash Sale' : 'Sale'
                const fallbackOriginal = Number((price * 1.3).toFixed(2))
                const originalPrice = parseFloat(String(item.originalPrice).replace(/[^\d.]/g, '')) || fallbackOriginal
                const inferredHasDiscount = originalPrice > price
                const hasDiscount = Number.isFinite(rawDiscount) ? rawDiscount > 0 : inferredHasDiscount
                const discountPercent = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : rawDiscount

                return (
                  <article key={item.id} className="cartItem">
                    <div className="itemImage">
                      <img
                        src={item.image && !item.image.startsWith('data:') && item.image.trim()
                          ? item.image
                          : resolveProductImage({ name: item.name, image: item.image })}
                        alt={item.name}
                        onError={e => {
                          e.target.src = resolveProductImage({ name: item.name })
                        }}
                      />
                    </div>

                    <div className="itemDetails">
                      <div className="itemTitleRow">
                        <h3>{item.name}</h3>
                        {hasDiscount ? <span className="salePill">{saleLabel}</span> : null}
                      </div>
                      {item.size || item.unit ? (
                        <p className="itemSize">Size: {item.size || item.unit}</p>
                      ) : null}
                      
                      <div className="itemPricing">
                        <span className="discountedPrice">Rs. {price.toFixed(2)}</span>
                        {hasDiscount ? <span className="originalPrice">Rs. {originalPrice.toFixed(2)}</span> : null}
                        {hasDiscount ? <span className="discountBadge">{discountPercent}% off</span> : null}
                      </div>

                      <p className="deliveryInfo">
                        {deliveryType === 'fast' && estimatedTime
                          ? `⚡ Delivered in ${estimatedTime}`
                          : deliveryType === 'normal' && estimatedTime
                            ? `🚚 Delivery ${estimatedTime}`
                            : (() => {
                                const d = new Date()
                                d.setDate(d.getDate() + (cartTotal > 500 ? 1 : 3))
                                return `🚚 Delivery by ${d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}`
                              })()}
                        {cartTotal > 500 && !deliveryType ? ' | FREE Delivery' : ''}
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
                        <button
                          className="saveForLater"
                          onClick={() => {
                            addToWishlist(item)
                            removeFromCart(item.id)
                          }}
                        >
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
                  <button className="placeOrderBtn" onClick={() => setCheckoutStep('details')}>
                    Proceed to Checkout
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

              <div className="couponSection">
                <div className="couponHeading">Apply Coupon</div>
                <div className="couponInputRow">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="couponInput"
                    disabled={couponLoading || Boolean(appliedCoupon)}
                  />
                  {!appliedCoupon ? (
                    <button
                      type="button"
                      className="applyCouponBtn"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading}
                    >
                      {couponLoading ? 'Applying...' : 'Apply'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="removeCouponBtn"
                      onClick={handleRemoveCoupon}
                    >
                      Remove
                    </button>
                  )}
                </div>
                {couponSuccess ? <div className="couponSuccess">{couponSuccess}</div> : null}
                {couponError ? <div className="couponError">{couponError}</div> : null}
              </div>

              {couponDiscount > 0 ? (
                <div className="priceRow discount">
                  <span>Coupon Discount</span>
                  <span className="greenText">− ₹{couponDiscount.toFixed(2)}</span>
                </div>
              ) : null}

              <hr className="priceDivider" />

              <div className="priceRow totalRow">
                <span>Total Amount</span>
                <span>₹{finalTotal.toFixed(2)}</span>
              </div>

              <div className="savingsMessage">
                <span className="checkIcon">✓</span> You will save ₹{(discount + couponDiscount).toFixed(2)} on this order
              </div>

              <button className="placeOrderBtn checkoutDesktopBtn" onClick={() => setCheckoutStep('details')}>
                Proceed to Checkout
              </button>

              <div style={{ marginTop: 12, padding: '10px 12px', background: '#fff', borderRadius: 8, border: '1px solid #eee' }}>
                <DeliveryInfo />
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
            background: #fff;
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
            border: 1px solid #e8e8e8;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 12px rgba(0,0,0,0.06);
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
            transition: background 0.15s;
          }

          .cartItem:hover {
            background: #fafcf7;
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

          .itemTitleRow {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 10px;
          }

          .itemTitleRow h3 {
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

          .salePill {
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 5px 12px;
            border-radius: 999px;
            background: linear-gradient(135deg, #fb923c 0%, #f97316 45%, #ea580c 100%);
            color: #fff;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.3px;
            text-transform: uppercase;
            box-shadow: 0 3px 10px rgba(234, 88, 12, 0.28);
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
            background: linear-gradient(135deg, #619233 0%, #4f7a29 100%);
            color: #fff;
            border: none;
            padding: 15px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
            letter-spacing: 0.3px;
            box-shadow: 0 4px 14px rgba(97,146,51,0.35);
          }

          .placeOrderBtn:hover {
            background: linear-gradient(135deg, #4f7a29 0%, #3d6b1a 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(97,146,51,0.45);
          }

          .checkoutDesktopBtn {
            width: 100%;
            margin: 16px 0 0;
          }

          .priceDetails {
            background: #fff;
            border: 1px solid #e8e8e8;
            border-radius: 12px;
            padding: 24px;
            position: sticky;
            top: 20px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.06);
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

          .couponSection {
            margin-top: 8px;
            margin-bottom: 8px;
          }

          .couponHeading {
            font-size: 13px;
            font-weight: 600;
            color: #444;
            margin-bottom: 8px;
          }

          .couponInputRow {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .couponInput {
            width: 100%;
            min-width: 0;
            height: 36px;
            padding: 0 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: #fff;
            color: #212121;
            font-size: 13px;
            font-family: inherit;
            outline: none;
            box-sizing: border-box;
          }

          .couponInput:focus {
            border-color: #619233;
          }

          .applyCouponBtn,
          .removeCouponBtn {
            height: 36px;
            border: 1px solid #619233;
            border-radius: 4px;
            background: #619233;
            color: #fff;
            font-size: 13px;
            font-weight: 600;
            padding: 0 14px;
            cursor: pointer;
            white-space: nowrap;
          }

          .applyCouponBtn:disabled {
            opacity: 0.65;
            cursor: not-allowed;
          }

          .removeCouponBtn {
            background: #fff;
            border-color: #d0d7de;
            color: #4f7a29;
          }

          .couponSuccess,
          .couponError {
            margin-top: 8px;
            font-size: 12px;
            font-weight: 500;
          }

          .couponSuccess {
            color: #2e7d32;
          }

          .couponError {
            color: #e53935;
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

            .couponInputRow {
              align-items: stretch;
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

            .itemTitleRow h3 {
              font-size: 14px;
            }

            .salePill {
              font-size: 10px;
              padding: 4px 10px;
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

function DeliveryInfo() {
  const { deliveryType, estimatedTime, detectUserLocation, distanceKm } = useDelivery()
  return (
    <div>
      {deliveryType === 'fast' && (
        <div style={{ fontWeight: 700, color: '#0a7c42', fontSize: 14 }}>Fast Delivery Available</div>
      )}
      {deliveryType === 'normal' && (
        <div style={{ fontWeight: 700, color: '#b45309', fontSize: 14 }}>Standard Delivery</div>
      )}
      {!deliveryType && (
        <div style={{ color: '#888', fontSize: 13 }}>Delivery info unavailable</div>
      )}
      <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>
        {deliveryType === 'fast' && estimatedTime ? `Delivered in ${estimatedTime}` : null}
        {deliveryType === 'normal' && estimatedTime ? `Delivery ${estimatedTime}` : null}
        {distanceKm ? ` • ${distanceKm} km` : ''}
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={() => detectUserLocation().catch(() => {})} className="shopNowBtn" style={{ fontSize: 12, padding: '6px 14px' }}>Detect My Location</button>
      </div>
    </div>
  )
}
