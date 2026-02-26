import { useState } from 'react'
import ShopLayout from './components/ShopLayout'
import ProductCard from './components/ProductCard'

const organicSpecials = [
  { name: 'Organic Honey Jar', price: 'Rs. 299.00', size: '250 GM', image: 'https://source.unsplash.com/800x800/?honey' },
  { name: 'Cold-Pressed Oil', price: 'Rs. 399.00', size: '500 ML', image: 'https://source.unsplash.com/800x800/?oil' },
  { name: 'Handmade Organic Soap', price: 'Rs. 99.00', size: '100 GM', image: 'https://source.unsplash.com/800x800/?soap' },
  { name: 'Organic Jaggery', price: 'Rs. 89.00', size: '250 GM', image: 'https://source.unsplash.com/800x800/?jaggery' },
]

export default function OrganicSpecials() {
  const [qtys, setQtys] = useState(() => organicSpecials.map(() => 1))
  const changeQty = (index, delta) => setQtys((prev) => prev.map((q, i) => (i === index ? Math.max(1, q + delta) : q)))

  return (
    <ShopLayout>
      <main className="mangoPage">
        <section className="mangoGridSection">
          <div className="mangoGridHeader">
            <h2>Organic Specials</h2>
            <p>Curated speciality items for a healthier pantry.</p>
          </div>

          <div className="mangoGrid">
            {organicSpecials.map((item, idx) => (
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
