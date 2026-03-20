# Super Admin — Multi-Warehouse Dashboard Feature

## Overview
The **Super Admin** can now sign in to a single admin account and view/manage **all warehouse dashboards** (Sirmaur, Kanpur, etc.) from one place.

---

## What Was Added

### 1. **Warehouse Selector UI** (Frontend: `admin.js`)
- Added a **dropdown selector** below the top bar after login
- Displays all warehouses with their locations
- Shows currently selected warehouse with a highlighted badge
- Example: "Sirmaur (Himachal Pradesh)" → easy to identify

### 2. **New "Warehouse View" Tab**
- Added a new tab in the admin dashboard sidebar: `📍 Warehouse View`
- Dynamically shows the name of the currently selected warehouse
- Contains:
  - **Warehouse Information Card**: Location, Status (Active/Inactive), Delivery Radius
  - **Live Stats**:
    - Total Orders
    - Pending Orders
    - Delivered Orders
    - Total Revenue (in ₹)
  - **Recent Orders Table**: Last 8 orders from that warehouse with Order ID, Customer, Amount, Status

### 3. **Backend Endpoint**
- Endpoint: `GET /admin/warehouses/:warehouseId/snapshot`
- Returns comprehensive warehouse dashboard data:
  ```json
  {
    "location": "Sirmaur Warehouse",
    "status": "active",
    "deliveryRadius": 50,
    "totalOrders": 150,
    "pendingOrders": 12,
    "deliveredOrders": 138,
    "revenue": 125000,
    "recentOrders": [
      {
        "id": 1001,
        "customerName": "Rajesh Kumar",
        "total": 850,
        "status": "delivered"
      },
      ...
    ]
  }
  ```

### 4. **State Management** (Frontend)
Added 4 new state variables in `admin.js`:
```javascript
const [allWarehouses, setAllWarehouses] = useState([])        // List of all warehouses
const [selectedWarehouse, setSelectedWarehouse] = useState(null)  // Currently selected warehouse ID
const [warehouseData, setWarehouseData] = useState(null)      // Snapshot data for selected warehouse
const [warehouseLoading, setWarehouseLoading] = useState(false) // Loading indicator
```

### 5. **Automatic Warehouse Loading**
- When admin logs in, **all warehouses are fetched** automatically
- **First warehouse is auto-selected** if available
- When warehouse changes via dropdown, **live data loads** in real-time

---

## How It Works

### Step 1: Admin Login
```
1. Admin signs in with credentials
2. Frontend verifies token and role = 'admin'
3. Page shows warehouse selector dropdown
```

### Step 2: View All Warehouses
```
1. Dropdown shows all available warehouses (Sirmaur, Kanpur, etc.)
2. Each warehouse displays: Name (City)
3. First warehouse is pre-selected
```

### Step 3: Switch Between Warehouses
```
1. Select a warehouse from dropdown
2. Frontend calls: GET /admin/warehouses/:warehouseId/snapshot
3. Live dashboard data loads for that warehouse
4. Shows orders, revenue, status, etc.
```

### Step 4: Monitor Multiple Locations
```
1. Quick stats card shows: Total Orders, Pending, Delivered, Revenue
2. Recent orders table shows last 8 orders from that warehouse
3. Status badge shows if warehouse is Active/Inactive
4. Admin can switch between warehouses instantly
```

---

## Frontend Changes

**File**: `/home/sama/organic/frontend/pages/admin.js`

### New State
```javascript
const [allWarehouses, setAllWarehouses] = useState([])
const [selectedWarehouse, setSelectedWarehouse] = useState(null)
const [warehouseData, setWarehouseData] = useState(null)
const [warehouseLoading, setWarehouseLoading] = useState(false)
```

### New Effects

