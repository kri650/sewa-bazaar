import SiteHeader from './components/SiteHeader'
import styles from '../styles/account.module.css'

export default function AccountPage() {
  return (
    <main className={styles.accountPage}>
      <SiteHeader />
      <section className={styles.accountHero} aria-label="Account access">
        <div className={styles.accountHeroInner}>
          <div className={styles.accountIntro}>
            <p className={styles.accountKicker}>Member Access</p>
            <h1>Manage your account with confidence.</h1>
            <p className={styles.accountSubhead}>
              Track orders, save favorites, and get early access to seasonal arrivals.
              Everything you need, in one secure place.
            </p>
            <div className={styles.accountHighlights}>
              <div className={styles.accountHighlight}>
                <span>01</span>
                <div>
                  <strong>Order history</strong>
                  <p>Reorder your essentials in seconds.</p>
                </div>
              </div>
              <div className={styles.accountHighlight}>
                <span>02</span>
                <div>
                  <strong>Fresh alerts</strong>
                  <p>Get notified when favorites return.</p>
                </div>
              </div>
              <div className={styles.accountHighlight}>
                <span>03</span>
                <div>
                  <strong>Secure payments</strong>
                  <p>Protected checkout, every time.</p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.accountPanel}>
            <div className={styles.accountCard}>
              <h2>Sign In</h2>
              <p className={styles.accountNote}>Welcome back. Please enter your details.</p>
              <form className={styles.accountForm}>
                <label>
                  Email
                  <input type="email" placeholder="you@email.com" />
                </label>
                <label>
                  Password
                  <input type="password" placeholder="••••••••" />
                </label>
                <div className={styles.accountRow}>
                  <label className={styles.accountCheckbox}>
                    <input type="checkbox" />
                    <span>Remember me</span>
                  </label>
                  <button type="button" className={styles.accountLink}>Forgot password?</button>
                </div>
                <button type="button" className={styles.accountPrimary}>Sign In</button>
              </form>
              <p className={styles.accountMeta}>
                Don&apos;t have an account?{' '}
                <button type="button" className={styles.accountLink}>Create an account</button>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
