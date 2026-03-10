import { createContext, useContext, useEffect, useState } from 'react'

const DeliveryContext = createContext(null)

// Haversine formula
function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180
  const R = 6371 // Earth radius km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export function DeliveryProvider({ children }) {
  const [config, setConfig] = useState(null) // {warehouse_lat, warehouse_lng, fast_radius_km}
  const [userLocation, setUserLocation] = useState(null) // {lat,lng}
  const [distanceKm, setDistanceKm] = useState(null)
  const [deliveryType, setDeliveryType] = useState(null) // 'fast' | 'normal' | null
  const [estimatedTime, setEstimatedTime] = useState(null)
  const [estimatedMinutesMin, setEstimatedMinutesMin] = useState(null)
  const [estimatedMinutesMax, setEstimatedMinutesMax] = useState(null)

  useEffect(() => {
    async function loadConfig() {
      try {
        const r = await fetch('/api/delivery/get-config')
        if (r.ok) {
          const j = await r.json()
          setConfig(j)
          return
        }
      } catch (e) {}
      setConfig({ warehouse_lat: 26.4499, warehouse_lng: 80.3319, fast_radius_km: 10 })
    }
    loadConfig()
  }, [])

  const [permissionDenied, setPermissionDenied] = useState(false)

  useEffect(() => {
    if (!userLocation || !config) return
    const d = haversineKm(config.warehouse_lat, config.warehouse_lng, userLocation.lat, userLocation.lng)
    setDistanceKm(Number(d.toFixed(2)))

    const radius = config.fast_radius_km || 10

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
  }, [userLocation, config])

  // Request browser geolocation (returns promise)
  const detectUserLocation = () => new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return reject(new Error('Geolocation not supported'))
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      const obj = { lat, lng }
      setUserLocation(obj)
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
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'
      const r = await fetch(`${API_BASE}/admin/delivery-config`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: authToken ? `Bearer ${authToken}` : '' }, body: JSON.stringify(newCfg) })
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
    setUserLocation({ lat, lng })
  }

  return (
    <DeliveryContext.Provider value={{ config, userLocation, distanceKm, deliveryType, estimatedTime, estimatedMinutesMin, estimatedMinutesMax, detectUserLocation, setManualLocation, setConfig, permissionDenied, saveConfig }}>
      {children}
    </DeliveryContext.Provider>
  )
}

export function useDelivery() {
  const ctx = useContext(DeliveryContext)
  if (!ctx) throw new Error('useDelivery must be used inside DeliveryProvider')
  return ctx
}
