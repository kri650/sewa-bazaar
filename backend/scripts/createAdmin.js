/**
 * Run once to create an admin user:
 *   node scripts/createAdmin.js
 *
 * Set ADMIN_EMAIL / ADMIN_PASSWORD as env vars or edit the defaults below.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const bcrypt = require('bcryptjs')
const pool   = require('../config/db')   // adjust path if your db file is elsewhere

const ADMIN_NAME     = process.env.ADMIN_NAME     || 'Super Admin'
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@sewabazaar.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@1234'
const ADMIN_PHONE    = process.env.ADMIN_PHONE    || '9000000000'

async function main() {
  try {
    // Check if already exists
    const [rows] = await pool.query('SELECT id, role FROM users WHERE email = ?', [ADMIN_EMAIL])
    if (rows.length > 0) {
      const u = rows[0]
      if (u.role === 'admin') {
        console.log(`✅  Admin already exists (id=${u.id}, email=${ADMIN_EMAIL})`)
      } else {
        await pool.query("UPDATE users SET role = 'admin' WHERE id = ?", [u.id])
        console.log(`✅  Existing user promoted to admin (id=${u.id}, email=${ADMIN_EMAIL})`)
      }
      process.exit(0)
    }

    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10)
    const [result] = await pool.query(
      `INSERT INTO users (name, email, phone, password, latitude, longitude, role)
       VALUES (?, ?, ?, ?, 0, 0, 'admin')`,
      [ADMIN_NAME, ADMIN_EMAIL, ADMIN_PHONE, hash]
    )
    console.log(`✅  Admin created! id=${result.insertId}`)
    console.log(`    Email   : ${ADMIN_EMAIL}`)
    console.log(`    Password: ${ADMIN_PASSWORD}`)
    console.log(`\n⚠️  Change this password after first login!`)
  } catch (err) {
    console.error('❌  Error:', err.message)
  } finally {
    await pool.end()
    process.exit(0)
  }
}

main()
