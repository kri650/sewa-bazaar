# Sewa Bazaar Backend

Backend API for Sewa Bazaar E-commerce Platform

## Overview

This is a Node.js + Express backend for the Sewa Bazaar e-commerce project. It provides RESTful APIs for user authentication and product management using dummy data.

## Features

- **Express Server** - Fast and minimal web framework
- **CORS Enabled** - Cross-origin resource sharing enabled
- **JSON Middleware** - Automatic JSON parsing
- **Health Check API** - Server health endpoint
- **Authentication APIs** - Login and Register endpoints
- **Product APIs** - Get all products, get by ID, category, and search

## Folder Structure

```
backend/
├── data/
│   └── dummyData.js          # Dummy users and products data
├── controllers/
│   ├── authController.js     # Auth logic (login, register)
│   └── productController.js  # Product logic (CRUD operations)
├── routes/
│   ├── authRoutes.js         # Auth API routes
│   └── productRoutes.js      # Product API routes
├── app.js                    # Express app configuration
├── server.js                 # Server entry point
├── package.json              # Dependencies
└── README.md                 # This file
```

## Prerequisites

- Node.js (v14 or higher)
- npm

## Installation

1. Navigate to the backend folder:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

## Running the Backend

### Development Mode

```bash
npm run dev
```

or

```bash
npm start
```

The server will start on **http://localhost:4000**

## API Endpoints

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check server health |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login user |

#### Register Request Body
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login Request Body
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products |
| GET | `/api/products/:id` | Get product by ID |
| GET | `/api/products/category/:category` | Get products by category |
| GET | `/api/products/search?q=query` | Search products |

## Example Responses

### Health Check Response
```json
{
  "status": "success",
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Get All Products Response
```json
{
  "status": "success",
  "message": "Products retrieved successfully",
  "data": [...],
  "total": 8
}
```

### Login Response
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Testing with cURL

### Health Check
```bash
curl http://localhost:4000/api/health
```

### Get All Products
```bash
curl http://localhost:4000/api/products
```

### Register User
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123"}'
```

### Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

## Notes

- This backend uses **dummy data** - data is stored in memory and will reset when the server restarts
- For production, you would need to:
  - Add a database (MongoDB, PostgreSQL, MySQL)
  - Hash passwords using bcrypt
  - Add JWT authentication
  - Add input validation
  - Add rate limiting
  - Add environment variables
  - Add proper error handling

## License

ISC

