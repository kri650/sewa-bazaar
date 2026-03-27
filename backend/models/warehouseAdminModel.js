const { pool, query } = require('../config/db')

const ACTIVE_ORDER_STATUSES = ['placed', 'confirmed', 'packed', 'ready_for_pickup', 'assigned', 'picked_up', 'out_for_delivery']

// Statuses a warehouse admin may SET an order to.
const WAREHOUSE_SETTABLE_STATUSES = new Set(['confirmed', 'packed', 'ready_for_pickup', 'assigned'])

// Statuses where the order has moved into delivery-partner or terminal territory —
// warehouse admin cannot update from these.
const DELIVERY_OR_TERMINAL_STATUSES = new Set(['picked_up', 'out_for_delivery', 'delivered', 'cancelled'])

let deliveryPartnerPasswordColumnExists = null
let productDiscountColumnsExist = null
let productFlashSaleColumnsExist = null

async function hasDeliveryPartnerPasswordColumn(conn) {
  if (deliveryPartnerPasswordColumnExists !== null) return deliveryPartnerPasswordColumnExists

  const [rows] = await conn.query(
    `SELECT 1
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'delivery_partners'
       AND COLUMN_NAME = 'password'
     LIMIT 1`
  )

  deliveryPartnerPasswordColumnExists = rows.length > 0
  return deliveryPartnerPasswordColumnExists
}

async function hasProductDiscountColumns(conn) {
  if (productDiscountColumnsExist !== null) return productDiscountColumnsExist

  const [rows] = await conn.query(
    `SELECT COUNT(*) AS columnCount
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'products'
       AND COLUMN_NAME IN ('discount_type', 'discount_value')`
  )

  productDiscountColumnsExist = Number(rows?.[0]?.columnCount || 0) === 2
  return productDiscountColumnsExist
}

async function hasProductFlashSaleColumns(conn) {
  if (productFlashSaleColumnsExist !== null) return productFlashSaleColumnsExist

  const [rows] = await conn.query(
    `SELECT COUNT(*) AS columnCount
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'products'
       AND COLUMN_NAME IN ('is_flash_sale', 'flash_sale_price', 'flash_sale_end_time')`
  )

  productFlashSaleColumnsExist = Number(rows?.[0]?.columnCount || 0) === 3
  return productFlashSaleColumnsExist
}

async function getWarehouseOrders(warehouseId, status = null) {
  const params = [warehouseId]
  let statusClause = ''

  if (status && status !== 'all') {
    statusClause = ' AND o.status = ?'
    params.push(status)
  }

  const orders = await query(
    `SELECT
       o.id,
       o.user_id AS userId,
       COALESCE(u.name, o.customer_name) AS customerName,
       o.customer_phone AS customerPhone,
       o.customer_email AS customerEmail,
       o.address_line1 AS addressLine1,
       o.address_line2 AS addressLine2,
       o.city,
       o.state,
       o.pincode,
       o.payment_method AS paymentMethod,
       o.status,
       COALESCE(o.total_amount, o.total) AS total,
       o.warehouse_id AS warehouseId,
       o.delivery_partner_id AS deliveryPartnerId,
       dp.name AS deliveryPartnerName,
       dp.email AS deliveryPartnerEmail,
       dp.phone AS deliveryPartnerPhone,
       o.created_at AS createdAt
     FROM orders o
     LEFT JOIN users u ON u.id = o.user_id
     LEFT JOIN delivery_partners dp ON dp.id = o.delivery_partner_id
     WHERE o.warehouse_id = ?${statusClause}
     ORDER BY o.created_at DESC`,
    params
  )

  if (orders.length === 0) return []

  const orderIds = orders.map((order) => order.id)
  const placeholders = orderIds.map(() => '?').join(',')

  const [items, history] = await Promise.all([
    query(
      `SELECT
         order_id AS orderId,
         product_id AS productId,
         product_name AS name,
         qty,
         price
       FROM order_items
       WHERE order_id IN (${placeholders})
       ORDER BY id ASC`,
      orderIds
    ),
    query(
      `SELECT
         order_id AS orderId,
         status,
         timestamp
       FROM order_status_history
       WHERE order_id IN (${placeholders})
       ORDER BY timestamp ASC, id ASC`,
      orderIds
    ),
  ])

  const itemsByOrder = {}
  const historyByOrder = {}

  for (const item of items) {
    if (!itemsByOrder[item.orderId]) itemsByOrder[item.orderId] = []
    itemsByOrder[item.orderId].push(item)
  }

  for (const entry of history) {
    if (!historyByOrder[entry.orderId]) historyByOrder[entry.orderId] = []
    historyByOrder[entry.orderId].push(entry)
  }

  return orders.map((order) => ({
    ...order,
    assignedPartnerId: order.deliveryPartnerId || null,
    assignedPartnerName: order.deliveryPartnerName || null,
    items: itemsByOrder[order.id] || [],
    statusHistory: historyByOrder[order.id] || [],
  }))
}

