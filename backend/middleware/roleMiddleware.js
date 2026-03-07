function requireRole(...allowedRoles) {
  return function roleGuard(req, res, next) {
    const role = req.userRole
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'forbidden: insufficient role' })
    }
    return next()
  }
}

module.exports = {
  requireRole,
}
