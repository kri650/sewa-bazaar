import { useState } from 'react'
import ShopLayout from '../../pages/components/ShopLayout'
import ProductCard from '../../pages/components/ProductCard'

const vegProducts = [
  { name: 'Fresh Carrots (Local)', price: 'Rs. 59.00', size: '500 GM', image: 'https://source.unsplash.com/800x800/?carrot', description: 'Crunchy, farm-harvested carrots full of beta-carotene.' , note: 'From nearby farms'},
  { name: 'Green Beans', price: 'Rs. 79.00', size: '250 GM', image: 'https://source.unsplash.com/800x800/?green-beans', description: 'Tender beans picked at peak freshness.' , note: 'Best within 3 days'},
  { name: 'Organic Tomatoes', price: 'Rs. 89.00', size: '500 GM', image: 'https://source.unsplash.com/800x800/?tomato', description: 'Juicy, sun-ripened tomatoes from partner farms.' , note: 'No preservatives'},
  { name: 'Local Spinach Bunch', price: 'Rs. 49.00', size: '1 Bunch', image: 'https://source.unsplash.com/800x800/?spinach', description: 'Fresh leafy greens, high in iron.' , note: 'Wash before use'},
  { name: 'Potatoes (Farm)', price: 'Rs. 39.00', size: '1 KG', image: 'https://source.unsplash.com/800x800/?potato', description: 'Sturdy potatoes, perfect for everyday cooking.' , note: 'Store in cool dry place'},
  { name: 'Local Onions', price: 'Rs. 45.00', size: '1 KG', image: 'https://source.unsplash.com/800x800/?onion', description: 'Aromatic onions harvested this week.' , note: 'Keeps 2-3 weeks'},
]

export default function FarmFreshVegetables() {
  const [qtys, setQtys] = useState(() => vegProducts.map(() => 1))
  const changeQty = (index, delta) => setQtys((prev) => prev.map((q, i) => (i === index ? Math.max(1, q + delta) : q)))

  return (
    <ShopLayout>
      <main className="mangoPage">
        <section className="mangoGridSection">
          <div className="mangoGridHeader">
            <h2>Farm Fresh Vegetables</h2>
            <p>Picked daily from local farms — seasonal, fresh and carefully handled.</p>
          </div>

          <div className="mangoGrid">
            {vegProducts.map((item, idx) => (
              <ProductCard
                key={item.name}
                name={item.name}
                price={item.price}
                size={item.size}
                image={item.image}
                description={item.description}
                note={item.note}
                showQty={true}
                qty={qtys[idx]}
                onQtyChange={(delta) => changeQty(idx, delta)}
                onAdd={() => console.log('Add', item.name, qtys[idx])}
              />
            ))}
          </div>
        </section>
      </main>
    </ShopLayout>
  )
}
