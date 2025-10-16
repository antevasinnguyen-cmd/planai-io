# 🚨 URGENT: AI API Keys Hết Quota/Credit

## Vấn đề
- **OpenAI API**: Quota exceeded (hết hạn mức)
- **Anthropic API**: Credit balance too low (hết tiền)
- **RLS Policy**: Cache không thể lưu do policy sai

## 🔧 Giải pháp khẩn cấp

### 1. Nạp tiền OpenAI (Ưu tiên cao)
```
Truy cập: https://platform.openai.com/account/billing
→ Add to credit balance
→ Nạp ít nhất $20-50
→ Sử dụng thẻ tín dụng hoặc chuyển khoản
```

### 2. Nạp tiền Anthropic (Backup)
```
Truy cập: https://console.anthropic.com/settings/plans
→ Add credits
→ Nạp ít nhất $20-50
→ Thanh toán bằng thẻ
```

### 3. Sửa RLS Policy trong Supabase
```sql
-- Chạy trong Supabase SQL Editor
ALTER TABLE ai_response_cache ENABLE ROW LEVEL SECURITY;

-- Xóa policy cũ
DROP POLICY IF EXISTS "Allow public read access to cache" ON ai_response_cache;
DROP POLICY IF EXISTS "Allow service role to insert/update cache" ON ai_response_cache;

-- Tạo policy mới
CREATE POLICY "Allow read access to cache"
ON ai_response_cache FOR SELECT
USING (true);

CREATE POLICY "Allow write access to cache"
ON ai_response_cache FOR ALL
USING (
  auth.jwt() ->> 'role' = 'service_role' OR
  auth.role() = 'service_role' OR
  auth.role() = 'authenticated'
);
```

### 4. Redeploy Vercel
```
Sau khi nạp tiền và sửa RLS → Redeploy trên Vercel
```

## 📊 Thời gian phục hồi
- **OpenAI**: 5-15 phút sau khi nạp tiền
- **Anthropic**: 5-15 phút sau khi nạp tiền
- **RLS**: Ngay lập tức sau khi chạy SQL

## ⚡ Giải pháp tạm thời
Nếu không thể nạp tiền ngay, hệ thống sẽ hiển thị thông báo:
"💰 API của chúng tôi đã hết hạn mức sử dụng. Chúng tôi đang nỗ lực nạp thêm credit..."

## 📞 Liên hệ hỗ trợ
- Email: webappsaas.ai@gmail.com
- Hotline: [Thêm số hotline nếu có]
