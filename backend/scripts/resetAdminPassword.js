/**
 * Reset admin password for an existing user in the `users` table.
 *
 * Usage:
 *   ADMIN_EMAIL="you@example.com" ADMIN_PASSWORD="NewPass123" node scripts/resetAdminPassword.js
 *
 * Optional:
 *   ADMIN_SET_ROLE=1   -> also set role to "admin" if not already admin/superadmin
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const bcrypt = require('bcryptjs')
const pool = require('../config/db')

const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase()
const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || '')
const ADMIN_SET_ROLE = String(process.env.ADMIN_SET_ROLE || '') === '1'

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.log('❌  Please set ADMIN_EMAIL and ADMIN_PASSWORD env vars.')
    process.exit(1)
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, role FROM users WHERE email = ? LIMIT 1',
      [ADMIN_EMAIL]
    )

    if (!rows.length) {
      console.log(`❌  No user found in users table for ${ADMIN_EMAIL}`)
      console.log('    Create one first (or use scripts/createAdmin.js).')
      process.exit(1)
    }

    const user = rows[0]
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10)

    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, user.id])

    if (ADMIN_SET_ROLE && !['admin', 'superadmin'].includes(String(user.role || '').toLowerCase())) {
      await pool.query("UPDATE users SET role = 'admin' WHERE id = ?", [user.id])
      console.log(`✅  Role updated to admin for user id=${user.id}`)
    }

    console.log(`✅  Password reset for ${ADMIN_EMAIL} (user id=${user.id})`)
    console.log('⚠️  If login still fails, ensure role is admin/superadmin in users table.')
  } catch (err) {
    console.error('❌  Error:', err.message)
  } finally {
    await pool.end()
    process.exit(0)
  }
}

main()
