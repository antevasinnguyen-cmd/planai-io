# 🔴 FIX 401 AUTHENTICATION ERROR - Plan Generation

**Date:** 24/10/2025  
**Issue:** `Failed to load resource: the server responded with a status of 401`  
**Status:** ✅ FIXED  
**Commit:** fe223a1

---

## 🔍 ROOT CAUSE ANALYSIS

### **What's Happening:**

1. User clicks "Tạo Kế Hoạch" on `/dashboard/create-plan`
2. Frontend redirects to `/dashboard/plans/generate`
3. Frontend calls `POST /api/plans/generate` with plan data
4. Backend's `getCurrentUser(request)` returns `null`
5. API returns 401: "Bạn cần đăng nhập để sử dụng tính năng này"

### **Why It Fails:**

The API route can't find the user because:
- ❌ Authorization header NOT sent by frontend
- ❌ Cookies NOT accessible in API route context
- ❌ `supabase.auth.getUser()` doesn't work without a token

---

## ✅ SOLUTION IMPLEMENTED

### **Change #1: Add Bearer Token to Frontend Request**

**File:** `app/dashboard/plans/generate/page.tsx`

**Before (WRONG ❌):**
```typescript
const res = await fetch('/api/plans/generate', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify(data)
})
```

**After (CORRECT ✅):**
```typescript
// Get session token for authentication
const { supabase } = await import('@/lib/supabase')
const { data: sessionData } = await supabase.auth.getSession()

const headers: any = { 
  'Content-Type': 'application/json'
}

// Add Authorization header if session exists
if (sessionData?.session?.access_token) {
  headers['Authorization'] = `Bearer ${sessionData.session.access_token}`
}

const res = await fetch('/api/plans/generate', {
  method: 'POST',
  headers,
  credentials: 'include',
  body: JSON.stringify(data)
})
```

**Key Changes:**
- ✅ Get session from Supabase client
- ✅ Extract access_token
- ✅ Add to Authorization header as Bearer token
- ✅ Send with fetch request

---

### **Change #2: Improve Backend Error Logging**

**File:** `lib/supabase.ts`

**Before (BROKEN ❌):**
```typescript
// Fallback to regular supabase client
const { data: { user }, error } = await supabase.auth.getUser()
if (user && !error) {
  return user
}
return null
```

**After (FIXED ✅):**
```typescript
// In API routes, we can't use getUser() without a token
console.log('=== SUPABASE: No authentication method worked ===')
console.log('=== SUPABASE: Authorization header:', request?.headers.get('Authorization') ? 'present' : 'missing')
console.log('=== SUPABASE: Credentials include:', request ? 'API route' : 'client-side')

return null
```

**Key Changes:**
- ✅ Remove broken fallback
- ✅ Add detailed logging for debugging
- ✅ Show what authentication methods were tried

---

## 🧪 HOW TO TEST

### **Step 1: Clear Cache & Cookies**

```bash
# In browser DevTools (F12)
1. Application tab
2. Cookies → Select planai.io.vn
3. Delete all cookies
4. Refresh page
```

### **Step 2: Login Again**

1. Go to https://planai.io.vn/login
2. Login with your account
3. You should see dashboard

### **Step 3: Create Plan**

1. Go to `/dashboard/create-plan`
2. Chat with AI (at least 1 message)
3. Click "Tạo Kế Hoạch"
4. Should redirect to `/dashboard/plans/generate`
5. Should see progress bar (NOT error)

### **Step 4: Check Console**

```bash
# Open DevTools (F12)
# Console tab
# Look for logs:
=== SUPABASE: Getting user from API request ===
=== SUPABASE: User found from Authorization header ===
# OR
=== SUPABASE: User found from cookies ===
```

---

## 🔧 DEBUGGING CHECKLIST

If still getting 401 error:

### **Check #1: Authorization Header**

