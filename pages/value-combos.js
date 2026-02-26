import { useState } from 'react'
import ShopLayout from './components/ShopLayout'
import ProductCard from './components/ProductCard'

const valueCombos = [
  { name: 'Family Veg Combo', price: 'Rs. 399.00', size: '5 KG', image: 'https://source.unsplash.com/800x800/?vegetable,basket', description: 'Balanced selection of everyday vegetables for a family of 4.', note: 'Most popular' },
  { name: 'Breakfast Bundle', price: 'Rs. 249.00', size: 'Various', image: 'https://source.unsplash.com/800x800/?breakfast,food', description: 'Cereal, milk alternatives and fresh fruits to start your day.', note: 'Great for busy mornings' },
  { name: 'Protein Pack', price: 'Rs. 499.00', size: 'Mixed', image: 'https://source.unsplash.com/800x800/?nuts,protein', description: 'Nuts, pulses and protein-rich produce for active lifestyles.', note: 'High protein' },
  { name: 'Weekly Pantry Saver', price: 'Rs. 599.00', size: 'Assorted', image: 'https://source.unsplash.com/800x800/?pantry,groceries', description: 'Staples and essentials to last the week.', note: 'Pantry essentials' },
  { name: 'Veg + Fruit Combo', price: 'Rs. 449.00', size: 'Mixed', image: 'https://source.unsplash.com/800x800/?veg,fruit', description: 'A mix of fresh fruits and vegetables for balanced meals.', note: 'Balanced diet' },
  { name: 'Family Breakfast Pack', price: 'Rs. 349.00', size: 'Family Size', image: 'https://source.unsplash.com/800x800/?family,breakfast', description: 'Quick breakfast staples curated for families.', note: 'Ready to eat' },
]

export default function ValueCombos() {
  const [qtys, setQtys] = useState(() => valueCombos.map(() => 1))
  const changeQty = (index, delta) => setQtys((prev) => prev.map((q, i) => (i === index ? Math.max(1, q + delta) : q)))

  return (
    <ShopLayout>
      <main className="mangoPage">
        <section className="mangoGridSection">
          <div className="mangoGridHeader">
            <h2>Value Combos</h2>
            <p>Smart bundles to save money without compromising on quality.</p>
          </div>

          <div className="mangoGrid">
            {valueCombos.map((item, idx) => (
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
