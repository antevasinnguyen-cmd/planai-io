-- Add order_code column to payments table for Payos integration
ALTER TABLE payments ADD COLUMN IF NOT EXISTS order_code BIGINT;
