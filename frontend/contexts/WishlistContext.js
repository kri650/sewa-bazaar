import { createContext, useContext, useEffect, useState } from 'react'

const WishlistContext = createContext(null)

const WISHLIST_KEY = 'sb_wishlist'

export function WishlistProvider({ children }) {
  const [items, setItems] = useState([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WISHLIST_KEY)
      setItems(raw ? JSON.parse(raw) : [])
    } catch (e) {
      setItems([])
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(items))
    } catch (e) {}
  }, [items])

  const add = (product) => {
    setItems((prev) => {
      if (!product) return prev
      const exists = prev.find((p) => p.id === product.id)
      if (exists) return prev
      return [{ id: String(product.id), name: product.name, price: product.price, size: product.size, image: product.image }, ...prev]
    })
  }

  const remove = (productId) => {
    setItems((prev) => prev.filter((p) => String(p.id) !== String(productId)))
  }

  const toggle = (product) => {
    if (!product) return
    const exists = items.find((p) => String(p.id) === String(product.id))
    if (exists) remove(product.id)
    else add(product)
  }

  return (
    <WishlistContext.Provider value={{ items, add, remove, toggle }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider')
  return ctx
}
