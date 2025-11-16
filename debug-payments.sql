-- Debug script để kiểm tra bảng payments

-- 1. Kiểm tra structure của bảng payments
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'payments'
ORDER BY ordinal_position;

-- 2. Kiểm tra RLS policies
SELECT 
  policyname, 
  permissive, 
  roles, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename = 'payments';

-- 3. Kiểm tra xem RLS có enable không
SELECT 
  schemaname, 
  tablename, 
  rowsecurity
FROM pg_tables 
WHERE tablename = 'payments';

-- 4. Kiểm tra constraints
SELECT 
  constraint_name, 
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'payments';

-- 5. Kiểm tra xem có payment nào được lưu không
SELECT 
  id, 
  user_id, 
  transaction_id, 
  status, 
  created_at,
  updated_at
FROM payments 
ORDER BY created_at DESC 
LIMIT 20;

-- 6. Kiểm tra xem có lỗi gì khi insert
-- Thử insert một payment test
INSERT INTO payments (
  user_id,
  subscription_tier,
  amount,
  currency,
  status,
  payment_method,
  transaction_id,
  provider
) VALUES (
  'test-user-123',
  'basic',
  169000,
  'VND',
  'pending',
  'sepay',
  'PLAN_TEST_' || to_char(now(), 'YYYYMMDDHHmmss'),
  'sepay'
)
RETURNING *;
