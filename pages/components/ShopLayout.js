import SiteHeader from './SiteHeader'

// showHeader: when true render the SiteHeader, otherwise omit it.
export default function ShopLayout({ children }) {
  return (
    <div className="shopLayout">
      <SiteHeader />
      <div className="shopOutlet">{children}</div>

      <footer className="siteFooter" role="contentinfo">
        <div className="footerInner">
          <div className="footerBrand">
            <img src="/logo.png" alt="Sewa Bazaar" />
            <div className="footerBrandText">
              <strong>Sewa Bazaar</strong>
            </div>
          </div>

          <div className="footerNav">
            <a href="/">Home</a>
            <a href="/vegetables">Vegetables</a>
            <a href="/mangoes">Fruits</a>
            <a href="/contact">Contact</a>
            <a href="/faq">FAQ</a>
          </div>

          <div className="footerInfo">
            <p>© {new Date().getFullYear()} Sewa Bazaar — All rights reserved.</p>
            <p>Contact: (+800) 111 2020</p>
          </div>
        </div>

        <style jsx>{`
          .siteFooter { background:#fafafa; border-top:1px solid #eee; padding:24px 5%; margin-top:40px; }
          .footerInner { max-width:1200px; margin:0 auto; display:flex; gap:24px; align-items:center; justify-content:space-between; flex-wrap:wrap; }
          .footerBrand { display:flex; align-items:center; gap:12px; }
          .footerBrand img { width:48px; height:48px; object-fit:contain; }
          .footerBrandText strong { font-weight:800; color:#000; }
          .footerNav { display:flex; gap:16px; flex-wrap:wrap; }
          .footerNav a { color:#333; text-decoration:none; font-weight:600; }
          .footerInfo { color:#666; font-size:13px; }
          @media (max-width:720px){ .footerInner{ flex-direction:column; align-items:flex-start; } }
        `}</style>
      </footer>
    </div>
  )
}
