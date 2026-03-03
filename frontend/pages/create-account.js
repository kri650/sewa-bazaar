import SiteHeader from '../components/SiteHeader'
import styles from '../styles/create-account.module.css'

export default function CreateAccountPage() {
  return (
    <main className={styles.createPage}>
      <SiteHeader />
      <section className={styles.createHero} aria-label="Create account">
        <div className={styles.createInner}>
          <div className={styles.createIntro}>
            <p className={styles.kicker}>Get Started</p>
            <h1>Create your account.</h1>
            <p className={styles.subhead}>
              Join Sewa Bazaar to save favorites, track orders, and get early access to seasonal picks.
            </p>
          </div>

          <div className={styles.createCard}>
            <h2>New Account</h2>
            <p className={styles.note}>It only takes a minute.</p>
            <form className={styles.form}>
              <label>
                Full Name
                <input type="text" placeholder="Jane Doe" />
              </label>
              <label>
                Email
                <input type="email" placeholder="you@email.com" />
              </label>
              <label>
                Password
                <input type="password" placeholder="Create a strong password" />
              </label>
              <label>
                Confirm Password
                <input type="password" placeholder="Re-enter your password" />
              </label>
              <button type="button" className={styles.primary}>Create Account</button>
            </form>
            <p className={styles.meta}>
              Already have an account?{' '}
              <a href="/account" className={styles.link}>Sign in</a>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
