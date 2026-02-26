import { useEffect, useRef, useState } from 'react'
import SiteHeader from './components/SiteHeader'

const organicRangeItems = [
  { title: 'Leafy Greens', image: 'https://unsplash.com/photos/whPlG79QzS0/download?force=true' },
  { title: 'Root Vegetables', image: 'https://unsplash.com/photos/BWzzZkQtZS0/download?force=true' },
  { title: 'Cruciferous', image: 'https://unsplash.com/photos/9nzQserYaN8/download?force=true' },
  { title: 'Alliums', image: 'https://unsplash.com/photos/FK1m_uWmqs4/download?force=true' },
  { title: 'Tomatoes', image: 'https://unsplash.com/photos/tYJfQ1sSMbY/download?force=true' },
  { title: 'Cucumbers', image: 'https://source.unsplash.com/700x700/?cucumber' },
  { title: 'Citrus Fruits', image: 'https://source.unsplash.com/700x700/?citrus,orange,lemon' },
  { title: 'Tropical Fruits', image: 'https://source.unsplash.com/700x700/?tropical-fruits' },
  { title: 'Berries', image: 'https://source.unsplash.com/700x700/?berries' },
  { title: 'Stone Fruits', image: 'https://source.unsplash.com/700x700/?peach,plum' },
  { title: 'Melons', image: 'https://source.unsplash.com/700x700/?watermelon,melon' },
  { title: 'Exotic Picks', image: 'https://source.unsplash.com/700x700/?dragon-fruit,kiwi' },
]

