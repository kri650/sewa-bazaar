import fs from 'fs'
import path from 'path'

const CONFIG_PATH = path.join(process.cwd(), 'frontend', 'data', 'delivery-config.json')
const PUBLIC_CONFIG_PATH = path.join(process.cwd(), 'frontend', 'public', 'data', 'delivery-config.json')

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export default async function handler(req, res) {
  // lat, lng = user's location (required)
  // plat, plng = product's own location set by admin (optional) — used to check product-origin distance
  const { lat, lng, plat, plng } = req.query
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' })

  let cfg = { warehouse_lat: 26.4499, warehouse_lng: 80.3319, fast_radius_km: 10 }
  try {
    let raw = null
    try { raw = fs.readFileSync(CONFIG_PATH, 'utf8') } catch (_) {}
    if (!raw) raw = fs.readFileSync(PUBLIC_CONFIG_PATH, 'utf8')
    cfg = JSON.parse(raw)
  } catch (e) { /* ignore */ }

  const uLat = parseFloat(lat)
  const uLng = parseFloat(lng)
  if (isNaN(uLat) || isNaN(uLng)) return res.status(400).json({ error: 'invalid coordinates' })

  const radius = Number(cfg.fast_radius_km) || 10

  // Distance from user to warehouse (config origin)
  const distWarehouse = haversineKm(cfg.warehouse_lat, cfg.warehouse_lng, uLat, uLng)

  // Distance from user to product-specific location (if provided and non-zero)
  let distProduct = Infinity
  const pLat = parseFloat(plat)
  const pLng = parseFloat(plng)
  if (!isNaN(pLat) && !isNaN(pLng) && (pLat !== 0 || pLng !== 0)) {
    distProduct = haversineKm(pLat, pLng, uLat, uLng)
  }

  // Use the shorter distance (user may be close to the product origin even if far from warehouse)
  const minDist = Math.min(distWarehouse, distProduct)
  const distance = Math.round(minDist * 100) / 100

  // "Sewa Bazaar Minutes" = user is within the configured fast radius
  const sewa_minutes_eligible = minDist <= radius

  // Delivery type based on eligibility
  const delivery_type = sewa_minutes_eligible ? 'fast' : 'normal'
  const estimated_time = sewa_minutes_eligible ? '10 minutes' : '1–3 hours'

  return res.json({
    distance,
    delivery_type,
    estimated_time,
    sewa_minutes_eligible,
    fast_radius_km: radius,
  })
}
