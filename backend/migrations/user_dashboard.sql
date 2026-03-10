-- ============================================================
-- Migration: User Dashboard — user_addresses table
-- Run once against your database before starting the server.
--   mysql -u <user> -p <database> < migrations/user_dashboard.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS user_addresses (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT       NOT NULL,
  full_name  VARCHAR(120) NOT NULL,
  phone      VARCHAR(30)  NOT NULL,
  street     VARCHAR(255) NOT NULL,
  city       VARCHAR(100) NOT NULL,
  state      VARCHAR(100) NOT NULL,
  pincode    VARCHAR(20)  NOT NULL,
  country    VARCHAR(100) NOT NULL DEFAULT 'India',
  is_default TINYINT(1)   NOT NULL DEFAULT 0,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_addr_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);
