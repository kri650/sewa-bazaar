import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useCart } from '../contexts/CartContext'

import { createPortal } from 'react-dom'
import { useLocation } from '../contexts/LocationContext'
import LocationPicker from './LocationPicker'
import allProducts from '../data/products'


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
  'FRUITS & VEGETABLES': '/fruits-vegetables',
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
  const [mounted, setMounted] = useState(false)
  const fvTriggerRef = useRef(null)
  const closeTimerRef = useRef(null)
  const [fvPos, setFvPos] = useState({ left: 0, top: 0, minWidth: 180 })
  const router = useRouter()
  const { getCartCount } = useCart()
  const cartCount = getCartCount()
  const { location } = useLocation()
  const [locationOpen, setLocationOpen] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [activeSuggestion, setActiveSuggestion] = useState(-1)
  const suggestionsRef = useRef(null)

  useEffect(() => {
    setMounted(true)
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
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
    // capture=true so scrolling containers also update position
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
    closeTimerRef.current = window.setTimeout(() => setIsFvOpen(false), 140)
  }

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
        {showTopHeader && (
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

            <div className="topActions">
              <div className="headerInfo">
                <div className="headerInfoRow">
                  <span>Mon-Fri 8:00 AM - 20:00 PM Saturday Closed</span>
                </div>
                <div className="headerInfoRow">
                  <span>(+800) 111 2020, (+700) 353 44 555</span>
                </div>
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
        )}

      <nav className="mainNav">
        <ul>
          {navItems.map((label) => {
            if (label === 'FRUITS & VEGETABLES') {
              return (
                <li 
                  key={label}
                  className="navDropdown"
                  onMouseEnter={openFv}
                  onMouseLeave={scheduleCloseFv}
                >
                  <span
                    ref={fvTriggerRef}
                    className="navTrigger"
                    role="button"
                    tabIndex={0}
                    aria-haspopup="menu"
                    aria-expanded={isFvOpen}
                    onFocus={openFv}
                    onBlur={scheduleCloseFv}
                    onMouseEnter={openFv}
                    onMouseLeave={scheduleCloseFv}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setIsFvOpen((prev) => !prev)
                      }
                      if (e.key === 'Escape') {
                        setIsFvOpen(false)
                      }
                    }}
                  >
                    {label}
                  </span>
                </li>
              )
            } else if (routeMap[label]) {
              return (
                <li key={label}>
                  <Link href={routeMap[label]}>{label}</Link>
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
            <Link href="/fruits" className="dropdownItem" role="menuitem" onClick={() => setIsFvOpen(false)}>
              Fruits
            </Link>
            <Link href="/vegetables" className="dropdownItem" role="menuitem" onClick={() => setIsFvOpen(false)}>
              Vegetables
            </Link>
          </div>,
          document.body
        )}

      <style jsx>{`
        .siteHeaderWrap { position: sticky; top: 0; z-index: 1200; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        /* Ensure header contents don't overlap page content when sticky */
        :global(body) { --site-header-height: ${showTopHeader ? 112 : 48}px; }
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
