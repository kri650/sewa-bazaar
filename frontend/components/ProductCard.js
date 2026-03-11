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
  const myId = String(name || image || '')
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
        style={{ cursor: onClick ? 'pointer' : undefined }}
      >
        <img
          className={name && name.includes('Potato') ? 'forceCover' : ''}
          src={image}
          alt={name}
          loading="lazy"
        />
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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: '100%' }}>
        <p className="productPrice" style={{ margin: 0, textAlign: 'center', flex: 1 }}>{displayPrice}</p>
        <button
          type="button"
          className="wishlistBtn"
          onClick={() => toggle({ id: myId, name, price, size, image })}
          aria-label="Add to wishlist"
          style={{
            position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: isWished ? '#e63946' : '#9ca3af', fontSize: 18, padding: 4,
          }}
        >
          {isWished ? '♥' : '♡'}
        </button>
      </div>

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
