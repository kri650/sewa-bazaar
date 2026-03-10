import ShopLayout from '../components/ShopLayout'
import CategoryPage from '../components/CategoryPage'
import { getProductsByCategory } from '../data/products'

const products = getProductsByCategory('Chips & Biscuits')

/* Original products for reference:
const products_backup = [
  { id: 'potato-chips', name: 'Salted Potato Chips', price: 20.00, size: '50 GM', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80' },
  { id: 'nachos', name: 'Cheese Nachos', price: 35.00, size: '100 GM', image: 'https://images.unsplash.com/photo-1613919113640-25732ec5e61f?w=400&q=80' },
  { id: 'cream-biscuits', name: 'Cream Biscuits', price: 30.00, size: '100 GM', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80' },
  { id: 'chocolate-biscuits', name: 'Chocolate Biscuits', price: 40.00, size: '150 GM', image: 'https://images.unsplash.com/photo-1548365328-8c6db3220e4c?w=400&q=80' },
  { id: 'butter-cookies', name: 'Butter Cookies', price: 55.00, size: '200 GM', image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&q=80' },
  { id: 'oat-biscuits', name: 'Healthy Oat Biscuits', price: 45.00, size: '150 GM', image: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=400&q=80' },
  { id: 'salted-chips', name: 'Plain Salted Chips', price: 20.00, size: '50 GM', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80' },
  { id: 'banana-chips', name: 'Crispy Banana Chips', price: 30.00, size: '100 GM', image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&q=80' },
  { id: 'masala-chips', name: 'Spicy Masala Chips', price: 20.00, size: '50 GM', image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&q=80' },
  { id: 'crackers', name: 'Salted Crackers', price: 40.00, size: '150 GM', image: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=400&q=80' },
  { id: 'digestive-biscuits', name: 'Digestive Biscuits', price: 45.00, size: '200 GM', image: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=400&q=80' },
  { id: 'marie-biscuits', name: 'Classic Marie Biscuits', price: 25.00, size: '100 GM', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80' },
  { id: 'chocolate-cookies', name: 'Choco Chip Cookies', price: 60.00, size: '150 GM', image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&q=80' },
  { id: 'wafer-rolls', name: 'Chocolate Wafer Rolls', price: 35.00, size: '100 GM', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80' },
  { id: 'snack-mix', name: 'Assorted Snack Mix', price: 50.00, size: '200 GM', image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&q=80' },
  { id: 'cheese-balls', name: 'Cheese Balls', price: 30.00, size: '100 GM', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80' },
  { id: 'corn-chips', name: 'Corn Chips', price: 30.00, size: '100 GM', image: 'https://images.unsplash.com/photo-1613919113640-25732ec5e61f?w=400&q=80' },
  { id: 'sandwich-biscuits', name: 'Cream Sandwich Biscuits', price: 35.00, size: '120 GM', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80' },
  { id: 'peanut-snacks', name: 'Roasted Peanut Snacks', price: 40.00, size: '150 GM', image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&q=80' },
  { id: 'potato-wafers', name: 'Crispy Potato Wafers', price: 25.00, size: '75 GM', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80' },
]*/
export default function ChipsBiscuits() {
  return (
    <ShopLayout>
      <CategoryPage
        title="Chips & Biscuits"
        description="Tasty snacks and treats for every occasion"
        category="Chips & Biscuits"
        products={products}
      />
    </ShopLayout>
  )
}
