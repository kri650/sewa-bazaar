const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const path = require('path')

// Try to load product data from disk; fallback to small in-memory list
let products = []
try {
  products = require('./data/products.json')
} catch (e) {
  products = [
    { id: 1, name: 'Organic Apples', price: 3.99, image: 'https://source.unsplash.com/800x800/?apple' },
    { id: 2, name: 'Organic Honey', price: 9.5, image: 'https://source.unsplash.com/800x800/?honey' },
    { id: 3, name: 'Organic Olive Oil', price: 12.0, image: 'https://source.unsplash.com/800x800/?olive-oil' }
  ]
}

const app = express()
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }))

app.get('/products', (req, res) => res.json(products))

app.get('/products/:id', (req, res) => {
  const id = req.params.id
  const item = products.find((p) => String(p.id) === String(id))
  if (!item) return res.status(404).json({ error: 'product not found' })
  res.json(item)
})

app.post('/orders', (req, res) => {
  const { items, customer } = req.body || {}
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'items required' })

  const orderItems = items.map((it) => {
    const prod = products.find((p) => String(p.id) === String(it.id))
    return {
      id: it.id,
      name: prod ? prod.name : 'Unknown',
      qty: it.qty || 1,
      price: prod ? prod.price : 0,
    }
  })

  const order = {
    id: `ord_${Date.now()}`,
    createdAt: new Date().toISOString(),
    items: orderItems,
    customer: customer || null,
    total: orderItems.reduce((s, i) => s + (Number(i.price) || 0) * i.qty, 0),
  }

  res.status(201).json(order)
})

// Serve static public assets if present
const publicDir = path.join(__dirname, 'public')
app.use('/static', express.static(publicDir))

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`organic-backend listening on http://localhost:${PORT}`))

module.exports = app
