/**
 * Warehouse V2 Migration
 *
 * Adds/updates:
 *   - order_status_history
 *   - delivery_partners (active/busy/offline)
 *   - inventory
 *   - categories.slug
 *   - orders.warehouse_id, orders.delivery_partner_id, orders.total_amount
 *   - cod_collections
 *   - workflow status enum on orders
 *
 * Run: node backend/scripts/migrate_warehouse_v2.js
 */
require('dotenv').config()
const mysql = require('mysql2/promise')

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '',
}

async function run() {
  const c = await mysql.createConnection(dbConfig)
  console.log('Connected to DB\n')

  await c.execute(`
    CREATE TABLE IF NOT EXISTS order_status_history (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      order_id BIGINT NOT NULL,
      status ENUM('placed','confirmed','packed','ready_for_pickup','assigned','picked_up','out_for_delivery','delivered','cancelled') NOT NULL,
      changed_by INT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_osh_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)
  console.log('✓ order_status_history table')

  await c.execute(`
    CREATE TABLE IF NOT EXISTS delivery_partners (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(190) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      warehouse_id INT NOT NULL,
      status ENUM('active','busy','offline') NOT NULL DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_dp_email (email),
      CONSTRAINT fk_dp_wh FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)
  console.log('✓ delivery_partners table')

  await c.execute(`
    CREATE TABLE IF NOT EXISTS inventory (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      warehouse_id INT NOT NULL,
      stock INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_inv (product_id, warehouse_id),
      CONSTRAINT fk_inv_p FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      CONSTRAINT fk_inv_w FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)
  console.log('✓ inventory table')

  await c.execute(`
    CREATE TABLE IF NOT EXISTS warehouse_inventory (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      warehouse_id INT NOT NULL,
      product_id INT NOT NULL,
      stock_quantity INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_wh_inv (product_id, warehouse_id),
      CONSTRAINT fk_wh_inv_p FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      CONSTRAINT fk_wh_inv_w FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)
  console.log('✓ warehouse_inventory table')

  // Copy existing stock from legacy inventory → warehouse_inventory (safe to re-run)
  await c.execute(`
    INSERT INTO warehouse_inventory (warehouse_id, product_id, stock_quantity, created_at, updated_at)
    SELECT warehouse_id, product_id, stock, created_at, updated_at
    FROM inventory
    ON DUPLICATE KEY UPDATE
      stock_quantity = VALUES(stock_quantity),
      updated_at = VALUES(updated_at)
  `)
  console.log('✓ warehouse_inventory seeded from inventory')

  await c.execute(`
    CREATE TABLE IF NOT EXISTS cod_collections (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      order_id BIGINT NOT NULL,
      delivery_partner_id BIGINT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      status ENUM('pending','settled') NOT NULL DEFAULT 'pending',
      collected_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_cod_order (order_id),
      CONSTRAINT fk_cod_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      CONSTRAINT fk_cod_partner FOREIGN KEY (delivery_partner_id) REFERENCES delivery_partners(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)
  console.log('✓ cod_collections table')

  // Ensure collected_at exists for older DBs
  await c.execute(`ALTER TABLE cod_collections ADD COLUMN IF NOT EXISTS collected_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP`)

  await c.execute(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug VARCHAR(120) NULL`)
  console.log('✓ categories.slug column')

  await c.execute(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS warehouse_id INT NULL`)
  await c.execute(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_partner_id BIGINT NULL`)
  await c.execute(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) NOT NULL DEFAULT 0`)
  console.log('✓ orders columns (warehouse_id, delivery_partner_id, total_amount)')

  await c.execute(`
    ALTER TABLE orders MODIFY COLUMN status
      ENUM('placed','confirmed','packed','ready_for_pickup','assigned','picked_up','out_for_delivery','delivered','cancelled')
      DEFAULT 'placed'
  `)
  console.log('✓ orders.status ENUM updated')

  await c.execute(`
    ALTER TABLE order_status_history MODIFY COLUMN status
      ENUM('placed','confirmed','packed','ready_for_pickup','assigned','picked_up','out_for_delivery','delivered','cancelled')
  `)
  console.log('✓ order_status_history.status ENUM updated')

  await c.execute(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_slug VARCHAR(190) NULL`)
  console.log('✓ order_items.product_slug column')

  console.log('\n✅ Warehouse V2 migration complete')
  await c.end()
}

run().catch((e) => {
  console.error('Migration failed:', e.message)
  process.exit(1)
})
