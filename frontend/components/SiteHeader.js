import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { createPortal } from 'react-dom'
import { useCart } from '../contexts/CartContext'
import { useLocation } from '../contexts/LocationContext'
import { useDelivery } from '../contexts/DeliveryContext'
import LocationPicker from './LocationPicker'
import staticProducts from '../data/products'

const navItems = [
  'BEST DEAL',
  'FRUITS & VEGETABLES',
  'ATTA, RICE & GRAINS',
  'OIL & GHEE',
  'MILK & DAIRY',
  'CHIPS & BISCUITS',
  'BATH & BODY',
  'SOAP & DETERGENTS',
  'BABY CARE',
  'POOJA ESSENTIALS',
  'BEVERAGES',
  'DRY FRUITS & NUTS',
]

const routeMap = {
  'BEST DEAL': '/best-deal',
  'ATTA, RICE & GRAINS': '/atta-rice-grains',
  'OIL & GHEE': '/oil-ghee',
  'MILK & DAIRY': '/milk-dairy',
  'CHIPS & BISCUITS': '/chips-biscuits',
  'BATH & BODY': '/bath-body',
  'SOAP & DETERGENTS': '/soap-detergents',
  'BABY CARE': '/baby-care',
  'POOJA ESSENTIALS': '/pooja-essentials',
  'BEVERAGES': '/beverages',
  'DRY FRUITS & NUTS': '/dry-fruits-nuts',
}

