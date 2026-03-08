import ShopLayout from '../components/ShopLayout'
import CategoryPage from '../components/CategoryPage'
import { getProductsByCategory } from '../data/products'

const products = getProductsByCategory('Milk & Dairy')

/* Original products for reference:
const products_backup = [
  { id: 'milk', name: 'Fresh Milk', price: 55.00, size: '1 L', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80' },
  { id: 'toned-milk', name: 'Toned Milk', price: 52.00, size: '1 L', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80' },
  { id: 'full-cream-milk', name: 'Full Cream Milk', price: 60.00, size: '1 L', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80' },
  { id: 'butter', name: 'Unsalted Butter', price: 95.00, size: '200 GM', image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80' },
  { id: 'paneer', name: 'Fresh Paneer', price: 85.00, size: '200 GM', image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80' },
  { id: 'cheese-slices', name: 'Cheese Slices', price: 120.00, size: '200 GM', image: 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=400&q=80' },
  { id: 'cheese-block', name: 'Cheddar Cheese Block', price: 240.00, size: '500 GM', image: 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=400&q=80' },
  { id: 'curd', name: 'Fresh Curd', price: 40.00, size: '500 GM', image: 'https://images.unsplash.com/photo-1625937286074-9ca519d5d9df?w=400&q=80' },
  { id: 'yogurt', name: 'Greek Yogurt', price: 60.00, size: '400 GM', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80' },
  { id: 'lassi', name: 'Sweet Lassi', price: 35.00, size: '200 ML', image: 'https://images.unsplash.com/photo-1625937286074-9ca519d5d9df?w=400&q=80' },
  { id: 'buttermilk', name: 'Fresh Buttermilk', price: 25.00, size: '500 ML', image: 'https://images.unsplash.com/photo-1625937286074-9ca519d5d9df?w=400&q=80' },
  { id: 'cream', name: 'Fresh Cream', price: 70.00, size: '250 ML', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&q=80' },
  { id: 'condensed-milk', name: 'Condensed Milk', price: 85.00, size: '400 GM', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80' },
  { id: 'milk-powder', name: 'Milk Powder', price: 320.00, size: '1 KG', image: 'https://images.unsplash.com/photo-1628618412999-11e3bc0b31d4?w=400&q=80' },
  { id: 'flavoured-milk', name: 'Chocolate Flavoured Milk', price: 30.00, size: '200 ML', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80' },
  { id: 'greek-yogurt', name: 'Premium Greek Yogurt', price: 75.00, size: '400 GM', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80' },
  { id: 'cheese-spread', name: 'Cream Cheese Spread', price: 110.00, size: '200 GM', image: 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=400&q=80' },
  { id: 'mozzarella-cheese', name: 'Mozzarella Cheese', price: 180.00, size: '200 GM', image: 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=400&q=80' },
  { id: 'dairy-whitener', name: 'Dairy Whitener', price: 280.00, size: '1 KG', image: 'https://images.unsplash.com/photo-1628618412999-11e3bc0b31d4?w=400&q=80' },
  { id: 'fresh-cream-whip', name: 'Fresh Whipping Cream', price: 95.00, size: '250 ML', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&q=80' },
]*/
export default function MilkDairy() {
  return (
    <ShopLayout>
      <CategoryPage
        title="Milk & Dairy"
        description="Fresh milk and dairy products delivered daily"
        category="Milk & Dairy"
        products={products}
      />
    </ShopLayout>
  )
}
