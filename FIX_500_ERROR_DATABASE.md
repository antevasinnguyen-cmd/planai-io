# 🔴 FIX 500 ERROR - Database Schema Missing Columns

**Date:** 24/10/2025  
**Issue:** 500 Internal Server Error when creating plans  
**Root Cause:** Plans table missing columns  
**Status:** 🔴 NEEDS IMMEDIATE ACTION

---

## 🔍 ROOT CAUSE ANALYSIS

### **What's Happening:**

1. User clicks "Tạo Kế Hoạch"
2. Frontend sends request to `/api/plans/generate`
3. Backend tries to INSERT into plans table
4. **ERROR:** Columns don't exist in database schema
5. API returns 500 error

### **Missing Columns:**

```
❌ collected_info (JSONB)
❌ model_used (TEXT)
❌ rag_processed (BOOLEAN)
❌ spiritual_enabled (BOOLEAN)
❌ spiritual_data (JSONB)
```

### **Why It Happened:**

- Code was updated to use these columns
- Database schema was NOT updated
- INSERT fails because columns don't exist

---

## ✅ SOLUTION - 3 STEPS

### **STEP 1: Go to Supabase Dashboard**

1. Open: https://supabase.com/dashboard
2. Select project: **wjzmscsoiibzlxejqpgg**
3. Click: **SQL Editor** (left sidebar)

---

### **STEP 2: Run Migration SQL**

Copy this SQL and paste into SQL Editor:

```sql
-- Fix plans table - Add missing columns
-- Date: 2025-10-24

-- Add missing columns to plans table
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS collected_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS model_used TEXT DEFAULT 'gpt-4o-mini',
ADD COLUMN IF NOT EXISTS rag_processed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS spiritual_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS spiritual_data JSONB DEFAULT '{}'::jsonb;

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

Then click: **Run** button

---

### **STEP 3: Verify Migration**

Run this query to verify columns were added:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'plans'
ORDER BY ordinal_position;
```

**Expected columns:**
- ✅ id
- ✅ user_id
- ✅ title
- ✅ goal
- ✅ content
- ✅ word_count
- ✅ status
- ✅ version
- ✅ metadata
- ✅ created_at
- ✅ updated_at
- ✅ **collected_info** ← NEW
- ✅ **model_used** ← NEW
- ✅ **rag_processed** ← NEW
- ✅ **spiritual_enabled** ← NEW
- ✅ **spiritual_data** ← NEW

---

## 🧪 TEST AFTER FIX

### **Step 1: Hard Refresh**
```
Ctrl+Shift+R  (or Cmd+Shift+R on Mac)
```

### **Step 2: Clear Cache**
```
F12 → Application → Cookies → Delete all
```

### **Step 3: Login**
```
Go to https://planai.io.vn/login
Login with your account
```

### **Step 4: Create Plan**
```
1. Go to /dashboard/create-plan
2. Chat with AI (type anything)
3. Click "Tạo Kế Hoạch"
4. Should see progress bar ✅
5. Should redirect to plan view ✅
```

---

## ✅ EXPECTED RESULTS

### **Before Fix:**
```
❌ Error: 500 Internal Server Error
❌ Error: "Failed to generate plan"
❌ Console: "No user found when loading subscription"
❌ Cannot create plans
```

### **After Fix:**
```
✅ Progress bar appears
✅ Progress: 10% → 25% → 40% → ... → 100%
✅ Redirects to plan view
✅ Plan created successfully
✅ No console errors
```

---

## 🎯 SUMMARY

| Step | Action | Status |
|------|--------|--------|
| 1 | Go to Supabase Dashboard | ⏳ DO THIS |
| 2 | Run migration SQL | ⏳ DO THIS |
| 3 | Verify columns added | ⏳ DO THIS |
| 4 | Test plan creation | ⏳ DO THIS |

---

## 🚨 IMPORTANT NOTES

### **Safe to Run:**
- ✅ Only ADD columns (no DROP)
- ✅ Uses IF NOT EXISTS (idempotent)
- ✅ Existing data not affected
- ✅ Zero downtime

### **Rollback (if needed):**
```sql
ALTER TABLE plans 
DROP COLUMN IF EXISTS collected_info,
DROP COLUMN IF EXISTS model_used,
DROP COLUMN IF EXISTS rag_processed,
DROP COLUMN IF EXISTS spiritual_enabled,
DROP COLUMN IF EXISTS spiritual_data;
```

---

## 📞 NEED HELP?

If migration fails:
1. Screenshot the error
2. Copy error message
3. Send to developer

If still getting 500 error after migration:
1. Hard refresh (Ctrl+Shift+R)
2. Clear cookies
3. Try again
4. If still fails, check server logs

---

## 🏆 CONCLUSION

**This is the ROOT CAUSE of your 500 error!**

**Solution:**
1. ✅ Run SQL migration on Supabase
2. ✅ Add missing columns
3. ✅ Test plan creation

**Expected:** Plans will be created successfully! 🎉

---

**Status:** 🔴 CRITICAL - NEEDS IMMEDIATE ACTION  
**Impact:** BLOCKS all plan generation  
**Fix Time:** 2 minutes  

**DO THIS NOW!** ⚡
