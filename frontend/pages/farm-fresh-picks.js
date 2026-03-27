import ShopLayout from '../components/ShopLayout'
import CategoryPage from '../components/CategoryPage'

const products = [
  {
    id: 'farm-fresh-veg-combo',
    name: 'Farm Fresh Veg Combo',
    price: 199.0,
    size: '2 KG',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600',
    description: 'Seasonal vegetable combo with the freshest picks.',
  },
  {
    id: 'organic-greens-box',
    name: 'Organic Greens Box',
    price: 149.0,
    size: '500 GM',
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600',
    description: 'Baby spinach, lettuce and herbs for salads.',
  },
  {
    id: 'local-radish-pack',
    name: 'Local Radish Pack',
    price: 69.0,
    size: '500 GM',
    image: 'https://images.unsplash.com/photo-1584306670957-99e1e9c3f64f?w=600',
    description: 'Crisp radishes with a peppery bite.',
  },
  {
    id: 'heirloom-tomatoes',
    name: 'Heirloom Tomatoes',
    price: 120.0,
    size: '500 GM',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600',
    description: 'Flavorful heirloom varieties for cooking.',
  },
  {
    id: 'organic-cucumber',
    name: 'Organic Cucumber',
    price: 85.0,
    size: '500 GM',
    image: 'https://images.unsplash.com/photo-1449339043519-7d3a95baf2d1?w=600',
    description: 'Crisp cucumbers, great for salads.',
  },
  {
    id: 'fresh-zucchini',
    name: 'Fresh Zucchini',
    price: 79.0,
    size: '500 GM',
    image: 'https://images.unsplash.com/photo-1592394933325-10d7559893b3?w=600',
    description: 'Tender zucchinis, perfect for grilling.',
  },
]

export default function FarmFreshPicks() {
  return (
    <ShopLayout>
      <CategoryPage
        title="Farm Fresh Picks"
        description="Picked daily from local farms for guaranteed freshness."
        category="Farm Fresh Picks"
        products={products}
      />
    </ShopLayout>
  )
}
