const { query } = require('../config/db')

function toNumber(value) {
  const n = Number(value)
  return Number.isNaN(n) ? 0 : n
}

function roundMoney(value) {
  return Math.round(toNumber(value) * 100) / 100
}

async function validateCoupon(req, res) {
  try {
    const code = String(req.body?.code || '').trim().toUpperCase()
    const items = Array.isArray(req.body?.items) ? req.body.items : []

    if (!code) {
      return res.status(400).json({ valid: false, error: 'Coupon code is required' })
    }

    if (items.length === 0) {
      return res.status(400).json({ valid: false, error: 'Cart items are required' })
    }

    const normalizedItems = items
      .map((item) => ({
        productId: toNumber(item?.productId || item?.id),
        qty: Math.max(0, toNumber(item?.qty || item?.quantity || 0)),
        price: Math.max(0, toNumber(item?.price)),
      }))
      .filter((item) => item.productId > 0 && item.qty > 0)

    if (normalizedItems.length === 0) {
      return res.status(400).json({ valid: false, error: 'No valid cart items found' })
    }

    const productIds = [...new Set(normalizedItems.map((item) => item.productId))]
    const placeholders = productIds.map(() => '?').join(',')

    const couponRows = await query(
      `SELECT id, code, discount_type AS discountType, discount_value AS discountValue, product_id AS productId
       FROM coupons
       WHERE UPPER(code) = ? AND product_id IN (${placeholders})`,
      [code, ...productIds]
    )

    if (!couponRows.length) {
      return res.status(404).json({ valid: false, error: 'Invalid coupon' })
    }

    const couponByProductId = new Map()
    couponRows.forEach((row) => {
      couponByProductId.set(Number(row.productId), {
        id: row.id,
        code: String(row.code || '').toUpperCase(),
        discountType: String(row.discountType || '').toLowerCase(),
        discountValue: toNumber(row.discountValue),
      })
    })

    let discountAmount = 0
    let matchedProductCount = 0

    normalizedItems.forEach((item) => {
      const coupon = couponByProductId.get(item.productId)
      if (!coupon) return

      matchedProductCount += 1
      const lineTotal = item.price * item.qty

      if (coupon.discountType === 'percentage') {
        discountAmount += (lineTotal * coupon.discountValue) / 100
      } else if (coupon.discountType === 'flat') {
        discountAmount += coupon.discountValue * item.qty
      }
    })

    if (matchedProductCount === 0 || discountAmount <= 0) {
      return res.status(404).json({ valid: false, error: 'Invalid coupon' })
    }

    const subtotal = normalizedItems.reduce((sum, item) => sum + item.price * item.qty, 0)
    const safeDiscount = Math.min(roundMoney(discountAmount), roundMoney(subtotal))

    return res.json({
      valid: true,
      code,
      discountAmount: safeDiscount,
      matchedProducts: matchedProductCount,
    })
  } catch (error) {
    if (error?.code === 'ER_NO_SUCH_TABLE' || error?.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(404).json({ valid: false, error: 'Invalid coupon' })
    }
    return res.status(500).json({ valid: false, error: error.message })
  }
}

module.exports = {
  validateCoupon,
}
