import { useState } from 'react'
import ShopLayout from './components/ShopLayout'
import ProductCard from './components/ProductCard'

const importedFruits = [
  { name: 'Imported Avocados', price: 'Rs. 349.00', size: '4 pcs', image: 'https://source.unsplash.com/800x800/?avocado' },
  { name: 'Premium Blueberries', price: 'Rs. 399.00', size: '200 GM', image: 'https://source.unsplash.com/800x800/?blueberries' },
  { name: 'Sunrise Kiwi', price: 'Rs. 279.00', size: '6 pcs', image: 'https://source.unsplash.com/800x800/?kiwi' },
  { name: 'Dragonfruit Delight', price: 'Rs. 599.00', size: '2 pcs', image: 'https://source.unsplash.com/800x800/?dragonfruit' },
  { name: 'Golden Pears (Imported)', price: 'Rs. 249.00', size: '6 pcs', image: 'https://source.unsplash.com/800x800/?pears' },
  { name: 'Chilean Grapes', price: 'Rs. 329.00', size: '500 GM', image: 'https://source.unsplash.com/800x800/?grapes' },
]

export default function ImportedFruits() {
  const [qtys, setQtys] = useState(() => importedFruits.map(() => 1))
  const changeQty = (index, delta) => setQtys((prev) => prev.map((q, i) => (i === index ? Math.max(1, q + delta) : q)))

  return (
    <ShopLayout>
      <main className="mangoPage">
        <section className="mangoGridSection">
          <div className="mangoGridHeader">
            <h2>Imported Fruits</h2>
            <p>Hand-picked imported fruits delivered fresh.</p>
          </div>

          <div className="mangoGrid">
            {importedFruits.map((item, idx) => (
              <ProductCard
                key={item.name}
                name={item.name}
                price={item.price}
                size={item.size}
                image={item.image}
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
