import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import SiteHeader from './components/SiteHeader'

const organicRangeItems = [
  { title: 'Leafy Greens', image: 'https://unsplash.com/photos/whPlG79QzS0/download?force=true', href: '/vegetables/leafy-vegetables' },
  { title: 'Root Vegetables', image: 'https://unsplash.com/photos/BWzzZkQtZS0/download?force=true', href: '/root-vegetables' },
  { title: 'Cruciferous', image: 'https://unsplash.com/photos/9nzQserYaN8/download?force=true', href: '/vegetables/regular-vegetables' },
  { title: 'Alliums', image: 'https://unsplash.com/photos/FK1m_uWmqs4/download?force=true', href: '/vegetables/regular-vegetables' },
  { title: 'Tomatoes', image: 'https://unsplash.com/photos/tYJfQ1sSMbY/download?force=true', href: '/vegetables/regular-vegetables' },
  { title: 'Cucumbers', image: 'https://unsplash.com/photos/L8GbxVUQ-f0/download?force=true', href: '/vegetables/salad-vegetables' },
  { title: 'Citrus Fruits', image: 'https://unsplash.com/photos/YSA1IRkGAsg/download?force=true', href: '/imported-fruits' },
  { title: 'Tropical Fruits', image: 'https://unsplash.com/photos/qPBKEyJbyS8/download?force=true', href: '/exotic-fruits' },
  { title: 'Berries', image: 'https://unsplash.com/photos/LHLPeIGVUBw/download?force=true', href: '/fruits' },
  { title: 'Stone Fruits', image: 'https://unsplash.com/photos/ERwyquOsnNE/download?force=true', href: '/fruits' },
  { title: 'Melons', image: 'https://unsplash.com/photos/XzSlxVsSEfc/download?force=true', href: '/fruits' },
  { title: 'Exotic Picks', image: 'https://unsplash.com/photos/ta0b_NDxi6k/download?force=true', href: '/exotic-fruits' },
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
  { name: 'Apple', price: 'Rs. 180.00', size: '1 KG', image: 'data:image/jpeg;base64,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' },
  { name: 'Orange', price: 'Rs. 120.00', size: '1 KG', image: 'https://unsplash.com/photos/SOdyjl7A0Qk/download?force=true' },
  { name: 'Pomegranate', price: 'Rs. 220.00', size: '1 KG', image: 'data:image/jpeg;base64,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' },
  { name: 'Papaya', price: 'Rs. 80.00', size: '1 KG', image: 'data:image/jpeg;base64,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' },
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
  { name: 'Organic Apple Box', price: 'Rs. 399.00', size: '2 KG', image: 'https://unsplash.com/photos/kbi-wnPrOMI/download?force=true', category: 'fruit' },
  { name: 'Farm Fresh Tomato', price: 'Rs. 32.00', size: '500 GM', image: 'https://unsplash.com/photos/AvvdZlhDowA/download?force=true', category: 'vegetable' },
  { name: 'Premium Alphonso Mango', price: 'Rs. 320.00', size: '1 KG', image: 'https://unsplash.com/photos/vxtBBfMTMZ0/download?force=true', category: 'fruit' },
  { name: 'Organic Baby Spinach', price: 'Rs. 65.00', size: '250 GM', image: 'https://unsplash.com/photos/4VMqrwYfmDw/download?force=true', category: 'vegetable' },
  { name: 'Fresh Pomegranate Pack', price: 'Rs. 220.00', size: '1 KG', image: 'https://unsplash.com/photos/T-MTH8Xlt98/download?force=true', category: 'fruit' },
  { name: 'Hydroponic Lettuce', price: 'Rs. 90.00', size: '300 GM', image: 'https://unsplash.com/photos/1qnIDA6gZ1g/download?force=true', category: 'vegetable' },
  { name: 'Organic Banana Pack', price: 'Rs. 60.00', size: '1 DOZEN', image: 'https://unsplash.com/photos/lTNAB9vmUMM/download?force=true', category: 'fruit' },
  { name: 'Crisp Green Beans', price: 'Rs. 58.00', size: '500 GM', image: 'https://unsplash.com/photos/Iu-N3KHx5NM/download?force=true', category: 'vegetable' },
]

const featureDishes = [
  { name: 'Crisp Cucumber', price: '$12.00', image: 'https://unsplash.com/photos/L8GbxVUQ-f0/download?force=true', active: false },
  { name: 'Fresh Cherries', price: '$20.00', image: 'https://unsplash.com/photos/ERwyquOsnNE/download?force=true', active: true },
  { name: 'Sweet Strawberries', price: '$16.00', image: 'https://unsplash.com/photos/I497Uc8xWXQ/download?force=true', active: false },
  { name: 'Garden Broccoli', price: '$14.00', image: 'https://unsplash.com/photos/4fTaeH37eH0/download?force=true', active: false, badge: 'Hot' },
]

