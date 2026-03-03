import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function FarmFreshDropdown({ isOpen = false, anchorRef = null }) {
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
    <div className="farm-dropdown" style={{ display: isOpen ? 'block' : 'none', position: 'absolute', left: pos.left + 'px', top: pos.top + 'px', minWidth: pos.width + 'px' }}>
      <ul className="farm-dropdown-list">
        <li>
          <a href="/farm-fresh-picks/vegetables" style={{ color: 'inherit', textDecoration: 'none', display: 'block' }}>
            Vegetables
          </a>
        </li>
        <li>
          <a href="/farm-fresh-picks/fruits" style={{ color: 'inherit', textDecoration: 'none', display: 'block' }}>
            Fruits
          </a>
        </li>
      </ul>
      <style jsx global>{`
        .farm-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          z-index: 9999;
          background: #fff;
          max-width: 240px;
          min-width: 180px;
          box-shadow: 0 8px 32px rgba(40,60,20,0.13);
          border-radius: 8px;
          padding: 8px 0;
        }
        .farm-dropdown-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .farm-dropdown-list li {
          margin: 0;
        }
        .farm-dropdown-list a {
          padding: 10px 20px;
          font-size: 16px;
          transition: background 0.15s;
        }
        .farm-dropdown-list a:hover {
          background: #f3f7ee;
        }
      `}</style>
    </div>,
    document.body
  )
}
