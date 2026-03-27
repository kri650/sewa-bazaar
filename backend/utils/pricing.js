const ALLOWED_DISCOUNT_TYPES = new Set(['none', 'percentage', 'flat', 'fixed'])

function roundMoney(value) {
  const numeric = Number(value || 0)
  if (Number.isNaN(numeric)) return 0
  return Math.round(numeric * 100) / 100
}

function applyDiscount(amount, type, value) {
  const base = Math.max(0, Number(amount || 0))
  const discountValue = Math.max(0, Number(value || 0))

  if (type === 'percentage') {
    return roundMoney(Math.max(0, base - (base * discountValue) / 100))
  }

  if (type === 'flat') {
    return roundMoney(Math.max(0, base - discountValue))
  }

  // fixed means the entered value is the exact final price.
  if (type === 'fixed') {
    return roundMoney(Math.min(base, discountValue))
  }

  return roundMoney(base)
}

function normalizeDiscountType(rawType) {
  const type = String(rawType || 'none').trim().toLowerCase()
  return ALLOWED_DISCOUNT_TYPES.has(type) ? type : null
}

function parsePricingInput(payload = {}) {
  const discountType = normalizeDiscountType(payload.discountType ?? payload.discount_type)
  if (!discountType) {
    return { error: 'discountType must be one of none, percentage, flat, fixed' }
  }

  const discountValueRaw = payload.discountValue ?? payload.discount_value ?? 0
  const discountValue = discountType === 'none' ? 0 : Number(discountValueRaw)

  if (discountType !== 'none') {
    if (Number.isNaN(discountValue) || discountValue <= 0) {
      return { error: 'discountValue must be greater than 0 when discountType is percentage, flat, or fixed' }
    }
    if (discountType === 'percentage' && discountValue > 100) {
      return { error: 'discountValue cannot exceed 100 for percentage discount' }
    }
  }

  return {
    data: {
      discountType,
      discountValue: roundMoney(discountValue),
    },
  }
}

function calculateFinalPrices({ originalPrice, discountType, discountValue, coupon }) {
  const basePrice = roundMoney(originalPrice)
  const discountedPrice = applyDiscount(basePrice, discountType, discountValue)
  const finalPrice = coupon
    ? applyDiscount(discountedPrice, coupon.discountType, coupon.discountValue)
    : discountedPrice

  return {
    originalPrice: basePrice,
    discountedPrice,
    finalPrice,
  }
}

module.exports = {
  parsePricingInput,
  calculateFinalPrices,
}
