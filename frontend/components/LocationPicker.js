import { useState, useEffect, useRef } from 'react'
import { useLocation } from '../contexts/LocationContext'
import { useDelivery } from '../contexts/DeliveryContext'

export default function LocationPicker({ onClose }) {
  const { location, loading, error, detectAuto, saveLocation, clearLocation } = useLocation()
  const { setManualLocation } = useDelivery()

  const [tab, setTab]             = useState('auto')
  const [cityInput, setCityInput] = useState('')
  const [pincodeInput, setPincodeInput] = useState('')
  const [manualLoading, setManualLoading] = useState(false)
  const [manualError, setManualError]     = useState('')
  const [suggestions, setSuggestions]     = useState([])
  const debounceRef = useRef(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Close automatically once auto-detect finishes
  useEffect(() => {
    if (!loading && location) onClose()
  }, [loading, location])

  // Fetch live city suggestions from Nominatim (free, no API key)
  const fetchSuggestions = (query) => {
    if (!query || query.length < 3) { setSuggestions([]); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const data = await res.json()
        setSuggestions(data || [])
      } catch (_) { setSuggestions([]) }
    }, 350)
  }

  const applyLocation = (lat, lng, label) => {
    saveLocation({ lat, lng, label })
    setManualLocation(lat, lng)
    setSuggestions([])
    onClose()
  }

  const pickSuggestion = (item) => {
    const lat   = parseFloat(item.lat)
    const lng   = parseFloat(item.lon)
    const label = item.address?.city || item.address?.town || item.address?.village || item.display_name.split(',')[0]
    applyLocation(lat, lng, label)
  }

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    setManualError('')
    const query = pincodeInput.trim() || cityInput.trim()
    if (!query) { setManualError('Please enter a city name or pincode.'); return }
    setManualLoading(true)
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', India')}&limit=1&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      if (!data || data.length === 0) {
        setManualError('Location not found. Try a different city or pincode.')
        setManualLoading(false)
        return
      }
      const item  = data[0]
      const lat   = parseFloat(item.lat)
      const lng   = parseFloat(item.lon)
      const label = item.address?.city || item.address?.town || item.address?.village || item.address?.county || query
      applyLocation(lat, lng, label)
    } catch (_) {
      setManualError('Could not fetch location. Please check your connection.')
    }
    setManualLoading(false)
  }

  return (
    <>
      {/* Backdrop */}
      <div className="lp-backdrop" onClick={onClose} />

      <div className="lp-modal" role="dialog" aria-modal="true" aria-label="Set delivery location">
        <button className="lp-close" onClick={onClose} aria-label="Close">✕</button>

        {/* Header */}
        <div className="lp-header">
          <div className="lp-icon">📍</div>
          <h2 className="lp-title">Set Delivery Location</h2>
          <p className="lp-sub">We'll show estimated delivery time based on your location</p>
        </div>

        {/* Tabs */}
        <div className="lp-tabs">
          <button className={`lp-tab ${tab === 'auto' ? 'active' : ''}`} onClick={() => setTab('auto')}>
            🎯 Auto Detect
          </button>
          <button className={`lp-tab ${tab === 'manual' ? 'active' : ''}`} onClick={() => setTab('manual')}>
            ✏️ Enter Manually
          </button>
        </div>

        {/* ── Auto Detect Tab ── */}
        {tab === 'auto' && (
          <div className="lp-tabContent">
            <button className="lp-auto-btn" onClick={detectAuto} disabled={loading}>
              {loading
                ? <><span className="lp-spinner" /> Detecting your location…</>
                : <><span>🎯</span> Use my current location</>
              }
            </button>
            {error && <p className="lp-error">⚠️ {error}</p>}
            <p className="lp-hint">Your browser will ask for location permission.</p>
          </div>
        )}

        {/* ── Manual Tab ── */}
        {tab === 'manual' && (
          <div className="lp-tabContent">
            <form onSubmit={handleManualSubmit} className="lp-manualForm">

              <div className="lp-fieldGroup">
                <label className="lp-label">City / Area Name</label>
                <div className="lp-inputWrap">
                  <span className="lp-inputIcon">🏙️</span>
                  <input
                    className="lp-input"
                    type="text"
                    placeholder="e.g. Sirmaur, Shimla, Delhi…"
                    value={cityInput}
                    onChange={(e) => { setCityInput(e.target.value); fetchSuggestions(e.target.value) }}
                    autoFocus
                  />
                </div>
                {/* Live suggestions */}
                {suggestions.length > 0 && (
                  <ul className="lp-suggestions">
                    {suggestions.map((s, i) => (
                      <li key={i} className="lp-suggestion" onClick={() => pickSuggestion(s)}>
                        <span className="lp-sugIcon">📍</span>
                        <div>
                          <div className="lp-sugName">
                            {s.address?.city || s.address?.town || s.address?.village || s.display_name.split(',')[0]}
                          </div>
                          <div className="lp-sugSub">{s.display_name.split(',').slice(1, 3).join(',').trim()}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="lp-orRow">
                <span className="lp-orLine" />
                <span className="lp-orText">OR</span>
                <span className="lp-orLine" />
              </div>

              <div className="lp-fieldGroup">
                <label className="lp-label">Pincode</label>
                <div className="lp-inputWrap">
                  <span className="lp-inputIcon">📮</span>
                  <input
                    className="lp-input"
                    type="text"
                    placeholder="6-digit pincode (e.g. 173101)"
                    maxLength={6}
                    value={pincodeInput}
                    onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              {manualError && <p className="lp-error">⚠️ {manualError}</p>}

              <button type="submit" className="lp-submitBtn" disabled={manualLoading}>
                {manualLoading
                  ? <><span className="lp-spinner" /> Finding location…</>
                  : '✓ Confirm Location'
                }
              </button>
            </form>
          </div>
        )}

        {/* Current saved location */}
        {location && (
          <div className="lp-current">
            <div className="lp-currentLeft">
              <span className="lp-currentPin">📍</span>
              <div>
                <div className="lp-currentLabel">{location.label}</div>
                <div className="lp-currentCoords">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</div>
              </div>
            </div>
            <button className="lp-clear" onClick={() => { clearLocation(); setManualLocation(null, null) }}>
              Change
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .lp-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 2000;
          backdrop-filter: blur(3px);
          animation: lpFadeIn 0.18s ease;
        }
        @keyframes lpFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes lpSlideUp {
          from { opacity: 0; transform: translate(-50%, -46%) }
          to   { opacity: 1; transform: translate(-50%, -50%) }
        }

        .lp-modal {
          position: fixed; left: 50%; top: 50%;
          transform: translate(-50%, -50%);
          background: #fff; border-radius: 20px;
          padding: 32px 28px 28px;
          width: min(460px, 95vw);
          z-index: 2001;
          box-shadow: 0 24px 64px rgba(0,0,0,0.22);
          animation: lpSlideUp 0.22s ease;
        }

        .lp-close {
          position: absolute; top: 14px; right: 14px;
          background: #f5f5f5; border: none;
          font-size: 14px; cursor: pointer; color: #666;
          width: 30px; height: 30px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .lp-close:hover { background: #e0e0e0; color: #222; }

        /* Header */
        .lp-header { text-align: center; margin-bottom: 22px; }
        .lp-icon { font-size: 30px; margin-bottom: 8px; }
        .lp-title { font-size: 20px; font-weight: 800; color: #1a1a1a; margin: 0 0 6px; }
        .lp-sub { font-size: 13px; color: #888; margin: 0; line-height: 1.5; }

        /* Tabs */
        .lp-tabs {
          display: flex; gap: 6px;
          background: #f3f4f6; border-radius: 12px;
          padding: 4px; margin-bottom: 20px;
        }
        .lp-tab {
          flex: 1; padding: 10px 8px;
          border: none; border-radius: 9px;
          font-size: 13px; font-weight: 600;
          cursor: pointer; color: #888;
          background: none; transition: all 0.18s;
        }
        .lp-tab.active {
          background: #fff; color: #619233;
          box-shadow: 0 1px 6px rgba(0,0,0,0.1);
        }
        .lp-tab:hover:not(.active) { color: #555; }

        /* Tab content */
        .lp-tabContent { animation: lpFadeIn 0.15s ease; }

        /* Auto detect */
        .lp-auto-btn {
          width: 100%; padding: 14px 16px;
          border: 2px solid #619233; border-radius: 12px;
          background: linear-gradient(135deg, #f5faee, #edf6e1);
          color: #619233; font-size: 15px; font-weight: 700;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(97,146,51,0.1);
        }
        .lp-auto-btn:hover:not(:disabled) {
          background: #619233; color: #fff;
          box-shadow: 0 4px 16px rgba(97,146,51,0.3);
          transform: translateY(-1px);
        }
        .lp-auto-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .lp-hint { font-size: 12px; color: #bbb; text-align: center; margin: 12px 0 0; }

        /* Manual form */
        .lp-manualForm { display: flex; flex-direction: column; gap: 4px; }
        .lp-fieldGroup { position: relative; display: flex; flex-direction: column; gap: 6px; }
        .lp-label { font-size: 11px; font-weight: 700; color: #555; text-transform: uppercase; letter-spacing: 0.5px; }

        .lp-inputWrap { position: relative; display: flex; align-items: center; }
        .lp-inputIcon { position: absolute; left: 11px; font-size: 15px; pointer-events: none; line-height: 1; }
        .lp-input {
          width: 100%; padding: 12px 14px 12px 40px;
          border: 1.5px solid #e5e7eb; border-radius: 10px;
          font-size: 14px; color: #1a1a1a; background: #fafafa;
          outline: none; transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .lp-input:focus { border-color: #619233; background: #fff; box-shadow: 0 0 0 3px rgba(97,146,51,0.1); }

        /* Suggestions */
        .lp-suggestions {
          position: absolute; top: calc(100% + 4px); left: 0; right: 0;
          background: #fff; border: 1.5px solid #e5e7eb;
          border-radius: 12px; list-style: none; padding: 4px; margin: 0;
          box-shadow: 0 8px 28px rgba(0,0,0,0.13);
          z-index: 20; max-height: 220px; overflow-y: auto;
        }
        .lp-suggestion {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 8px; cursor: pointer;
          transition: background 0.15s;
        }
        .lp-suggestion:hover { background: #f5faee; }
        .lp-sugIcon { font-size: 15px; flex-shrink: 0; }
        .lp-sugName { font-size: 13px; font-weight: 600; color: #1a1a1a; }
        .lp-sugSub { font-size: 11px; color: #aaa; margin-top: 1px; }

        /* OR divider */
        .lp-orRow { display: flex; align-items: center; gap: 10px; margin: 16px 0; }
        .lp-orLine { flex: 1; height: 1px; background: #e5e7eb; }
        .lp-orText { font-size: 11px; color: #bbb; font-weight: 700; letter-spacing: 1px; }

        /* Submit */
        .lp-submitBtn {
          width: 100%; padding: 13px;
          background: linear-gradient(135deg, #619233, #4f7a29);
          color: #fff; border: none; border-radius: 10px;
          font-size: 15px; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.2s; margin-top: 8px;
          box-shadow: 0 4px 14px rgba(97,146,51,0.3);
        }
        .lp-submitBtn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(97,146,51,0.4); }
        .lp-submitBtn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Error */
        .lp-error {
          font-size: 13px; color: #e53e3e;
          padding: 8px 12px; background: #fff5f5;
          border-radius: 8px; border-left: 3px solid #e53e3e;
          margin-top: 10px;
        }

        /* Spinner */
        .lp-spinner {
          width: 16px; height: 16px;
          border: 2.5px solid currentColor;
          border-top-color: transparent; border-radius: 50%;
          animation: lpSpin 0.7s linear infinite;
          display: inline-block; flex-shrink: 0;
        }
        @keyframes lpSpin { to { transform: rotate(360deg) } }

        /* Current location card */
        .lp-current {
          margin-top: 20px; padding: 12px 14px;
          background: linear-gradient(135deg, #f5faee, #edf6e1);
          border-radius: 12px; border: 1px solid #c8e49a;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
        }
        .lp-currentLeft { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .lp-currentPin { font-size: 18px; flex-shrink: 0; }
        .lp-currentLabel { font-size: 14px; font-weight: 700; color: #2e7d32; }
        .lp-currentCoords { font-size: 11px; color: #aaa; margin-top: 2px; }
        .lp-clear {
          background: none; border: 1.5px solid #619233;
          color: #619233; border-radius: 8px; padding: 4px 12px;
          font-size: 12px; font-weight: 700; cursor: pointer;
          white-space: nowrap; flex-shrink: 0; transition: all 0.15s;
        }
        .lp-clear:hover { background: #619233; color: #fff; }
      `}</style>
    </>
  )
}
