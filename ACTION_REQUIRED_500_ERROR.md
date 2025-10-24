# ⚡ ACTION REQUIRED - 500 Error Fix

**Status:** 🔴 CRITICAL - Needs your action NOW  
**Time Required:** 2 minutes  
**Difficulty:** Very Easy

---

## 🚨 YOUR ISSUE

```
Error: "Có lỗi xảy ra"
Failed to generate plan
Status: 500 Internal Server Error
```

---

## ✅ THE FIX (3 Steps)

### **Step 1: Open Supabase**
- Go to: https://supabase.com/dashboard
- Select: **wjzmscsoiibzlxejqpgg**
- Click: **SQL Editor**

### **Step 2: Copy & Paste This SQL**

```sql
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS collected_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS model_used TEXT DEFAULT 'gpt-4o-mini',
ADD COLUMN IF NOT EXISTS rag_processed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS spiritual_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS spiritual_data JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_plans_user_id ON plans(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_status ON plans(status);
CREATE INDEX IF NOT EXISTS idx_plans_created_at ON plans(created_at DESC);
```

### **Step 3: Click RUN**

Done! ✅

---

## 🧪 Test It

1. Hard refresh: `Ctrl+Shift+R`
2. Clear cookies: F12 → Application → Cookies → Delete all
3. Login again
4. Go to `/dashboard/create-plan`
5. Chat and click "Tạo Kế Hoạch"
6. Should work now! ✅

---

## 📖 Full Guide

See: `COMPLETE_FIX_GUIDE_500_ERROR.md`

---

**DO THIS NOW!** ⚡
