import { useState } from 'react'
import ShopLayout from './components/ShopLayout'
import ProductCard from './components/ProductCard'

const farmFreshProducts = [
  { name: 'Farm Fresh Veg Combo', price: 'Rs. 199.00', size: '2 KG', image: 'https://source.unsplash.com/800x800/?vegetables,market', description: 'Seasonal vegetable combo with the freshest picks.' , note: 'Picked today' },
  { name: 'Organic Greens Box', price: 'Rs. 149.00', size: '500 GM', image: 'https://source.unsplash.com/800x800/?leafy,greens', description: 'Baby spinach, lettuce and herbs for salads.' , note: 'Locally grown' },
  { name: 'Local Radish Pack', price: 'Rs. 69.00', size: '500 GM', image: 'https://source.unsplash.com/800x800/?radish', description: 'Crisp radishes with a peppery bite.' , note: 'Small-batched' },
  { name: 'Heirloom Tomatoes', price: 'Rs. 120.00', size: '500 GM', image: 'https://source.unsplash.com/800x800/?tomato', description: 'Flavorful heirloom varieties for cooking.' , note: 'Seasonal' },
  { name: 'Organic Cucumber', price: 'Rs. 85.00', size: '500 GM', image: 'https://source.unsplash.com/800x800/?cucumber', description: 'Crisp cucumbers, great for salads.' , note: 'Crisp & cool' },
  { name: 'Fresh Zucchini', price: 'Rs. 79.00', size: '500 GM', image: 'https://source.unsplash.com/800x800/?zucchini', description: 'Tender zucchinis, perfect for grilling.' , note: 'Farm harvest' },
]

export default function FarmFreshPicks() {
  const [qtys, setQtys] = useState(() => farmFreshProducts.map(() => 1))
  const changeQty = (index, delta) => setQtys((prev) => prev.map((q, i) => (i === index ? Math.max(1, q + delta) : q)))

  return (
    <ShopLayout>
      <main className="mangoPage">
        <section className="mangoGridSection">
          <div className="mangoGridHeader">
            <h2>Farm Fresh Picks</h2>
            <p>Picked daily from local farms — freshness guaranteed.</p>
            <p style={{ marginTop: 10 }}>
              Explore: <a href="/farm-fresh-picks/vegetables">Vegetables</a> · <a href="/farm-fresh-picks/fruits">Fruits</a>
            </p>
          </div>

          <div className="mangoGrid">
            {farmFreshProducts.map((item, idx) => (
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
