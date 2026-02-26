import { useState } from 'react'
import ShopLayout from '../components/ShopLayout'
import ProductCard from '../components/ProductCard'

const exoticProducts = [
  { name: 'Rambutan Pack', price: 'Rs. 499.00', size: '500 GM', image: 'https://source.unsplash.com/800x800/?rambutan', description: 'Tropical rambutan with juicy flesh.', note: 'Imported variety' },
  { name: 'Lychee Box', price: 'Rs. 549.00', size: '500 GM', image: 'https://source.unsplash.com/800x800/?lychee', description: 'Sweet and fragrant lychees.', note: 'Seasonal limited' },
  { name: 'Mangosteen', price: 'Rs. 699.00', size: '500 GM', image: 'https://source.unsplash.com/800x800/?mangosteen', description: 'Exotic mangosteen with delicate tang.', note: 'Premium' },
  { name: 'Longan', price: 'Rs. 429.00', size: '500 GM', image: 'https://source.unsplash.com/800x800/?longan', description: 'Sweet longan bites, great for snacking.', note: 'Fresh arrival' },
  { name: 'Passion Fruit', price: 'Rs. 179.00', size: '6 pcs', image: 'https://source.unsplash.com/800x800/?passionfruit', description: 'Tart and aromatic passion fruit.', note: 'Use within 3 days' },
  { name: 'Starfruit (Carambola)', price: 'Rs. 229.00', size: '4 pcs', image: 'https://source.unsplash.com/800x800/?starfruit', description: 'Crunchy starfruit with a sweet-tart flavor.', note: 'Exotic pick' },
]

export default function ExoticFruits() {
  const [qtys, setQtys] = useState(() => exoticProducts.map(() => 1))
  const changeQty = (index, delta) => setQtys((prev) => prev.map((q, i) => (i === index ? Math.max(1, q + delta) : q)))

  return (
    <ShopLayout>
      <main className="mangoPage">
        <section className="mangoGridSection">
          <div className="mangoGridHeader">
            <h2>Exotic Fruits</h2>
            <p>Handpicked exotic fruits sourced from reliable growers — try something different.</p>
          </div>

          <div className="mangoGrid">
            {exoticProducts.map((item, idx) => (
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

