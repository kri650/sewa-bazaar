import React from 'react'
import { useWishlist } from '../contexts/WishlistContext'

const parseRupees = (price) => Number(String(price || '').replace(/[^\d.]/g, '')) || 0

const parseBooleanLike = (value) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  const normalized = String(value || '').trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on'
}

const parseDateTimeMs = (value) => {
  if (!value) return null
  const ts = new Date(value).getTime()
  return Number.isFinite(ts) ? ts : null
}

const formatCountdown = (remainingMs) => {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':')
}

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
  isFlashSale,
  flashSalePrice,
  flashSaleEndTime,
  originalPrice,
  discount,
  discountType,
  discountValue,
  size,
  image,
  badge,
  description,
  note,
  stockQuantity,
  showQty = false,
  qty = 1,
  onQtyChange,
  onAdd,
  onRequestProduct,
  onClick,
}) {
  // Debug: Log product data to verify flash sale fields are received
  if (isFlashSale || flashSalePrice || flashSaleEndTime) {
    console.log('[ProductCard] Flash Sale Data:', {
      id,
      name,
      price,
      isFlashSale,
      flashSalePrice,
      flashSaleEndTime,
      parsedFlashSale: parseBooleanLike(isFlashSale),
      parsedFlashSalePrice: parseRupees(flashSalePrice),
      parsedFlashSaleEndTime: parseDateTimeMs(flashSaleEndTime),
      nowMs: Date.now(),
      endTableMs: parseDateTimeMs(flashSaleEndTime),
      isActive: parseBooleanLike(isFlashSale) && parseDateTimeMs(flashSaleEndTime) && Date.now() < parseDateTimeMs(flashSaleEndTime),
    })
  }

  const { items: wishlistItems, toggle } = useWishlist()
  const [nowMs, setNowMs] = React.useState(() => Date.now())

  const myId = String(id ?? name ?? image ?? '')
  const isWished = wishlistItems.some((p) => String(p.id) === myId)
  const numeric = parseRupees(price)

  const flashEndMs = React.useMemo(() => parseDateTimeMs(flashSaleEndTime), [flashSaleEndTime])
  const flashNumeric = parseRupees(flashSalePrice)
  const isFlashEnabled = parseBooleanLike(isFlashSale)

  React.useEffect(() => {
    if (!flashEndMs || flashEndMs <= Date.now()) return undefined

    setNowMs(Date.now())
    const intervalId = setInterval(() => {
      setNowMs(Date.now())
    }, 1000)

    return () => clearInterval(intervalId)
  }, [flashEndMs])

  const isFlashSaleActive =
    isFlashEnabled &&
    flashEndMs &&
    nowMs < flashEndMs &&
    flashNumeric > 0 &&
    numeric > 0 &&
    flashNumeric < numeric

  const normalizedDiscountType = String(discountType || '').trim().toLowerCase()
  const numericDiscountValue = Number(String(discountValue || '').replace(/[^\d.]/g, ''))
  const hasDiscountTypeValue =
    Number.isFinite(numericDiscountValue) &&
    numericDiscountValue > 0 &&
    (normalizedDiscountType === 'percentage' || normalizedDiscountType === 'flat' || normalizedDiscountType === 'fixed')

  let discountedUnitPrice = numeric
  let discountPercentFromType = 0

  if (hasDiscountTypeValue && numeric > 0) {
    if (normalizedDiscountType === 'percentage') {
      discountedUnitPrice = Math.max(0, numeric - (numeric * numericDiscountValue) / 100)
      discountPercentFromType = Math.round(Math.min(numericDiscountValue, 100))
    } else if (normalizedDiscountType === 'fixed') {
      discountedUnitPrice = Math.min(numeric, Math.max(0, numericDiscountValue))
      discountPercentFromType = Math.round(((numeric - discountedUnitPrice) / numeric) * 100)
    } else {
      discountedUnitPrice = Math.max(0, numeric - numericDiscountValue)
      discountPercentFromType = Math.round(((numeric - discountedUnitPrice) / numeric) * 100)
    }
    discountedUnitPrice = Number(discountedUnitPrice.toFixed(2))
  }

  const unitPrice = isFlashSaleActive ? flashNumeric : discountedUnitPrice
  const displayPrice =
    showQty
      ? formatRupees(unitPrice * qty)
      : typeof price === 'string' && price.trim().startsWith('Rs')
        ? isFlashSaleActive
          ? formatRupees(unitPrice)
          : price
        : formatRupees(unitPrice)

  const origNumericProp = parseRupees(originalPrice)
  const discountFromProp = discount ? Number(String(discount).replace(/[^\d]/g, '')) : null

  let finalDiscount = 0
  let finalOrigNumeric = origNumericProp || 0

  if (!isFlashSaleActive && hasDiscountTypeValue) {
    finalDiscount = discountPercentFromType
    finalOrigNumeric = numeric
  } else if (discountFromProp) {
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

  const hasDiscount = !isFlashSaleActive && Boolean(finalDiscount && finalOrigNumeric > unitPrice)
  const flashCountdown = isFlashSaleActive ? formatCountdown(flashEndMs - nowMs) : null
  const hasStockInfo = stockQuantity !== undefined && stockQuantity !== null
  const isOutOfStock = hasStockInfo && Number(stockQuantity) <= 0

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
        {isFlashSaleActive ? (
          <span className="flashSaleBadge">Flash Sale</span>
        ) : null}
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

      {description ? <p className="productDescription">{description}</p> : null}

      {badge ? (
        <span className="mangoBadge">{badge}</span>
      ) : null}

      <p className="productPrice" style={{ margin: 0, textAlign: 'center' }}>{displayPrice}</p>

      {isFlashSaleActive ? (
        <div className="priceRow" style={{ marginTop: 6 }}>
          <span className="productOriginal">{formatRupees(numeric)}</span>
          <span className="productDiscount" style={{ color: '#c2410c', fontWeight: 700 }}>
            Ends in {flashCountdown}
          </span>
        </div>
      ) : null}

      {hasDiscount ? (
        <div className="priceRow">
          {finalOrigNumeric ? (
            <span className="productOriginal">{formatRupees(finalOrigNumeric)}</span>
          ) : null}
          <span className="productDiscount">{finalDiscount}% Off</span>
        </div>
      ) : null}

      <span className="productSize" suppressHydrationWarning>{size}</span>
      {note ? <small className="productNote">{note}</small> : null}

      {isOutOfStock ? (
        <button
          type="button"
          className="pickNowBtn"
          onClick={onRequestProduct}
          style={{ background: '#f59e0b' }}
        >
          Request Product
        </button>
      ) : showQty ? (
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
