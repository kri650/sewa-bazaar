import ShopLayout from '../components/ShopLayout'
import CategoryPage from '../components/CategoryPage'

const products = [
  {
    id: 'family-veg-combo',
    name: 'Family Veg Combo',
    price: 399.0,
    size: '5 KG',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600',
    description: 'Balanced selection of everyday vegetables for a family of 4.',
  },
  {
    id: 'breakfast-bundle',
    name: 'Breakfast Bundle',
    price: 249.0,
    size: 'Various',
    image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600',
    description: 'Cereal, milk alternatives and fresh fruits to start your day.',
  },
  {
    id: 'protein-pack',
    name: 'Protein Pack',
    price: 499.0,
    size: 'Mixed',
    image: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=600',
    description: 'Nuts, pulses and protein-rich produce for active lifestyles.',
  },
  {
    id: 'weekly-pantry-saver',
    name: 'Weekly Pantry Saver',
    price: 599.0,
    size: 'Assorted',
    image: 'https://images.unsplash.com/photo-1506484334406-382bec6a1574?w=600',
    description: 'Staples and essentials to last the week.',
  },
  {
    id: 'veg-fruit-combo',
    name: 'Veg + Fruit Combo',
    price: 449.0,
    size: 'Mixed',
    image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=600',
    description: 'A mix of fresh fruits and vegetables for balanced meals.',
  },
  {
    id: 'family-breakfast-pack',
    name: 'Family Breakfast Pack',
    price: 349.0,
    size: 'Family Size',
    image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=600',
    description: 'Quick breakfast staples curated for families.',
  },
]

export default function ValueCombos() {
  return (
    <ShopLayout>
      <CategoryPage
        title="Value Combos"
        description="Smart bundles designed to help you save while getting premium quality produce."
        category="Value Combos"
        products={products}
      />
    </ShopLayout>
  )
}
