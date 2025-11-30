# 🔧 APPLY DATABASE MIGRATION - FIX SUBSCRIPTION LIMITS

## ❌ **Vấn Đề**
```
Could not find the 'chat_limit' column of 'subscriptions' in the schema cache
```

Bảng `subscriptions` thiếu các cột:
- `chat_limit`
- `plan_limit`
- `word_limit`
- `current_period_start`
- `current_period_end`

## ✅ **Giải Pháp**

Migration file đã được tạo: `supabase/migrations/20251130_add_limits_to_subscriptions.sql`

## 📋 **Các Bước Apply Migration**

### **Option 1: Qua Supabase Dashboard (RECOMMENDED)**

1. Vào Supabase Dashboard: https://supabase.com/dashboard
2. Chọn project: **planai-io**
3. Vào **SQL Editor** (menu bên trái)
4. Click **New Query**
5. Copy toàn bộ nội dung file `supabase/migrations/20251130_add_limits_to_subscriptions.sql`
6. Paste vào SQL Editor
7. Click **Run** (hoặc Ctrl/Cmd + Enter)
8. Kiểm tra kết quả:
   - Nếu thành công: "Success. No rows returned"
   - Nếu lỗi: Xem error message và báo lại

### **Option 2: Qua Supabase CLI (nếu đã cài đặt)**

```bash
# Chạy migration
supabase db push

# Hoặc apply migration cụ thể
supabase migration up
```

## 🔍 **Verify Migration**

Sau khi apply migration, kiểm tra bảng `subscriptions`:

```sql
-- Kiểm tra schema
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;
```

Kết quả phải có:
- ✅ `chat_limit` (integer)
- ✅ `plan_limit` (integer)
- ✅ `word_limit` (integer)
- ✅ `current_period_start` (timestamp with time zone)
- ✅ `current_period_end` (timestamp with time zone)

## 🧪 **Test Lại Payment Flow**

Sau khi apply migration:

1. User mua Gói 1 qua Sepay
2. Webhook sẽ tạo/update subscription với `chat_limit = 40`, `plan_limit = 1`
3. Dashboard sẽ hiển thị "Gói 1" với "0/40 chats, 0/1 plan"

## 📝 **Migration Content**

File: `supabase/migrations/20251130_add_limits_to_subscriptions.sql`

```sql
-- Add chat_limit, plan_limit, and period columns to subscriptions table

ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS chat_limit INTEGER DEFAULT 5;

ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS plan_limit INTEGER DEFAULT 1;

ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS word_limit INTEGER DEFAULT 4000;

ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days');

-- Update existing records with correct limits based on tier
UPDATE subscriptions 
SET 
  chat_limit = CASE tier
    WHEN 'free' THEN 5
    WHEN 'basic' THEN 40
    WHEN 'pro' THEN 100
    WHEN 'pro_max' THEN 270
    ELSE 5
  END,
  plan_limit = CASE tier
    WHEN 'free' THEN 1
    WHEN 'basic' THEN 1
    WHEN 'pro' THEN 2
    WHEN 'pro_max' THEN 5
    ELSE 1
  END,
  word_limit = CASE tier
    WHEN 'free' THEN 4000
    WHEN 'basic' THEN 50000
    WHEN 'pro' THEN 50000
    WHEN 'pro_max' THEN 50000
    ELSE 4000
  END
WHERE chat_limit IS NULL OR plan_limit IS NULL OR word_limit IS NULL;
```

## ⚠️ **Important Notes**

- Migration này **KHÔNG ẢNH HƯỞNG** đến code hiện tại
- Chỉ thêm các cột mới vào database
- Existing data sẽ được update với default values
- RLS policies không thay đổi
- Không cần restart Vercel deployment
