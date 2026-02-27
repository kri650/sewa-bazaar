import SiteHeader from './SiteHeader'

// showHeader: when true render the SiteHeader, otherwise omit it.
export default function ShopLayout({ children }) {
  return (
    <div className="shopLayout">
      <SiteHeader />
      <div className="shopOutlet">{children}</div>

        <footer className="siteFooter" role="contentinfo">
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
    </div>
  )
}
