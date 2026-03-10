/**
 * otpStore.js
 * -----------
 * In-memory temporary store for OTP verification data.
 * Acts like PHP $_SESSION — stores pending signup data + OTP
 * until the user verifies, then discards it.
 *
 * Each entry auto-expires after 10 minutes.
 */

const EXPIRY_MS = 10 * 60 * 1000 // 10 minutes

const store = new Map()

function set(key, value) {
  store.set(key, { value, expiresAt: Date.now() + EXPIRY_MS })
}

function get(key) {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return null
  }
  return entry.value
}

function del(key) {
  store.delete(key)
}

// Purge expired entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of store.entries()) {
    if (now > v.expiresAt) store.delete(k)
  }
}, 5 * 60 * 1000)

module.exports = { set, get, del }