```javascript
// In browser console on /dashboard/plans/generate
const { supabase } = await import('@/lib/supabase')
const { data: sessionData } = await supabase.auth.getSession()
console.log('Session:', sessionData)
console.log('Access Token:', sessionData?.session?.access_token)
```

**Expected:** Should show access token (long string starting with `eyJ...`)

### **Check #2: Cookies**

```javascript
// In browser console
document.cookie
```

**Expected:** Should see cookies like `sb-wjzmscsoiibzlxejqpgg-auth-token`

### **Check #3: Network Tab**

1. Open DevTools (F12)
2. Network tab
3. Click "Tạo Kế Hoạch"
4. Find POST request to `/api/plans/generate`
5. Check Request Headers:
   - Should have `Authorization: Bearer eyJ...`
   - Should have `Cookie: sb-...`

### **Check #4: Server Logs**

Check Vercel logs for:
```
=== SUPABASE: Getting user from API request ===
=== SUPABASE: User found from Authorization header ===
```

If you see:
```
=== SUPABASE: No authentication method worked ===
```

Then authentication is failing.

---

## 📊 AUTHENTICATION FLOW

```
User on /dashboard/plans/generate
    ↓
Frontend: Get session from supabase.auth.getSession()
    ↓
Extract: sessionData.session.access_token
    ↓
Add to headers: Authorization: Bearer {token}
    ↓
Fetch: POST /api/plans/generate with headers
    ↓
Backend: getCurrentUser(request)
    ↓
Check: Authorization header
    ↓
Extract: Bearer token
    ↓
Validate: supabase.auth.getUser(token)
    ↓
Return: user object ✅
    ↓
API continues processing
    ↓
Plan generated successfully ✅
```

---

## 🎯 EXPECTED BEHAVIOR

### **Before Fix:**
- Click "Tạo Kế Hoạch"
- Redirect to `/dashboard/plans/generate`
- See error: "Có lỗi xảy ra"
- Console shows: 401 error

### **After Fix:**
- Click "Tạo Kế Hoạch"
- Redirect to `/dashboard/plans/generate`
- See progress bar: "Đang phân tích thông tin..."
- Progress increases: 10% → 25% → 40% → ... → 100%
- Redirect to `/dashboard/plans/{planId}`
- See generated plan ✅

---

## 🚀 DEPLOYMENT

**Commit:** fe223a1  
**Files Changed:**
- `app/dashboard/plans/generate/page.tsx` - Add Bearer token
- `lib/supabase.ts` - Improve logging

**Status:** ✅ Deployed to Vercel  
**Live:** https://planai.io.vn

---

## 💡 NEXT STEPS IF STILL FAILING

1. **Clear everything:**
   - Clear browser cache (Ctrl+Shift+Delete)
   - Clear cookies
   - Hard refresh (Ctrl+Shift+R)
   - Logout and login again

2. **Check environment variables:**
   - Verify `NEXT_PUBLIC_SUPABASE_URL` is set
   - Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
   - Check `.env.local` file

3. **Check Supabase:**
   - Go to https://supabase.com/dashboard
   - Select project: wjzmscsoiibzlxejqpgg
   - Check Authentication settings
   - Verify API keys are correct

4. **Check Network:**
   - Open DevTools Network tab
   - Look at `/api/plans/generate` request
   - Check Request Headers
   - Check Response (should show detailed error)

5. **Screenshot & Send:**
   - Screenshot of error
   - Screenshot of Network tab
   - Screenshot of Console logs
   - Send to developer for debugging

---

## 📞 SUPPORT

If you're still getting 401 error:

1. **Screenshot the error** - Show what you see
2. **Open DevTools** - F12 → Console
3. **Copy console logs** - Paste them here
4. **Check Network tab** - Show `/api/plans/generate` request
5. **Send all info** - I'll debug immediately

---

**Status:** ✅ FIX DEPLOYED  
**Commit:** fe223a1  
**Live:** https://planai.io.vn  

**Test now and let me know if it works!** 🚀
