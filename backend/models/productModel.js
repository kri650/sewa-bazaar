const { query } = require('../config/db')

async function listActiveProducts() {
  return query(
    `SELECT
      p.id,
      p.name,
      p.price,
      p.unit,
      p.image,
      p.description,
      p.category_id AS categoryId,
      p.latitude,
      p.longitude,
      c.name AS category,
      COALESCE(inv.totalStock, 0) AS stockQuantity,
      CASE
        WHEN COALESCE(inv.totalStock, 0) > 0 AND COALESCE(inv.totalStock, 0) < 10 THEN 1
        ELSE 0
      END AS lowStock
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
      p.unit,
      p.image,
      p.description,
      p.category_id AS categoryId,
      p.latitude,
      p.longitude,
      c.name AS category,
      COALESCE(inv.totalStock, 0) AS stockQuantity,
      CASE
        WHEN COALESCE(inv.totalStock, 0) > 0 AND COALESCE(inv.totalStock, 0) < 10 THEN 1
        ELSE 0
      END AS lowStock
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
      p.unit,
      p.image,
      p.description,
      p.category_id AS categoryId,
      p.latitude,
      p.longitude,
      c.name AS category,
      COALESCE(inv.totalStock, 0) AS stockQuantity,
      CASE
        WHEN COALESCE(inv.totalStock, 0) > 0 AND COALESCE(inv.totalStock, 0) < 10 THEN 1
        ELSE 0
      END AS lowStock
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

async function createProduct({ name, price, unit, image, description, categoryId, latitude, longitude }) {
  const result = await query(
    `INSERT INTO products (name, price, unit, image, description, category_id, latitude, longitude, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [name, price, unit || null, image || null, description || null, categoryId || null, latitude, longitude]
  )
  return result.insertId
}

async function updateProduct({ id, name, price, unit, image, description, categoryId, latitude, longitude, isActive }) {
  const result = await query(
    `UPDATE products
     SET
       name = COALESCE(?, name),
       price = COALESCE(?, price),
       unit = COALESCE(?, unit),
       image = COALESCE(?, image),
       description = COALESCE(?, description),
       category_id = COALESCE(?, category_id),
       latitude = COALESCE(?, latitude),
       longitude = COALESCE(?, longitude),
       is_active = COALESCE(?, is_active)
     WHERE id = ?`,
    [name, price, unit, image, description, categoryId, latitude, longitude, isActive, id]
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
