-- Fix RLS policy cho bảng payments
-- Cho phép service role (backend) insert mà không bị RLS block

-- 1. Kiểm tra RLS policy hiện tại
SELECT * FROM pg_policies WHERE tablename = 'payments';

-- 2. Xóa policy cũ nếu có (nếu cần)
-- DROP POLICY IF EXISTS "Enable insert for authenticated users" ON payments;
-- DROP POLICY IF EXISTS "Enable read for users" ON payments;

-- 3. Tạo policy cho phép service role insert
-- Policy này cho phép authenticated users và service role insert
CREATE POLICY "Enable insert for payments" ON payments
  FOR INSERT
  WITH CHECK (true);  -- Cho phép tất cả insert (service role sẽ bypass RLS)

-- 4. Tạo policy cho phép users read payments của họ
CREATE POLICY "Enable read for users" ON payments
  FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- 5. Tạo policy cho phép service role update
CREATE POLICY "Enable update for service role" ON payments
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- 6. Kiểm tra RLS status
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'payments';
