import { useState } from 'react'
import ShopLayout from '../../pages/components/ShopLayout'
import ProductCard from '../../pages/components/ProductCard'

const fruitProducts = [
  { name: 'Local Apples', price: 'Rs. 129.00', size: '1 KG', image: 'https://source.unsplash.com/800x800/?apple', description: 'Crisp apples harvested from nearby orchards.' , note: 'Seasonal' },
  { name: 'Farm Pears', price: 'Rs. 119.00', size: '1 KG', image: 'https://source.unsplash.com/800x800/?pear', description: 'Sweet and juicy pears, perfect for desserts.' , note: 'Limited stock' },
  { name: 'Banana Bunch', price: 'Rs. 49.00', size: '6 pcs', image: 'https://source.unsplash.com/800x800/?banana', description: 'Ripe bananas ideal for smoothies and snacks.' , note: 'High potassium' },
  { name: 'Local Grapes', price: 'Rs. 199.00', size: '500 GM', image: 'https://source.unsplash.com/800x800/?grapes', description: 'Fresh grapes with a natural sweet flavour.' , note: 'Wash before use' },
  { name: 'Seasonal Plums', price: 'Rs. 179.00', size: '500 GM', image: 'https://source.unsplash.com/800x800/?plum', description: 'Sweet-tart plums from local groves.' , note: 'Seasonal pick' },
  { name: 'Citrus Mix', price: 'Rs. 159.00', size: '1 KG', image: 'https://source.unsplash.com/800x800/?orange,lemon', description: 'Oranges and lemons packed for freshness.' , note: 'Vitamin C rich' },
]

export default function FarmFreshFruits() {
  const [qtys, setQtys] = useState(() => fruitProducts.map(() => 1))
  const changeQty = (index, delta) => setQtys((prev) => prev.map((q, i) => (i === index ? Math.max(1, q + delta) : q)))

  return (
    <ShopLayout>
      <main className="mangoPage">
        <section className="mangoGridSection">
          <div className="mangoGridHeader">
            <h2>Farm Fresh Fruits</h2>
            <p>Seasonal fruits straight from local orchards — flavorful and picked with care.</p>
          </div>

          <div className="mangoGrid">
            {fruitProducts.map((item, idx) => (
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
