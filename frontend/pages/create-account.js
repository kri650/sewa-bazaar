import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import SiteHeader from '../components/SiteHeader'
import styles from '../styles/create-account.module.css'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'

export default function CreateAccountPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    latitude: '',
    longitude: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
        }))
      },
      () => {
        // Keep blank if user denies location; we fallback to 0,0 on submit.
      },
      { timeout: 5000 }
    )
  }, [])

  const onChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.name || !form.email || !form.phone || !form.password || !form.confirmPassword) {
      setError('Please fill all required fields.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    const latitude = form.latitude ? Number(form.latitude) : 0
    const longitude = form.longitude ? Number(form.longitude) : 0

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setError('Latitude and longitude must be valid numbers.')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          latitude,
          longitude,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data?.error || 'Signup failed.')
        return
      }

      if (data?.token) localStorage.setItem('authToken', data.token)
      if (data?.id) localStorage.setItem('authUserId', String(data.id))
      if (data?.name) localStorage.setItem('authUserName', data.name)
      if (data?.email) localStorage.setItem('authUserEmail', data.email)
      if (data?.role) localStorage.setItem('authUserRole', data.role)

      setSuccess('Account created successfully. Redirecting...')
      setTimeout(() => router.push('/account'), 700)
    } catch (err) {
      setError(err?.message || 'Unable to connect to server.')
    } finally {
      setLoading(false)
    }
  }

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
            <form className={styles.form} onSubmit={handleSignup}>
              <label>
                Full Name
                <input type="text" placeholder="Jane Doe" value={form.name} onChange={onChange('name')} />
              </label>
              <label>
                Email
                <input type="email" placeholder="you@email.com" value={form.email} onChange={onChange('email')} />
              </label>
              <label>
                Phone
                <input type="tel" placeholder="9876543210" value={form.phone} onChange={onChange('phone')} />
              </label>
              <label>
                Password
                <input type="password" placeholder="Create a strong password" value={form.password} onChange={onChange('password')} />
              </label>
              <label>
                Confirm Password
                <input type="password" placeholder="Re-enter your password" value={form.confirmPassword} onChange={onChange('confirmPassword')} />
              </label>
              <label>
                Latitude (optional)
                <input type="text" placeholder="Auto-detected or 0" value={form.latitude} onChange={onChange('latitude')} />
              </label>
              <label>
                Longitude (optional)
                <input type="text" placeholder="Auto-detected or 0" value={form.longitude} onChange={onChange('longitude')} />
              </label>
              {error ? <p className={styles.meta} style={{ color: '#b42318' }}>{error}</p> : null}
              {success ? <p className={styles.meta} style={{ color: '#1f7a1f' }}>{success}</p> : null}
              <button type="submit" className={styles.primary} disabled={loading}>
                {loading ? 'Creating...' : 'Create Account'}
              </button>
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