async function updateOrderStatus(orderId, newStatus, warehouseId, adminId = null) {
  const conn = await pool.getConnection()

  try {
    await conn.beginTransaction()

    const [rows] = await conn.query(
      `SELECT id, status, delivery_partner_id AS deliveryPartnerId,
              payment_method AS paymentMethod,
              COALESCE(total_amount, total) AS totalAmount
       FROM orders
       WHERE id = ? AND warehouse_id = ?
       LIMIT 1`,
      [orderId, warehouseId]
    )

    if (rows.length === 0) {
      await conn.rollback()
      return { ok: false, reason: 'order_not_found_in_warehouse' }
    }

    const currentStatus = rows[0].status

    // Reject if the order is already in delivery-partner or terminal territory
    if (DELIVERY_OR_TERMINAL_STATUSES.has(currentStatus)) {
      await conn.rollback()
      return { ok: false, reason: 'invalid_status_transition' }
    }

    // Reject if the requested new status is not a warehouse-settable value
    if (!WAREHOUSE_SETTABLE_STATUSES.has(newStatus)) {
      await conn.rollback()
      return { ok: false, reason: 'invalid_status_transition' }
    }

    await conn.query(`UPDATE orders SET status = ? WHERE id = ?`, [newStatus, orderId])
    await conn.query(
      `INSERT INTO order_status_history (order_id, status, changed_by) VALUES (?, ?, ?)`,
      [orderId, newStatus, adminId]
    )

    if (newStatus === 'delivered' && rows[0].paymentMethod === 'cod' && rows[0].deliveryPartnerId) {
      await conn.query(
        `INSERT INTO cod_collections (order_id, delivery_partner_id, amount, status, collected_at)
         VALUES (?, ?, ?, 'pending', NOW())
         ON DUPLICATE KEY UPDATE
           delivery_partner_id = VALUES(delivery_partner_id),
           amount = VALUES(amount),
           collected_at = VALUES(collected_at)`,
        [orderId, rows[0].deliveryPartnerId, Number(rows[0].totalAmount || 0)]
      )
    }

    if ((newStatus === 'delivered' || newStatus === 'cancelled') && rows[0].deliveryPartnerId) {
      await conn.query(
        `UPDATE delivery_partners SET status = 'active' WHERE id = ?`,
        [rows[0].deliveryPartnerId]
      )
    }

    await conn.commit()

    return { ok: true, previousStatus: currentStatus, newStatus }
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

async function listDeliveryPartners(warehouseId) {
  return query(`
    SELECT id, name, phone, status
    FROM delivery_partners
    WHERE warehouse_id = ?
    AND status = 'active'
    ORDER BY name ASC
  `, [warehouseId])
}

async function findDeliveryPartnerByEmail(email) {
  const rows = await query(
    `SELECT id
     FROM delivery_partners
     WHERE LOWER(TRIM(email)) = ?
     LIMIT 1`,
    [String(email || '').trim().toLowerCase()]
  )
  return rows[0] || null
}

async function createDeliveryPartner({ name, email, phone, passwordHash, warehouseId }) {
  const conn = await pool.getConnection()

  const wh = await query(`SELECT id FROM warehouses WHERE id = ? LIMIT 1`, [warehouseId])
  if (wh.length === 0) {
    const err = new Error('warehouse not found')
    err.statusCode = 400
    throw err
  }

  try {
    await conn.beginTransaction()

    const includePassword = await hasDeliveryPartnerPasswordColumn(conn)

    const insertSql = includePassword
      ? `INSERT INTO delivery_partners (name, email, phone, password, warehouse_id, status)
         VALUES (?, ?, ?, ?, ?, 'active')`
      : `INSERT INTO delivery_partners (name, email, phone, warehouse_id, status)
         VALUES (?, ?, ?, ?, 'active')`

    const insertParams = includePassword
      ? [name, email, phone, passwordHash, warehouseId]
      : [name, email, phone, warehouseId]

    const [insertResult] = await conn.query(insertSql, insertParams)

    // Keep a matching delivery user account for auth flows that read from users.role='delivery'.
    const [existingUsers] = await conn.query(
      `SELECT id, role
       FROM users
       WHERE LOWER(TRIM(email)) = ?
       LIMIT 1`,
      [String(email || '').trim().toLowerCase()]
    )

    if (existingUsers.length === 0) {
      await conn.query(
        `INSERT INTO users (name, email, phone, password, latitude, longitude, role)
         VALUES (?, ?, ?, ?, 0, 0, 'delivery')`,
        [name, email, phone || '', passwordHash]
      )
    } else if (existingUsers[0].role === 'delivery') {
      await conn.query(
        `UPDATE users
         SET name = ?, phone = ?, password = ?
         WHERE id = ?`,
        [name, phone || '', passwordHash, existingUsers[0].id]
      )
    }

    const [rows] = await conn.query(
      `SELECT
         id,
         name,
         email,
         phone,
         status,
         warehouse_id AS warehouseId,
         created_at AS createdAt
       FROM delivery_partners
       WHERE id = ? LIMIT 1`,
      [insertResult.insertId]
    )

    await conn.commit()
    return rows[0] || null
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

async function updateDeliveryPartnerStatus(deliveryPartnerId, warehouseId, status) {
  const result = await query(
    `UPDATE delivery_partners
     SET status = ?
     WHERE id = ? AND warehouse_id = ?`,
    [status, deliveryPartnerId, warehouseId]
  )

  if (result.affectedRows === 0) return { ok: false, reason: 'delivery_partner_not_found' }
  return { ok: true }
}

async function assignDeliveryPartner(orderId, deliveryPartnerId, warehouseId, adminId = null) {
  const conn = await pool.getConnection()

  try {
    await conn.beginTransaction()

    const [orderRows] = await conn.query(
      `SELECT id, status, delivery_partner_id AS deliveryPartnerId, customer_name AS customerName
       FROM orders
       WHERE id = ? AND warehouse_id = ?
       LIMIT 1`,
      [orderId, warehouseId]
    )

    if (orderRows.length === 0) {
      await conn.rollback()
      return { ok: false, reason: 'order_not_found_in_warehouse' }
    }

    // Prevent assignment to terminal or already-in-delivery orders
    const terminalStatuses = ['cancelled', 'delivered', 'picked_up', 'out_for_delivery']
    if (terminalStatuses.includes(orderRows[0].status)) {
      await conn.rollback()
      return { ok: false, reason: `cannot_assign_to_${orderRows[0].status}_order` }
    }

    // Keep warehouse -> delivery flow consistent: Confirmed -> Packed -> Assigned.
    // Assignment is valid only once order is warehouse-ready.
    const allowedBeforeAssignment = new Set(['pending', 'confirmed', 'packed', 'ready_for_pickup', 'assigned'])
    if (!allowedBeforeAssignment.has(orderRows[0].status)) {
      await conn.rollback()
      return { ok: false, reason: 'invalid_status_before_assignment' }
    }

    const [partnerRows] = await conn.query(
      `SELECT id, status
       FROM delivery_partners
       WHERE id = ? AND warehouse_id = ?
       LIMIT 1`,
      [deliveryPartnerId, warehouseId]
    )

    if (partnerRows.length === 0) {
      await conn.rollback()
      return { ok: false, reason: 'delivery_partner_not_found' }
    }
    if (partnerRows[0].status !== 'active') {
      await conn.rollback()
      return { ok: false, reason: 'delivery_partner_not_available' }
    }

    if (orderRows[0].deliveryPartnerId && orderRows[0].deliveryPartnerId !== deliveryPartnerId) {
      await conn.query(
        `UPDATE delivery_partners
         SET status = 'active'
         WHERE id = ?`,
        [orderRows[0].deliveryPartnerId]
      )
    }

    const currentStatus = orderRows[0].status
    // Always advance to 'assigned' when a delivery partner is assigned
    const nextStatus = 'assigned'

    await conn.query(
      `UPDATE orders
       SET delivery_partner_id = ?, status = ?
       WHERE id = ?`,
      [deliveryPartnerId, nextStatus, orderId]
    )

    await conn.query(
      `UPDATE delivery_partners
       SET status = 'busy'
       WHERE id = ?`,
      [deliveryPartnerId]
    )

    if (nextStatus !== currentStatus) {
      await conn.query(
        `INSERT INTO order_status_history (order_id, status, changed_by)
         VALUES (?, ?, ?)`,
        [orderId, nextStatus, adminId]
      )
    }

    await conn.commit()

    // Re-fetch partner name for response
    const [partnerData] = await pool.query(
      `SELECT name FROM delivery_partners WHERE id = ? LIMIT 1`,
      [deliveryPartnerId]
    )
    const partnerName = partnerData[0]?.name || null

    return { ok: true, status: nextStatus, partnerName, partnerId: deliveryPartnerId }
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

async function listProductsForInventory() {
  const conn = await pool.getConnection()

  try {
    const hasDiscountColumns = await hasProductDiscountColumns(conn)
    const hasFlashSaleColumns = await hasProductFlashSaleColumns(conn)

    const discountTypeColumn = hasDiscountColumns ? 'p.discount_type' : `'none'`
    const discountValueColumn = hasDiscountColumns ? 'p.discount_value' : '0'
    const flashSaleColumn = hasFlashSaleColumns ? 'COALESCE(p.is_flash_sale, 0)' : '0'
    const flashSalePriceColumn = hasFlashSaleColumns ? 'p.flash_sale_price' : 'NULL'
    const flashSaleEndTimeColumn = hasFlashSaleColumns ? 'p.flash_sale_end_time' : 'NULL'

    const [rows] = await conn.query(
      `SELECT
         p.id,
         p.name,
         p.price,
         p.quantity,
         p.unit,
         p.image,
         p.description,
         p.category_id AS categoryId,
         ${discountTypeColumn} AS discountType,
         ${discountValueColumn} AS discountValue,
         ${flashSaleColumn} AS isFlashSale,
         ${flashSalePriceColumn} AS flashSalePrice,
         ${flashSaleEndTimeColumn} AS flashSaleEndTime,
         c.name AS categoryName
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.is_active = 1
       ORDER BY c.name ASC, p.name ASC`
    )

    return rows
  } finally {
    conn.release()
  }
}

async function listCategories() {
  return query(
    `SELECT id, name, slug
     FROM categories
     ORDER BY name ASC`
  )
}

async function createProductForWarehouse({
  warehouseId,
  name,
  price,
  quantity,
  unit,
  image,
  description,
  categoryId,
  initialStock,
  discountType,
  discountValue,
  isFlashSale,
  flashSalePrice,
  flashSaleEndTime,
}) {
  const conn = await pool.getConnection()

  try {
    await conn.beginTransaction()

    const hasDiscountColumns = await hasProductDiscountColumns(conn)
    const hasFlashSaleColumns = await hasProductFlashSaleColumns(conn)

    let insertSql = `INSERT INTO products (name, price, quantity, unit, image, description, category_id, latitude, longitude`
    let insertValues = [
      name,
      price,
      quantity != null ? Number(quantity) : null,
      unit || null,
      image || null,
      description || null,
      categoryId || null,
    ]

    if (hasDiscountColumns) {
      insertSql += `, discount_type, discount_value`
      insertValues.push(discountType || 'none', Number(discountValue || 0))
    }

    if (hasFlashSaleColumns) {
      insertSql += `, is_flash_sale, flash_sale_price, flash_sale_end_time`
      insertValues.push(
        Number(isFlashSale ? 1 : 0),
        isFlashSale ? Number(flashSalePrice || 0) : null,
        isFlashSale ? flashSaleEndTime || null : null
      )
    }

    insertSql += `, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0`
    if (hasDiscountColumns) insertSql += `, ?, ?`
    if (hasFlashSaleColumns) insertSql += `, ?, ?, ?`
    insertSql += `, 1)`

    const [result] = await conn.query(insertSql, insertValues)

    const productId = result.insertId
    const safeStock = Math.max(0, Number(initialStock || 0))

    if (safeStock > 0) {
      await conn.query(
        `INSERT INTO warehouse_inventory (product_id, warehouse_id, stock_quantity)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE stock_quantity = VALUES(stock_quantity)`,
        [productId, warehouseId, safeStock]
      )
    }

    await conn.commit()

    const discountTypeColumn = hasDiscountColumns ? 'p.discount_type' : `'none'`
    const discountValueColumn = hasDiscountColumns ? 'p.discount_value' : '0'
    const flashSaleColumn = hasFlashSaleColumns ? 'COALESCE(p.is_flash_sale, 0)' : '0'
    const flashSalePriceColumn = hasFlashSaleColumns ? 'p.flash_sale_price' : 'NULL'
    const flashSaleEndTimeColumn = hasFlashSaleColumns ? 'p.flash_sale_end_time' : 'NULL'

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
         ${discountTypeColumn} AS discountType,
         ${discountValueColumn} AS discountValue,
         ${flashSaleColumn} AS isFlashSale,
         ${flashSalePriceColumn} AS flashSalePrice,
         ${flashSaleEndTimeColumn} AS flashSaleEndTime,
         c.name AS categoryName,
         c.slug AS categorySlug
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ?
       LIMIT 1`,
      [productId]
    )

    return { product: rows[0] || null, initialStock: safeStock }
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

async function updateProductForWarehouse({
  warehouseId,
  productId,
  name,
  price,
  quantity,
  unit,
  image,
  description,
  categoryId,
  discountType,
  discountValue,
  isFlashSale,
  flashSalePrice,
  flashSaleEndTime,
}) {
  const conn = await pool.getConnection()

  try {
    await conn.beginTransaction()

    const [inventoryRows] = await conn.query(
      `SELECT product_id AS productId
       FROM warehouse_inventory
       WHERE warehouse_id = ? AND product_id = ?
       LIMIT 1`,
      [warehouseId, productId]
    )

    if (inventoryRows.length === 0) {
      await conn.rollback()
      return { ok: false, reason: 'product_not_in_inventory' }
    }

    const hasDiscountColumns = await hasProductDiscountColumns(conn)
    const hasFlashSaleColumns = await hasProductFlashSaleColumns(conn)

    let updateSql = `UPDATE products
         SET name = ?,
             price = ?,
             quantity = ?,
             unit = ?,
             image = ?,
             description = ?,
             category_id = ?`
    const updateValues = [
      name,
      price,
      quantity != null ? Number(quantity) : null,
      unit || null,
      image || null,
      description || null,
      categoryId || null,
    ]

    if (hasDiscountColumns) {
      updateSql += `,
             discount_type = ?,
             discount_value = ?`
      updateValues.push(discountType || 'none', Number(discountValue || 0))
    }

    if (hasFlashSaleColumns) {
      updateSql += `,
             is_flash_sale = ?,
             flash_sale_price = ?,
             flash_sale_end_time = ?`
      updateValues.push(
        Number(isFlashSale ? 1 : 0),
        isFlashSale ? Number(flashSalePrice || 0) : null,
        isFlashSale ? flashSaleEndTime || null : null
      )
    }

    updateSql += `
         WHERE id = ?`
    updateValues.push(productId)

    const [result] = await conn.query(updateSql, updateValues)

    if (result.affectedRows === 0) {
      await conn.rollback()
      return { ok: false, reason: 'product_not_found' }
    }

    await conn.commit()

    const discountTypeColumn = hasDiscountColumns ? 'p.discount_type' : `'none'`
    const discountValueColumn = hasDiscountColumns ? 'p.discount_value' : '0'
    const flashSaleColumn = hasFlashSaleColumns ? 'COALESCE(p.is_flash_sale, 0)' : '0'
    const flashSalePriceColumn = hasFlashSaleColumns ? 'p.flash_sale_price' : 'NULL'
    const flashSaleEndTimeColumn = hasFlashSaleColumns ? 'p.flash_sale_end_time' : 'NULL'

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
         ${discountTypeColumn} AS discountType,
         ${discountValueColumn} AS discountValue,
         ${flashSaleColumn} AS isFlashSale,
         ${flashSalePriceColumn} AS flashSalePrice,
         ${flashSaleEndTimeColumn} AS flashSaleEndTime,
         c.name AS categoryName,
         c.slug AS categorySlug
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ?
       LIMIT 1`,
      [productId]
    )

    return { ok: true, product: rows[0] || null }
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

async function getInventoryGrouped(warehouseId) {
  const rows = await query(
    `SELECT
       inv.id AS inventoryId,
       inv.product_id AS productId,
       inv.stock_quantity AS stock,
       inv.updated_at AS updatedAt,
       p.name AS productName,
       p.price,
       p.unit,
       c.id AS categoryId,
       c.name AS categoryName,
       c.slug AS categorySlug
     FROM warehouse_inventory inv
     JOIN products p ON p.id = inv.product_id
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE inv.warehouse_id = ?
     ORDER BY c.name ASC, p.name ASC`,
    [warehouseId]
  )

  const groups = []
  const byCategory = new Map()

  for (const row of rows) {
    const categoryId = row.categoryId || 0
    if (!byCategory.has(categoryId)) {
      const nextGroup = {
        categoryId,
        categoryName: row.categoryName || 'Uncategorized',
        categorySlug: row.categorySlug || null,
        products: [],
      }
      byCategory.set(categoryId, nextGroup)
      groups.push(nextGroup)
    }

    byCategory.get(categoryId).products.push({
      id: row.productId,
      inventoryId: row.inventoryId,
      name: row.productName,
      price: Number(row.price || 0),
      unit: row.unit || null,
      stock: Number(row.stock || 0),
      lowStock: Number(row.stock || 0) < 10,
      updatedAt: row.updatedAt,
      categoryName: row.categoryName || 'Uncategorized',
    })
  }

  return groups
}

async function ensureProductExists(productId) {
  const rows = await query(`SELECT id FROM products WHERE id = ? LIMIT 1`, [productId])
  return rows[0] || null
}

async function setStock(productId, warehouseId, stock) {
  const product = await ensureProductExists(productId)
  if (!product) return { ok: false, reason: 'product_not_found' }

  await query(
    `INSERT INTO warehouse_inventory (product_id, warehouse_id, stock_quantity)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE stock_quantity = VALUES(stock_quantity)`,
    [productId, warehouseId, Math.max(0, stock)]
  )

  return { ok: true }
}

async function addStock(productId, warehouseId, qty) {
  const product = await ensureProductExists(productId)
  if (!product) return { ok: false, reason: 'product_not_found' }

  await query(
    `INSERT INTO warehouse_inventory (product_id, warehouse_id, stock_quantity)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE stock_quantity = stock_quantity + VALUES(stock_quantity)`,
    [productId, warehouseId, Math.max(0, qty)]
  )

  return { ok: true }
}

async function getLowStockItems(warehouseId) {
  return query(
    `SELECT
       inv.product_id AS productId,
       p.name AS productName,
       c.name AS categoryName,
       inv.stock_quantity AS stock
     FROM warehouse_inventory inv
     JOIN products p ON p.id = inv.product_id
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE inv.warehouse_id = ? AND inv.stock_quantity < 10
     ORDER BY inv.stock_quantity ASC, p.name ASC`,
    [warehouseId]
  )
}

async function getMetrics(warehouseId) {
  const [orderStats] = await query(
    `SELECT
       COUNT(*) AS totalOrders,
       SUM(CASE WHEN status IN (${ACTIVE_ORDER_STATUSES.map(() => '?').join(',')}) THEN 1 ELSE 0 END) AS pendingOrders,
       SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS deliveredOrders,
       SUM(CASE WHEN delivery_partner_id IS NULL THEN 1 ELSE 0 END) AS unassignedOrders,
       COALESCE(SUM(COALESCE(total_amount, total)), 0) AS totalRevenue
     FROM orders
     WHERE warehouse_id = ?`,
    [...ACTIVE_ORDER_STATUSES, warehouseId]
  )

  const [inventoryStats] = await query(
    `SELECT
       COUNT(*) AS productsInInventory,
       SUM(CASE WHEN stock_quantity < 10 THEN 1 ELSE 0 END) AS lowStockCount
     FROM warehouse_inventory
     WHERE warehouse_id = ?`,
    [warehouseId]
  )

  return {
    totalOrders: Number(orderStats?.totalOrders || 0),
    pendingOrders: Number(orderStats?.pendingOrders || 0),
    deliveredOrders: Number(orderStats?.deliveredOrders || 0),
    unassignedOrders: Number(orderStats?.unassignedOrders || 0),
    productsInInventory: Number(inventoryStats?.productsInInventory || 0),
    totalRevenue: Number(orderStats?.totalRevenue || 0),
    lowStockCount: Number(inventoryStats?.lowStockCount || 0),
  }
}

async function getOverview(warehouseId) {
  const [orderRow] = await query(
    `SELECT
       COUNT(*) AS totalOrders,
       SUM(CASE WHEN status IN ('placed','confirmed','packed','out_for_delivery') THEN 1 ELSE 0 END) AS pendingOrders,
       SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS deliveredOrders,
       SUM(CASE WHEN delivery_partner_id IS NULL THEN 1 ELSE 0 END) AS unassignedOrders,
       COALESCE(SUM(COALESCE(total_amount, total)), 0) AS totalRevenue
     FROM orders
     WHERE warehouse_id = ?`,
    [warehouseId]
  )

  const [invRow] = await query(
    `SELECT COUNT(*) AS productsInInventory
     FROM warehouse_inventory
     WHERE warehouse_id = ?`,
    [warehouseId]
  )

  return {
    totalOrders: Number(orderRow?.totalOrders || 0),
    pendingOrders: Number(orderRow?.pendingOrders || 0),
    deliveredOrders: Number(orderRow?.deliveredOrders || 0),
    unassignedOrders: Number(orderRow?.unassignedOrders || 0),
    totalRevenue: Number(orderRow?.totalRevenue || 0),
    productsInInventory: Number(invRow?.productsInInventory || 0),
  }
}

async function getCodCollections(warehouseId) {
  return query(
    `SELECT
      cc.id,
      cc.order_id AS orderId,
      cc.delivery_partner_id AS deliveryPartnerId,
      cc.amount,
      cc.status,
      cc.collected_at AS collectedAt,
      cc.created_at AS createdAt,
      COALESCE(u.name, o.customer_name) AS customerName,
      dp.name AS deliveryPartnerName
    FROM cod_collections cc
    JOIN orders o ON o.id = cc.order_id
    LEFT JOIN users u ON u.id = o.user_id
    LEFT JOIN delivery_partners dp ON dp.id = cc.delivery_partner_id
    WHERE o.warehouse_id = ?
    ORDER BY cc.created_at DESC`,
    [warehouseId]
  )
}

module.exports = {
  addStock,
  assignDeliveryPartner,
  createDeliveryPartner,
  findDeliveryPartnerByEmail,
  getCodCollections,
  getOverview,
  getInventoryGrouped,
  getLowStockItems,
  getMetrics,
  getWarehouseOrders,
  listCategories,
  listDeliveryPartners,
  listProductsForInventory,
  createProductForWarehouse,
  updateProductForWarehouse,
  setStock,
  updateDeliveryPartnerStatus,
  updateOrderStatus,
}