const newArrivals = [
  { name: 'Fresh Tomato', price: 'Rs. 32.00', size: '500 GM', image: 'https://unsplash.com/photos/YfLRk4RtRcU/download?force=true' },
  { name: 'Organic Potato', price: 'Rs. 50.00', size: '1 KG', image: 'https://unsplash.com/photos/jJUuF4hqCQM/download?force=true' },
  { name: 'Green Capsicum', price: 'Rs. 42.00', size: '500 GM', image: 'https://unsplash.com/photos/3N_znw90QlU/download?force=true' },
  { name: 'Red Onion', price: 'Rs. 52.00', size: '1 KG', image: 'https://unsplash.com/photos/SQ51rwKOi9s/download?force=true' },
  { name: 'Fresh Carrot', price: 'Rs. 48.00', size: '500 GM', image: 'https://unsplash.com/photos/R198mTymEFQ/download?force=true' },
  { name: 'Cucumber', price: 'Rs. 36.00', size: '500 GM', image: 'https://unsplash.com/photos/puMz26-ub30/download?force=true' },
  { name: 'Bottle Gourd', price: 'Rs. 44.00', size: '1 KG', image: 'https://unsplash.com/photos/jS02QWnPOAA/download?force=true' },
  { name: 'Lady Finger', price: 'Rs. 40.00', size: '500 GM', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThiXMjOAHWxGVinoRCv4I0Wmo8tUQ39z-Y_4O0xgCsFHxJWQF6vipyVyReKd5ATUOTIRXdMr99vyvbcn5KfJZerlzD6gt7ps6IvVd2ltPJ&s=10' },
  { name: 'Cauliflower', price: 'Rs. 38.00', size: '1 PC', image: 'https://unsplash.com/photos/PT-GXFtQj-s/download?force=true' },
  { name: 'Cabbage', price: 'Rs. 30.00', size: '1 PC', image: 'https://unsplash.com/photos/5MU_4hPl67Y/download?force=true' },
  { name: 'Spinach', price: 'Rs. 25.00', size: '250 GM', image: 'https://unsplash.com/photos/4jpNPu7IW8k/download?force=true' },
  { name: 'Beetroot', price: 'Rs. 40.00', size: '500 GM', image: 'https://unsplash.com/photos/eZBVfr8EpaA/download?force=true' },
]

const vegetableDeals = [
  { name: 'Banana', price: 'Rs. 60.00', size: '1 DOZEN', image: 'https://unsplash.com/photos/Kl3467edwsE/download?force=true' },
  { name: 'Apple', price: 'Rs. 180.00', size: '1 KG', image: 'https://unsplash.com/photos/XiWQbLEhFyo/download?force=true' },
  { name: 'Orange', price: 'Rs. 120.00', size: '1 KG', image: 'https://unsplash.com/photos/SOdyjl7A0Qk/download?force=true' },
  { name: 'Pomegranate', price: 'Rs. 220.00', size: '1 KG', image: 'https://unsplash.com/photos/XiWQbLEhFyo/download?force=true' },
  { name: 'Papaya', price: 'Rs. 80.00', size: '1 KG', image: 'https://unsplash.com/photos/RC6RbCzw_lg/download?force=true' },
  { name: 'Watermelon', price: 'Rs. 35.00', size: '1 KG', image: 'https://unsplash.com/photos/izi5AnlbRIA/download?force=true' },
  { name: 'Grapes', price: 'Rs. 95.00', size: '500 GM', image: 'https://unsplash.com/photos/KyFEImlFKQY/download?force=true' },
  { name: 'Mango', price: 'Rs. 210.00', size: '1 KG', image: 'https://unsplash.com/photos/7iLlgS5o09c/download?force=true' },
  { name: 'Guava', price: 'Rs. 90.00', size: '1 KG', image: 'https://unsplash.com/photos/vUlr2F01z-o/download?force=true' },
  { name: 'Pineapple', price: 'Rs. 70.00', size: '1 PC', image: 'https://unsplash.com/photos/Cr9hZrpC1Oc/download?force=true' },
  { name: 'Muskmelon', price: 'Rs. 55.00', size: '1 KG', image: 'https://unsplash.com/photos/PIybW7_fg1U/download?force=true' },
  { name: 'Kiwi', price: 'Rs. 140.00', size: '500 GM', image: 'https://unsplash.com/photos/wds9ue_gops/download?force=true' },
]

const pantryPicks = [
  { name: 'Seasonal Veg Combo', price: 'Rs. 199.00', size: '2 KG', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQL3Evx-3CrwP-gEBdpeUbxguBnZXuserSqzg&s' },
  { name: 'Leafy Greens Mix', price: 'Rs. 75.00', size: '500 GM', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdeLSkf0wrGWhCTDI_PBYaK0rR_Oyv2TxovA&s' },
  { name: 'Root Vegetables Pack', price: 'Rs. 140.00', size: '1 KG', image: 'https://unsplash.com/photos/-r5KSMkyoSc/download?force=true' },
  { name: 'Salad Veg Mix', price: 'Rs. 95.00', size: '800 GM', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRP6BuOWHh7oM2cHY2WjhCXSoHTrqOn7q1HEQ&s' },
  { name: 'Tropical Fruit Box', price: 'Rs. 299.00', size: '2 KG', image: 'https://unsplash.com/photos/0xgDzbm8rO8/download?force=true' },
  { name: 'Citrus Fruit Box', price: 'Rs. 220.00', size: '1.5 KG', image: 'https://unsplash.com/photos/m8TlqcWBjT0/download?force=true' },
  { name: 'Berry Fruit Pack', price: 'Rs. 260.00', size: '500 GM', image: 'https://unsplash.com/photos/jHcKq383ibg/download?force=true' },
  { name: 'Family Fruit Basket', price: 'Rs. 349.00', size: '3 KG', image: 'https://unsplash.com/photos/2ZgflmYgK_E/download?force=true' },
  { name: 'Farm Fresh Veg Basket', price: 'Rs. 289.00', size: '3 KG', image: 'https://unsplash.com/photos/_U8BWkVytUI/download?force=true' },
  { name: 'Kids Fruit Box', price: 'Rs. 175.00', size: '1 KG', image: 'https://unsplash.com/photos/23XEGHMH5dQ/download?force=true' },
  { name: 'Hydroponic Veg Pack', price: 'Rs. 240.00', size: '1 KG', image: 'https://unsplash.com/photos/7_TOqDuIqp4/download?force=true' },
  { name: 'Exotic Fruits Pack', price: 'Rs. 390.00', size: '1 KG', image: 'https://unsplash.com/photos/qPBKEyJbyS8/download?force=true' },
]

const bestSellers = [
  { name: 'Organic Apple Box', price: 'Rs. 399.00', size: '2 KG', image: 'https://unsplash.com/photos/kbi-wnPrOMI/download?force=true' },
  { name: 'Farm Fresh Tomato', price: 'Rs. 32.00', size: '500 GM', image: 'https://source.unsplash.com/500x320/?fresh-tomato' },
  { name: 'Premium Alphonso Mango', price: 'Rs. 320.00', size: '1 KG', image: 'https://unsplash.com/photos/vxtBBfMTMZ0/download?force=true' },
  { name: 'Organic Baby Spinach', price: 'Rs. 65.00', size: '250 GM', image: 'https://unsplash.com/photos/4VMqrwYfmDw/download?force=true' },
  { name: 'Fresh Pomegranate Pack', price: 'Rs. 220.00', size: '1 KG', image: 'https://unsplash.com/photos/T-MTH8Xlt98/download?force=true' },
  { name: 'Hydroponic Lettuce', price: 'Rs. 90.00', size: '300 GM', image: 'https://unsplash.com/photos/1qnIDA6gZ1g/download?force=true' },
  { name: 'Organic Banana Pack', price: 'Rs. 60.00', size: '1 DOZEN', image: 'https://unsplash.com/photos/lTNAB9vmUMM/download?force=true' },
  { name: 'Crisp Green Beans', price: 'Rs. 58.00', size: '500 GM', image: 'https://unsplash.com/photos/Iu-N3KHx5NM/download?force=true' },
]

const featureDishes = [
  { name: 'Black Beans', price: '$20.00', image: '🍌', active: false },
  { name: 'Jungle Food', price: '$20.00', image: '🍒', active: true },
  { name: 'Kidney Beans', price: '$18.00', image: '🥝', active: false },
  { name: 'Carne Asada', price: '$45.00', image: '🍇', active: false, badge: 'Hot' },
]

const topCategories = [
  { name: 'Strawberries [250g]', image: 'https://source.unsplash.com/700x700/?strawberries,dessert' },
  { name: 'Spinach', image: 'https://unsplash.com/photos/doeWwiscUPI/download?force=true' },
  { name: 'Kale', image: 'https://unsplash.com/photos/B-DrrO3tSbo/download?force=true' },
  { name: 'Nectarines', image: 'https://source.unsplash.com/700x700/?nectarine,fruit' },
  { name: 'Broccoli', image: 'https://source.unsplash.com/700x700/?broccoli,vegetable' },
  { name: 'Avocado', image: 'https://source.unsplash.com/700x700/?avocado,healthy-food' },
]


const wellnessVisuals = {
  primary: '/vecteezy_a-basket-brimming-with-vegetables_44771696.png',
  secondary: '/vecteezy_assortment-of-fresh-fruits-bursting-with-color-isolated-on_48725335.png',
}

const parseRupees = (price) => Number(price.replace(/[^\d.]/g, ''))
const formatRupees = (amount) => `Rs. ${amount.toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`
const getSectionItems = (items, page, size) => {
  const start = page * size
  return items.slice(start, start + size).map((item, offset) => ({ item, index: start + offset }))
}

export default function Home() {
  const heroImages = [
    '/hero/Green%20Modern%20Bold%20Vegetable%20Grocery%20Presentation%20(1).png',
    '/hero/Green%20and%20Yellow%20Modern%20Vegetable%20Shop%20Profile%20Presentation.png',
    '/hero/Red%20Yellow%20Colorful%20Fruits%20Presentation.png',
  ]

  // allow overriding via env var (NEXT_PUBLIC_HERO_IMAGES) as comma separated URLs
  const envImages = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_HERO_IMAGES
    ? process.env.NEXT_PUBLIC_HERO_IMAGES.split(',').map(s => s.trim()).filter(Boolean)
    : null

  const slides = (envImages && envImages.length) ? envImages : heroImages
  const [active, setActive] = useState(0)
  const timerRef = useRef(null)
  const [arrivalQty, setArrivalQty] = useState(() => newArrivals.map(() => 1))
  const [vegQty, setVegQty] = useState(() => vegetableDeals.map(() => 1))
  const [pantryQty, setPantryQty] = useState(() => pantryPicks.map(() => 1))
  const [bestQty, setBestQty] = useState(() => bestSellers.map(() => 1))
  const [arrivalPage, setArrivalPage] = useState(0)
  const [vegPage, setVegPage] = useState(0)
  const [pantryPage, setPantryPage] = useState(0)
  const [bestPage, setBestPage] = useState(0)
  const wellnessRef = useRef(null)
  const [wellnessVisible, setWellnessVisible] = useState(false)
  const arrivalPageCount = Math.ceil(newArrivals.length / 6)
  const vegPageCount = Math.ceil(vegetableDeals.length / 6)
  const pantryPageCount = Math.ceil(pantryPicks.length / 6)
  const bestPageCount = Math.ceil(bestSellers.length / 4)

  const changeQty = (setter, index, delta) => {
    setter((prev) => prev.map((qty, i) => {
      if (i !== index) return qty
      return Math.max(1, qty + delta)
    }))
  }

  useEffect(() => {
    if (slides.length <= 1) return undefined

    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length)
    }, 4000)

    return () => clearInterval(timerRef.current)
  }, [slides.length])

  useEffect(() => {
    if (!wellnessRef.current) return undefined

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setWellnessVisible(true)
          observer.disconnect()
        }
      })
    }, { threshold: 0.35 })

    observer.observe(wellnessRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <main className="pageShell">
      <div className="promoStrip">
        <div className="promoStripInner">
          <p className="promoTitle">Special Offer!</p>
          <p className="promoSubtitle">Rewarding all customers with a 30% discount</p>
        </div>
      </div>

      <div className="utilityBar">
        <div className="utilityBarInner">
          <div className="utilityLeft" />
          <div className="utilityRight">
            <a href="#" className="utilityItem">Track Your Order</a>
            <a href="#" className="utilityItem">Contact Us</a>
            <a href="#" className="utilityItem">FAQ&apos;s</a>
          </div>
        </div>
      </div>

      <SiteHeader />

      <style jsx global>{`
        /* Show dropdown on hover */
        .mainNav li:hover > .veg-dropdown {
          display: block;
        }
      `}</style>

      <section className="heroAnimationSection">
        <div className="topAnimationBar" aria-hidden="true">
          <div className="barGradient" />
        </div>

        <div className="animationContainer">
          <div className="heroCarousel" aria-hidden="false">
            {slides.map((src, idx) => (
              <div
                className={`carouselItem ${idx === active ? 'isActive' : ''}`}
                key={idx}
                aria-hidden={idx !== active}
              >
                {src ? (
                  <img src={src} alt={`slide ${idx + 1}`} />
                ) : (
                  <div className="placeholder">slide {idx + 1}</div>
                )}
              </div>
            ))}

            <div className="heroOverlayText">
              <p className="heroKicker">Fresh Every Day</p>
              <h1>Organic Groceries Delivered Fast</h1>
              <p className="heroSubtitle">Farm-picked vegetables, fruits, and essentials at your doorstep.</p>
              <button type="button" className="shopNowBtn">Shop Now</button>
            </div>
          </div>
        </div>
      </section>

      <section className="trustRibbonSection" aria-label="Trust badges">
        <div className="trustRibbonInner">
          <div className="trustLeft">
            <div className="trustRound">India</div>
            <div className="trustRound">USDA</div>
            <div className="trustRound">Organic</div>
            <div className="trustRound">100%</div>
          </div>

          <div className="trustCenter">
            <p>India&apos;s 1st</p>
            <h2>Certified Organic Online Store</h2>
          </div>

          <div className="trustRight">
            <div className="trustMini">
              <span className="trustIcon" aria-hidden>
                <svg viewBox="0 0 24 24" className="trustIconSvg">
                  <path d="M12 3l7 3v5c0 5-3.2 8.8-7 10-3.8-1.2-7-5-7-10V6l7-3z" fill="none" stroke="currentColor" strokeWidth="1.9" />
                </svg>
              </span>
              <span>100% Trusted</span>
            </div>
            <div className="trustMini">
              <span className="trustIcon" aria-hidden>
                <svg viewBox="0 0 24 24" className="trustIconSvg">
                  <path d="M12 3v6M9 6h6M5 12c2-2 4-2 6 0M13 12c2-2 4-2 6 0M7 18c1.5-2 3.5-2 5 0M12 18c1.5-2 3.5-2 5 0" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                </svg>
              </span>
              <span>No Wastage Policy</span>
            </div>
            <div className="trustMini">
              <span className="trustIcon" aria-hidden>
                <svg viewBox="0 0 24 24" className="trustIconSvg">
                  <path d="M7 11l3 3m7-4l-3 3m-5 1l1.2 1.2a2 2 0 0 0 2.8 0L17 12m-10 0L4 9m13 3l3-3M10 14l-2.2-2.2a2 2 0 0 0-2.8 0L4 13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>Fair Trade with Farmers</span>
            </div>
          </div>
        </div>
      </section>

      <section className="organicRangeSection" aria-label="Our organic range">
        <div className="container">
          <h2>OUR ORGANIC RANGE</h2>
          <div className="organicRangeGrid">
            {organicRangeItems.map((item) => (
              <article className="organicRangeCard" key={item.title}>
                <div className="organicRangeImageWrap">
                  <img src={item.image} alt={item.title} loading="lazy" />
                </div>
                <p>{item.title}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="productShelfSection" aria-label="Featured products">
        <div className="container">
          <div className="shelfBlock">
            <div className="shelfHeader">
              <h3>Fresh Vegetables <span>- daily farm-picked greens!</span></h3>
              <button type="button">View All</button>
            </div>
            <div className="productSliderWrap">
              <button type="button" className="productNav productNavLeft" onClick={() => setArrivalPage((p) => (p - 1 + arrivalPageCount) % arrivalPageCount)} aria-label="Previous products">‹</button>
              <div className="productGrid">
                {getSectionItems(newArrivals, arrivalPage, 6).map(({ item, index }) => (
                <article className="productCard" key={item.name}>
                  <div className="productImageWrap">
                    <img className={item.name && item.name.includes('Potato') ? 'forceCover' : ''} src={item.image} alt={item.name} loading="lazy" />
                  </div>
                  <p className="productName">{item.name}</p>
                  <p className="productPrice">{formatRupees(parseRupees(item.price) * arrivalQty[index])}</p>
                  <span className="productSize">{item.size}</span>
                  <div className="qtyRow">
                    <button type="button" onClick={() => changeQty(setArrivalQty, index, -1)}>-</button>
                    <span>{arrivalQty[index]}</span>
                    <button type="button" onClick={() => changeQty(setArrivalQty, index, 1)}>+</button>
                  </div>
                  <button type="button" className="pickNowBtn">Add to Cart</button>
                </article>
              ))}
              </div>
              <button type="button" className="productNav productNavRight" onClick={() => setArrivalPage((p) => (p + 1) % arrivalPageCount)} aria-label="Next products">›</button>
            </div>
          </div>

          <div className="shelfBlock">
            <div className="shelfHeader">
              <h3>Sewa Bazaar Fruits <span>- sweet, juicy and handpicked!</span></h3>
              <button type="button">View All</button>
            </div>
            <div className="productSliderWrap">
              <button type="button" className="productNav productNavLeft" onClick={() => setVegPage((p) => (p - 1 + vegPageCount) % vegPageCount)} aria-label="Previous products">‹</button>
              <div className="productGrid">
                {getSectionItems(vegetableDeals, vegPage, 6).map(({ item, index }) => (
                <article className="productCard" key={item.name}>
                  <div className="productImageWrap">
                    <img src={item.image} alt={item.name} loading="lazy" />
                  </div>
                  <p className="productName">{item.name}</p>
                  <p className="productPrice">{formatRupees(parseRupees(item.price) * vegQty[index])}</p>
                  <span className="productSize">{item.size}</span>
                  <div className="qtyRow">
                    <button type="button" onClick={() => changeQty(setVegQty, index, -1)}>-</button>
                    <span>{vegQty[index]}</span>
                    <button type="button" onClick={() => changeQty(setVegQty, index, 1)}>+</button>
                  </div>
                  <button type="button" className="pickNowBtn">Add to Cart</button>
                </article>
              ))}
              </div>
              <button type="button" className="productNav productNavRight" onClick={() => setVegPage((p) => (p + 1) % vegPageCount)} aria-label="Next products">›</button>
            </div>
          </div>

          <div className="shelfBlock">
            <div className="shelfHeader">
              <h3>Fruit & Veggie Combos <span>- value packs for your family!</span></h3>
              <button type="button">View All</button>
            </div>
            <div className="productSliderWrap">
              <button type="button" className="productNav productNavLeft" onClick={() => setPantryPage((p) => (p - 1 + pantryPageCount) % pantryPageCount)} aria-label="Previous products">‹</button>
              <div className="productGrid">
                {getSectionItems(pantryPicks, pantryPage, 6).map(({ item, index }) => (
                <article className="productCard" key={item.name}>
                  <div className="productImageWrap">
                    <img src={item.image} alt={item.name} loading="lazy" />
                  </div>
                  <p className="productName">{item.name}</p>
                  <p className="productPrice">{formatRupees(parseRupees(item.price) * pantryQty[index])}</p>
                  <span className="productSize">{item.size}</span>
                  <div className="qtyRow">
                    <button type="button" onClick={() => changeQty(setPantryQty, index, -1)}>-</button>
                    <span>{pantryQty[index]}</span>
                    <button type="button" onClick={() => changeQty(setPantryQty, index, 1)}>+</button>
                  </div>
                  <button type="button" className="pickNowBtn">Add to Cart</button>
                </article>
              ))}
              </div>
              <button type="button" className="productNav productNavRight" onClick={() => setPantryPage((p) => (p + 1) % pantryPageCount)} aria-label="Next products">›</button>
            </div>
          </div>
        </div>
      </section>

      <section
        className={`wellnessStorySection ${wellnessVisible ? 'isVisible' : ''}`}
        aria-label="Natural products section"
        ref={wellnessRef}
      >
        <div className="container wellnessStoryWrap">
          <div className="wellnessText">
            <p className="wellnessTag">Pure ingredients. Real wellness.</p>
            <h2>Natural Products Designed for Everyday Healthy Living</h2>
            <p>
              Discover thoughtfully sourced organic essentials made to support your daily routine. From
              fresh produce to wellness products, every item is selected for quality, safety, and
              long-term health benefits for you and your family. We partner with trusted growers and
              responsible suppliers to bring you clean, authentic products at fair prices. With consistent
              freshness, careful packaging, and dependable doorstep delivery, Sewa Bazzar helps you build
              healthier habits with confidence every single day.
            </p>
            <button type="button" className="wellnessBtn">Explore Collection</button>
          </div>

          <div className="wellnessVisualArea">
            <img className="wellnessPrimary" src={wellnessVisuals.primary} alt="Natural product visual one" />
            <img className="wellnessSecondary" src={wellnessVisuals.secondary} alt="Natural product visual two" />
          </div>
        </div>
      </section>

      <section className="bestSellersSection" aria-label="Nature's best sellers">
        <div className="container">
          <div className="bestSellersHeader">
            <h2>Sewa Bazaar Best Sellers</h2>
            <p>Most ordered fruits and vegetables loved by our customers</p>
          </div>

          <div className="productSliderWrap bestSellersSliderWrap">
            <button type="button" className="productNav productNavLeft" onClick={() => setBestPage((p) => (p - 1 + bestPageCount) % bestPageCount)} aria-label="Previous products">‹</button>
            <div className="productGrid bestSellersGrid">
              {getSectionItems(bestSellers, bestPage, 4).map(({ item, index }) => (
              <article className="productCard" key={item.name}>
                <div className="productImageWrap">
                  <img src={item.image} alt={item.name} loading="lazy" />
                </div>
                <p className="productName">{item.name}</p>
                <p className="productPrice">{formatRupees(parseRupees(item.price) * bestQty[index])}</p>
                <span className="productSize">{item.size}</span>
                <div className="qtyRow">
                  <button type="button" onClick={() => changeQty(setBestQty, index, -1)}>-</button>
                  <span>{bestQty[index]}</span>
                  <button type="button" onClick={() => changeQty(setBestQty, index, 1)}>+</button>
                </div>
                <button type="button" className="pickNowBtn">Add to Cart</button>
              </article>
            ))}
            </div>
            <button type="button" className="productNav productNavRight" onClick={() => setBestPage((p) => (p + 1) % bestPageCount)} aria-label="Next products">›</button>
          </div>
        </div>
      </section>

      <section className="dualPromoSection" aria-label="Promotional banners">
        <div className="dualPromoGrid">
          <article className="promoCard promoLeft">
            <img src="/Green%20Gradient%20Modern%20Playful%20Cute%20Leaves%20Vegetable%20Illustrative%20Food%20Healthy%20Salad%20Presentation.png" alt="Premium organic food banner" />
            <div className="promoOverlay">
              <h3>We Offer Premium &amp; 100% Organic Fruits</h3>
              <button type="button">Shop Now</button>
            </div>
          </article>

          <article className="promoCard promoRight">
            <img src="/Yellow%20Modern%20Fruit%20Store%20Promotion%20Banner.png" alt="Vegetable sale banner" />
            <div className="promoOverlay">
              <h3>Vegetables Big Sale Fresh Farm Products</h3>
              <button type="button">Shop Now</button>
            </div>
          </article>
        </div>
      </section>

      <section className="homeFeatureArrivalSection" aria-label="Latest arrivals under banners">
        <div className="homeFeatureArrivalHead">
          <h2>Latest Arrivals</h2>
          <p>Feature Dishes</p>
          <span className="homeFeatureLeaf" aria-hidden="true">❧</span>
        </div>
        <div className="homeFeatureTopDecor" aria-hidden="true">
          <img src="/vecteezy_hand-drawn-fruits-clipart-design-illustration_9342298.png" alt="" />
        </div>

        <div className="homeFeatureArrivalWrap">
          <div className="homeFeatureArrivalGrid">
            {featureDishes.map((item) => (
              <article key={item.name} className={`homeFeatureCard ${item.active ? 'active' : ''}`}>
                <div className="homeFeatureImage" aria-hidden="true">{item.image}</div>
                <div className="homeFeatureInfo">
                  {item.badge ? <span className="homeFeatureBadge">{item.badge}</span> : null}
                  <h3>{item.name}</h3>
                  <p>{item.price}</p>
                  <div className="homeFeatureStars" aria-label="Rated 5 out of 5">★★★★★</div>
                </div>
              </article>
            ))}
          </div>

          <aside className="homeFeatureOfferCard" aria-label="Apple juice offer">
            <div className="homeFeatureOfferImage" aria-hidden="true">🍎</div>
            <div className="homeFeatureOfferClosed">Offer closed</div>
            <div className="homeFeatureOfferBody">
              <h3>Apple Juice</h3>
              <p>$11.05</p>
              <div className="homeFeatureStars" aria-label="Rated 5 out of 5">★★★★★</div>
            </div>
          </aside>
        </div>
      </section>

      <section className="shopCategoriesSection" aria-label="Shop by categories">
        <div className="shopCategoriesHead">
          <h2>Shop By Categories</h2>
          <p>Top Categories</p>
          <span aria-hidden="true">❧</span>
        </div>
        <div className="shopCategoriesLeftDecor" aria-hidden="true">
          <img src="/vecteezy_hand-drawn-fruits-clipart-design-illustration_9342298.png" alt="" />
        </div>

        <div className="shopCategoriesRail">
          <div className="shopCategoriesTrack">
            {[...topCategories, ...topCategories].map((item, idx) => (
              <article className="shopCategoryCard" key={`${item.name}-${idx}`}>
                <div className="shopCategoryImgWrap">
                  <img src={item.image} alt={item.name} loading="lazy" />
                </div>
                <p>{item.name}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="clientSaySection" aria-label="Client testimonials">
        <div className="clientSayInner">
          <div className="clientSayHeader">
            <h2>What Our Clients Say</h2>
            <p>
              Discover why thousands of families trust Sewa Bazaar for their fresh produce and
              mindful living.
            </p>
            <p>Real reviews from real people who love our fruits and vegetables.</p>
          </div>

          <div className="clientSaySlider">
            <button type="button" className="clientNav clientNavLeft" aria-label="Previous testimonial">‹</button>

            <div className="clientSayCards">
              <article className="clientCard">
                <span className="clientQuote" aria-hidden="true">“</span>
                <h3>Prakriti Care is the Best!</h3>
                <p>
                  I've been using Prakriti Care's herbal hair oil for three months now, and the
                  transformation is remarkable. My hair is stronger, shinier, and healthier. The
                  natural ingredients make all the difference!
                </p>
                <div className="clientMeta">
                  <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80" alt="Jane Travis" />
                  <div>
                    <strong>Jane Travis</strong>
                    <span>Writer</span>
                  </div>
                </div>
              </article>

              <article className="clientCard">
                <span className="clientQuote" aria-hidden="true">“</span>
                <h3>100% Recommended</h3>
                <p>
                  As someone with sensitive skin, I've struggled to find products that work for me.
                  Prakriti Care's Ayurvedic skincare line has been a game-changer. Natural, effective,
                  and gentle on my skin!
                </p>
                <div className="clientMeta">
                  <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80" alt="Larry Wilson" />
                  <div>
                    <strong>Larry Wilson</strong>
                    <span>Journalist</span>
                  </div>
                </div>
              </article>
            </div>

            <button type="button" className="clientNav clientNavRight" aria-label="Next testimonial">›</button>
          </div>
        </div>
      </section>

      <footer className="siteFooter" aria-label="Footer">
        <div className="siteFooterInner">
          <div className="footerContent">
            <section className="footerColumns" aria-label="Footer links and contact">
              <article className="footerCol">
                <h4>Contact Us</h4>
                <p>6 Fifth Avenue 5501, Broadway, New York, NY 10012</p>
                <ul>
                  <li>foodano@email.com</li>
                  <li>+1 (123) 4567 8900</li>
                </ul>
              </article>

              <article className="footerCol">
                <h4>Useful Links</h4>
                <ul>
                  <li>Shop</li>
                  <li>Blog</li>
                  <li>Contact Us</li>
                  <li>FAQ Page</li>
                  <li>Services</li>
                </ul>
              </article>

              <article className="footerCol">
                <h4>Follow Us Now</h4>
                <ul>
                  <li>Facebook</li>
                  <li>Twitter</li>
                  <li>Dribbble</li>
                  <li>Pinterest</li>
                  <li>LinkedIn</li>
                </ul>
              </article>

              <article className="footerCol">
                <h4>Get Direction</h4>
                <div className="footerMap">
                  <iframe
                    title="Map to New York"
                    src="https://www.openstreetmap.org/export/embed.html?bbox=-74.20%2C40.55%2C-73.70%2C40.95&amp;layer=mapnik"
                    loading="lazy"
                  />
                </div>
              </article>
            </section>

            <div className="footerBottom">
              © {new Date().getFullYear()} Sewa Bazaar. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

    </main>
  )
}
