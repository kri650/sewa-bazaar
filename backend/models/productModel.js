const { query } = require('../config/db')

/**
 * Safe operation to get is_flash_sale column
 * Falls back to 0 if the column doesn't exist in the database
 * Uses COALESCE to handle NULL values
 */
function getFlashSaleColumn() {
  return `COALESCE(p.is_flash_sale, 0) AS isFlashSale`
}

function getFlashSalePriceColumn() {
  return `p.flash_sale_price AS flashSalePrice`
}

function getFlashSaleEndTimeColumn() {
  return `p.flash_sale_end_time AS flashSaleEndTime`
}

async function listActiveProducts() {
  return query(
    `SELECT
      p.id,
      p.name,
      p.price,
      p.quantity,
      p.unit,
      p.image,
      p.description,
      p.category_id AS categoryId,
      p.latitude,
      p.longitude,
      c.name AS category,
      c.slug AS categorySlug,
      c.slug AS category_slug,
      p.discount_type AS discountType,
      p.discount_value AS discountValue,
      COALESCE(inv.totalStock, p.quantity, 0) AS stockQuantity,
      CASE
        WHEN COALESCE(inv.totalStock, p.quantity, 0) > 0 AND COALESCE(inv.totalStock, p.quantity, 0) < 10 THEN 1
        ELSE 0
      END AS lowStock,
      ${getFlashSaleColumn()},
      ${getFlashSalePriceColumn()},
      ${getFlashSaleEndTimeColumn()}
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN (
      SELECT product_id, SUM(stock_quantity) AS totalStock
      FROM warehouse_inventory
      GROUP BY product_id
    ) inv ON inv.product_id = p.id
    WHERE p.is_active = 1
    ORDER BY p.id DESC`
  )
}

async function findById(id) {
  const rows = await query(
    `SELECT
      p.id,
      p.name,
      p.price,
      p.quantity,
      p.unit,
      p.image,
      p.description,
      p.category_id AS categoryId,
      p.latitude,
      p.longitude,
      c.name AS category,
      c.slug AS categorySlug,
      c.slug AS category_slug,
      p.discount_type AS discountType,
      p.discount_value AS discountValue,
      COALESCE(inv.totalStock, p.quantity, 0) AS stockQuantity,
      CASE
        WHEN COALESCE(inv.totalStock, p.quantity, 0) > 0 AND COALESCE(inv.totalStock, p.quantity, 0) < 10 THEN 1
        ELSE 0
      END AS lowStock,
      ${getFlashSaleColumn()},
      ${getFlashSalePriceColumn()},
      ${getFlashSaleEndTimeColumn()}
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN (
      SELECT product_id, SUM(stock_quantity) AS totalStock
      FROM warehouse_inventory
      GROUP BY product_id
    ) inv ON inv.product_id = p.id
    WHERE p.id = ?
    LIMIT 1`,
    [id]
  )
  return rows[0] || null
}

async function searchActiveProducts(searchTerm) {
  const like = `%${searchTerm}%`
  return query(
    `SELECT
      p.id,
      p.name,
      p.price,
      p.quantity,
      p.unit,
      p.image,
      p.description,
      p.category_id AS categoryId,
      p.latitude,
      p.longitude,
      c.name AS category,
      c.slug AS categorySlug,
      c.slug AS category_slug,
      p.discount_type AS discountType,
      p.discount_value AS discountValue,
      COALESCE(inv.totalStock, p.quantity, 0) AS stockQuantity,
      CASE
        WHEN COALESCE(inv.totalStock, p.quantity, 0) > 0 AND COALESCE(inv.totalStock, p.quantity, 0) < 10 THEN 1
        ELSE 0
      END AS lowStock,
      ${getFlashSaleColumn()},
      ${getFlashSalePriceColumn()},
      ${getFlashSaleEndTimeColumn()}
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN (
       SELECT product_id, SUM(stock_quantity) AS totalStock
       FROM warehouse_inventory
       GROUP BY product_id
     ) inv ON inv.product_id = p.id
     WHERE p.is_active = 1
       AND (
         p.name LIKE ?
         OR p.description LIKE ?
         OR c.name LIKE ?
       )
     ORDER BY p.id DESC`,
    [like, like, like]
  )
}

async function exists(id) {
  const rows = await query('SELECT id FROM products WHERE id = ? LIMIT 1', [id])
  return rows.length > 0
}

async function createProduct({ name, price, quantity, unit, image, description, categoryId, latitude, longitude }) {
  const result = await query(
    `INSERT INTO products (name, price, quantity, unit, image, description, category_id, latitude, longitude, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [name, price, quantity || null, unit || null, image || null, description || null, categoryId || null, latitude, longitude]
  )
  return result.insertId
}

async function updateProduct({ id, name, price, quantity, unit, image, description, categoryId, latitude, longitude, isActive }) {
  const result = await query(
    `UPDATE products
     SET
       name = COALESCE(?, name),
       price = COALESCE(?, price),
       quantity = COALESCE(?, quantity),
       unit = COALESCE(?, unit),
       image = COALESCE(?, image),
       description = COALESCE(?, description),
       category_id = COALESCE(?, category_id),
       latitude = COALESCE(?, latitude),
       longitude = COALESCE(?, longitude),
       is_active = COALESCE(?, is_active)
     WHERE id = ?`,
    [name, price, quantity, unit, image, description, categoryId, latitude, longitude, isActive, id]
  )
  return result.affectedRows > 0
}

async function deleteProduct(id) {
  const result = await query('DELETE FROM products WHERE id = ?', [id])
  return result.affectedRows > 0
}

module.exports = {
  listActiveProducts,
  findById,
  exists,
  searchActiveProducts,
  createProduct,
  updateProduct,
  deleteProduct,
}
