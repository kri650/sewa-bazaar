# Organic Monorepo

This workspace contains the frontend only. The previous backend was removed.

- `frontend/` - Next.js frontend

Quick start (frontend-only using the included mock data):

1. cd frontend && npm install
2. Start frontend: npm run dev (port 3000)

The frontend API route `pages/api/products.js` will try the backend at `http://localhost:4000` by default, and will fall back to in-repo mock data when the backend is not available.
