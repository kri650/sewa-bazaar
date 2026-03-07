import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import VegetablesDropdown from './VegetablesDropdown'
import FarmFreshDropdown from './FarmFreshDropdown'
import { useCart } from '../contexts/CartContext'
import { useLocation } from '../contexts/LocationContext'
import LocationPicker from './LocationPicker'
import allProducts from '../data/products'

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
  // 'VALUE COMBOS',
  'FRUIT BASKETS',
  'IMPORTED FRUITS',
  // 'MANGOES' removed per request
]

const routeMap = {
  'FRUITS': '/fruits',
  'EXOTIC FRUITS': '/exotic-fruits',
  'ORGANIC SPECIALS': '/organic-specials',
  'VALUE COMBOS': '/value-combos',
  'FRUIT BASKETS': '/fruit-baskets',
  'IMPORTED FRUITS': '/imported-fruits',
  'FARM FRESH PICKS': '/farm-fresh-picks',
  'SEASONAL SPECIALS': '/seasonal-special',
  'ROOT VEGETABLES': '/root-vegetables',
  'HYDROPONIC VEGGIES': '/hydroponic-vegetables',
}

export default function SiteHeader() {
  const [vegOpen, setVegOpen] = useState(false)
  const [farmOpen, setFarmOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const { getCartCount } = useCart()
  const cartCount = getCartCount()
  const { location } = useLocation()
  const [locationOpen, setLocationOpen] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [activeSuggestion, setActiveSuggestion] = useState(-1)
  const suggestionsRef = useRef(null)

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      const query = searchQuery.trim()
      setSuggestions([])
      const pushTarget = { pathname: '/search', query: { q: query } }
      try {
        // Prefer client-side navigation (keeps history) and fall back to full load
        router.push(pushTarget).catch(() => {
          if (typeof window !== 'undefined') window.location.href = `/search?q=${encodeURIComponent(query)}`
        })
      } catch (err) {
        if (typeof window !== 'undefined') window.location.href = `/search?q=${encodeURIComponent(query)}`
      }
    }
  }

  // Use onKeyDown (more reliable across browsers than onKeyPress)
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e)
    }
  }
  // Suggestion keyboard handling and click
  const handleSuggestionKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      setActiveSuggestion((v) => Math.min(v + 1, suggestions.length - 1))
      e.preventDefault()
    } else if (e.key === 'ArrowUp') {
      setActiveSuggestion((v) => Math.max(v - 1, 0))
      e.preventDefault()
    } else if (e.key === 'Enter') {
      if (activeSuggestion >= 0 && suggestions[activeSuggestion]) {
        const s = suggestions[activeSuggestion]
        setSearchQuery(s.name)
        router.push({ pathname: '/search', query: { q: s.name } })
        e.preventDefault()
      }
    }
  }

  useEffect(() => {
    const term = (searchQuery || '').trim().toLowerCase()
    if (!term) {
      setSuggestions([])
      setActiveSuggestion(-1)
      return
    }

    // ALL tokens must match — prefix matches show first, then other substring matches
    const tokens = term.split(/\s+/).filter(Boolean)

    const matchesAll = (p) => {
      const searchable = p.name.toLowerCase() + ' ' + (p.category || '').toLowerCase()
      return tokens.every(t => searchable.includes(t))
    }

    const prefix = allProducts.filter(p => {
      const name = p.name.toLowerCase()
      return matchesAll(p) && tokens.some(t => name.startsWith(t))
    })
    const contains = allProducts.filter(p => {
      return matchesAll(p) && !prefix.includes(p)
    })
    const merged = [...prefix, ...contains].slice(0, 8)
    setSuggestions(merged)
    setActiveSuggestion(-1)
  }, [searchQuery])
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
  const farmBtnRef = useRef(null)

  // Auto-open picker on first visit (no saved location)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('sb_location')
    if (!saved) {
      // Small delay so page has rendered
      const t = setTimeout(() => setLocationOpen(true), 600)
      return () => clearTimeout(t)
    }
  }, [])

  return (
    <>
      <div className="stickyShell">
      {/* ── Black top banner ── */}
      <div className="infoBanner">
        <div className="bannerLeft">
          <a href="#" className="bannerLink">Track Your Order</a>
          <span className="sep">|</span>
          <a href="#" className="bannerLink">Contact Us</a>
          <span className="sep">|</span>
          <a href="#" className="bannerLink">FAQ&apos;s</a>
        </div>
        <button
          className="bannerLocation"
          onClick={() => setLocationOpen(true)}
          aria-label="Set delivery location"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
          {location
            ? (location.label.length > 22 ? location.label.slice(0, 22) + '…' : location.label)
            : 'Add your address'}
        </button>
      </div>

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

            <form className="searchWrap" onSubmit={handleSearch}>
              <input 
                type="text" 
                placeholder="Go organic" 
                aria-label="Search products"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { handleSearchKeyPress(e); handleSuggestionKeyDown(e) }}
                onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                aria-autocomplete="list"
                aria-controls="search-suggestions"
              />
              <button type="submit" className="searchBtn">Search</button>
            </form>
            {suggestions.length > 0 && (
              <div id="search-suggestions" className="searchSuggestions" ref={suggestionsRef} role="listbox">
                {suggestions.map((s, idx) => (
                  <div
                    key={s.id}
                    role="option"
                    aria-selected={idx === activeSuggestion}
                    className={idx === activeSuggestion ? 'suggestion active' : 'suggestion'}
                    onMouseDown={() => { setSearchQuery(s.name); setSuggestions([]); router.push({ pathname: '/search', query: { q: s.name } }) }}
                  >
                    <strong>{s.name}</strong>
                    <div className="small">{s.category}</div>
                  </div>
                ))}
              </div>
            )}
        <div className="topActions">
          <div className="headerInfo">
            <div className="headerInfoRow">📞 (+800) 111 2020 &nbsp;|&nbsp; (+700) 353 44 555</div>
            <div className="headerInfoRow">Mon – Fri &nbsp;8:00 AM – 8:00 PM &nbsp;·&nbsp; Sat Closed</div>
          </div>
          <Link href="/cart" className="cartBtn" aria-label="Cart">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 4h2l2.2 9.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 7H7.1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="10" cy="19" r="1.5" fill="currentColor" />
              <circle cx="17" cy="19" r="1.5" fill="currentColor" />
            </svg>
            {cartCount > 0 && <span className="cartCount">{cartCount}</span>}
          </Link>
        </div>
      </header>

      <nav className="mainNav">
        <ul>
          {navItems.map((label) => {
            if (label === 'VEGETABLES') {
              return (
                <li
                  key={label}
                  id="nav-vegetables"
                  className={vegOpen ? 'veg-open' : ''}
                  onMouseEnter={() => setVegOpen(true)}
                  onMouseLeave={() => setVegOpen(false)}
                  onFocus={() => setVegOpen(true)}
                  onBlur={() => setVegOpen(false)}
                >
                  <Link href="/vegetables/leafy-vegetables" passHref legacyBehavior>
                    <a
                      className="navLink"
                      aria-haspopup="true"
                      aria-expanded={vegOpen}
                      ref={vegBtnRef}
                    >
                      {label}
                    </a>
                  </Link>
                  <VegetablesDropdown isOpen={vegOpen} anchorRef={vegBtnRef} />
                </li>
              )
            } else if (label === 'FARM FRESH PICKS') {
              return (
                <li
                  key={label}
                  id="nav-farmfresh"
                  className={farmOpen ? 'farm-open' : ''}
                  onMouseEnter={() => setFarmOpen(true)}
                  onMouseLeave={() => setFarmOpen(false)}
                  onFocus={() => setFarmOpen(true)}
                  onBlur={() => setFarmOpen(false)}
                >
                  <Link href="/farm-fresh-picks/fruits" passHref legacyBehavior>
                    <a
                      className="navLink"
                      aria-haspopup="true"
                      aria-expanded={farmOpen}
                      ref={farmBtnRef}
                    >
                      {label}
                    </a>
                  </Link>
                  <FarmFreshDropdown isOpen={farmOpen} anchorRef={farmBtnRef} />
                </li>
              )
            } else if (routeMap[label]) {
              return (
                <li key={label}>
                  <Link href={routeMap[label]} className="navLink">{label}</Link>
                </li>
              )
            } else {
              return (
                <li key={label}>
                  <button type="button">{label}</button>
                </li>
              )
            }
          })}
        </ul>
        <Link href="/account" className="accountBtn">Account</Link>
        </nav>
      </div>
      </div>{/* /stickyShell */}

      <style jsx>{`
        /* ── Sticky outer shell (banner + header) ── */
        .stickyShell { position: sticky; top: 0; z-index: 1200; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }

        /* ── Black info banner ── */
        .infoBanner { display: flex; align-items: center; justify-content: space-between; background: #1a1a1a; color: #d4d4d4; font-size: 12px; padding: 7px 24px; gap: 12px; }
        .bannerLeft { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .bannerLink { color: #c8c8c8; text-decoration: none; font-size: 12px; transition: color 0.15s; }
        .bannerLink:hover { color: #fff; }
        .sep { opacity: 0.35; font-size: 11px; }
        .bannerLocation { display: inline-flex; align-items: center; gap: 6px; background: transparent; border: 1.5px solid #619233; color: #a3d55f; border-radius: 20px; padding: 4px 13px; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; max-width: 220px; overflow: hidden; text-overflow: ellipsis; transition: background 0.18s, color 0.18s; flex-shrink: 0; }
        .bannerLocation:hover { background: #619233; color: #fff; }
        .bannerLocation svg { flex-shrink: 0; }

        /* ── Main header ── */
        .siteHeaderWrap { background: #fff; }
        :global(body) { --site-header-height: 124px; }
        .logoWrap { display: inline-flex; align-items: center; text-decoration: none; }
        .logoInner { display: flex; align-items: center; gap: 10px; }
        .logoInner img { width: 56px; height: 56px; object-fit: contain; display: block; }
        .brandName { display: flex; flex-direction: column; line-height: 1; color: #000; font-weight: 800; }
        .brandName span { color: #000; font-weight: 800; font-size: 18px; }
        .brandName span + span { margin-top: 2px; }
        @media (max-width: 520px) {
          .logoInner img { width: 44px; height: 44px; }
          .brandName span { font-size: 16px; }
          .infoBanner { padding: 6px 12px; }
          .bannerLeft { display: none; }
        }
        .searchWrap { position: relative; display: inline-flex; align-items: center; }
        .searchWrap input { padding: 10px 12px; border: 1px solid #e6e6e6; border-radius: 6px 0 0 6px; width: 280px; }
        .searchBtn { padding: 10px 14px; border: 1px solid #e6e6e6; border-left: none; background: #619233; color: #fff; border-radius: 0 6px 6px 0; cursor: pointer; }
        .searchSuggestions { position: absolute; left: 0; top: calc(100% + 4px); width: 100%; min-width: 320px; background: #fff; border: 1.5px solid #d4e8b0; box-shadow: 0 8px 28px rgba(0,0,0,0.13); z-index: 1400; border-radius: 10px; overflow: hidden; }
        .suggestion { padding: 11px 16px; cursor: pointer; display: flex; flex-direction: column; border-bottom: 1px solid #f3f3f3; transition: background 0.15s; }
        .suggestion:last-child { border-bottom: none; }
        .suggestion:hover, .suggestion.active { background: #f3f9eb; }
        .suggestion strong { font-size: 14px; color: #222; }
        .suggestion .small { font-size: 12px; color: #619233; margin-top: 2px; font-weight: 500; }
        .topActions { display: flex; align-items: center; gap: 16px; }
        .headerInfo { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
        .headerInfoRow { font-size: 12px; color: #555; white-space: nowrap; }
        @media (max-width: 700px) { .headerInfo { display: none; } }
      `}</style>
      {locationOpen && <LocationPicker onClose={() => setLocationOpen(false)} />}
    </>
  )
}
