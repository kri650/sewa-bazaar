import fs from 'fs'
import path from 'path'

// Works whether cwd is repo root OR frontend/
function resolvePublicConfig() {
  const cwd = process.cwd()
  // If running from frontend/ directly
  const direct = path.join(cwd, 'public', 'data', 'delivery-config.json')
  if (fs.existsSync(direct)) return direct
  // If running from repo root
  const nested = path.join(cwd, 'frontend', 'public', 'data', 'delivery-config.json')
  if (fs.existsSync(nested)) return nested
  return direct // fallback (will fail gracefully below)
}

const DEFAULT_CONFIG = { warehouse_lat: 26.4499, warehouse_lng: 80.3319, fast_radius_km: 10 }

export default async function handler(req, res) {
  // Try reading from public file first (most reliable, no auth needed)
  try {
    const configPath = resolvePublicConfig()
    const raw = fs.readFileSync(configPath, 'utf8')
    const j = JSON.parse(raw)
    return res.json(j)
  } catch (e) {
    // ignore, return default
  }
  return res.json(DEFAULT_CONFIG)
}
