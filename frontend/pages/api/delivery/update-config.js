import fs from 'fs'
import path from 'path'

// Works whether cwd is repo root OR frontend/
function resolveConfigPaths() {
  const cwd = process.cwd()
  const direct = {
    public: path.join(cwd, 'public', 'data', 'delivery-config.json'),
    data:   path.join(cwd, 'data', 'delivery-config.json'),
  }
  const nested = {
    public: path.join(cwd, 'frontend', 'public', 'data', 'delivery-config.json'),
    data:   path.join(cwd, 'frontend', 'data', 'delivery-config.json'),
  }
  // prefer whichever public path already exists
  if (fs.existsSync(direct.public)) return direct
  if (fs.existsSync(nested.public)) return nested
  return direct
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const { warehouse_lat, warehouse_lng, fast_radius_km } = req.body || {}
  if (warehouse_lat === undefined || warehouse_lng === undefined || fast_radius_km === undefined) {
    return res.status(400).json({ error: 'missing fields' })
  }

  const cfg = {
    warehouse_lat: Number(warehouse_lat),
    warehouse_lng: Number(warehouse_lng),
    fast_radius_km: Number(fast_radius_km),
  }

  const paths = resolveConfigPaths()
  let saved = false

  // Try to write both locations so the change is picked up everywhere
  for (const p of [paths.public, paths.data]) {
    try {
      fs.mkdirSync(path.dirname(p), { recursive: true })
      fs.writeFileSync(p, JSON.stringify(cfg, null, 2), 'utf8')
      saved = true
    } catch (e) { /* ignore individual write failures */ }
  }

  if (!saved) return res.status(500).json({ error: 'Could not persist config (read-only filesystem?)' })
  return res.json({ ok: true, config: cfg })
}
