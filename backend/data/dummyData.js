/**
 * Dummy Data for Testing
 * Contains sample users and products
 */

const users = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123', // In real app, this would be hashed
    createdAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    createdAt: new Date('2024-01-02').toISOString()
  }
];

const products = [
  {
    id: 1,
    name: 'Fresh Organic Apples',
    description: 'Juicy and crisp organic apples from local farms',
    price: 3.99,
    category: 'Fruits',
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400',
    stock: 50,
    createdAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 2,
    name: 'Fresh Organic Bananas',
    description: 'Naturally ripened organic bananas',
    price: 1.99,
    category: 'Fruits',
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400',
    stock: 100,
    createdAt: new Date('2024-01-02').toISOString()
  },
  {
    id: 3,
    name: 'Fresh Organic Carrots',
    description: 'Crunchy and nutritious organic carrots',
    price: 2.49,
    category: 'Vegetables',
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400',
    stock: 75,
    createdAt: new Date('2024-01-03').toISOString()
  },
  {
    id: 4,
    name: 'Fresh Organic Spinach',
    description: 'Leafy green spinach packed with nutrients',
    price: 2.99,
    category: 'Vegetables',
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400',
    stock: 40,
    createdAt: new Date('2024-01-04').toISOString()
  },
  {
    id: 5,
    name: 'Fresh Organic Oranges',
    description: 'Sweet and juicy oranges rich in Vitamin C',
    price: 4.49,
    category: 'Fruits',
    image: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400',
    stock: 60,
    createdAt: new Date('2024-01-05').toISOString()
  },
  {
    id: 6,
    name: 'Fresh Organic Broccoli',
    description: 'Green and fresh broccoli florets',
    price: 3.29,
    category: 'Vegetables',
    image: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
    stock: 35,
    createdAt: new Date('2024-01-06').toISOString()
  },
  {
    id: 7,
    name: 'Fresh Organic Strawberries',
    description: 'Sweet and ripe strawberries',
    price: 5.99,
    category: 'Fruits',
    image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400',
    stock: 25,
    createdAt: new Date('2024-01-07').toISOString()
  },
  {
    id: 8,
    name: 'Fresh Organic Tomatoes',
    description: 'Red and juicy tomatoes',
    price: 2.79,
    category: 'Vegetables',
    image: 'https://images.unsplash.com/photo-1546470427-227c7a715614?w=400',
    stock: 80,
    createdAt: new Date('2024-01-08').toISOString()
  }
];

module.exports = {
  users,
  products
};

