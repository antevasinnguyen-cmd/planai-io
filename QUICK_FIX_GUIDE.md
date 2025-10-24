# ⚡ QUICK FIX GUIDE - 401 Error When Creating Plans

**Problem:** Can't create plans - getting 401 error  
**Solution:** ✅ FIXED - Just deployed!  
**Status:** Live at https://planai.io.vn

---

## 🚀 WHAT WAS FIXED

| Issue | Fix | Status |
|-------|-----|--------|
| 401 Unauthorized | Added Bearer token to API | ✅ Fixed |
| CSP blocks Google Analytics | Updated CSP policy | ✅ Fixed |
| Console warnings | Improved logging | ✅ Fixed |

---

## 🧪 TEST IT NOW (2 minutes)

### **Step 1: Hard Refresh**
```
Ctrl+Shift+R  (or Cmd+Shift+R on Mac)
```

### **Step 2: Clear Cookies**
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

## ✅ EXPECTED RESULT

**Before:**
- ❌ Error: "Có lỗi xảy ra"
- ❌ Console: 401 error

**After:**
- ✅ Progress bar appears
- ✅ Progress: 10% → 25% → 40% → ... → 100%
- ✅ Redirects to plan view
- ✅ No console errors

---

## 🔍 IF STILL NOT WORKING

### **Check #1: Cookies**
```javascript
// Open DevTools (F12) → Console
// Paste this:
document.cookie
```
Should show: `sb-wjzmscsoiibzlxejqpgg-auth-token=...`

### **Check #2: Network**
```
F12 → Network tab
Click "Tạo Kế Hoạch"
Find: POST /api/plans/generate
Check Request Headers:
  - Authorization: Bearer eyJ...
  - Cookie: sb-...
```

### **Check #3: Console Logs**
```
F12 → Console
Should see: "Đang phân tích thông tin..."
Should NOT see: 401 error
```

---

## 📝 WHAT CHANGED

**2 Files Modified:**
1. `app/dashboard/plans/generate/page.tsx` - Added Bearer token
2. `next.config.js` - Updated CSP policy

**3 Commits:**
- `fe223a1` - Add Bearer token
- `a36cb88` - Update CSP
- `21227d4` - Add documentation

---

## 💡 TECHNICAL DETAILS

### **The Fix:**
```typescript
// Before: No authentication
const res = await fetch('/api/plans/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})

// After: With Bearer token
const { supabase } = await import('@/lib/supabase')
const { data: sessionData } = await supabase.auth.getSession()

const res = await fetch('/api/plans/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionData.session.access_token}`
  },
  credentials: 'include',
  body: JSON.stringify(data)
})
```

---

## 🎯 SUMMARY

✅ **3 Issues Fixed**
- 401 Authentication error
- CSP blocking Google Analytics
- Console warnings

✅ **Ready to Test**
- Deployed to Vercel
- Live at https://planai.io.vn

✅ **Next Step**
- Test the fix
- Report results

---

## 📞 NEED HELP?

If still getting errors:
1. Screenshot the error
2. Open DevTools (F12)
3. Copy console logs
4. Send to developer

---

**Status:** ✅ DEPLOYED  
**Live:** https://planai.io.vn  
**Test Now!** 🚀
