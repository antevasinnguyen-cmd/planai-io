# 🔴 FIX CRITICAL: Plans Table Missing Columns

## ❌ VẤN ĐỀ PHÁT HIỆN

API `/api/plans/generate` đang cố gắng insert vào `plans` table với các columns KHÔNG TỒN TẠI:

```typescript
// API đang insert:
{
  user_id,
  title,
  content,
  collected_info,      // ❌ KHÔNG có trong schema
  status,
  word_count,
  created_at,
  model_used,          // ❌ KHÔNG có trong schema  
  rag_processed        // ❌ KHÔNG có trong schema
}
```

**Schema hiện tại chỉ có:**
- id
- user_id
- title
- goal
- content
- word_count
- status
- version
- metadata
- created_at
- updated_at

## ✅ GIẢI PHÁP

### **Bước 1: Chạy SQL Migration Trên Supabase**

1. Vào **Supabase Dashboard**: https://supabase.com/dashboard
2. Chọn project: **wjzmscsoiibzlxejqpgg**
3. Vào **SQL Editor**
4. Copy và paste SQL sau:

```sql
-- Fix plans table - Add missing columns
-- Date: 2025-10-24

-- Add missing columns
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS collected_info JSONB,
ADD COLUMN IF NOT EXISTS model_used TEXT,
ADD COLUMN IF NOT EXISTS rag_processed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS spiritual_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS spiritual_data JSONB;

-- Update existing plans to have default values
UPDATE plans 
SET 
  collected_info = '{}'::jsonb WHERE collected_info IS NULL,
  rag_processed = false WHERE rag_processed IS NULL,
  spiritual_enabled = false WHERE spiritual_enabled IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_plans_user_id ON plans(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_status ON plans(status);
CREATE INDEX IF NOT EXISTS idx_plans_created_at ON plans(created_at DESC);

-- Add comments for documentation
COMMENT ON COLUMN plans.collected_info IS 'JSON data collected from user chat';
COMMENT ON COLUMN plans.model_used IS 'AI model used (gpt-4o-mini, claude-3.5-sonnet)';
COMMENT ON COLUMN plans.rag_processed IS 'Whether processed with RAG embeddings';
COMMENT ON COLUMN plans.spiritual_enabled IS 'Whether spiritual analysis enabled';
COMMENT ON COLUMN plans.spiritual_data IS 'Spiritual analysis data (zodiac, numerology)';
```

5. Click **Run** để execute SQL

### **Bước 2: Verify Migration**

Chạy query này để verify:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'plans'
ORDER BY ordinal_position;
```

Expected output phải có:
- ✅ collected_info (jsonb)
- ✅ model_used (text)
- ✅ rag_processed (boolean)
- ✅ spiritual_enabled (boolean)
- ✅ spiritual_data (jsonb)

### **Bước 3: Test Plan Generation**

1. Vào https://planai.io.vn/dashboard/create-plan
2. Chat với AI
3. Click "Tạo Kế Hoạch"
4. Verify plan được tạo thành công

## 🎯 TẠI SAO LỖI NÀY XẢY RA?

1. **Schema không đồng bộ với code:**
   - Code đã được update để insert thêm columns
   - Nhưng database schema không được update
   - Result: INSERT fails vì columns không tồn tại

2. **Missing migrations:**
   - Khi thêm features mới (RAG, spiritual analysis)
   - Đã update code nhưng quên chạy migration
   - Database vẫn ở schema cũ

3. **RLS Policies:**
   - Row Level Security có thể block INSERT
   - Nhưng trong trường hợp này, lỗi là do missing columns

## 📊 EXPECTED RESULTS

### **Before Fix:**
```
❌ Error: column "collected_info" does not exist
❌ Error: column "model_used" does not exist  
❌ Error: column "rag_processed" does not exist
❌ Cannot create plans
```

### **After Fix:**
```
✅ Plans table has all required columns
✅ INSERT succeeds
✅ Plans created successfully
✅ RAG processing works
✅ Spiritual analysis works
```

## 🚨 CRITICAL NOTES

1. **Backup First:**
   - Supabase tự động backup
   - Nhưng nên export plans table trước khi chạy migration

2. **Zero Downtime:**
   - Migration này an toàn
   - Chỉ ADD columns, không DROP
   - Existing data không bị ảnh hưởng

3. **Rollback Plan:**
   - Nếu có vấn đề, có thể DROP columns:
   ```sql
   ALTER TABLE plans 
   DROP COLUMN IF EXISTS collected_info,
   DROP COLUMN IF EXISTS model_used,
   DROP COLUMN IF EXISTS rag_processed,
   DROP COLUMN IF EXISTS spiritual_enabled,
   DROP COLUMN IF EXISTS spiritual_data;
   ```

## 🎉 CONCLUSION

Đây là **ROOT CAUSE** của lỗi "Có lỗi xảy ra" khi tạo plan!

**Không phải lỗi:**
- ❌ Authentication (đã fix)
- ❌ API keys (đã có)
- ❌ Code logic (đúng)

**Lỗi thực sự:**
- ✅ **Database schema thiếu columns**
- ✅ **INSERT statement fails vì columns không tồn tại**

**Solution:**
- ✅ Chạy SQL migration trên Supabase
- ✅ Add missing columns
- ✅ Test plan generation

---

**Created:** 24/10/2025
**By:** Cascade AI Assistant
**Status:** 🔴 CRITICAL - NEEDS IMMEDIATE ACTION
**Impact:** BLOCKS all plan generation
