CREATE TABLE IF NOT EXISTS product_requests (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NULL,
  warehouse_id INT NULL,
  product_name VARCHAR(150) NOT NULL,
  user_name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  status ENUM('pending', 'fulfilled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_request_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  CONSTRAINT fk_product_request_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL,
  INDEX idx_product_requests_product (product_id),
  INDEX idx_product_requests_warehouse (warehouse_id),
  INDEX idx_product_requests_status (status)
);

ALTER TABLE product_requests ADD COLUMN IF NOT EXISTS warehouse_id INT NULL;
