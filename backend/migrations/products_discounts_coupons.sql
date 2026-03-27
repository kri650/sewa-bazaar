ALTER TABLE products
  ADD COLUMN IF NOT EXISTS discount_type VARCHAR(10) NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10,2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL,
  discount_type VARCHAR(10) NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_coupons_code (code),
  INDEX idx_coupons_product (product_id),
  CONSTRAINT fk_coupons_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
