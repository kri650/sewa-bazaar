/**
 * Auth Controller
 * Handles user authentication (login, register)
 */

const { users } = require('../data/dummyData');

// Dummy user storage (in real app, this would be a database)
let userStore = [...users];

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide name, email, and password'
      });
    }

    // Check if user already exists
    const existingUser = userStore.find(user => user.email === email);
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const newUser = {
      id: userStore.length + 1,
      name,
      email,
      password, // In real app, hash the password!
      createdAt: new Date().toISOString()
    };

    userStore.push(newUser);

    // Return success (without password)
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to register user'
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    // Find user by email
    const user = userStore.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Check password (in real app, use bcrypt to compare hashed passwords)
    if (user.password !== password) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Return success (without password)
    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to login'
    });
  }
};

module.exports = {
  register,
  login
};

