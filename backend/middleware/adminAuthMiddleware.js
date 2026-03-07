const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'

function requireAdminAuth(req, res, next) {
  const raw = req.headers.authorization || ''
  if (!raw.startsWith('Bearer '))
    return res.status(401).json({ error: 'admin authorization token required' })

  const token = raw.slice('Bearer '.length)
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    if (payload.source !== 'admin')
      return res.status(403).json({ error: 'forbidden: not an admin token' })
    req.adminId = payload.adminId
    req.adminEmail = payload.email
    return next()
  } catch (_err) {
    return res.status(401).json({ error: 'invalid or expired token' })
  }
}

module.exports = { requireAdminAuth }
