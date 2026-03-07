import { useState, useEffect } from 'react'
import { useLocation } from '../contexts/LocationContext'

export default function LocationPicker({ onClose }) {
  const { location, loading, error, detectAuto, clearLocation } = useLocation()

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Close modal automatically once auto-detect finishes
  useEffect(() => {
    if (!loading && location) onClose()
  }, [loading, location])

  return (
    <>
      {/* Backdrop */}
      <div className="lp-backdrop" onClick={onClose} />

      <div className="lp-modal" role="dialog" aria-modal="true" aria-label="Set delivery location">
        <button className="lp-close" onClick={onClose} aria-label="Close">✕</button>

        <h2 className="lp-title">📍 Set Delivery Location</h2>
        <p className="lp-sub">Allow location access so we can show products available near you.</p>

        {/* Option A — auto detect */}
        <button className="lp-auto-btn" onClick={detectAuto} disabled={loading}>
          {loading ? <span className="lp-spinner" /> : <span>🎯</span>}
          {loading ? 'Detecting your location…' : 'Use my current location'}
        </button>

        {error && <p className="lp-error">⚠️ {error}</p>}

        {/* Current saved location */}
        {location && (
          <div className="lp-current">
            <span>📍 </span>
            <strong>{location.label}</strong>
            <span className="lp-coords"> ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})</span>
            <button className="lp-clear" onClick={clearLocation}>Change</button>
          </div>
        )}
      </div>

      <style jsx>{`
        .lp-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 2000; animation: fadeIn 0.15s ease; }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }

        .lp-modal {
          position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%);
          background: #fff; border-radius: 16px; padding: 36px 32px 32px;
          width: min(420px, 94vw); z-index: 2001;
          box-shadow: 0 20px 60px rgba(0,0,0,0.18); animation: slideUp 0.2s ease;
        }
        .lp-close {
          position: absolute; top: 14px; right: 16px; background: none;
          border: none; font-size: 18px; cursor: pointer; color: #888;
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }
        .lp-close:hover { background: #f5f5f5; color: #333; }

        .lp-title { font-size: 20px; font-weight: 800; color: #222; margin: 0 0 8px; }
        .lp-sub { font-size: 14px; color: #888; margin: 0 0 24px; line-height: 1.5; }

        .lp-auto-btn {
          width: 100%; padding: 14px; border: 2px solid #619233;
          border-radius: 10px; background: #f5faee; color: #619233;
          font-size: 15px; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: all 0.2s;
        }
        .lp-auto-btn:hover:not(:disabled) { background: #619233; color: #fff; }
        .lp-auto-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .lp-spinner {
          width: 18px; height: 18px; border: 2.5px solid #619233;
          border-top-color: transparent; border-radius: 50%;
          animation: spin 0.7s linear infinite; display: inline-block; flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg) } }

        .lp-error { color: #e53e3e; font-size: 13px; margin: 14px 0 0; }

        .lp-current {
          margin-top: 20px; padding: 12px 14px; background: #f5faee;
          border-radius: 10px; font-size: 13px; color: #444;
          border: 1px solid #d4e8b0; display: flex; align-items: center; gap: 4px; flex-wrap: wrap;
        }
        .lp-coords { color: #aaa; }
        .lp-clear {
          margin-left: auto; background: none; border: 1px solid #c8e49a;
          color: #619233; border-radius: 6px; padding: 2px 10px;
          font-size: 12px; font-weight: 600; cursor: pointer;
        }
        .lp-clear:hover { background: #619233; color: #fff; border-color: #619233; }
      `}</style>
    </>
  )
}
