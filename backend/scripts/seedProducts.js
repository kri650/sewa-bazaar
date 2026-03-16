const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Map product data files to category IDs
const categoryMap = {
  'atta-rice-grains-data': 'Grains',
  'baby-care-data': 'Baby Care',
  'bath-body-data': 'Bath & Body',
  'best-deal-data': 'Best Deals',
  'beverages-data': 'Beverages',
  'chips-biscuits-data': 'Snacks',
  'dry-fruits-nuts-data': 'Dry Fruits',
  'exotic-fruits-data': 'Exotic Fruits',
  'farm-fresh-picks-data': 'Farm Fresh',
  'fruit-baskets-data': 'Fruit Baskets',
  'fruits-data': 'Fruits',
  'hydroponic-data': 'Hydroponic',
  'leafy-vegetables-data': 'Vegetables',
  'milk-dairy-data': 'Dairy',
  'oil-ghee-data': 'Oil & Ghee',
  'organic-specials-data': 'Organic',
  'pooja-essentials-data': 'Pooja',
  'regular-vegetables-data': 'Vegetables',
  'root-vegetables-data': 'Vegetables',
  'seasonal-special-data': 'Seasonal',
  'soap-detergents-data': 'Cleaning',
};

// Get or create category ID
async function getCategoryId(conn, categoryName) {
  const [rows] = await conn.query(
    'SELECT id FROM categories WHERE name = ?',
    [categoryName]
  );

  if (rows.length > 0) {
    return rows[0].id;
  }

  // Create category if it doesn't exist
  const [result] = await conn.query(
    'INSERT INTO categories (name) VALUES (?)',
    [categoryName]
  );
  return result.insertId;
}

// Load products from a data file
function loadProductsFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Extract the exported object
    // Handle different export patterns
    let products = [];
    
    // Try pattern: export const varName = [...]
    const exportMatch = content.match(/export const \w+ = (\[[\s\S]*?\]);/);
    if (exportMatch) {
      const code = exportMatch[1];
      try {
        products = eval(code);
      } catch (e) {
        console.error(`Error parsing file ${filePath}:`, e.message);
      }
    }
    
    return products;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return [];
  }
}

// Main function
async function seedProducts() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
  });

  try {
    // Clear existing products
    console.log('Clearing existing products...');
    await conn.query('DELETE FROM products');

    // Process each data file
    const dataDir = path.join(__dirname, '../..', 'frontend', 'data');
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('-data.js'));

    console.log(`Found ${files.length} data files`);

    let totalProducts = 0;

    for (const file of files) {
      const filePath = path.join(dataDir, file);
      const fileKey = file.replace('-data.js', '');
      const categoryName = categoryMap[fileKey] || fileKey.replace(/-/g, ' ');

      console.log(`\nProcessing: ${file} (Category: ${categoryName})`);

      const products = loadProductsFromFile(filePath);
      console.log(`  Found ${products.length} products`);

      if (products.length === 0) {
        console.log(`  Skipping: No products found in ${file}`);
        continue;
      }

      // Get or create category
      const categoryId = await getCategoryId(conn, categoryName);

      // Insert products
      for (const product of products) {
        try {
          const name = product.name || 'Unknown';
          const price = parseFloat(product.price) || 0;
          const unit = product.size || product.unit || '';
          const image = product.image || '';
          const description = product.description || '';

          await conn.query(
            `INSERT INTO products (name, price, unit, image, description, category_id, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
            [name, price, unit, image, description, categoryId]
          );

          totalProducts++;
        } catch (error) {
          console.error(`  Error inserting product "${product.name}":`, error.message);
        }
      }
    }

    console.log(`\n✅ Successfully seeded ${totalProducts} products into the database!`);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

// Run the seed
seedProducts();
