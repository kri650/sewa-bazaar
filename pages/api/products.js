// Proxy to backend API during development. Update BASE_URL in production.
import axios from 'axios'

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:4000'

export default async function handler(req, res) {
  try {
    const r = await axios.get(`${BASE_URL}/products`)
    res.status(r.status).json(r.data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products', details: err.message })
  }
}
