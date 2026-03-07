const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'

function getBearerToken(req) {
  const raw = req.headers.authorization || ''
  if (!raw.startsWith('Bearer ')) return null
  return raw.slice('Bearer '.length)
}

function extractUserId(req) {
  const token = getBearerToken(req)
  if (!token) return null
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    return payload.userId
  } catch (_err) {
    return null
  }
}

function requireAuth(req, res, next) {
  const token = getBearerToken(req)
  if (!token) return res.status(401).json({ error: 'authorization token required' })

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.userId = payload.userId
    req.userRole = payload.role || 'customer'
    return next()
  } catch (_err) {
    return res.status(401).json({ error: 'invalid or expired token' })
  }
}

module.exports = {
  getBearerToken,
  extractUserId,
  requireAuth,
}
