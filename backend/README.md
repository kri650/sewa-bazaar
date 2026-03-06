# Organic Backend

Express backend for Organic e-commerce.

Scripts:
- npm run dev: start dev server with nodemon on port 4000
- npm run start: start production server

## DB Integration (MySQL)

1. Copy env template and fill your DB values:
   - `cp .env.example .env`
2. In phpMyAdmin, open your database and run SQL from:
   - `backend/schema.sql`
3. Install dependencies:
   - `npm install`
4. Start backend:
   - `npm run dev`

## New API Endpoints

- `POST /users/register`
- `POST /users/login`
- `GET /users/me` (Bearer token)
- `GET /products`
- `GET /products/:id`
- `GET /wishlist` (Bearer token)
- `POST /wishlist` (Bearer token)
- `DELETE /wishlist/:productId` (Bearer token)
- `GET /cart` (Bearer token)
- `POST /cart/items` (Bearer token)
- `PATCH /cart/items/:productId` (Bearer token)
- `DELETE /cart/items/:productId` (Bearer token)
- `POST /orders` (supports guest or logged-in user)
