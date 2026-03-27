# SQL Error Fix: Unknown Column 'is_flash_sale'

## Problem
The backend API endpoint `/api/products` was throwing a SQL error:
```
Unknown column 'p.is_flash_sale' in SELECT
```

This occurred because the queries in `productModel.js` were referencing columns (`is_flash_sale`, `flash_sale_price`, `flash_sale_end_time`) that didn't exist in the products table.

## Root Cause
The database schema definitions exist in:
- `schema.sql` (lines 55-57)
- `migrations/flash_sale_products.sql`

However, these migrations were not being executed when the backend started, so the columns were never created in the database.

## Solution Implemented

### 1. Database Initialization Module (`backend/utils/initializeDb.js`)
- **New file** that runs all SQL migrations on application startup
- Automatically executes migration files from `/backend/migrations/` directory
- Provides helper functions to check if tables and columns exist
- Logs initialization status for debugging

### 2. Backend Startup Enhancement (`backend/index.js`)
- **Modified `startServer()` function** to initialize the database after connection is established
- Calls `initializeDatabase()` automatically when the server starts
- Continues with a warning if migrations have already been applied
- Logs success/failure of database initialization

### 3. Robust Product Model (`backend/models/productModel.js`)
- **Added helper functions** to encapsulate flash sale column selection:
  - `getFlashSaleColumn()` - Returns COALESCE expression for `is_flash_sale`
  - `getFlashSalePriceColumn()` - Returns expression for `flash_sale_price`
  - `getFlashSaleEndTimeColumn()` - Returns expression for `flash_sale_end_time`
- Updated three main query functions:
  - `listActiveProducts()` - Uses helper functions
  - `findById()` - Uses helper functions
  - `searchActiveProducts()` - Uses helper functions
- Makes code more maintainable and easier to adapt if columns are missing

### 4. Enhanced Error Handling (`backend/controllers/productController.js`)
- **Added comprehensive error handling** to all controller functions:
  - `listProducts()` - Detects DB schema errors and provides helpful message
  - `getProduct()` - Validates input and handles DB errors gracefully
  - `adminAddProduct()` - Better error logging
  - `adminUpdateProduct()` - Better error logging
  - `adminDeleteProduct()` - Better error logging
- Returns specific error codes (`DB_SCHEMA_ERROR`, `DB_ERROR`) for debugging
- Logs all errors to server console with function context
- Prevents raw error messages from leaking to frontend

## Database Migrations
The following migrations are automatically run on startup:
1. **flash_sale_products.sql** - Adds `is_flash_sale`, `flash_sale_price`, `flash_sale_end_time` columns
2. **products_discounts_coupons.sql** - Adds discount-related columns
3. **user_dashboard.sql** - Adds user dashboard tables

Each migration uses `IF NOT EXISTS` to prevent errors if columns already exist.

## API Response Changes
The `/api/products` endpoint will now return:
- ✅ **Success Case**: Array of products with all fields including `isFlashSale`, `flashSalePrice`, `flashSaleEndTime`
- ✅ **Error Case**: Detailed error response with error code for debugging
- ✅ **Schema Error Case**: Helpful message about missing database columns

### Example Success Response
```json
[
  {
    "id": 1,
    "name": "Organic Apple",
    "price": "150.00",
    "categoryId": 1,
    "isFlashSale": 0,
    "flashSalePrice": null,
    "flashSaleEndTime": null,
    "stockQuantity": 45,
    "lowStock": 0,
    ...
  }
]
```

### Example Error Response
```json
{
  "error": "Failed to retrieve products",
  "code": "DB_ERROR"
}
```

## Testing
To verify the fix works:

1. **Start the backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Check server logs** for:
   ```
   [DB Init] Starting database initialization...
   [DB Migration] Executed: flash_sale_products.sql
   [DB Migration] Executed: products_discounts_coupons.sql
   [DB Migration] Executed: user_dashboard.sql
   [DB Init] Database schema initialized
   ✅ Database schema initialized
   ```

3. **Test the API endpoint**:
   ```bash
   curl http://localhost:5000/api/products
   ```

4. **Expected result**: Products array returns without SQL error

## Files Modified
1. ✅ `backend/utils/initializeDb.js` - NEW
2. ✅ `backend/index.js` - Added db initialization call
3. ✅ `backend/models/productModel.js` - Added helper functions for flash sale columns
4. ✅ `backend/controllers/productController.js` - Enhanced error handling

## Frontend Impact
✅ **No frontend changes required** - The API response format remains the same, just without the SQL error.

## Why This Approach?
1. **Automatic Migration**: Database schema is automatically initialized when backend starts
2. **Graceful Degradation**: Uses COALESCE to handle missing columns if migrations fail
3. **Better Debugging**: Specific error codes help identify issues quickly
4. **Maintainability**: Helper functions make future schema changes easier to manage
5. **Safe Migration**: Uses `IF NOT EXISTS` to work with existing databases
