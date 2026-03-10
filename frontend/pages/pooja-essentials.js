import ShopLayout from '../components/ShopLayout'
import CategoryPage from '../components/CategoryPage'
import { getProductsByCategory } from '../data/products'

const products = getProductsByCategory('Pooja Essentials')

/* Original products for reference:
const products_backup = [
  { id: 'incense-sticks', name: 'Fragrant Incense Sticks', price: 45.00, size: '100 GM', image: 'https://images.unsplash.com/photo-1609111769175-f92b45dc8e68?w=400&q=80' },
  { id: 'dhoop-sticks', name: 'Pure Dhoop Sticks', price: 50.00, size: '50 GM', image: 'https://images.unsplash.com/photo-1609111769175-f92b45dc8e68?w=400&q=80' },
  { id: 'camphor', name: 'Pure Camphor Tablets', price: 40.00, size: '100 GM', image: 'https://images.unsplash.com/photo-1545915143-8ff64e8dd8f2?w=400&q=80' },
  { id: 'cotton-wicks', name: 'Cotton Wicks (Batti)', price: 25.00, size: '100 PCS', image: 'https://images.unsplash.com/photo-1545915143-8ff64e8dd8f2?w=400&q=80' },
  { id: 'ghee-diya', name: 'Ghee Diya Set', price: 120.00, size: '12 PCS', image: 'https://images.unsplash.com/photo-1545915143-8ff64e8dd8f2?w=400&q=80' },
  { id: 'pooja-thali', name: 'Brass Pooja Thali', price: 450.00, size: '1 PC', image: 'https://images.unsplash.com/photo-1545915143-8ff64e8dd8f2?w=400&q=80' },
  { id: 'kumkum', name: 'Pure Kumkum Powder', price: 30.00, size: '50 GM', image: 'https://images.unsplash.com/photo-1609111769175-f92b45dc8e68?w=400&q=80' },
  { id: 'chandan-powder', name: 'Sandalwood (Chandan) Powder', price: 85.00, size: '50 GM', image: 'https://images.unsplash.com/photo-1609111769175-f92b45dc8e68?w=400&q=80' },
  { id: 'pooja-oil', name: 'Pooja Lamp Oil', price: 60.00, size: '500 ML', image: 'https://images.unsplash.com/photo-1545915143-8ff64e8dd8f2?w=400&q=80' },
  { id: 'agarbatti-pack', name: 'Premium Agarbatti Pack', price: 120.00, size: '200 GM', image: 'https://images.unsplash.com/photo-1609111769175-f92b45dc8e68?w=400&q=80' },
  { id: 'brass-diya', name: 'Traditional Brass Diya', price: 80.00, size: '1 PC', image: 'https://images.unsplash.com/photo-1545915143-8ff64e8dd8f2?w=400&q=80' },
  { id: 'puja-bell', name: 'Brass Pooja Bell', price: 150.00, size: '1 PC', image: 'https://images.unsplash.com/photo-1545915143-8ff64e8dd8f2?w=400&q=80' },
  { id: 'rudraksha-mala', name: 'Rudraksha Mala', price: 320.00, size: '1 PC', image: 'https://images.unsplash.com/photo-1609111769175-f92b45dc8e68?w=400&q=80' },
  { id: 'hawan-samagri', name: 'Hawan Samagri Mix', price: 75.00, size: '200 GM', image: 'https://images.unsplash.com/photo-1545915143-8ff64e8dd8f2?w=400&q=80' },
  { id: 'pooja-flowers-pack', name: 'Fresh Pooja Flowers', price: 40.00, size: '100 GM', image: 'https://images.unsplash.com/photo-1609111769175-f92b45dc8e68?w=400&q=80' },
  { id: 'pooja-cloth', name: 'Silk Pooja Cloth', price: 180.00, size: '1 PC', image: 'https://images.unsplash.com/photo-1545915143-8ff64e8dd8f2?w=400&q=80' },
  { id: 'puja-kit', name: 'Complete Puja Kit', price: 550.00, size: '1 SET', image: 'https://images.unsplash.com/photo-1545915143-8ff64e8dd8f2?w=400&q=80' },
  { id: 'temple-oil', name: 'Temple Lamp Oil', price: 80.00, size: '1 L', image: 'https://images.unsplash.com/photo-1545915143-8ff64e8dd8f2?w=400&q=80' },
  { id: 'matchbox-pack', name: 'Safety Matchbox (10 Pack)', price: 35.00, size: '10 PCS', image: 'https://images.unsplash.com/photo-1609111769175-f92b45dc8e68?w=400&q=80' },
  { id: 'holy-water-bottle', name: 'Ganga Jal (Holy Water)', price: 50.00, size: '500 ML', image: 'https://images.unsplash.com/photo-1545915143-8ff64e8dd8f2?w=400&q=80' },
]
*/

export default function PoojaEssentials() {
  return (
    <ShopLayout>
      <CategoryPage
        title="Pooja Essentials"
        description="Divine offerings and religious essentials"
        category="Pooja Essentials"
        products={products}
      />
    </ShopLayout>
  )
}
