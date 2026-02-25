/**
 * Server Entry Point
 * Starts the Express server for Sewa Bazaar Backend
 */

const app = require('./app');

const PORT = process.env.PORT || 4000;

// Start the server
app.listen(PORT, () => {
  console.log('========================================');
  console.log('🛒  Sewa Bazaar Backend Server');
  console.log('========================================');
  console.log(`Server running on: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log('========================================');
});

