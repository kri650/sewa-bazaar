import { createContext, useContext, useState, useEffect } from 'react'

const LocationContext = createContext(null)

// Read API key from Next.js public env (set NEXT_PUBLIC_GOOGLE_MAPS_KEY in .env.local)
const GMAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ''

// Helper: extract a short human label from a Google Geocoding result
function labelFromGoogleResult(result) {
  if (!result) return ''
  const comps = result.address_components || []
  const get = (type) => comps.find((c) => c.types.includes(type))?.long_name
  return (
    get('sublocality_level_1') ||
    get('sublocality') ||
    get('neighborhood') ||
    get('locality') ||
    get('administrative_area_level_2') ||
    result.formatted_address?.split(',')[0] ||
    ''
  )
}

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(null)   // { lat, lng, label }
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  // Restore saved location on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sb_location')
      if (saved) setLocation(JSON.parse(saved))
    } catch (_) {}
  }, [])

  const saveLocation = (loc) => {
    setLocation(loc)
    try { localStorage.setItem('sb_location', JSON.stringify(loc)) } catch (_) {}
  }

  // Option A — browser geolocation → reverse-geocode via Google Maps
  const detectAuto = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }
    setLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        try {
          const res  = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GMAPS_KEY}`
          )
          const data = await res.json()
          if (data.status === 'OK' && data.results?.length) {
            const label = labelFromGoogleResult(data.results[0]) || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
            saveLocation({ lat, lng, label })
          } else {
            saveLocation({ lat, lng, label: `${lat.toFixed(4)}, ${lng.toFixed(4)}` })
          }
        } catch (_) {
          saveLocation({ lat, lng, label: `${lat.toFixed(4)}, ${lng.toFixed(4)}` })
        }
        setLoading(false)
      },
      (err) => {
        setError(
          err.code === 1
            ? 'Location permission denied. Please allow access or search manually.'
            : 'Unable to retrieve your location. Try searching manually.'
        )
        setLoading(false)
      },
      { timeout: 10000 }
    )
  }

  // Option B — manual search (disabled)
  const searchLocation = async () => []

  const clearLocation = () => {
    setLocation(null)
    try { localStorage.removeItem('sb_location') } catch (_) {}
  }

  return (
    <LocationContext.Provider value={{ location, loading, error, detectAuto, searchLocation, saveLocation, clearLocation, setError }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const ctx = useContext(LocationContext)
  if (!ctx) throw new Error('useLocation must be used inside LocationProvider')
  return ctx
}
