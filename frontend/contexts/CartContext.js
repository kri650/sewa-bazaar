import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()

const parsePrice = (value) => {
  if (value == null) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const parsed = Number(String(value).replace(/[^\d.]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

const parseBooleanLike = (value) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  const normalized = String(value || '').trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on'
}

const parseDateMs = (value) => {
  if (!value) return null
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}

const resolveEffectivePrice = (product) => {
  const basePrice = parsePrice(product?.price)
  const flashPrice = parsePrice(product?.flashSalePrice)
  const flashEnabled = parseBooleanLike(product?.isFlashSale)
  const flashEndMs = parseDateMs(product?.flashSaleEndTime)
  const now = Date.now()

  const flashActive =
    flashEnabled &&
    flashEndMs &&
    now < flashEndMs &&
    flashPrice > 0 &&
    basePrice > 0 &&
    flashPrice < basePrice

  if (flashActive) {
    return {
      price: flashPrice,
      originalPrice: basePrice,
      discount: Math.round(((basePrice - flashPrice) / basePrice) * 100),
      isFlashSaleActive: true,
    }
  }

  const normalizedDiscountType = String(product?.discountType || '').trim().toLowerCase()
  const discountValue = parsePrice(product?.discountValue)
  const hasDiscountTypeValue =
    discountValue > 0 &&
    (normalizedDiscountType === 'percentage' || normalizedDiscountType === 'flat' || normalizedDiscountType === 'fixed')

  if (hasDiscountTypeValue && basePrice > 0) {
    let discountedPrice = basePrice
    if (normalizedDiscountType === 'percentage') {
      discountedPrice = Math.max(0, basePrice - (basePrice * discountValue) / 100)
    } else if (normalizedDiscountType === 'fixed') {
      discountedPrice = Math.min(basePrice, Math.max(0, discountValue))
    } else {
      discountedPrice = Math.max(0, basePrice - discountValue)
    }
    discountedPrice = Number(discountedPrice.toFixed(2))

    return {
      price: discountedPrice,
      originalPrice: basePrice,
      discount: Math.round(((basePrice - discountedPrice) / basePrice) * 100),
      isFlashSaleActive: false,
    }
  }

  const explicitDiscount = Number(String(product?.discount || '').replace(/[^\d.]/g, ''))
  if (Number.isFinite(explicitDiscount) && explicitDiscount > 0 && basePrice > 0) {
    const discountedPrice = Number((basePrice - (basePrice * explicitDiscount / 100)).toFixed(2))
    return {
      price: discountedPrice,
      originalPrice: basePrice,
      discount: Math.round(explicitDiscount),
      isFlashSaleActive: false,
    }
  }

  return {
    price: basePrice,
    originalPrice: basePrice,
    discount: 0,
    isFlashSaleActive: false,
  }
}

const normalizeCartItem = (item) => {
  const resolved = resolveEffectivePrice(item)
  return {
    ...item,
    price: resolved.price,
    originalPrice: resolved.originalPrice,
    discount: resolved.discount,
    isFlashSaleActive: resolved.isFlashSaleActive,
  }
}

export function useCart() {
  return useContext(CartContext)
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState([])

  // Load cart from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('organic-cart')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setCart(parsed.map(normalizeCartItem))
        }
      } catch (e) {
        console.error('Failed to load cart', e)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('organic-cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (product, quantity = 1) => {
    const resolved = resolveEffectivePrice(product)

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? {
              ...item,
              ...product,
              price: resolved.price,
              originalPrice: resolved.originalPrice,
              discount: resolved.discount,
              isFlashSaleActive: resolved.isFlashSaleActive,
              quantity: item.quantity + quantity,
            }
            : item
        )
      }
      return [
        ...prev,
        {
          ...product,
          price: resolved.price,
          originalPrice: resolved.originalPrice,
          discount: resolved.discount,
          isFlashSaleActive: resolved.isFlashSaleActive,
          quantity,
        },
      ]
    })
  }

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId))
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const getCartTotal = () => {
    return cart.reduce((sum, item) => {
      const price = parseFloat(String(item.price).replace(/[^\d.]/g, '')) || 0
      return sum + price * item.quantity
    }, 0)
  }

  const getCartCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
