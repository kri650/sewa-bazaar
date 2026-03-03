
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function VegetablesDropdown({ isOpen = false, anchorRef = null }) {
  const [pos, setPos] = useState({ left: 0, top: 0, width: 180 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!mounted) return
    if (!anchorRef || !anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    setPos({ left: rect.left + window.scrollX, top: rect.bottom + window.scrollY, width: Math.max(180, rect.width) })
  }, [anchorRef, isOpen, mounted])

  if (!mounted) return null

  return createPortal(
    <div className="veg-dropdown" style={{ display: isOpen ? 'block' : 'none', position: 'absolute', left: pos.left + 'px', top: pos.top + 'px', minWidth: pos.width + 'px' }}>
      <ul className="veg-dropdown-list">
        <li>
          <a href="/vegetables/leafy-vegetables" style={{ color: 'inherit', textDecoration: 'none', display: 'block' }}>
            Leafy Vegetables
          </a>
        </li>
        <li>
          <a href="/vegetables/regular-vegetables" style={{ color: 'inherit', textDecoration: 'none', display: 'block' }}>
          Regular Vegetables
         </a>
        </li>
        <li>
          <a href="/vegetables/exotic-vegetables" style={{ color: 'inherit', textDecoration: 'none', display: 'block' }}>
        Exotic Vegetables
          </a>
          </li>
        <li>
          <a href="/vegetables/gourds-and-pumpkin" style={{ color: 'inherit', textDecoration: 'none', display: 'block' }}>
        Gourds & Pumpkin
          </a>
          </li>
        <li>
          <a href="/vegetables/salad-vegetables" style={{ color: 'inherit', textDecoration: 'none', display: 'block' }}>
        Salad Vegetables
          </a>
          </li>
        {/* <li>Organic Vegetable Boxes</li> */}
      </ul>
      <style jsx global>{`
        .veg-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          z-index: 9999;
          background: #fff;
          max-width: 240px;
          min-width: 180px;
          box-shadow: 0 8px 32px rgba(40,60,20,0.13);
          border-radius: 8px;
          border: 1px solid #e6efe3;
        }
        .veg-dropdown-list {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
        }
        .veg-dropdown-list li {
          display: block;
          padding: 7px 14px;
          color: #1f3a2b;
          font-weight: 500;
          border-radius: 4px;
          cursor: pointer;
          font-size: 15px;
          line-height: 1.2;
          transition: background 0.15s, color 0.15s;
        }
        .veg-dropdown-list li:hover {
          background: #f6fbf6;
          color: #4f8525;
        }
      `}</style>
    </div>,
    document.body
  )
}