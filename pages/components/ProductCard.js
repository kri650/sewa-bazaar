import React from 'react'

// local helpers (keeps component self-contained)
const parseRupees = (price) => Number(String(price || '').replace(/[^\d.]/g, '')) || 0
const formatRupees = (amount) => `Rs. ${amount.toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`

export default function ProductCard({
  name,
  price,
  size,
  image,
  badge,
  description,
  note,
  showQty = false,
  qty = 1,
  onQtyChange,
  onAdd,
}) {
  const numeric = parseRupees(price)
  const displayPrice = showQty ? formatRupees(numeric * qty) : (typeof price === 'string' && price.trim().startsWith('Rs') ? price : formatRupees(numeric))

  return (
    <article className="productCard">
      <div className="productImageWrap">
        <img
          className={name && name.includes('Potato') ? 'forceCover' : ''}
          src={image}
          alt={name}
          loading="lazy"
        />
        {badge ? <span className="mangoBadge">{badge}</span> : null}
      </div>

  <p className="productName">{name}</p>
  {description ? <p className="productDescription">{description}</p> : null}
      <p className="productPrice">{displayPrice}</p>
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
