import { useState } from 'react'
import ShopLayout from './components/ShopLayout'
import ProductCard from './components/ProductCard'

const fruitBaskets = [
  { name: 'Celebration Classic Basket', price: 'Rs. 749.00', size: 'Assorted (6-8 pcs)', image: 'https://source.unsplash.com/800x800/?fruit,basket,gift', description: 'A festive selection of seasonal fruits wrapped in a decorative box.', note: 'Free gift wrap available' },
  { name: 'Birthday Deluxe Basket', price: 'Rs. 999.00', size: 'Premium (8-10 pcs)', image: 'https://source.unsplash.com/800x800/?birthday,fruit,basket', description: 'Premium fruits with a complimentary greeting card.', note: 'Same-day delivery eligible' },
  { name: 'Corporate Assorted Basket', price: 'Rs. 1299.00', size: 'Large', image: 'https://source.unsplash.com/800x800/?corporate,gift,basket', description: 'Elegant assortment for corporate gifting, individually packed.', note: 'Invoicing available' },
  { name: 'Newborn Welcome Basket', price: 'Rs. 649.00', size: 'Small', image: 'https://source.unsplash.com/800x800/?newborn,gift', description: 'Soft selection of gentle fruits suitable for newborn households.', note: 'Includes a small congratulatory card' },
  { name: 'Healthy Snack Basket', price: 'Rs. 549.00', size: 'Assorted Snacks', image: 'https://source.unsplash.com/800x800/?healthy,snacks,basket', description: 'Mixed dried fruits and healthy snacks for on-the-go.', note: 'Perfect for office snacking' },
  { name: 'Premium Tropical Basket', price: 'Rs. 1199.00', size: 'Tropical Selection', image: 'https://source.unsplash.com/800x800/?tropical,fruits,basket', description: 'Exotic tropical fruits sourced from trusted farms.', note: 'Limited stock — seasonal' },
]

export default function FruitBaskets() {
  const [qtys, setQtys] = useState(() => fruitBaskets.map(() => 1))
  const changeQty = (index, delta) => setQtys((prev) => prev.map((q, i) => (i === index ? Math.max(1, q + delta) : q)))

  return (
    <ShopLayout>
      <main className="mangoPage">
        <section className="mangoGridSection">
          <div className="mangoGridHeader">
            <h2>Gift & Celebration Baskets</h2>
            <p>Curated baskets for birthdays, anniversaries, corporate gifting and special occasions — beautifully packed and ready to present.</p>
          </div>

          <div className="mangoGrid">
            {fruitBaskets.map((item, idx) => (
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
