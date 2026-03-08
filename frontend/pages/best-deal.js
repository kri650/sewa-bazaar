import ShopLayout from '../components/ShopLayout'
import CategoryPage from '../components/CategoryPage'
import { getProductsByCategory } from '../data/products'

const products = getProductsByCategory('Best Deal')

/* Original products for reference:
const products_backup = [
  { id: 'deal-tomato', name: 'Fresh Tomato', price: 22.00, originalPrice: 32.00, size: '500 GM', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80', discount: '30% OFF' },
  { id: 'deal-basmati', name: 'Basmati Rice', price: 224.00, originalPrice: 320.00, size: '5 KG', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80', discount: '30% OFF' },
  { id: 'deal-mustard-oil', name: 'Pure Mustard Oil', price: 126.00, originalPrice: 180.00, size: '1 L', image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&q=80', discount: '30% OFF' },
  { id: 'deal-milk', name: 'Full Cream Milk', price: 42.00, originalPrice: 60.00, size: '1 L', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80', discount: '30% OFF' },
  { id: 'deal-potato-chips', name: 'Salted Potato Chips', price: 14.00, originalPrice: 20.00, size: '50 GM', image: 'https://cdn.grofers.com/da/cms-assets/cms/product/d659ecce-67a3-4092-b878-fd889f5faced.jpg', discount: '30% OFF' },
  { id: 'deal-body-wash', name: 'Moisturizing Body Wash', price: 126.00, originalPrice: 180.00, size: '200 ML', image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80', discount: '30% OFF' },
  { id: 'deal-detergent', name: 'Laundry Detergent Powder', price: 196.00, originalPrice: 280.00, size: '2 KG', image: 'https://m.media-amazon.com/images/I/71v+67aeZuL.jpg', discount: '30% OFF' },
  { id: 'deal-diapers', name: 'Baby Diapers (Medium)', price: 315.00, originalPrice: 450.00, size: '46 PCS', image: 'https://letsallter.com/cdn/shop/files/M-32_-Breeze-Diaper-Pants_128fa9f2-b756-4dcb-a598-3f4c4f3ec097.png?v=1770962187&width=2160', discount: '30% OFF' },
  { id: 'deal-incense', name: 'Fragrant Incense Sticks', price: 31.50, originalPrice: 45.00, size: '100 GM', image: 'https://images.unsplash.com/photo-1609111769175-f92b45dc8e68?w=400&q=80', discount: '30% OFF' },
  { id: 'deal-apple', name: 'Red Apple', price: 126.00, originalPrice: 180.00, size: '1 KG', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80', discount: '30% OFF' },
  { id: 'deal-oats', name: 'Rolled Oats', price: 112.00, originalPrice: 160.00, size: '1 KG', image: 'https://images.unsplash.com/photo-1574635162616-e3b0c2e8b9d9?w=400&q=80', discount: '30% OFF' },
  { id: 'deal-ghee', name: 'Pure Cow Ghee', price: 406.00, originalPrice: 580.00, size: '1 L', image: 'https://images.unsplash.com/photo-1628408804046-b1a0ba0c48d7?w=400&q=80', discount: '30% OFF' },
  { id: 'deal-paneer', name: 'Fresh Paneer', price: 59.50, originalPrice: 85.00, size: '200 GM', image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80', discount: '30% OFF' },
  { id: 'deal-cookies', name: 'Choco Chip Cookies', price: 42.00, originalPrice: 60.00, size: '150 GM', image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&q=80', discount: '30% OFF' },
  { id: 'deal-shampoo', name: 'Natural Hair Shampoo', price: 175.00, originalPrice: 250.00, size: '200 ML', image: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=400&q=80', discount: '30% OFF' },
  { id: 'deal-floor-cleaner', name: 'Floor Cleaner Liquid', price: 112.00, originalPrice: 160.00, size: '1 L', image: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=400&q=80', discount: '30% OFF' },
  { id: 'deal-baby-lotion', name: 'Baby Body Lotion', price: 126.00, originalPrice: 180.00, size: '200 ML', image: 'https://images.unsplash.com/photo-1607748851746-0eecef527761?w=400&q=80', discount: '30% OFF' },
  { id: 'deal-camphor', name: 'Pure Camphor Tablets', price: 28.00, originalPrice: 40.00, size: '100 GM', image: 'https://images.unsplash.com/photo-1545915143-8ff64e8dd8f2?w=400&q=80', discount: '30% OFF' },
  { id: 'deal-onion', name: 'Red Onion', price: 36.40, originalPrice: 52.00, size: '1 KG', image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&q=80', discount: '30% OFF' },
  { id: 'deal-wheat-flour', name: 'Whole Wheat Flour', price: 196.00, originalPrice: 280.00, size: '5 KG', image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80', discount: '30% OFF' },
]
*/

export default function BestDeal() {
  return (
    <ShopLayout>
      <div className="bestDealBanner" aria-hidden="true">
        <img
          src="/hero/best-deal-banner.jpeg"
          alt=""
          className="bestDealBannerImg"
        />
      </div>
      <div className="bestDealSection">
        <CategoryPage
          title="Best Deal"
          description="Discover amazing deals on your favorite grocery items - All products at 30% OFF!"
          category="Best Deal"
          products={products}
        />
      </div>

      <style jsx>{`
        .bestDealBanner {
          width: 100vw;
          margin-left: calc(50% - 50vw);
          margin-right: calc(50% - 50vw);
          margin-bottom: 24px;
        }

        .bestDealBannerImg {
          width: 100%;
          height: auto;
          display: block;
          object-fit: cover;
        }

        .bestDealSection {
          margin-top: clamp(-28px, -3vw, -16px);
        }
      `}</style>
    </ShopLayout>
  )
}
