import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const DeliveryContext = createContext(null)

const DEFAULT_CONFIG = {
  warehouse_lat: 26.4499,
  warehouse_lng: 80.3319,
  fast_radius_km: 10,
  warehouses: [],
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')

// Haversine formula
function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180
  const R = 6371 // Earth radius km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function normalizeConfig(payload) {
  if (!payload) return null

  const warehouses = Array.isArray(payload?.warehouses)
    ? payload.warehouses
    : Array.isArray(payload?.data?.warehouses)
      ? payload.data.warehouses
      : []

  const primary = warehouses.find((w) => String(w.status || '').toLowerCase() === 'active') || warehouses[0]

  const latCandidate = payload?.warehouse_lat ?? primary?.lat ?? primary?.latitude
  const lngCandidate = payload?.warehouse_lng ?? primary?.lng ?? primary?.longitude
  const radiusCandidate = payload?.fast_radius_km ?? primary?.fast_radius_km ?? primary?.fast_radius

  const safeLat = Number.isFinite(Number(latCandidate)) ? Number(latCandidate) : DEFAULT_CONFIG.warehouse_lat
  const safeLng = Number.isFinite(Number(lngCandidate)) ? Number(lngCandidate) : DEFAULT_CONFIG.warehouse_lng
  const safeRadius = Number.isFinite(Number(radiusCandidate)) ? Number(radiusCandidate) : DEFAULT_CONFIG.fast_radius_km

  return {
    warehouse_lat: safeLat,
    warehouse_lng: safeLng,
    fast_radius_km: safeRadius,
    warehouses,
  }
}

function round2(value) {
  return Math.round(value * 100) / 100
}

function pickNearestWarehouse(warehouses, userLat, userLng) {
  if (!Array.isArray(warehouses) || warehouses.length === 0) return null
  const active = warehouses.filter((w) => String(w.status || '').toLowerCase() === 'active')
  const list = active.length ? active : warehouses
  if (userLat == null || userLng == null) return list[0] || null

  let nearest = null
  let minDist = Infinity

  for (const wh of list) {
    const wLat = Number(wh.lat ?? wh.latitude)
    const wLng = Number(wh.lng ?? wh.longitude)
    if (!Number.isFinite(wLat) || !Number.isFinite(wLng)) continue
    const dist = haversineKm(Number(userLat), Number(userLng), wLat, wLng)
    if (dist < minDist) {
      minDist = dist
      nearest = { ...wh, distanceKm: round2(dist) }
    }
  }

  return nearest || list[0] || null
}

// Matches the shape previously returned by the (now removed) Next.js API route:
// /api/delivery/check-distance
function computeDeliveryInfo(cfg, userLat, userLng, productLat, productLng) {
  if (!cfg) return null

  const uLat = Number(userLat)
  const uLng = Number(userLng)
  if (!Number.isFinite(uLat) || !Number.isFinite(uLng)) return null

  const radius = Number(cfg.fast_radius_km) || 10

  const distWarehouse = haversineKm(cfg.warehouse_lat, cfg.warehouse_lng, uLat, uLng)

  let distProduct = Infinity
  const pLat = Number(productLat)
  const pLng = Number(productLng)
  if (Number.isFinite(pLat) && Number.isFinite(pLng) && (pLat !== 0 || pLng !== 0)) {
    distProduct = haversineKm(pLat, pLng, uLat, uLng)
  }

  const minDist = Math.min(distWarehouse, distProduct)
  const sewa_minutes_eligible = minDist <= radius

  return {
    distance: round2(minDist),
    delivery_type: sewa_minutes_eligible ? 'fast' : 'normal',
    estimated_time: sewa_minutes_eligible ? '10 minutes' : '1–3 hours',
    sewa_minutes_eligible,
    fast_radius_km: radius,
  }
}

