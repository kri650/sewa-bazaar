const { query, pool } = require('../config/db')

let productDiscountColumnsExist = null
let productQuantityColumnExist = null
let productFlashSaleColumnsExist = null

async function hasProductDiscountColumns(executor = query) {
  if (productDiscountColumnsExist !== null) return productDiscountColumnsExist

  const rows = await executor(
    `SELECT COUNT(*) AS columnCount
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'products'
       AND COLUMN_NAME IN ('discount_type', 'discount_value')`
  )

  productDiscountColumnsExist = Number(rows?.[0]?.columnCount || 0) === 2
  return productDiscountColumnsExist
}

async function hasProductQuantityColumn(executor = query) {
  if (productQuantityColumnExist !== null) return productQuantityColumnExist

  const rows = await executor(
    `SELECT COUNT(*) AS columnCount
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'products'
       AND COLUMN_NAME = 'quantity'`
  )

  productQuantityColumnExist = Number(rows?.[0]?.columnCount || 0) === 1
  return productQuantityColumnExist
}

async function hasProductFlashSaleColumns(executor = query) {
  if (productFlashSaleColumnsExist !== null) return productFlashSaleColumnsExist

  const rows = await executor(
    `SELECT COUNT(*) AS columnCount
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'products'
       AND COLUMN_NAME IN ('is_flash_sale', 'flash_sale_price', 'flash_sale_end_time')`
  )

  productFlashSaleColumnsExist = Number(rows?.[0]?.columnCount || 0) === 3
  return productFlashSaleColumnsExist
}

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
  return query(`
    SELECT 
      dp.id,
      dp.name,
      dp.email,
      dp.phone,
      dp.status,
      dp.warehouse_id,
      dp.created_at AS createdAt,
      w.name AS warehouseName,
      w.city AS warehouseCity
    FROM delivery_partners dp
    LEFT JOIN warehouses w ON w.id = dp.warehouse_id
    ORDER BY dp.created_at DESC
  `)
}

const CATEGORY_NAME_BY_SLUG = {
  'fruits': 'Fruits',
  'root-vegetables': 'Root Vegetables',
  'hydroponic-vegetables': 'Hydroponic Vegetables',
  'seasonal-special': 'Seasonal Special',
  'farm-fresh-picks': 'Farm Fresh Picks',
  'organic-specials': 'Organic Specials',
  'value-combos': 'Value Combos',
  'best-deal': 'Best Deal',
  'exotic-fruits': 'Exotic Fruits',
  'imported-fruits': 'Imported Fruits',
  'fruit-baskets': 'Fruit Baskets',
  'dry-fruits-nuts': 'Dry Fruits & Nuts',
  'atta-rice-grains': 'Atta, Rice & Grains',
  'oil-ghee': 'Oil & Ghee',
  'milk-dairy': 'Milk & Dairy',
  'chips-biscuits': 'Chips & Biscuits',
  'bath-body': 'Bath & Body',
  'soap-detergents': 'Soap & Detergents',
  'baby-care': 'Baby Care',
  'pooja-essentials': 'Pooja Essentials',
  'beverages': 'Beverages',
}

