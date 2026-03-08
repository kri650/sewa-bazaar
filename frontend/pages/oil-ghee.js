import ShopLayout from '../components/ShopLayout'
import CategoryPage from '../components/CategoryPage'
import { getProductsByCategory } from '../data/products'

const products = getProductsByCategory('Oil & Ghee')

/* Original products for reference:
const products_backup = [
  { id: 'mustard-oil', name: 'Pure Mustard Oil', price: 180.00, size: '1 L', image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&q=80' },
  { id: 'sunflower-oil', name: 'Sunflower Oil', price: 220.00, size: '1 L', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80' },
  { id: 'olive-oil', name: 'Extra Virgin Olive Oil', price: 650.00, size: '500 ML', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80' },
  { id: 'coconut-oil', name: 'Pure Coconut Oil', price: 240.00, size: '1 L', image: 'https://images.unsplash.com/photo-1598579501842-365ecdf60d72?w=400&q=80' },
  { id: 'groundnut-oil', name: 'Groundnut Oil', price: 200.00, size: '1 L', image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&q=80' },
  { id: 'rice-bran-oil', name: 'Rice Bran Oil', price: 190.00, size: '1 L', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80' },
  { id: 'sesame-oil', name: 'Cold Pressed Sesame Oil', price: 280.00, size: '500 ML', image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&q=80' },
  { id: 'cow-ghee', name: 'Pure Cow Ghee', price: 580.00, size: '1 L', image: 'https://images.unsplash.com/photo-1628408804046-b1a0ba0c48d7?w=400&q=80' },
  { id: 'buffalo-ghee', name: 'Buffalo Ghee', price: 520.00, size: '1 L', image: 'https://images.unsplash.com/photo-1628408804046-b1a0ba0c48d7?w=400&q=80' },
  { id: 'organic-ghee', name: 'Organic Cow Ghee', price: 720.00, size: '1 L', image: 'https://images.unsplash.com/photo-1628408804046-b1a0ba0c48d7?w=400&q=80' },
  { id: 'refined-oil', name: 'Refined Cooking Oil', price: 160.00, size: '1 L', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80' },
  { id: 'cold-pressed-oil', name: 'Cold Pressed Mustard Oil', price: 220.00, size: '1 L', image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&q=80' },
  { id: 'cooking-oil-combo', name: 'Cooking Oil Combo Pack', price: 380.00, size: '2 L', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80' },
  { id: 'pure-desi-ghee', name: 'Pure Desi Ghee', price: 550.00, size: '1 L', image: 'https://images.unsplash.com/photo-1628408804046-b1a0ba0c48d7?w=400&q=80' },
  { id: 'premium-olive-oil', name: 'Premium Olive Oil', price: 580.00, size: '500 ML', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80' },
  { id: 'extra-virgin-olive', name: 'Italian Extra Virgin Olive Oil', price: 750.00, size: '500 ML', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80' },
  { id: 'palm-oil', name: 'Palm Oil', price: 140.00, size: '1 L', image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&q=80' },
  { id: 'vegetable-oil', name: 'Vegetable Cooking Oil', price: 150.00, size: '1 L', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80' },
  { id: 'herbal-oil', name: 'Herbal Hair Oil', price: 120.00, size: '200 ML', image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&q=80' },
  { id: 'cooking-oil-pack', name: 'Family Cooking Oil Pack', price: 450.00, size: '5 L', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80' },
]*/
export default function OilGhee() {
  return (
    <ShopLayout>
      <CategoryPage
        title="Oil & Ghee"
        description="Pure and natural cooking oils and ghee"
        category="Oil & Ghee"
        products={products}
      />
    </ShopLayout>
  )
}