export function DeliveryProvider({ children }) {
  const [config, setConfig] = useState(null) // {warehouse_lat, warehouse_lng, fast_radius_km}
  const [userLocation, setUserLocation] = useState(null) // {lat,lng}
  const [nearestWarehouse, setNearestWarehouse] = useState(null)
  const [distanceKm, setDistanceKm] = useState(null)
  const [deliveryType, setDeliveryType] = useState(null) // 'fast' | 'normal' | null
  const [estimatedTime, setEstimatedTime] = useState(null)
  const [estimatedMinutesMin, setEstimatedMinutesMin] = useState(null)
  const [estimatedMinutesMax, setEstimatedMinutesMax] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadConfig() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/delivery/get-config`)
        if (!response.ok) throw new Error('failed to load delivery config')
        const json = await response.json()
        const normalized = normalizeConfig(json)
        if (normalized && !cancelled) {
          setConfig(normalized)
          return
        }
      } catch (_) {
        // If backend is unreachable, fall back to defaults (pure-client mode).
      }

      if (!cancelled) setConfig(DEFAULT_CONFIG)
    }

    loadConfig()

    return () => {
      cancelled = true
    }
  }, [])

  const [permissionDenied, setPermissionDenied] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem('sb_location')
      if (!saved) return
      const parsed = JSON.parse(saved)
      if (parsed && Number.isFinite(Number(parsed.lat)) && Number.isFinite(Number(parsed.lng))) {
        setUserLocation({ lat: Number(parsed.lat), lng: Number(parsed.lng) })
      }
    } catch (_) {}
  }, [])

  useEffect(() => {
    if (!config) return
    const next = pickNearestWarehouse(config.warehouses || [], userLocation?.lat, userLocation?.lng)
    setNearestWarehouse(next)
  }, [config, userLocation])

  const effectiveConfig = useMemo(() => {
    if (!config) return null
    if (!nearestWarehouse) return config

    const lat = Number(nearestWarehouse?.lat ?? nearestWarehouse?.latitude ?? config.warehouse_lat)
    const lng = Number(nearestWarehouse?.lng ?? nearestWarehouse?.longitude ?? config.warehouse_lng)
    const radius = Number(nearestWarehouse?.fast_radius_km ?? nearestWarehouse?.fast_radius ?? config.fast_radius_km)

    return {
      ...config,
      warehouse_lat: Number.isFinite(lat) ? lat : config.warehouse_lat,
      warehouse_lng: Number.isFinite(lng) ? lng : config.warehouse_lng,
      fast_radius_km: Number.isFinite(radius) ? radius : config.fast_radius_km,
    }
  }, [config, nearestWarehouse])

  useEffect(() => {
    if (!userLocation || !effectiveConfig) return

    const d = haversineKm(effectiveConfig.warehouse_lat, effectiveConfig.warehouse_lng, userLocation.lat, userLocation.lng)
    setDistanceKm(Number(d.toFixed(2)))

    const radius = Number(effectiveConfig.fast_radius_km) || 10

    if (d <= radius) {
      // ── Fast delivery (within radius) ── Flipkart: "Delivery in 20-40 minutes"
      setDeliveryType('fast')
      setEstimatedMinutesMin(20)
      setEstimatedMinutesMax(40)
      setEstimatedTime('20-40 minutes')
    } else {
      // ── Normal delivery ── Flipkart style: "Delivery by Tomorrow" / date
      setDeliveryType('normal')

      // ~1 km/min as crow-flies + handling: estimate days
      // Under 50 km → same-day evening / tomorrow; else +1 day per 100 km
      const extraDays = d < 50 ? 1 : Math.ceil(d / 100)
      const deliveryDate = new Date()
      deliveryDate.setDate(deliveryDate.getDate() + extraDays)

      const today = new Date()
      const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1)

      let dateLabel
      if (deliveryDate.toDateString() === today.toDateString()) {
        dateLabel = 'Today'
      } else if (deliveryDate.toDateString() === tomorrow.toDateString()) {
        dateLabel = 'Tomorrow'
      } else {
        dateLabel = deliveryDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
      }

      // Minute range for within-same-day cases
      const minMins = Math.round(60 + d * 3)
      const maxMins = Math.round(minMins + 30)
      setEstimatedMinutesMin(minMins)
      setEstimatedMinutesMax(maxMins)
      setEstimatedTime(`by ${dateLabel}`)
    }
  }, [userLocation, effectiveConfig])

  // Request browser geolocation (returns promise)
  const detectUserLocation = () => new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return reject(new Error('Geolocation not supported'))
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      const obj = { lat, lng }
      setUserLocation(obj)
      try { localStorage.setItem('sb_location', JSON.stringify({ lat, lng })) } catch (_) {}
      setPermissionDenied(false)
      resolve(obj)
    }, (err) => reject(err), { timeout: 10000 })
  })

  // Auto-detect on first visit if user has not saved a location
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('sb_location')
    if (saved) return
    // try to detect silently
    detectUserLocation().catch((err) => {
      if (err && err.code === 1) setPermissionDenied(true)
    })
  }, [config])

  const saveConfig = async (newCfg, authToken) => {
    // prefer backend admin endpoint
    try {
      const r = await fetch(`${API_BASE_URL}/admin/delivery-config`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: authToken ? `Bearer ${authToken}` : '' }, body: JSON.stringify(newCfg) })
      if (r.ok) {
        setConfig(newCfg)
        return { ok: true }
      }
      const j = await r.json()
      return { ok: false, error: j?.error }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  }

  const setManualLocation = (lat, lng) => {
    const next = { lat: Number(lat), lng: Number(lng) }
    setUserLocation(next)
    try { localStorage.setItem('sb_location', JSON.stringify(next)) } catch (_) {}
  }

  return (
    <DeliveryContext.Provider
      value={{
        config,
        nearestWarehouse,
        userLocation,
        distanceKm,
        deliveryType,
        estimatedTime,
        estimatedMinutesMin,
        estimatedMinutesMax,
        detectUserLocation,
        setManualLocation,
        setConfig,
        permissionDenied,
        saveConfig,
        getDeliveryInfo: ({ lat, lng, plat, plng }) => computeDeliveryInfo(effectiveConfig, lat, lng, plat, plng),
      }}
    >
      {children}
    </DeliveryContext.Provider>
  )
}

export function useDelivery() {
  const ctx = useContext(DeliveryContext)
  if (!ctx) throw new Error('useDelivery must be used inside DeliveryProvider')
  return ctx
}
