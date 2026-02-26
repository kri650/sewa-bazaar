// Proxy to backend API during development. Update BASE_URL in production.
import axios from 'axios'
import mockProducts from '../../data/mock-products'

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:4000'

export default async function handler(req, res) {
  // Try the real backend first. If it fails, return local mock data so frontend keeps working.
  try {
    const r = await axios.get(`${BASE_URL}/products`)
    if (r && r.data) return res.status(r.status).json(r.data)
  } catch (err) {
    // swallow and fallback to mock below
    console.warn('Backend products fetch failed, falling back to mock data:', err.message)
  }

  // Final fallback: return in-repo mock data
  return res.status(200).json(mockProducts)
}
