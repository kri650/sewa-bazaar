import Link from 'next/link'

const navItems = [
  'VEGETABLES',
  'HYDROPONIC VEGGIES',
  'FRUITS',
  'SEASONAL SPECIALS',
  'LEAFY GREENS',
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
}

export default function SiteHeader() {
  return (
    <>
      <header className="topHeader">
        <Link href="/" aria-label="Sewa Bazaar home" className="logoWrap">
          <>
            <img src="/logo.png" alt="Sewa Bazaar" />
            <span className="brandName">
              <span>Sewa</span>
              <span>Bazaar</span>
            </span>
          </>
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
            <li key={label}>
              {routeMap[label] ? (
                <Link href={routeMap[label]} className="navLink">{label}</Link>
              ) : (
                <button type="button">{label}</button>
              )}
            </li>
          ))}
        </ul>
        <button className="accountBtn" type="button">Account</button>
      </nav>
    </>
  )
}
