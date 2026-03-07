import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import SiteHeader from '../components/SiteHeader'
import styles from '../styles/account.module.css'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'

export default function AccountPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [sessionUser, setSessionUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const savedName = localStorage.getItem('authUserName')
    const savedEmail = localStorage.getItem('authUserEmail')
    if (token && (savedName || savedEmail)) {
      setSessionUser({
        name: savedName || 'User',
        email: savedEmail || '',
      })
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email || !password) {
      setError('Email and password are required.')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data?.error || 'Login failed.')
        return
      }

      if (data?.token) localStorage.setItem('authToken', data.token)
      if (data?.id) localStorage.setItem('authUserId', String(data.id))
      if (data?.name) localStorage.setItem('authUserName', data.name)
      if (data?.email) localStorage.setItem('authUserEmail', data.email)
      if (data?.role) localStorage.setItem('authUserRole', data.role)

      setSessionUser({
        name: data?.name || 'User',
        email: data?.email || email,
      })
      setSuccess('Login successful.')
    } catch (err) {
      setError(err?.message || 'Unable to connect to server.')
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUserId')
    localStorage.removeItem('authUserName')
    localStorage.removeItem('authUserEmail')
    localStorage.removeItem('authUserRole')
    setSessionUser(null)
    setSuccess('Logged out successfully.')
    setError('')
  }

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
              {sessionUser ? (
                <>
                  <h2>Welcome, {sessionUser.name}</h2>
                  <p className={styles.accountNote}>You are signed in as {sessionUser.email}.</p>
                  {success ? <p className={styles.accountMeta} style={{ color: '#1f7a1f' }}>{success}</p> : null}
                  <button type="button" className={styles.accountPrimary} onClick={() => router.push('/')}>
                    Continue Shopping
                  </button>
                  <button type="button" className={styles.accountLink} onClick={logout} style={{ marginTop: 14 }}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <h2>Sign In</h2>
                  <p className={styles.accountNote}>Welcome back. Please enter your details.</p>
                  <form className={styles.accountForm} onSubmit={handleLogin}>
                    <label>
                      Email
                      <input
                        type="email"
                        placeholder="you@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </label>
                    <label>
                      Password
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </label>
                    <div className={styles.accountRow}>
                      <label className={styles.accountCheckbox}>
                        <input type="checkbox" defaultChecked />
                        <span>Remember me</span>
                      </label>
                      <button type="button" className={styles.accountLink}>Forgot password?</button>
                    </div>
                    {error ? <p className={styles.accountMeta} style={{ color: '#b42318' }}>{error}</p> : null}
                    {success ? <p className={styles.accountMeta} style={{ color: '#1f7a1f' }}>{success}</p> : null}
                    <button type="submit" className={styles.accountPrimary} disabled={loading}>
                      {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                  </form>
                  <p className={styles.accountMeta}>
                    Don&apos;t have an account?{' '}
                    <a href="/create-account" className={styles.accountLink}>Create an account</a>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