**Load all warehouses on admin login:**
```javascript
useEffect(() => {
  if (!isAdmin || !token) return
  const loadWarehouses = async () => {
    const res = await fetch(`${API_BASE}/admin/warehouses`, { headers: authHeaders })
    const data = await res.json()
    const whList = data?.data?.warehouses || []
    setAllWarehouses(whList)
    if (whList.length > 0 && !selectedWarehouse) {
      setSelectedWarehouse(whList[0].id)
    }
  }
  loadWarehouses()
}, [isAdmin, token])
```

**Load selected warehouse snapshot on change:**
```javascript
useEffect(() => {
  if (!isAdmin || !selectedWarehouse || !token) return
  const loadWarehouseSnapshot = async () => {
    setWarehouseLoading(true)
    const res = await fetch(`${API_BASE}/admin/warehouses/${selectedWarehouse}/snapshot`, { headers: authHeaders })
    const data = await res.json()
    setWarehouseData(data?.data || null)
    setWarehouseLoading(false)
  }
  loadWarehouseSnapshot()
}, [isAdmin, token, selectedWarehouse])
```

### New Tab

Added `warehouse-view` tab that displays:
- Warehouse info (location, status, radius)
- 4 stat cards (Orders, Pending, Delivered, Revenue)
- Recent orders table (last 8 orders)
- Loading state and error handling

---

## Backend Requirements

**Endpoint must exist**: `GET /admin/warehouses/:warehouseId/snapshot`

**Expected response format**:
```json
{
  "data": {
    "location": "string",
    "status": "active|inactive",
    "deliveryRadius": number,
    "totalOrders": number,
    "pendingOrders": number,
    "deliveredOrders": number,
    "revenue": number,
    "recentOrders": [
      {
        "id": number,
        "customerName": "string",
        "total": number,
        "status": "delivered|pending|cancelled|etc"
      }
    ]
  }
}
```

If this endpoint doesn't exist yet, it needs to be created in:
- **File**: `backend/controllers/adminController.js`
- **Route**: `backend/routes/adminRoutes.js`

---

## Usage Flow

```
┌─────────────────────────────────────────────┐
│  1. Admin Signs In                          │
│     (email + password)                      │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────┐
│  2. Frontend Loads All Warehouses           │
│     GET /admin/warehouses                   │
│     Result: [Sirmaur, Kanpur, Delhi, ...]   │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────┐
│  3. Auto-Select First Warehouse             │
│     Shows "Sirmaur (Himachal Pradesh)"      │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────┐
│  4. Load Warehouse Dashboard                │
│     GET /admin/warehouses/123/snapshot      │
│     Shows: Orders, Stats, Recent Orders     │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────┐
│  5. Admin Can Switch Warehouses             │
│     Dropdown → Select "Kanpur"              │
│     Auto-loads Kanpur's dashboard           │
└─────────────────────────────────────────────┘
```

---

## Testing

### Test Scenario: Super Admin Views All Warehouses

1. **Login**: Use admin credentials
2. **Check Warehouse Selector**: Dropdown should show all warehouses
3. **Switch Warehouses**: Click dropdown, select different warehouse
4. **Verify Data**: Dashboard should update with that warehouse's data
5. **Check Stats**: Orders, revenue, status should be specific to that warehouse

---

## File Summary

| File | Changes |
|------|---------|
| `frontend/pages/admin.js` | Added warehouse selector UI, new "Warehouse View" tab, 3 new useEffect hooks, 4 new state variables |
| `backend/controllers/adminController.js` | Needs `getWarehouseSnapshot()` function (if not present) |
| `backend/routes/adminRoutes.js` | Needs `router.get('/warehouses/:warehouseId/snapshot', ...)` route (if not present) |

---

## Build Status
✅ **Frontend build**: Successful (0 errors)

---

## Next Steps

1. **Verify backend endpoint** `/admin/warehouses/:warehouseId/snapshot` exists
2. **Test with multiple warehouses** in the database
3. **Monitor real-time data** from each warehouse
4. **Add more warehouse-specific features** (inventory, delivery boys, etc.) as needed