function categoryNameFromSlug(slug) {
  const normalized = String(slug || '').trim().toLowerCase()
  if (CATEGORY_NAME_BY_SLUG[normalized]) return CATEGORY_NAME_BY_SLUG[normalized]
  return normalized
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

async function resolveCategoryIdFromSlug(conn, categorySlug) {
  const normalizedSlug = String(categorySlug || '').trim().toLowerCase()
  if (!normalizedSlug) return null

  const [existingBySlug] = await conn.query(
    `SELECT id FROM categories WHERE slug = ? LIMIT 1`,
    [normalizedSlug]
  )
  if (existingBySlug.length > 0) return existingBySlug[0].id

  const generatedName = categoryNameFromSlug(normalizedSlug)
  try {
    const [inserted] = await conn.query(
      `INSERT INTO categories (name, slug) VALUES (?, ?)`,
      [generatedName, normalizedSlug]
    )
    return inserted.insertId
  } catch (error) {
    const [fallbackBySlug] = await conn.query(
      `SELECT id FROM categories WHERE slug = ? LIMIT 1`,
      [normalizedSlug]
    )
    if (fallbackBySlug.length > 0) return fallbackBySlug[0].id

    const [fallbackByName] = await conn.query(
      `SELECT id FROM categories WHERE name = ? LIMIT 1`,
      [generatedName]
    )
    if (fallbackByName.length > 0) return fallbackByName[0].id

    throw error
  }
}

async function getCategorySlugById(categoryId) {
  if (!categoryId || Number.isNaN(Number(categoryId))) return ''
  const rows = await query(
    `SELECT slug FROM categories WHERE id = ? LIMIT 1`,
    [Number(categoryId)]
  )
  return rows?.[0]?.slug || ''
}

async function createProduct({
  name,
  price,
  category,
  quantity,
  unit,
  image,
  description,
  latitude,
  longitude,
  discountType,
  discountValue,
  isFlashSale,
  flashSalePrice,
  flashSaleEndTime,
}) {
  const conn = await pool.getConnection()

  try {
    await conn.beginTransaction()

    const categoryId = await resolveCategoryIdFromSlug(conn, category)

    const hasDiscountColumns = await hasProductDiscountColumns(async (sql, params = []) => {
      const [rows] = await conn.query(sql, params)
      return rows
    })
    const hasQuantityColumn = await hasProductQuantityColumn(async (sql, params = []) => {
      const [rows] = await conn.query(sql, params)
      return rows
    })
    const hasFlashSaleColumns = await hasProductFlashSaleColumns(async (sql, params = []) => {
      const [rows] = await conn.query(sql, params)
      return rows
    })

    const normalizedIsFlashSale = Boolean(isFlashSale)
    const normalizedFlashSalePrice = normalizedIsFlashSale ? Number(flashSalePrice) : null
    const normalizedFlashSaleEndTime = normalizedIsFlashSale ? (flashSaleEndTime || null) : null

    let result
    if (hasDiscountColumns && hasQuantityColumn && hasFlashSaleColumns) {
      ;[result] = await conn.query(
        `INSERT INTO products (name, price, quantity, unit, image, description, category_id, latitude, longitude, discount_type, discount_value, is_flash_sale, flash_sale_price, flash_sale_end_time, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          name,
          price,
          Number(quantity),
          unit || null,
          image || null,
          description || null,
          categoryId || null,
          latitude,
          longitude,
          discountType || 'none',
          Number(discountValue || 0),
          normalizedIsFlashSale ? 1 : 0,
          normalizedFlashSalePrice,
          normalizedFlashSaleEndTime,
        ]
      )
    } else if (hasDiscountColumns && hasQuantityColumn && !hasFlashSaleColumns) {
      ;[result] = await conn.query(
        `INSERT INTO products (name, price, quantity, unit, image, description, category_id, latitude, longitude, discount_type, discount_value, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          name,
          price,
          Number(quantity),
          unit || null,
          image || null,
          description || null,
          categoryId || null,
          latitude,
          longitude,
          discountType || 'none',
          Number(discountValue || 0),
        ]
      )
    } else if (hasDiscountColumns && !hasQuantityColumn && hasFlashSaleColumns) {
      ;[result] = await conn.query(
        `INSERT INTO products (name, price, unit, image, description, category_id, latitude, longitude, discount_type, discount_value, is_flash_sale, flash_sale_price, flash_sale_end_time, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          name,
          price,
          unit || null,
          image || null,
          description || null,
          categoryId || null,
          latitude,
          longitude,
          discountType || 'none',
          Number(discountValue || 0),
          normalizedIsFlashSale ? 1 : 0,
          normalizedFlashSalePrice,
          normalizedFlashSaleEndTime,
        ]
      )
    } else if (hasDiscountColumns && !hasQuantityColumn && !hasFlashSaleColumns) {
      ;[result] = await conn.query(
        `INSERT INTO products (name, price, unit, image, description, category_id, latitude, longitude, discount_type, discount_value, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          name,
          price,
          unit || null,
          image || null,
          description || null,
          categoryId || null,
          latitude,
          longitude,
          discountType || 'none',
          Number(discountValue || 0),
        ]
      )
    } else if (!hasDiscountColumns && hasQuantityColumn && hasFlashSaleColumns) {
      ;[result] = await conn.query(
        `INSERT INTO products (name, price, quantity, unit, image, description, category_id, latitude, longitude, is_flash_sale, flash_sale_price, flash_sale_end_time, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          name,
          price,
          Number(quantity),
          unit || null,
          image || null,
          description || null,
          categoryId || null,
          latitude,
          longitude,
          normalizedIsFlashSale ? 1 : 0,
          normalizedFlashSalePrice,
          normalizedFlashSaleEndTime,
        ]
      )
    } else if (!hasDiscountColumns && hasQuantityColumn && !hasFlashSaleColumns) {
      ;[result] = await conn.query(
        `INSERT INTO products (name, price, quantity, unit, image, description, category_id, latitude, longitude, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          name,
          price,
          Number(quantity),
          unit || null,
          image || null,
          description || null,
          categoryId || null,
          latitude,
          longitude,
        ]
      )
    } else if (!hasDiscountColumns && !hasQuantityColumn && hasFlashSaleColumns) {
      ;[result] = await conn.query(
        `INSERT INTO products (name, price, unit, image, description, category_id, latitude, longitude, is_flash_sale, flash_sale_price, flash_sale_end_time, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          name,
          price,
          unit || null,
          image || null,
          description || null,
          categoryId || null,
          latitude,
          longitude,
          normalizedIsFlashSale ? 1 : 0,
          normalizedFlashSalePrice,
          normalizedFlashSaleEndTime,
        ]
      )
    } else {
      ;[result] = await conn.query(
        `INSERT INTO products (name, price, unit, image, description, category_id, latitude, longitude, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          name,
          price,
          unit || null,
          image || null,
          description || null,
          categoryId || null,
          latitude,
          longitude,
        ]
      )
    }

    const productId = result.insertId

    await conn.commit()

    return {
      id: productId,
      name,
      price,
      category: category || null,
      quantity: Number(quantity),
      unit: unit || null,
      image: image || null,
      description: description || null,
      categoryId: categoryId || null,
      latitude,
      longitude,
      discountType: discountType || 'none',
      discountValue: Number(discountValue || 0),
      isFlashSale: normalizedIsFlashSale,
      flashSalePrice: normalizedFlashSalePrice,
      flashSaleEndTime: normalizedFlashSaleEndTime,
      isActive: 1,
    }
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

async function listProducts() {
  const hasDiscountColumns = await hasProductDiscountColumns()
  const hasQuantityColumn = await hasProductQuantityColumn()
  const hasFlashSaleColumns = await hasProductFlashSaleColumns()

  return hasDiscountColumns
    ? query(
      `SELECT
        p.id,
        p.name,
        p.price,
        ${hasQuantityColumn ? 'p.quantity' : 'NULL AS quantity'},
        p.unit,
        p.image,
        p.description,
        p.category_id AS categoryId,
        c.slug AS category,
        p.discount_type AS discountType,
        p.discount_value AS discountValue,
        ${hasFlashSaleColumns ? 'p.is_flash_sale' : '0'} AS isFlashSale,
        ${hasFlashSaleColumns ? 'p.flash_sale_price' : 'NULL'} AS flashSalePrice,
        ${hasFlashSaleColumns ? 'p.flash_sale_end_time' : 'NULL'} AS flashSaleEndTime,
        p.latitude,
        p.longitude,
        p.is_active AS isActive,
        p.created_at AS createdAt
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ORDER BY p.created_at DESC`
    )
    : query(
      `SELECT
        p.id,
        p.name,
        p.price,
        ${hasQuantityColumn ? 'p.quantity' : 'NULL AS quantity'},
        p.unit,
        p.image,
        p.description,
        p.category_id AS categoryId,
        c.slug AS category,
        'none' AS discountType,
        0 AS discountValue,
        ${hasFlashSaleColumns ? 'p.is_flash_sale' : '0'} AS isFlashSale,
        ${hasFlashSaleColumns ? 'p.flash_sale_price' : 'NULL'} AS flashSalePrice,
        ${hasFlashSaleColumns ? 'p.flash_sale_end_time' : 'NULL'} AS flashSaleEndTime,
        p.latitude,
        p.longitude,
        p.is_active AS isActive,
        p.created_at AS createdAt
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ORDER BY p.created_at DESC`
    )
}

async function updateProduct(productId, {
  name,
  price,
  category,
  quantity,
  unit,
  image,
  description,
  discountType,
  discountValue,
  isFlashSale,
  flashSalePrice,
  flashSaleEndTime,
}) {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const categoryId = await resolveCategoryIdFromSlug(conn, category)
    const hasQuantityColumn = await hasProductQuantityColumn(async (sql, params = []) => {
      const [rows] = await conn.query(sql, params)
      return rows
    })
    const hasDiscountColumns = await hasProductDiscountColumns(async (sql, params = []) => {
      const [rows] = await conn.query(sql, params)
      return rows
    })
    const hasFlashSaleColumns = await hasProductFlashSaleColumns(async (sql, params = []) => {
      const [rows] = await conn.query(sql, params)
      return rows
    })

    const normalizedIsFlashSale = Boolean(isFlashSale)
    const normalizedFlashSalePrice = normalizedIsFlashSale ? Number(flashSalePrice) : null
    const normalizedFlashSaleEndTime = normalizedIsFlashSale ? (flashSaleEndTime || null) : null

    const setClauses = [
      'name=?',
      'price=?',
      'unit=?',
      'image=?',
      'description=?',
      'category_id=?',
    ]
    const params = [
      name,
      price,
      unit || null,
      image || null,
      description || null,
      categoryId || null,
    ]

    if (hasQuantityColumn) {
      setClauses.splice(2, 0, 'quantity=?')
      params.splice(2, 0, Number(quantity))
    }

    if (hasDiscountColumns) {
      setClauses.push('discount_type=?', 'discount_value=?')
      params.push(discountType || 'none', Number(discountValue || 0))
    }

    if (hasFlashSaleColumns) {
      setClauses.push('is_flash_sale=?', 'flash_sale_price=?', 'flash_sale_end_time=?')
      params.push(
        normalizedIsFlashSale ? 1 : 0,
        normalizedFlashSalePrice,
        normalizedFlashSaleEndTime,
      )
    }

    params.push(productId)
    const [result] = await conn.query(
      `UPDATE products SET ${setClauses.join(', ')} WHERE id=?`,
      params,
    )

    await conn.commit()
    return result.affectedRows > 0
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

async function deleteProduct(productId) {
  const result = await query('DELETE FROM products WHERE id = ?', [productId])
  return result.affectedRows > 0
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
    'INSERT INTO delivery_partners (name, email, phone, password) VALUES (?, ?, ?, ?)',
    [name, email, phone, passwordHash]
  )
  return { id: result.insertId, name, email, phone }
}

async function deleteDeliveryPartner(userId) {
  // First set delivery_partner_id to NULL in orders table
  await query('UPDATE orders SET delivery_partner_id = NULL WHERE delivery_partner_id = ?', [userId])
  
  // Then delete from delivery_partners table
  const result = await query('DELETE FROM delivery_partners WHERE id = ?', [userId])
  return result.affectedRows > 0
}

async function assignOrderToDeliveryPartner(orderId, deliveryPartnerId) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const partners = await query(
      `SELECT id FROM delivery_partners WHERE id = ? LIMIT 1`,
      [deliveryPartnerId]
    )
    if (partners.length === 0) return { ok: false, reason: 'delivery_partner_not_found' }

    const orders = await query(
      `SELECT id, user_id AS userId, customer_name AS customerName, total, status FROM orders WHERE id = ? LIMIT 1`,
      [orderId]
    )
    if (orders.length === 0) return { ok: false, reason: 'order_not_found' }

    const currentStatus = String(orders[0].status || '').trim().toLowerCase().replace(/[\\s-]+/g, '_')
    const allowedBeforeAssignment = new Set([
      '',
      'placed',
      'pending',
      'confirmed',
      'packed',
      'ready_for_pickup',
      'assigned',
    ])
    if (!allowedBeforeAssignment.has(currentStatus)) {
      return { ok: false, reason: 'invalid_status_before_assignment' }
    }

    await query(
      `UPDATE orders SET delivery_partner_id = ?, status = 'assigned' WHERE id = ?`,
      [deliveryPartnerId, orderId]
    )

    if (currentStatus !== 'assigned') {
      await query(
        `INSERT INTO order_status_history (order_id, status) VALUES (?, ?)`,
        [orderId, 'assigned']
      )
    }
    await connection.commit()
    return { ok: true, order: orders[0] }
  } catch (error) {
    await connection.rollback()
    return { ok: false, error: 'database_error' }
  } finally {
    connection.release()
  }
}

// ── Warehouse Admin Management (Super Admin) ──────────────────────────────

async function listWarehouseAdmins() {
  return query(
    `SELECT
       wa.id,
       wa.name,
       wa.email,
       wa.warehouse_id AS warehouseId,
       wa.created_at   AS createdAt,
       w.name          AS warehouseName,
       w.city          AS warehouseCity
     FROM warehouse_admins wa
     LEFT JOIN warehouses w ON w.id = wa.warehouse_id
     ORDER BY w.id ASC, wa.created_at DESC`
  )
}

async function updateWarehouseAdminWarehouse(adminId, warehouseId) {
  const result = await query(
    `UPDATE warehouse_admins SET warehouse_id = ? WHERE id = ?`,
    [warehouseId, adminId]
  )
  return result.affectedRows > 0
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
  listWarehouseAdmins,
  updateWarehouseAdminWarehouse,
  getCategorySlugById,
}
