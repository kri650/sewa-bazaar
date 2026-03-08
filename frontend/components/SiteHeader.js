import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useCart } from '../contexts/CartContext'
import { createPortal } from 'react-dom'

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
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e)
    }
  }

  return (
    <>
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
                onKeyPress={handleSearchKeyPress}
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
        }
      `}</style>
    </>
  )
}
