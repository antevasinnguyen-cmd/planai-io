-- Cập nhật RLS policy cho bảng ai_response_cache
-- Bật RLS
ALTER TABLE ai_response_cache ENABLE ROW LEVEL SECURITY;

-- Xóa policy cũ nếu có
DROP POLICY IF EXISTS "Allow public read access to cache" ON ai_response_cache;
DROP POLICY IF EXISTS "Allow service role to insert/update cache" ON ai_response_cache;

-- Tạo policy mới cho phép đọc cache (không cần auth)
CREATE POLICY "Allow read access to cache"
ON ai_response_cache FOR SELECT
USING (true);

-- Tạo policy cho phép ghi cache (service role hoặc authenticated users)
CREATE POLICY "Allow write access to cache"
ON ai_response_cache FOR ALL
USING (
  auth.jwt() ->> 'role' = 'service_role' OR
  auth.role() = 'service_role' OR
  auth.role() = 'authenticated'
);

-- Kiểm tra RLS đã được bật
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'ai_response_cache';
