import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import ShopLayout from '../components/ShopLayout'
import CategoryPage from '../components/CategoryPage'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
console.log('[VegetablesPage] API Base URL:', API_BASE)

const normalizeProductName = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const normalizeCategoryName = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').trim()

const staticProducts = [
  { id: 'tomato', name: 'Fresh Tomato', price: 32.00, size: '500 GM', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80', category: 'vegetables' },
  { id: 'potato', name: 'Organic Potato', price: 50.00, size: '1 KG', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80', category: 'vegetables' },
  { id: 'onion', name: 'Red Onion', price: 52.00, size: '1 KG', image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&q=80', category: 'vegetables' },
  { id: 'carrot', name: 'Fresh Carrot', price: 48.00, size: '500 GM', image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80', category: 'vegetables' },
  { id: 'cabbage', name: 'Green Cabbage', price: 35.00, size: '1 PC', image: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400&q=80', category: 'vegetables' },
  { id: 'cauliflower', name: 'Cauliflower', price: 42.00, size: '1 PC', image: 'https://images.unsplash.com/photo-1568584711271-6ec8e8a9d39a?w=400&q=80', category: 'vegetables' },
  { id: 'spinach', name: 'Fresh Spinach', price: 25.00, size: '250 GM', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80', category: 'vegetables' },
  { id: 'cucumber', name: 'Cucumber', price: 36.00, size: '500 GM', image: 'https://images.unsplash.com/photo-1589621316382-008455b857cd?w=400&q=80', category: 'vegetables' },
  { id: 'capsicum', name: 'Green Capsicum', price: 42.00, size: '500 GM', image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&q=80', category: 'vegetables' },
  { id: 'broccoli', name: 'Fresh Broccoli', price: 55.00, size: '500 GM', image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&q=80', category: 'vegetables' },
  { id: 'beans', name: 'Green Beans', price: 40.00, size: '500 GM', image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400&q=80', category: 'vegetables' },
  { id: 'beetroot', name: 'Fresh Beetroot', price: 44.00, size: '500 GM', image: 'https://images.unsplash.com/photo-1599807875674-4982d8223b92?w=400&q=80', category: 'vegetables' },
  { id: 'peas', name: 'Green Peas', price: 50.00, size: '500 GM', image: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=400&q=80', category: 'vegetables' },
  { id: 'eggplant', name: 'Eggplant (Brinjal)', price: 38.00, size: '500 GM', image: 'https://images.unsplash.com/photo-1618643824458-a4949a609b10?w=400&q=80', category: 'vegetables' },
  { id: 'okra', name: 'Okra (Ladyfinger)', price: 45.00, size: '500 GM', image: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400&q=80', category: 'vegetables' },
  { id: 'radish', name: 'White Radish', price: 30.00, size: '500 GM', image: 'https://images.unsplash.com/photo-1616684398170-1155566a6c87?w=400&q=80', category: 'vegetables' },
  { id: 'lettuce', name: 'Fresh Lettuce', price: 35.00, size: '1 PC', image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400&q=80', category: 'vegetables' },
  { id: 'mushroom', name: 'Button Mushroom', price: 80.00, size: '200 GM', image: 'https://images.unsplash.com/photo-1565969190283-48f9fad28f49?w=400&q=80', category: 'vegetables' },
  { id: 'pumpkin', name: 'Fresh Pumpkin', price: 38.00, size: '1 KG', image: 'https://images.unsplash.com/photo-1570586437263-ab629fccc818?w=400&q=80', category: 'vegetables' },
  { id: 'corn', name: 'Sweet Corn', price: 50.00, size: '2 PCS', image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&q=80', category: 'vegetables' },
]

export default function Vegetables() {
  const [liveProducts, setLiveProducts] = useState([])
  const router = useRouter()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/products`)
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        const data = await response.json()
        console.log('[Vegetables] Fetched products from API:', data.length || 0, 'items')
        setLiveProducts(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('[Vegetables] Failed to fetch products:', error)
        setLiveProducts([])
      }
    }

    fetchProducts()
  }, [])

  const mergedProducts = useMemo(() => {
    const seen = new Set()
    const merged = []

    // First add live products filtered by category
    liveProducts.forEach((product) => {
      const category = normalizeCategoryName(product.category || '')
      if (category === 'vegetables' || category === 'vegetable') {
        const normalizedName = normalizeProductName(product.name)
        if (normalizedName && !seen.has(normalizedName)) {
          merged.push(product)
          seen.add(normalizedName)
        }
      }
    })

    // Then add static products not yet included
    staticProducts.forEach((product) => {
      const normalizedName = normalizeProductName(product.name)
      if (!seen.has(normalizedName)) {
        merged.push(product)
        seen.add(normalizedName)
      }
    })

    return merged
  }, [liveProducts])

  return (
    <ShopLayout>
      <CategoryPage
        title="Fresh Vegetables"
        description="Farm-fresh vegetables delivered to your doorstep"
        category="Vegetables"
        products={mergedProducts}
      />
    </ShopLayout>
  )
}
