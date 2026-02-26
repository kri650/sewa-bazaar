import { useState } from 'react'
import ShopLayout from '../components/ShopLayout'
import ProductCard from '../components/ProductCard'

const mangoProducts = [
  {
    name: 'Premium Alphonso Mango',
    price: 'Rs. 320.00',
    size: '1 KG',
    image: 'https://unsplash.com/photos/vxtBBfMTMZ0/download?force=true',
    badge: 'Seasonal',
  },
  {
    name: 'Golden Mango Box',
    price: 'Rs. 599.00',
    size: '2 KG',
    image: 'https://unsplash.com/photos/7iLlgS5o09c/download?force=true',
  },
  {
    name: 'Farm Fresh Mangoes',
    price: 'Rs. 210.00',
    size: '1 KG',
    image: 'https://source.unsplash.com/800x800/?mango,fruit',
  },
  {
    name: 'Mango Dessert Pack',
    price: 'Rs. 260.00',
    size: '1 KG',
    image: 'https://source.unsplash.com/800x800/?mango-slice',
  },
  {
    name: 'Organic Mango Box',
    price: 'Rs. 389.00',
    size: '1.5 KG',
    image: 'https://source.unsplash.com/800x800/?mangoes',
  },
  {
    name: 'Sweet Mango Basket',
    price: 'Rs. 449.00',
    size: '2 KG',
    image: 'https://source.unsplash.com/800x800/?mango,basket',
  },
]

export default function MangoesPage() {
  const [qtys, setQtys] = useState(() => mangoProducts.map(() => 1))

  const changeQty = (index, delta) => {
    setQtys((prev) => prev.map((q, i) => (i === index ? Math.max(1, q + delta) : q)))
  }

  return (
    <ShopLayout>
      <main className="mangoPage">

      <section className="mangoGridSection">
        <div className="mangoGridHeader">
          <h2>Fruits — Mangoes</h2>
          <p>Fresh, juicy, and farm-direct mango varieties.</p>
        </div>

        <div className="mangoGrid">
          {mangoProducts.map((item, idx) => (
            <ProductCard
              key={item.name}
              name={item.name}
              price={item.price}
              size={item.size}
              image={item.image}
              badge={item.badge}
              showQty={true}
              qty={qtys[idx]}
              onQtyChange={(delta) => changeQty(idx, delta)}
              onAdd={() => console.log('Add to cart', item.name, qtys[idx])}
            />
          ))}
        </div>
      </section>
      </main>
    </ShopLayout>
  )
}
