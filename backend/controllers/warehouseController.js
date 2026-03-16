const { query } = require('../config/db')

function validateWarehousePayload(body) {
  const {
    id,
    name,
    address,
    city,
    state,
    pincode,
    latitude,
    longitude,
    lat,
    lng,
    fast_radius,
    max_radius,
    fast_radius_km,
    max_radius_km,
    status,
  } = body || {}

  if (!name || !String(name).trim())
    return { error: 'Warehouse name is required' }
  if (!city || !String(city).trim())
    return { error: 'City is required' }
  if (!/^\d{6}$/.test(String(pincode || '')))
    return { error: 'Pincode must be exactly 6 digits' }

  const latCandidate = latitude !== undefined && latitude !== '' ? latitude : lat
  const lngCandidate = longitude !== undefined && longitude !== '' ? longitude : lng

  const latNum = Number(latCandidate)
  const lngNum = Number(lngCandidate)
  if (latCandidate === undefined || latCandidate === '' || Number.isNaN(latNum))
    return { error: 'Valid latitude is required' }
  if (lngCandidate === undefined || lngCandidate === '' || Number.isNaN(lngNum))
    return { error: 'Valid longitude is required' }
  if (latNum < -90 || latNum > 90)
    return { error: 'Latitude must be between -90 and 90' }
  if (lngNum < -180 || lngNum > 180)
    return { error: 'Longitude must be between -180 and 180' }

  const fastRadiusCandidate = fast_radius !== undefined && fast_radius !== '' ? fast_radius : fast_radius_km
  const maxRadiusCandidate = max_radius !== undefined && max_radius !== '' ? max_radius : max_radius_km

  const fastR = fastRadiusCandidate === undefined || fastRadiusCandidate === '' ? 10 : Number(fastRadiusCandidate)
  if (Number.isNaN(fastR) || fastR <= 0)
    return { error: 'Fast delivery radius must be a positive number' }

  const maxR = (maxRadiusCandidate !== undefined && maxRadiusCandidate !== '') ? Number(maxRadiusCandidate) : 50
  if (Number.isNaN(maxR) || maxR <= 0)
    return { error: 'Max delivery radius must be a positive number' }

  const normalizedStatus = status === 'inactive' ? 'inactive' : 'active'

  return {
    id,
    name: String(name).trim(),
    address: String(address || '').trim(),
    city: String(city).trim(),
    state: String(state || '').trim(),
    pincode: String(pincode),
    latitudeNum: latNum,
    longitudeNum: lngNum,
    fastR,
    maxR,
    status: normalizedStatus,
  }
}

/** GET /admin/warehouses  and  GET /api/admin/warehouses */
async function getWarehouses(_req, res) {
  try {
    const warehouses = await query(
      `SELECT 
         id,
         name,
         address,
         city,
         state,
         pincode,
         latitude  AS lat,
         longitude AS lng,
         fast_radius AS fast_radius_km,
         max_radius  AS max_radius_km,
         status,
         created_at
       FROM warehouses
       ORDER BY id DESC`
    )

    return res.json({ success: true, data: { warehouses } })
  } catch (err) {
    console.error('[admin/warehouses GET] error:', err)
    return res.status(500).json({ success: false, message: err.message || 'Failed to load warehouses' })
  }
}

/** POST /admin/warehouses  (create or update) */
async function saveWarehouse(req, res) {
  try {
    const validated = validateWarehousePayload(req.body)
    if (validated.error) {
      return res.status(400).json({ success: false, message: validated.error })
    }

    const { id, name, address, city, state, pincode, latitudeNum, longitudeNum, fastR, maxR, status } = validated

    const params = [name, address, city, state, pincode, latitudeNum, longitudeNum, fastR, maxR, status]

    let message
    if (id) {
      // Update existing warehouse
      const result = await query(
        `UPDATE warehouses
           SET name = ?,
               address = ?,
               city = ?,
               state = ?,
               pincode = ?,
               latitude = ?,
               longitude = ?,
               fast_radius = ?,
               max_radius = ?,
               status = ?
         WHERE id = ?`,
        [...params, id]
      )

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Warehouse not found' })
      }
      message = 'Warehouse updated successfully'
    } else {
      // Insert new warehouse
      const result = await query(
        `INSERT INTO warehouses
           (name, address, city, state, pincode, latitude, longitude, fast_radius, max_radius, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params
      )
      validated.id = result.insertId
      message = 'Warehouse added successfully'
    }

    const warehouseRows = await query(
      `SELECT
         id,
         name,
         address,
         city,
         state,
         pincode,
         latitude AS lat,
         longitude AS lng,
         fast_radius AS fast_radius_km,
         max_radius AS max_radius_km,
         status,
         created_at
       FROM warehouses
       WHERE id = ?
       LIMIT 1`,
      [id || validated.id]
    )

    const warehouse = warehouseRows && warehouseRows.length ? warehouseRows[0] : null

    // Return fresh list after mutation so admin UI stays in sync
    const warehouses = await query(
      `SELECT
         id,
         name,
         address,
         city,
         state,
         pincode,
         latitude AS lat,
         longitude AS lng,
         fast_radius AS fast_radius_km,
         max_radius AS max_radius_km,
         status,
         created_at
       FROM warehouses
       ORDER BY id DESC`
    )

    return res.status(id ? 200 : 201).json({
      success: true,
      message,
      data: { warehouse, warehouses },
    })
  } catch (err) {
    console.error('[admin/warehouses POST] error:', err)
    return res.status(500).json({ success: false, message: err.message || 'Failed to save warehouse' })
  }
}

/** DELETE /admin/warehouses/:id */
async function deleteWarehouse(req, res) {
  try {
    const { id } = req.params
    if (!id) return res.status(400).json({ success: false, message: 'Warehouse id is required' })

    const result = await query('DELETE FROM warehouses WHERE id = ?', [id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' })
    }

    const warehouses = await query(
      `SELECT 
         id,
         name,
         address,
         city,
         state,
         pincode,
         latitude AS lat,
         longitude AS lng,
         fast_radius AS fast_radius_km,
         max_radius AS max_radius_km,
         status,
         created_at
       FROM warehouses
       ORDER BY id DESC`
    )

    return res.json({ success: true, message: 'Warehouse deleted', data: { warehouses } })
  } catch (err) {
    console.error('[admin/warehouses DELETE] error:', err)
    return res.status(500).json({ success: false, message: err.message || 'Failed to delete warehouse' })
  }
}

module.exports = { getWarehouses, saveWarehouse, deleteWarehouse }