export default function SiteHeader({ showTopHeader = true }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isFvOpen, setIsFvOpen] = useState(false)
  const [isVegSubOpen, setIsVegSubOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const fvTriggerRef = useRef(null)
  const closeTimerRef = useRef(null)
  const vegSubCloseTimerRef = useRef(null)
  const [fvPos, setFvPos] = useState({ left: 0, top: 0, minWidth: 180 })
  const router = useRouter()
  const { getCartCount } = useCart()
  const cartCount = getCartCount()
  const { location } = useLocation()
  const { distanceKm, deliveryType, estimatedTime, detectUserLocation, userLocation, permissionDenied } = useDelivery()
  const [locationOpen, setLocationOpen] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [activeSuggestion, setActiveSuggestion] = useState(-1)
  const suggestionsRef = useRef(null)
  const inputRef = useRef(null)
  const [inlineCompletion, setInlineCompletion] = useState('')
  const [liveProducts] = useState(staticProducts)
  const [sessionUser, setSessionUser] = useState(null)

  // read user session from localStorage after mount
  useEffect(() => {
    const raw = localStorage.getItem('sbUserData')
    if (raw) { try { setSessionUser(JSON.parse(raw)) } catch (_) {} }
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      const query = searchQuery.trim()
      setSuggestions([])
      setInlineCompletion('')
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
        setSuggestions([])
        setInlineCompletion('')
        router.push({ pathname: '/search', query: { q: s.name } })
        e.preventDefault()
      }
    } else if ((e.key === 'Tab' || e.key === 'ArrowRight') && inlineCompletion) {
      const input = inputRef.current
      const atEnd = input && input.selectionStart === searchQuery.length
      if (atEnd) {
        e.preventDefault()
        setSearchQuery(inlineCompletion)
        setInlineCompletion('')
        setSuggestions([])
      }
    }
  }

  useEffect(() => {
    const term = (searchQuery || '').trim().toLowerCase()
    if (!term) {
      setSuggestions([])
      setActiveSuggestion(-1)
      setInlineCompletion('')
      return
    }

    // ALL tokens must match — prefix matches show first, then other substring matches
    const tokens = term.split(/\s+/).filter(Boolean)

    const matchesAll = (p) => {
      const searchable = p.name.toLowerCase() + ' ' + (p.category || '').toLowerCase()
      return tokens.every(t => searchable.includes(t))
    }

    const prefix = liveProducts.filter(p => {
      const name = p.name.toLowerCase()
      return matchesAll(p) && tokens.some(t => name.startsWith(t))
    })
    const contains = liveProducts.filter(p => {
      return matchesAll(p) && !prefix.includes(p)
    })
    const merged = [...prefix, ...contains].slice(0, 8)
    setSuggestions(merged)
    setActiveSuggestion(-1)
    // Best prefix match for inline ghost-text completion
    const bestInline = liveProducts.find(p => p.name.toLowerCase().startsWith(term))
    setInlineCompletion(bestInline ? bestInline.name : '')
  }, [searchQuery, liveProducts])
  useEffect(() => {
    setMounted(true)
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
      if (vegSubCloseTimerRef.current) window.clearTimeout(vegSubCloseTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (!isFvOpen) return
    if (!fvTriggerRef.current) return

    const updatePos = () => {
      const rect = fvTriggerRef.current.getBoundingClientRect()
      const minWidth = Math.max(180, rect.width)
      let left = rect.left + window.scrollX
      const top = rect.bottom + window.scrollY

      const maxLeft = window.scrollX + window.innerWidth - minWidth - 8
      if (left > maxLeft) left = Math.max(window.scrollX + 8, maxLeft)
      if (left < window.scrollX + 8) left = window.scrollX + 8

      setFvPos({ left, top, minWidth })
    }

    updatePos()
    window.addEventListener('resize', updatePos)
    window.addEventListener('scroll', updatePos, true)
    return () => {
      window.removeEventListener('resize', updatePos)
      window.removeEventListener('scroll', updatePos, true)
    }
  }, [isFvOpen, mounted])

  const openFv = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setIsFvOpen(true)
  }

  const scheduleCloseFv = () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
    closeTimerRef.current = window.setTimeout(() => {
      setIsFvOpen(false)
      setIsVegSubOpen(false)
    }, 140)
  }

  const openVegSub = () => {
    if (vegSubCloseTimerRef.current) {
      window.clearTimeout(vegSubCloseTimerRef.current)
      vegSubCloseTimerRef.current = null
    }
    setIsVegSubOpen(true)
  }

  const scheduleCloseVegSub = () => {
    if (vegSubCloseTimerRef.current) window.clearTimeout(vegSubCloseTimerRef.current)
    vegSubCloseTimerRef.current = window.setTimeout(() => setIsVegSubOpen(false), 140)
  }

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
  <div className="headerShell">
      {/* ── Black top banner (all pages) ── */}
      {showTopHeader && (
        <div className="infoBanner">
          <div className="bannerLeft">
            {deliveryType && estimatedTime ? (
              <span style={{ marginLeft: 12, fontWeight: 700, fontSize: 13, color: '#a3d55f' }}>
                🚚&nbsp;
                {deliveryType === 'fast'
                  ? `Delivery in ${estimatedTime}`
                  : `Delivery ${estimatedTime}`}
                {distanceKm ? ` • ${distanceKm} km` : ''}
              </span>
            ) : location && !deliveryType ? (
              <span style={{ marginLeft: 12, fontSize: 12, color: '#888' }}>
                Calculating delivery…
              </span>
            ) : null}
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
      )}

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

            <div className="searchContainer">
              <form className="searchWrap" onSubmit={handleSearch}>
                <div className="searchInputWrap">
                  {inlineCompletion && searchQuery && inlineCompletion.toLowerCase().startsWith(searchQuery.toLowerCase()) && (
                    <div className="ghostText" aria-hidden="true">
                      <span className="ghostTyped">{searchQuery}</span>
                      <span className="ghostSuffix">{inlineCompletion.slice(searchQuery.length)}</span>
                    </div>
                  )}
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Go organic"
                    aria-label="Search products"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { handleSearchKeyPress(e); handleSuggestionKeyDown(e) }}
                    onBlur={() => setTimeout(() => { setSuggestions([]); setInlineCompletion('') }, 150)}
                    aria-autocomplete="list"
                    aria-controls="search-suggestions"
                  />
                </div>
                <button type="submit" className="searchBtn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                </button>
              </form>
              {suggestions.length > 0 && (
                <div id="search-suggestions" className="searchSuggestions" ref={suggestionsRef} role="listbox">
                  {suggestions.map((s, idx) => (
                    <div
                      key={s.id}
                      role="option"
                      aria-selected={idx === activeSuggestion}
                      className={idx === activeSuggestion ? 'suggestion active' : 'suggestion'}
                      onMouseDown={() => {
                        setSuggestions([])
                        setInlineCompletion('')
                        router.push({
                          pathname: `/product/${s.id}`,
                          query: { name: s.name, price: s.price, size: s.size || s.unit, image: s.image, category: s.category }
                        })
                      }}
                    >
                      <svg className="suggestionIcon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                      <div className="suggestionText">
                        <span className="suggestionName">{s.name}</span>
                        <span className="suggestionCat">{s.category}</span>
                      </div>
                      <span className="suggestionPrice">₹{s.price}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
            // Fruits & Vegetables: open dropdown on hover/focus and navigate on click
            if (label === 'FRUITS & VEGETABLES') {
              return (
                <li key={label}>
                  <button
                    type="button"
                    ref={fvTriggerRef}
                    className="navTrigger"
                    onMouseEnter={openFv}
                    onMouseLeave={scheduleCloseFv}
                    onFocus={openFv}
                    onBlur={scheduleCloseFv}
                    onClick={() => { setIsFvOpen(false); router.push('/fruits') }}
                  >
                    {label}
                  </button>
                </li>
              )
            }

            if (routeMap[label]) {
              return (
                <li key={label}>
                  <Link href={routeMap[label]} className="navLink">{label}</Link>
                </li>
              )
            } else {
              return (
                <li key={label}>
                  <button type="button" className="navTrigger">{label}</button>
                </li>
              )
            }
          })}
        </ul>
        <Link href="/account" className="accountBtn">
          {sessionUser ? `Hi, ${sessionUser.name?.split(' ')[0] || 'Me'}` : 'Account'}
        </Link>
        </nav>
      </div>
  </div>{/* /headerShell */}

      {mounted &&
        createPortal(
          <div
            className="dropdownMenu"
            style={{
              display: isFvOpen ? 'flex' : 'none',
              position: 'absolute',
              left: fvPos.left + 'px',
              top: fvPos.top + 'px',
              minWidth: fvPos.minWidth + 'px',
            }}
            role="menu"
            onMouseEnter={openFv}
            onMouseLeave={scheduleCloseFv}
          >
            <Link href="/fruits" className="dropdownItem" role="menuitem" onClick={() => { setIsFvOpen(false); }}>
              Fruits
            </Link>

            <div
              className="dropdownItem dropdownItemWithSub"
              onMouseEnter={openVegSub}
              onMouseLeave={scheduleCloseVegSub}
            >
              <span>Vegetables</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto' }}>
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
              <div
                className="subMenu"
                style={{
                  display: isVegSubOpen ? 'flex' : 'none',
                }}
                onMouseEnter={openVegSub}
                onMouseLeave={scheduleCloseVegSub}
              >
                <Link href="/vegetables/leafy-vegetables" className="subMenuItem" role="menuitem" onClick={() => { setIsFvOpen(false); setIsVegSubOpen(false); }}>
                  Leafy Vegetables
                </Link>
                <Link href="/vegetables/regular-vegetables" className="subMenuItem" role="menuitem" onClick={() => { setIsFvOpen(false); setIsVegSubOpen(false); }}>
                  Regular Vegetables
                </Link>
                <Link href="/vegetables/exotic-vegetables" className="subMenuItem" role="menuitem" onClick={() => { setIsFvOpen(false); setIsVegSubOpen(false); }}>
                  Exotic Vegetables
                </Link>
                <Link href="/vegetables/gourds-and-pumpkin" className="subMenuItem" role="menuitem" onClick={() => { setIsFvOpen(false); setIsVegSubOpen(false); }}>
                  Gourds &amp; Pumpkin
                </Link>
                <Link href="/vegetables/salad-vegetables" className="subMenuItem" role="menuitem" onClick={() => { setIsFvOpen(false); setIsVegSubOpen(false); }}>
                  Salad Vegetables
                </Link>
              </div>
            </div>
          </div>,
          document.body
        )}

      <style jsx>{`
  /* ── Header outer shell (banner + header) — not sticky ── */
  .headerShell { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }

        /* ── Black info banner ── */
  .infoBanner { display: flex; align-items: center; justify-content: space-between; background: #1a1a1a; color: #d4d4d4; font-size: 12px; padding: 7px 24px 7px 90px; gap: 12px; position: relative; }
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
        .searchContainer { position: relative; display: inline-flex; flex-direction: column; }
        .searchWrap { display: inline-flex; align-items: center; }
        .searchInputWrap { position: relative; display: inline-flex; background: #fff; border-radius: 24px 0 0 24px; }
        .searchWrap input { padding: 11px 16px; border: 1.5px solid #e0e0e0; border-right: none; border-radius: 24px 0 0 24px; width: 320px; background: transparent; position: relative; z-index: 1; font-size: 14px; font-family: inherit; outline: none; transition: border-color 0.2s; }
        .searchWrap input:focus { border-color: #619233; }
        .ghostText { position: absolute; left: 0; top: 0; width: 100%; height: 100%; padding: 11px 16px; font-size: 14px; font-family: inherit; letter-spacing: normal; pointer-events: none; white-space: pre; overflow: hidden; z-index: 0; display: flex; align-items: center; box-sizing: border-box; }
        .ghostTyped { color: transparent; }
        .ghostSuffix { color: #bbb; }
        .searchBtn { padding: 10px 16px; border: 1.5px solid #619233; border-left: none; background: #619233; color: #fff; border-radius: 0 24px 24px 0; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
        .searchBtn:hover { background: #4e7828; }
        .searchSuggestions { position: absolute; left: 0; top: calc(100% + 6px); width: 100%; min-width: 340px; background: #fff; border: 1px solid #e0e0e0; box-shadow: 0 4px 24px rgba(0,0,0,0.13); z-index: 1400; border-radius: 14px; overflow-y: auto; max-height: 400px; padding: 6px 0; }
        .suggestion { padding: 10px 16px; cursor: pointer; display: flex; align-items: center; gap: 12px; transition: background 0.12s; }
        .suggestion:hover, .suggestion.active { background: #f3f9eb; }
        .suggestionIcon { color: #aaa; flex-shrink: 0; }
        .suggestionText { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
        .suggestionName { font-size: 14px; color: #111; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .suggestionCat { font-size: 11px; color: #619233; font-weight: 500; }
        .suggestionPrice { font-size: 13px; color: #555; font-weight: 600; white-space: nowrap; flex-shrink: 0; }
        .topActions { display: flex; align-items: center; gap: 16px; }
        .headerInfo { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
        .headerInfoRow { font-size: 12px; color: #555; white-space: nowrap; }
        @media (max-width: 700px) { .headerInfo { display: none; } }
        .navTrigger {
          cursor: pointer;
          background: transparent;
          border: 0;
          color: inherit;
          font-weight: 600;
          padding: 6px 10px; /* match .mainNav link spacing */
          font-size: 13px; /* keep consistent size */
          height: 30px;
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
          text-decoration: none;
          transition: color .15s ease, background .15s ease, transform .12s ease;
        }
        .navTrigger:focus-visible { box-shadow: 0 0 0 3px rgba(255,255,255,0.08); outline: none; border-radius: 6px; }
  :global(.dropdownMenu) { flex-direction: column; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); z-index: 1500; min-width: 180px; overflow: visible; }
        :global(.dropdownItem) { display: block; padding: 12px 20px; font-size: 14px; font-weight: 500; color: #333; text-decoration: none; transition: background 0.15s, color 0.15s; }
        :global(.dropdownItem:hover) { background: #f3f9eb; color: #619233; }
        :global(.dropdownItemWithSub) { position: relative; display: flex !important; align-items: center; cursor: pointer; }
        :global(.dropdownItemWithSub span) { flex: 1; }
        :global(.subMenu) { position: absolute; left: 100%; top: 0; background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 4px; min-width: 180px; padding: 8px 0; z-index: 1600; flex-direction: column; margin-left: 4px; }
        :global(.subMenuItem) { display: block !important; padding: 10px 20px !important; color: #333 !important; text-decoration: none !important; transition: background 0.2s; white-space: nowrap; height: auto !important; background: transparent !important; font-size: 14px !important; }
        :global(.subMenuItem:hover) { background: #f5f5f5 !important; color: #619233 !important; transform: none !important; }
      `}</style>
      {locationOpen && <LocationPicker onClose={() => setLocationOpen(false)} />}
      {permissionDenied && (
        <div className="geoModal">
          <div className="geoBox">
            <h3>Location access needed</h3>
            <p>To show accurate delivery estimates, please allow location access or set your address manually.</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => { setLocationOpen(true) }}>Set address manually</button>
              <button onClick={() => { detectUserLocation().catch(() => {}) }}>Retry detection</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
