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

  // Restore saved location on mount — if label looks like raw coords, re-resolve it
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sb_location')
      if (saved) {
        const parsed = JSON.parse(saved)
        setLocation(parsed)
        // If label looks like raw coordinates (e.g. "30.7562, 77.2993"), re-resolve
        if (parsed && parsed.lat && parsed.lng && parsed.label && /^\d+\.\d+,\s*\d+\.\d+$/.test(parsed.label.trim())) {
          reverseGeocodeNominatim(parsed.lat, parsed.lng).then((newLabel) => {
            if (newLabel) {
              const updated = { ...parsed, label: newLabel }
              setLocation(updated)
              try { localStorage.setItem('sb_location', JSON.stringify(updated)) } catch (_) {}
            }
          })
        }
      }
    } catch (_) {}
  }, [])

  const saveLocation = (loc) => {
    setLocation(loc)
    try {
      localStorage.setItem('sb_location', JSON.stringify(loc))
      // Notify DeliveryContext in the same tab (storage events only fire cross-tab)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('sb_location_updated'))
      }
    } catch (_) {}
  }

  // Reverse-geocode via free Nominatim (OpenStreetMap) — no API key needed
  const reverseGeocodeNominatim = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=14`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      if (data && data.address) {
        const a = data.address
        return (
          a.suburb || a.neighbourhood || a.village || a.town || a.city ||
          a.county || a.state_district || a.state ||
          data.display_name?.split(',')[0] || ''
        )
      }
    } catch (_) {}
    return ''
  }

  // Browser geolocation → reverse-geocode (Google Maps if key exists, otherwise Nominatim)
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
        let label = ''

        // Try Google Maps first if key is available
        if (GMAPS_KEY && GMAPS_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
          try {
            const res  = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GMAPS_KEY}`
            )
            const data = await res.json()
            if (data.status === 'OK' && data.results?.length) {
              label = labelFromGoogleResult(data.results[0])
            }
          } catch (_) {}
        }

        // Fallback: use free Nominatim reverse geocoding
        if (!label) {
          label = await reverseGeocodeNominatim(lat, lng)
        }

        // Last resort: show coords
        if (!label) {
          label = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        }

        saveLocation({ lat, lng, label })
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
