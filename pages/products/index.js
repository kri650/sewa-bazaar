import useSWR from 'swr'
import axios from 'axios'
import SiteHeader from '../components/SiteHeader'

const fetcher = (url) => axios.get(url).then((r) => r.data)

const featuredItems = [
  { name: 'Black Beans', price: '$20.00', image: '🍌', active: false },
  { name: 'Jungle Food', price: '$20.00', image: '🍒', active: true },
  { name: 'Kidney Beans', price: '$18.00', image: '🥝', active: false },
  { name: 'Carne Asada', price: '$45.00', image: '🍇', active: false, badge: 'Hot' },
]

export default function Products() {
  const { data, error } = useSWR('/api/products', fetcher)

  return (
    <main className="latestArrivalsPage pageShell">
      <SiteHeader />
      <header className="productsHeroHeader" aria-label="Products header">
        <div className="productsHeroOverlay">
          <p>Farm Fresh Everyday</p>
          <h1>Organic Fruits &amp; Vegetables</h1>
        </div>
      </header>

      <section className="latestArrivalsSection" aria-label="Latest arrivals">
        <div className="latestHead">
          <h2>Latest Arrivals</h2>
          <p>Feature Dishes</p>
          <span className="leafMark" aria-hidden="true">❧</span>
        </div>
        <div className="latestTopDecor" aria-hidden="true">
          <img src="/vecteezy_hand-drawn-fruits-clipart-design-illustration_9342298.png" alt="" />
        </div>

        <div className="latestGridWrap">
          <div className="latestGrid">
            {featuredItems.map((item) => (
              <article key={item.name} className={`arrivalCard ${item.active ? 'active' : ''}`}>
                <div className="arrivalImage" aria-hidden="true">{item.image}</div>
                <div className="arrivalInfo">
                  {item.badge ? <span className="hotBadge">{item.badge}</span> : null}
                  <h3>{item.name}</h3>
                  <p>{item.price}</p>
                  <div className="stars" aria-label="Rated 5 out of 5">★★★★★</div>
                </div>
              </article>
            ))}
          </div>

          <aside className="offerCard" aria-label="Apple juice offer">
            <div className="offerImage" aria-hidden="true">🍎</div>
            <div className="offerClosed">Offer closed</div>
            <div className="offerBody">
              <h3>Apple Juice</h3>
              <p>$11.05</p>
              <div className="stars" aria-label="Rated 5 out of 5">★★★★★</div>
            </div>
          </aside>
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

      <section className="latestArrivalsSection latestArrivalsSectionAfterBanner" aria-label="Latest arrivals under banners">
        <div className="latestHead">
          <h2>Latest Arrivals</h2>
          <p>Feature Dishes</p>
          <span className="leafMark" aria-hidden="true">❧</span>
        </div>
        <div className="latestTopDecor" aria-hidden="true">
          <img src="/vecteezy_hand-drawn-fruits-clipart-design-illustration_9342298.png" alt="" />
        </div>

        <div className="latestGridWrap">
          <div className="latestGrid">
            {featuredItems.map((item) => (
              <article key={`after-banner-${item.name}`} className={`arrivalCard ${item.active ? 'active' : ''}`}>
                <div className="arrivalImage" aria-hidden="true">{item.image}</div>
                <div className="arrivalInfo">
                  {item.badge ? <span className="hotBadge">{item.badge}</span> : null}
                  <h3>{item.name}</h3>
                  <p>{item.price}</p>
                  <div className="stars" aria-label="Rated 5 out of 5">★★★★★</div>
                </div>
              </article>
            ))}
          </div>

          <aside className="offerCard" aria-label="Apple juice offer">
            <div className="offerImage" aria-hidden="true">🍎</div>
            <div className="offerClosed">Offer closed</div>
            <div className="offerBody">
              <h3>Apple Juice</h3>
              <p>$11.05</p>
              <div className="stars" aria-label="Rated 5 out of 5">★★★★★</div>
            </div>
          </aside>
        </div>
      </section>

      <section className="productsApiState" aria-label="API products status">
        {error ? <p>Error loading products</p> : null}
        {!data ? <p>Loading products...</p> : <p>Loaded {data.length} products from API.</p>}
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

      <style jsx>{`
        .latestArrivalsPage {
          background: #fff;
          min-height: 100vh;
          padding: 0 0 72px;
        }

        .productsHeroHeader {
          height: clamp(280px, 42vw, 560px);
          width: 100%;
          background-image: url('/Untitled design.png');
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center top;
          background-color: #f3f6f3;
          display: grid;
          align-items: center;
          margin-bottom: 54px;
        }

        .productsHeroOverlay {
          width: min(1000px, calc(100% - 40px));
          margin: 0 auto;
          color: #fff;
        }

        .productsHeroOverlay p {
          margin: 0 0 10px;
          font-size: clamp(14px, 1.8vw, 22px);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 600;
        }

        .productsHeroOverlay h1 {
          margin: 0;
          font-size: clamp(28px, 4vw, 56px);
          line-height: 1.05;
          font-family: 'Playfair Display', serif;
          font-weight: 600;
        }

        .latestArrivalsSection {
          width: min(1000px, calc(100% - 40px));
          margin: 0 auto;
          position: relative;
        }
        
        .latestArrivalsSectionAfterBanner {
          margin-top: 34px;
        }

        .latestTopDecor {
          position: absolute;
          top: -8px;
          right: -64px;
          width: 130px;
          opacity: 0.94;
          pointer-events: none;
          animation: latestFloat 4.8s ease-in-out infinite;
        }

        .latestTopDecor img {
          width: 100%;
          height: auto;
          display: block;
          filter: drop-shadow(0 10px 16px rgba(0, 0, 0, 0.12));
        }

        @keyframes latestFloat {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }

        .latestHead h2 {
          margin: 0;
          font-size: clamp(36px, 4.2vw, 56px);
          line-height: 1;
          color: #060606;
          font-family: inherit;
          font-weight: 500;
          letter-spacing: 0.01em;
        }

        .latestHead p {
          margin: 10px 0 0;
          font-size: clamp(30px, 3.4vw, 48px);
          line-height: 1;
          color: #619233;
          font-family: inherit;
          font-weight: 400;
        }

        .leafMark {
          display: inline-block;
          margin-top: 14px;
          font-size: 40px;
          color: #e0c952;
          line-height: 1;
          transform: translateX(3px);
        }

        .latestGridWrap {
          margin-top: 30px;
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 20px;
          align-items: stretch;
        }

        .latestGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px 16px;
        }

        .arrivalCard {
          position: relative;
          display: grid;
          grid-template-columns: 46% 54%;
          min-height: 124px;
          border: 1px solid #d7d7d7;
          background: #f2f3f6;
        }

        .arrivalCard.active {
          border-color: #6ca043;
        }

        .arrivalImage {
          display: grid;
          place-items: center;
          background: #fff !important;
          font-size: 54px;
          line-height: 1;
        }

        .arrivalInfo {
          background: #e8e9ee;
          padding: 16px 12px 10px 12px;
          position: relative;
        }

        .arrivalInfo h3 {
          margin: 0;
          color: #0f0f0f;
          font-family: 'Playfair Display', serif;
          font-weight: 500;
          font-size: 19px;
          line-height: 1.05;
        }

        .arrivalCard.active .arrivalInfo h3 {
          color: #619233;
        }

        .arrivalInfo p {
          margin: 10px 0 8px;
          color: #707070;
          font-family: 'Playfair Display', serif;
          font-weight: 300;
          font-size: 13px;
        }

        .stars {
          color: #619233;
          letter-spacing: 0.08em;
          font-size: 13px;
        }

        .hotBadge {
          position: absolute;
          top: 8px;
          right: 0;
          background: #64992f;
          color: #fff;
          border-radius: 999px 0 0 999px;
          padding: 3px 12px 4px;
          font-size: 12px;
          line-height: 1;
          font-family: 'Arial Black', sans-serif;
        }

        .offerCard {
          border: 1px solid #d0d0d0;
          background: #fff;
          padding: 14px;
          display: grid;
          grid-template-rows: auto auto 1fr;
          min-height: 480px;
        }

        .offerImage {
          background: #e8e9ee !important;
          display: grid;
          place-items: center;
          min-height: 250px;
          font-size: 90px;
        }

        .offerClosed {
          margin: 14px 6px 0;
          background: #619233;
          color: #fff;
          min-height: 62px;
          display: grid;
          place-items: center;
          font-size: 22px;
          font-family: 'Arial Black', sans-serif;
        }

        .offerBody {
          display: grid;
          place-content: center;
          text-align: center;
          gap: 10px;
          padding-top: 18px;
        }

        .offerBody h3 {
          margin: 0;
          color: #619233;
          font-family: 'Playfair Display', serif;
          font-weight: 500;
          font-size: 30px;
          line-height: 1.04;
        }

        .offerBody p {
          margin: 0;
          color: #6d6d6d;
          font-size: 20px;
          font-family: 'Playfair Display', serif;
          font-weight: 300;
        }

        .productsApiState {
          width: min(1000px, calc(100% - 40px));
          margin: 26px auto 0;
          color: #4f4f4f;
          font-family: 'Playfair Display', serif;
          font-size: 13px;
        }

        .productsApiState p {
          margin: 0;
        }


        @media (max-width: 1100px) {
          .latestGridWrap {
            grid-template-columns: 1fr;
          }

          .offerCard {
            max-width: 360px;
          }
        }

        @media (max-width: 860px) {
          .latestArrivalsPage {
            padding: 0 0 48px;
          }

          .productsHeroHeader {
            margin-bottom: 34px;
          }

          .productsHeroOverlay p {
            font-size: 12px;
          }

          .latestGrid {
            grid-template-columns: 1fr;
          }

          .latestTopDecor {
            display: none;
          }

          .arrivalCard {
            min-height: 140px;
          }

          .arrivalImage {
            font-size: 52px;
          }

          .arrivalInfo h3 {
            font-size: 13px;
          }

          .arrivalInfo p {
            font-size: 14px;
          }

          .offerClosed {
            font-size: 16px;
          }

          .offerBody h3 {
            font-size: 13px;
          }

          .offerBody p {
            font-size: 13px;
          }

        }
      `}</style>
    </main>
  )
}
