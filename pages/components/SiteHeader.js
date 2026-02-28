import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import VegetablesDropdown from '../../components/VegetablesDropdown'

const navItems = [
  'VEGETABLES',
  'HYDROPONIC VEGGIES',
  'FRUITS',
  'SEASONAL SPECIALS',
  // 'LEAFY GREENS',
  'ROOT VEGETABLES',
  'EXOTIC FRUITS',
  'FARM FRESH PICKS',
  'ORGANIC SPECIALS',
  'VALUE COMBOS',
  'FRUIT BASKETS',
  'IMPORTED FRUITS',
  // 'MANGOES' removed per request
]

const routeMap = {
  'FRUITS': '/mangoes',
  'EXOTIC FRUITS': '/exotic-fruits',
  'ORGANIC SPECIALS': '/organic-specials',
  'VALUE COMBOS': '/value-combos',
  'FRUIT BASKETS': '/fruit-baskets',
  'IMPORTED FRUITS': '/imported-fruits',
  'FARM FRESH PICKS': '/farm-fresh-picks',
  'SEASONAL SPECIALS': '/seasonal-special',
  'ROOT VEGETABLES': '/root-vegetables',
}

export default function SiteHeader() {
  const [vegOpen, setVegOpen] = useState(false)
  useEffect(() => {
    // Attach pointer events as a fallback to ensure hover works across browsers
    const el = document.getElementById('nav-vegetables')
    if (!el) return undefined

    const onEnter = () => el.classList.add('veg-open')
    const onLeave = () => el.classList.remove('veg-open')

    el.addEventListener('pointerenter', onEnter)
    el.addEventListener('pointerleave', onLeave)

    return () => {
      el.removeEventListener('pointerenter', onEnter)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  const vegBtnRef = useRef(null)

  return (
    <>
      <div className="siteHeaderWrap">
        <header className="topHeader">
        <Link href="/" aria-label="Sewa Bazaar home" className="logoWrap">
          <div className="logoInner">
            <img src="/logo.png" alt="Sewa Bazaar" />
            <span className="brandName">
              <span>Sewa</span>
              <span>Bazaar</span>
            </span>
          </div>
        </Link>

        <div className="searchWrap">
          <input type="text" placeholder="Go organic" aria-label="Search products" />
          <button type="button" className="searchBtn">Search</button>
        </div>

        <div className="topActions">
          <div className="headerInfo">
            <div className="headerInfoRow">
              <span>Mon-Fri 8:00 AM - 20:00 PM Saturday Closed</span>
            </div>
            <div className="headerInfoRow">
              <span>(+800) 111 2020, (+700) 353 44 555</span>
            </div>
          </div>

          <button className="cartBtn" type="button" aria-label="Cart">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 4h2l2.2 9.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 7H7.1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="10" cy="19" r="1.5" fill="currentColor" />
              <circle cx="17" cy="19" r="1.5" fill="currentColor" />
            </svg>
            <span className="cartCount">0</span>
          </button>
        </div>
      </header>

      <nav className="mainNav">
        <ul>
          {navItems.map((label) => (
            <li
              key={label}
              id={label === 'VEGETABLES' ? 'nav-vegetables' : undefined}
              className={label === 'VEGETABLES' ? (vegOpen ? 'veg-open' : '') : undefined}
              onMouseEnter={label === 'VEGETABLES' ? () => setVegOpen(true) : undefined}
              onMouseLeave={label === 'VEGETABLES' ? () => setVegOpen(false) : undefined}
              onFocus={label === 'VEGETABLES' ? () => setVegOpen(true) : undefined}
              onBlur={label === 'VEGETABLES' ? () => setVegOpen(false) : undefined}
            >
              {label === 'VEGETABLES' ? (
                <>
                  <button
                    type="button"
                    className="navLink"
                    aria-haspopup="true"
                    aria-expanded={vegOpen}
                    onClick={() => setVegOpen((v) => !v)}
                    ref={vegBtnRef}
                  >
                    {label}
                  </button>
                  <VegetablesDropdown isOpen={vegOpen} anchorRef={vegBtnRef} />
                </>
              ) : routeMap[label] ? (
                <Link href={routeMap[label]} className="navLink">{label}</Link>
              ) : (
                <button type="button">{label}</button>
              )}
            </li>
          ))}
        </ul>
        <Link href="/account" className="accountBtn">Account</Link>
        </nav>
      </div>

      <style jsx>{`
        .siteHeaderWrap { position: sticky; top: 0; z-index: 1200; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        /* Ensure header contents don't overlap page content when sticky */
        :global(body) { --site-header-height: 112px; }
        .logoWrap { display: inline-flex; align-items: center; text-decoration: none; }
        .logoInner { display: flex; align-items: center; gap: 10px; }
        .logoInner img { width: 56px; height: 56px; object-fit: contain; display: block; }
  .brandName { display: flex; flex-direction: column; line-height: 1; color: #000; font-weight: 800; }
  .brandName span { color: #000; font-weight: 800; font-size: 18px; }
  .brandName span + span { margin-top: 2px; }

        /* Small screens: slightly smaller logo and text */
        @media (max-width: 520px) {
          .logoInner img { width: 44px; height: 44px; }
          .brandName span { font-size: 16px; }
        }
      `}</style>
    </>
  )
}
