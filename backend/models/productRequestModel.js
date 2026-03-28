const { query } = require('../config/db')

async function findPreferredWarehouseIdForProduct(productId) {
  if (!productId || Number.isNaN(Number(productId))) return null

  const rows = await query(
    `SELECT warehouse_id AS warehouseId
     FROM warehouse_inventory
     WHERE product_id = ?
     ORDER BY stock_quantity DESC, warehouse_id ASC
     LIMIT 1`,
    [Number(productId)]
  )

  return rows?.[0]?.warehouseId ? Number(rows[0].warehouseId) : null
}

async function createProductRequest({ productId, warehouseId, productName, userName, phone }) {
  const result = await query(
    `INSERT INTO product_requests (
      product_id,
      warehouse_id,
      product_name,
      user_name,
      phone,
      status
    ) VALUES (?, ?, ?, ?, ?, 'pending')`,
    [productId || null, warehouseId || null, productName, userName, phone]
  )

  return {
    id: result.insertId,
    productId: productId || null,
    warehouseId: warehouseId || null,
    productName,
    userName,
    phone,
    status: 'pending',
  }
}

async function listProductRequests() {
  return query(
    `SELECT
      pr.id,
      pr.product_id AS productId,
      pr.warehouse_id AS warehouseId,
      pr.warehouse_id AS warehouse_id,
      w.name AS warehouseName,
      w.name AS warehouse_name,
      pr.product_name AS productName,
      pr.user_name AS userName,
      pr.phone,
      pr.status,
      pr.created_at AS createdAt,
      COALESCE(rc.requestCount, 0) AS requestCount
    FROM product_requests pr
    LEFT JOIN (
      SELECT product_id, COUNT(*) AS requestCount
      FROM product_requests
      GROUP BY product_id
    ) rc ON rc.product_id = pr.product_id
    LEFT JOIN warehouses w ON w.id = pr.warehouse_id
    ORDER BY pr.created_at DESC`
  )
}

async function listProductRequestsByWarehouse(warehouseId) {
  return query(
    `SELECT
      pr.id,
      pr.product_id AS productId,
      pr.warehouse_id AS warehouseId,
      pr.warehouse_id AS warehouse_id,
      w.name AS warehouseName,
      w.name AS warehouse_name,
      pr.product_name AS productName,
      pr.user_name AS userName,
      pr.phone,
      pr.status,
      pr.created_at AS createdAt,
      COALESCE(rc.requestCount, 0) AS requestCount
    FROM product_requests pr
    LEFT JOIN (
      SELECT product_id, warehouse_id, COUNT(*) AS requestCount
      FROM product_requests
      GROUP BY product_id, warehouse_id
    ) rc ON rc.product_id = pr.product_id AND rc.warehouse_id = pr.warehouse_id
    LEFT JOIN warehouses w ON w.id = pr.warehouse_id
    WHERE pr.warehouse_id = ?
    ORDER BY pr.created_at DESC`,
    [warehouseId]
  )
}

async function updateProductRequestStatus(id, status) {
  const result = await query(
    `UPDATE product_requests SET status = ? WHERE id = ?`,
    [status, id]
  )
  return result.affectedRows > 0
}

async function deleteProductRequest(id) {
  const result = await query('DELETE FROM product_requests WHERE id = ?', [id])
  return result.affectedRows > 0
}

async function updateProductRequestStatusForWarehouse(id, warehouseId, status) {
  const result = await query(
    `UPDATE product_requests
     SET status = ?
     WHERE id = ? AND warehouse_id = ?`,
    [status, id, warehouseId]
  )
  return result.affectedRows > 0
}

async function deleteProductRequestForWarehouse(id, warehouseId) {
  const result = await query(
    'DELETE FROM product_requests WHERE id = ? AND warehouse_id = ?',
    [id, warehouseId]
  )
  return result.affectedRows > 0
}

module.exports = {
  findPreferredWarehouseIdForProduct,
  createProductRequest,
  listProductRequests,
  listProductRequestsByWarehouse,
  updateProductRequestStatus,
  deleteProductRequest,
  updateProductRequestStatusForWarehouse,
  deleteProductRequestForWarehouse,
}
