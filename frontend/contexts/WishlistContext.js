import { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

const WishlistContext = createContext(null)

const WISHLIST_KEY = 'sb_wishlist'

export function WishlistProvider({ children }) {
  const [items, setItems] = useState([])

  // Helper to check user session
  const checkAuth = () => {
    if (typeof window === 'undefined') return false
    return !!localStorage.getItem('sbUserToken')
  }

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
    if (!checkAuth()) {
      toast.error('Please log in to add items to your wishlist')
      return
    }

    setItems((prev) => {
      if (!product) return prev
      const exists = prev.find((p) => p.id === product.id)
      if (exists) {
        toast('Already in wishlist!', { icon: '❤️' })
        return prev
      }
      toast.success('Added to wishlist')
      return [{ id: String(product.id), name: product.name, price: product.price, size: product.size, image: product.image }, ...prev]
    })
  }

  const remove = (productId) => {
    // Ideally user should be logged in to manage wishlist, but removing is less critical.
    // Let's enforce it for consistency if desired.
    if (!checkAuth()) {
      toast.error('Please log in to manage your wishlist')
      return
    }
    setItems((prev) => prev.filter((p) => String(p.id) !== String(productId)))
    toast.success('Removed from wishlist')
  }

  const toggle = (product) => {
    if (!checkAuth()) {
      toast.error('Please log in to use wishlist')
      return
    }
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
