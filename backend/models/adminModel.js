const { query } = require('../config/db')

async function listOrders() {
  return query(
    `SELECT
      o.id,
      o.user_id AS userId,
      o.customer_name AS customerName,
      o.customer_phone AS customerPhone,
      o.customer_email AS customerEmail,
      o.city,
      o.state,
      o.pincode,
      o.payment_method AS paymentMethod,
      o.status,
      o.total,
      o.delivery_partner_id AS deliveryPartnerId,
      dp.name AS deliveryPartnerName,
      o.created_at AS createdAt
    FROM orders o
    LEFT JOIN users dp ON dp.id = o.delivery_partner_id
    ORDER BY o.created_at DESC`
  )
}

async function listUsers() {
  return query(
    `SELECT
      u.id,
      u.name,
      u.email,
      u.phone,
      u.latitude,
      u.longitude,
      u.role,
      u.created_at AS createdAt
    FROM users u
    ORDER BY u.created_at DESC`
  )
}

async function listDeliveryBoys() {
  return query(
    `SELECT
      u.id,
      u.name,
      u.email,
      u.phone,
      u.latitude,
      u.longitude,
      u.created_at AS createdAt
    FROM users u
    WHERE u.role = 'delivery'
    ORDER BY u.created_at DESC`
  )
}

async function createProduct({ name, price, unit, image, description, categoryId, latitude, longitude }) {
  const result = await query(
    `INSERT INTO products (name, price, unit, image, description, category_id, latitude, longitude, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [name, price, unit || null, image || null, description || null, categoryId || null, latitude, longitude]
  )

  return {
    id: result.insertId,
    name,
    price,
    unit: unit || null,
    image: image || null,
    description: description || null,
    categoryId: categoryId || null,
    latitude,
    longitude,
    isActive: 1,
  }
}

async function updateProduct(productId, { name, price, unit, image, description, categoryId }) {
  const result = await query(
    `UPDATE products SET name=?, price=?, unit=?, image=?, description=?, category_id=? WHERE id=?`,
    [name, price, unit || null, image || null, description || null, categoryId || null, productId]
  )
  return result.affectedRows > 0
}

async function deleteProduct(productId) {
  const result = await query('DELETE FROM products WHERE id = ?', [productId])
  return result.affectedRows > 0
}

async function listProducts() {
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
      p.is_active AS isActive,
      p.created_at AS createdAt
    FROM products p
    ORDER BY p.created_at DESC`
  )
}

async function updateUserRole(userId, role) {
  const result = await query('UPDATE users SET role = ? WHERE id = ?', [role, userId])
  return result.affectedRows > 0
}

async function updateOrderStatus(orderId, status) {
  const result = await query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId])
  return result.affectedRows > 0
}

// ── Delivery Partner Management ──────────────────────────────────────────────

async function createDeliveryPartner({ name, email, phone, passwordHash }) {
  const result = await query(
    `INSERT INTO users (name, email, phone, password, latitude, longitude, role)
     VALUES (?, ?, ?, ?, 0, 0, 'delivery')`,
    [name, email, phone || '', passwordHash]
  )
  return { id: result.insertId, name, email, phone, role: 'delivery' }
}

async function deleteDeliveryPartner(userId) {
  const result = await query(
    `DELETE FROM users WHERE id = ? AND role = 'delivery'`,
    [userId]
  )
  return result.affectedRows > 0
}

async function assignOrderToDeliveryPartner(orderId, deliveryPartnerId) {
  const partners = await query(
    `SELECT id FROM users WHERE id = ? AND role = 'delivery' LIMIT 1`,
    [deliveryPartnerId]
  )
  if (partners.length === 0) return { ok: false, reason: 'delivery_partner_not_found' }

  const orders = await query(
    `SELECT id, user_id AS userId, customer_name AS customerName, total, status FROM orders WHERE id = ? LIMIT 1`,
    [orderId]
  )
  if (orders.length === 0) return { ok: false, reason: 'order_not_found' }

  await query(
    `UPDATE orders SET delivery_partner_id = ?, status = 'confirmed' WHERE id = ?`,
    [deliveryPartnerId, orderId]
  )
  return { ok: true, order: orders[0] }
}

module.exports = {
  listOrders,
  listUsers,
  listDeliveryBoys,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateUserRole,
  updateOrderStatus,
  createDeliveryPartner,
  deleteDeliveryPartner,
  assignOrderToDeliveryPartner,
}
