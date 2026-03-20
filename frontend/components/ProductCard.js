import React from 'react'
import { useWishlist } from '../contexts/WishlistContext'

const parseRupees = (price) => Number(String(price || '').replace(/[^\d.]/g, '')) || 0

const formatRupees = (amount) =>
  `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const deterministicDiscount = (key) => {
  const choices = [10, 15, 20, 25, 30, 35, 40, 50, 60]
  if (!key) return 10
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h + key.charCodeAt(i) * (i + 1)) & 0xffff
  return choices[h % choices.length]
}

export default function ProductCard({
  id,
  name,
  price,
  originalPrice,
  discount,
  size,
  image,
  badge,
  description,
  note,
  showQty = false,
  qty = 1,
  onQtyChange,
  onAdd,
  onClick,
}) {
  const { items: wishlistItems, toggle } = useWishlist()
  const myId = String(id ?? name ?? image ?? '')
  const isWished = wishlistItems.some((p) => String(p.id) === myId)
  const numeric = parseRupees(price)
  const displayPrice =
    showQty
      ? formatRupees(numeric * qty)
      : typeof price === 'string' && price.trim().startsWith('Rs')
        ? price
        : formatRupees(numeric)

  const origNumericProp = parseRupees(originalPrice)
  const discountFromProp = discount ? Number(String(discount).replace(/[^\d]/g, '')) : null

  let finalDiscount = 0
  let finalOrigNumeric = origNumericProp || 0

  if (discountFromProp) {
    finalDiscount = Math.round(discountFromProp)
    if (!finalOrigNumeric && numeric > 0) {
      finalOrigNumeric = Math.round((numeric * 100) / (100 - finalDiscount))
    }
  } else if (origNumericProp && origNumericProp > numeric) {
    finalOrigNumeric = origNumericProp
    finalDiscount = Math.round(((finalOrigNumeric - numeric) / finalOrigNumeric) * 100)
  } else {
    finalDiscount = deterministicDiscount(name || String(image || ''))
    if (numeric > 0) finalOrigNumeric = Math.round((numeric * 100) / (100 - finalDiscount))
  }

  const hasDiscount = Boolean(finalDiscount && finalOrigNumeric > numeric)

  return (
    <article className="productCard">
      <div
        className="productImageWrap"
        onClick={() => onClick && onClick()}
        style={{ cursor: onClick ? 'pointer' : undefined, position: 'relative' }}
      >
        <img
          className={name && name.includes('Potato') ? 'forceCover' : ''}
          src={image}
          alt={name}
          loading="lazy"
        />
        {/* Wishlist heart — top-right of image */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggle({ id: myId, name, price, size, image }) }}
          aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
          style={{
            position: 'absolute', top: 8, right: 8, zIndex: 2,
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 17,
            color: isWished ? '#e63946' : '#9ca3af',
            boxShadow: '0 1px 6px rgba(0,0,0,0.12)',
            transition: 'color 0.2s, transform 0.2s',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M20.8 4.6c-1.5-1.5-4-1.5-5.5 0l-0.8 0.8-0.8-0.8c-1.5-1.5-4-1.5-5.5 0-1.5 1.5-1.5 4 0 5.5l6.3 6.3 6.3-6.3c1.5-1.5 1.5-4 0-5.5z"
              fill={isWished ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <p
        className="productName"
        onClick={() => onClick && onClick()}
        style={{ cursor: onClick ? 'pointer' : undefined }}
      >
        {name}
      </p>

      {badge ? (
        <span className="mangoBadge">{badge}</span>
      ) : null}

      {description ? <p className="productDescription">{description}</p> : null}

      <p className="productPrice" style={{ margin: 0, textAlign: 'center' }}>{displayPrice}</p>

      {hasDiscount ? (
        <div className="priceRow">
          {finalOrigNumeric ? (
            <span className="productOriginal">{formatRupees(finalOrigNumeric)}</span>
          ) : null}
          <span className="productDiscount">{finalDiscount}% Off</span>
        </div>
      ) : null}

      <span className="productSize">{size}</span>
      {note ? <small className="productNote">{note}</small> : null}

      {showQty ? (
        <>
          <div className="qtyRow">
            <button type="button" onClick={() => onQtyChange && onQtyChange(-1)}>-</button>
            <span>{qty}</span>
            <button type="button" onClick={() => onQtyChange && onQtyChange(1)}>+</button>
          </div>
          <button type="button" className="pickNowBtn" onClick={onAdd}>Add to Cart</button>
        </>
      ) : (
        <button type="button" className="pickNowBtn" onClick={onAdd}>Add to Cart</button>
      )}
    </article>
  )
}