const topCategories = [
  { name: 'Strawberries [250g]', image: 'https://unsplash.com/photos/I497Uc8xWXQ/download?force=true', href: '/fruits' },
  { name: 'Spinach', image: 'https://unsplash.com/photos/doeWwiscUPI/download?force=true', href: '/vegetables/leafy-vegetables' },
  { name: 'Kale', image: 'https://unsplash.com/photos/B-DrrO3tSbo/download?force=true', href: '/vegetables/leafy-vegetables' },
  { name: 'Nectarines', image: 'https://unsplash.com/photos/-P2YUqgo1Qs/download?force=true', href: '/fruits' },
  { name: 'Broccoli', image: 'https://unsplash.com/photos/4fTaeH37eH0/download?force=true', href: '/vegetables/regular-vegetables' },
  { name: 'Avocado', image: 'https://unsplash.com/photos/Utnc4nbYFKo/download?force=true', href: '/exotic-fruits' },
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
              <Link href="/hydroponic-vegetables">
                <button type="button" className="shopNowBtn">Shop Now</button>
              </Link>
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
              <Link href={item.href} key={item.title}>
                <article className="organicRangeCard">
                  <div className="organicRangeImageWrap">
                    <img src={item.image} alt={item.title} loading="lazy" />
                  </div>
                  <p>{item.title}</p>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="productShelfSection" aria-label="Featured products">
        <div className="container">
          <div className="shelfBlock">
            <div className="shelfHeader">
              <h3>Fresh Vegetables <span>- daily farm-picked greens!</span></h3>
              <Link href="/hydroponic-vegetables">
                <button type="button">View All</button>
              </Link>
            </div>
            <div className="productSliderWrap">
              <button type="button" className="productNav productNavLeft" onClick={() => setArrivalPage((p) => (p - 1 + arrivalPageCount) % arrivalPageCount)} aria-label="Previous products">‹</button>
              <div className="productGrid">
                {getSectionItems(newArrivals, arrivalPage, 6).map(({ item, index }) => (
                  <Link href="/hydroponic-vegetables" key={item.name}>
                    <article className="productCard">
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
                  </Link>
                ))}
              </div>
              <button type="button" className="productNav productNavRight" onClick={() => setArrivalPage((p) => (p + 1) % arrivalPageCount)} aria-label="Next products">›</button>
            </div>
          </div>

          <div className="shelfBlock">
            <div className="shelfHeader">
              <h3>Sewa Bazaar Fruits <span>- sweet, juicy and handpicked!</span></h3>
              <Link href="/fruits">
                <button type="button">View All</button>
              </Link>
            </div>
            <div className="productSliderWrap">
              <button type="button" className="productNav productNavLeft" onClick={() => setVegPage((p) => (p - 1 + vegPageCount) % vegPageCount)} aria-label="Previous products">‹</button>
              <div className="productGrid">
                {getSectionItems(vegetableDeals, vegPage, 6).map(({ item, index }) => (
                  <Link href="/fruits" key={item.name}>
                    <article className="productCard">
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
                  </Link>
                ))}
              </div>
              <button type="button" className="productNav productNavRight" onClick={() => setVegPage((p) => (p + 1) % vegPageCount)} aria-label="Next products">›</button>
            </div>
          </div>

          <div className="shelfBlock">
            <div className="shelfHeader">
              <h3>Fruit & Veggie Combos <span>- value packs for your family!</span></h3>
              <Link href="/hydroponic-vegetables">
                <button type="button">View All</button>
              </Link>
            </div>
            <div className="productSliderWrap">
              <button type="button" className="productNav productNavLeft" onClick={() => setPantryPage((p) => (p - 1 + pantryPageCount) % pantryPageCount)} aria-label="Previous products">‹</button>
              <div className="productGrid">
                {getSectionItems(pantryPicks, pantryPage, 6).map(({ item, index }) => (
                  <Link href="/hydroponic-vegetables" key={item.name}>
                    <article className="productCard">
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
                  </Link>
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
            <Link href="/hydroponic-vegetables">
              <button type="button" className="wellnessBtn">Explore Collection</button>
            </Link>
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
              {getSectionItems(bestSellers, bestPage, 4).map(({ item, index }) => {
            const href = item.category === 'vegetable' ? '/hydroponic-vegetables' : '/fruits'
            return (
              <Link href={href} key={item.name}>
                <article className="productCard">
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
              </Link>
            )
          })}
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
              <Link href="/hydroponic-vegetables">
                <button type="button">Shop Now</button>
              </Link>
            </div>
          </article>

          <article className="promoCard promoRight">
            <img src="/Yellow%20Modern%20Fruit%20Store%20Promotion%20Banner.png" alt="Vegetable sale banner" />
            <div className="promoOverlay">
              <h3>Vegetables Big Sale Fresh Farm Products</h3>
              <Link href="/hydroponic-vegetables">
                <button type="button">Shop Now</button>
              </Link>
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
                <div className="homeFeatureImage">
                  <img src={item.image} alt={item.name} loading="lazy" />
                </div>
                <div className="homeFeatureInfo">
                  {item.badge ? <span className="homeFeatureBadge">{item.badge}</span> : null}
                  <h3>{item.name}</h3>
                  <p>{item.price}</p>
                  <div className="homeFeatureStars" aria-label="Rated 5 out of 5">★★★★★</div>
                </div>
              </article>
            ))}
          </div>

          <aside className="homeFeatureOfferCard" aria-label="Mango offer">
            <div className="homeFeatureOfferImage">
              <img src="https://unsplash.com/photos/7iLlgS5o09c/download?force=true" alt="Fresh mango" loading="lazy" />
            </div>
            <div className="homeFeatureOfferClosed">Offer open</div>
            <div className="homeFeatureOfferBody">
              <h3>Fresh Mango</h3>
              <p>$9.50</p>
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
              <Link href={item.href} key={`${item.name}-${idx}`}>
                <article className="shopCategoryCard">
                  <div className="shopCategoryImgWrap">
                    <img src={item.image} alt={item.name} loading="lazy" />
                  </div>
                  <p>{item.name}</p>
                </article>
              </Link>
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
