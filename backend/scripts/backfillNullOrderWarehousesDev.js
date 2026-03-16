const { query } = require('../config/db')

async function main() {
  try {
    const result = await query(
      `UPDATE orders
       SET warehouse_id = 1
       WHERE warehouse_id IS NULL`
    )

    // mysql2 returns OkPacket; affectedRows is typical
    const affected = result?.affectedRows ?? result?.[0]?.affectedRows ?? null
    console.log(`✅ Backfilled NULL orders.warehouse_id -> 1 (affectedRows: ${affected ?? 'unknown'})`)
    process.exit(0)
  } catch (err) {
    console.error('❌ Backfill failed:', err.message)
    process.exit(1)
  }
}

main()
