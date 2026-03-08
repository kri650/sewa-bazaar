import ShopLayout from '../components/ShopLayout'
import CategoryPage from '../components/CategoryPage'
import { getProductsByCategory } from '../data/products'

const products = getProductsByCategory('Bath & Body')

/* Original products for reference:
const products_backup = [
  { id: 'body-wash', name: 'Moisturizing Body Wash', price: 180.00, size: '200 ML', image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80' },
  { id: 'soap-bar', name: 'Herbal Soap Bar', price: 35.00, size: '125 GM', image: 'https://images.unsplash.com/photo-1588016687299-78d294688293?w=400&q=80' },
  { id: 'face-wash', name: 'Deep Cleansing Face Wash', price: 150.00, size: '100 ML', image: 'https://images.unsplash.com/photo-1556228841-a462d9f4e322?w=400&q=80' },
  { id: 'body-lotion', name: 'Nourishing Body Lotion', price: 200.00, size: '200 ML', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80' },
  { id: 'hand-wash', name: 'Liquid Hand Wash', price: 120.00, size: '250 ML', image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80' },
  { id: 'shampoo', name: 'Natural Hair Shampoo', price: 250.00, size: '200 ML', image: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=400&q=80' },
  { id: 'conditioner', name: 'Hair Conditioner', price: 220.00, size: '200 ML', image: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=400&q=80' },
  { id: 'shower-gel', name: 'Refreshing Shower Gel', price: 220.00, size: '250 ML', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80' },
  { id: 'bath-soap-pack', name: 'Bath Soap Pack (3 pcs)', price: 90.00, size: '375 GM', image: 'https://images.unsplash.com/photo-1588016687299-78d294688293?w=400&q=80' },
  { id: 'herbal-soap', name: 'Ayurvedic Herbal Soap', price: 45.00, size: '125 GM', image: 'https://images.unsplash.com/photo-1588016687299-78d294688293?w=400&q=80' },
  { id: 'moisturizer', name: 'Daily Moisturizer Cream', price: 280.00, size: '100 GM', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80' },
  { id: 'face-cleanser', name: 'Gentle Face Cleanser', price: 160.00, size: '150 ML', image: 'https://images.unsplash.com/photo-1556228841-a462d9f4e322?w=400&q=80' },
  { id: 'body-scrub', name: 'Exfoliating Body Scrub', price: 320.00, size: '200 GM', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80' },
  { id: 'bath-oil', name: 'Aromatherapy Bath Oil', price: 380.00, size: '100 ML', image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80' },
  { id: 'charcoal-soap', name: 'Activated Charcoal Soap', price: 55.00, size: '125 GM', image: 'https://images.unsplash.com/photo-1588016687299-78d294688293?w=400&q=80' },
  { id: 'aloe-vera-gel', name: 'Pure Aloe Vera Gel', price: 140.00, size: '200 GM', image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80' },
  { id: 'body-butter', name: 'Shea Body Butter', price: 420.00, size: '200 GM', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80' },
  { id: 'liquid-soap', name: 'Luxury Liquid Soap', price: 150.00, size: '250 ML', image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80' },
  { id: 'bath-kit', name: 'Complete Bath Care Kit', price: 650.00, size: '1 SET', image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80' },
  { id: 'skincare-set', name: 'Premium Skincare Set', price: 850.00, size: '1 SET', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80' },
]*/
export default function BathBody() {
  return (
    <ShopLayout>
      <CategoryPage
        title="Bath & Body"
        description="Personal care products for your daily routine"
        category="Bath & Body"
        products={products}
      />
    </ShopLayout>
  )
}
