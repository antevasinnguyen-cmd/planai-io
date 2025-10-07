# 🔧 FIX REDIRECT LOOP - TRANG LOAD LIÊN TỤC

## ❌ VẤN ĐỀ

**Triệu chứng**:
- Truy cập `/dashboard` → Redirect to `/login?redirectedFrom=/dashboard`
- Trang load liên tục, không dừng
- Console error: "Define @import rules at the top of the stylesheet"
- Không thể vào dashboard

**URL bị loop**: `https://planai.io.vn/login?redirectedFrom=%2Fdashboard`

## 🎯 NGUYÊN NHÂN

**Redirect Loop** giữa middleware và auth-context:

```
1. User vào /dashboard
   ↓
2. Middleware check session → Không có session (chưa load xong)
   ↓
3. Middleware redirect to /login?redirectedFrom=/dashboard
   ↓
4. Auth-context detect user đã login
   ↓
5. Auth-context redirect về /dashboard
   ↓
6. Lặp lại từ bước 2 → LOOP VÔ HẠN
```

**Root cause**: 
- Middleware check session quá sớm (server-side)
- Auth-context check session sau (client-side)
- Conflict giữa 2 logic redirect

## ✅ GIẢI PHÁP

### Fix 1: Tắt Middleware Redirect Logic

**File**: `middleware.ts`

**Trước** (BAD - gây loop):
```typescript
export async function middleware(req: NextRequest) {
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()
  
  // ❌ BAD: Redirect ở middleware
  if (!session && isProtectedPath) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  
  if (session && req.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
}
```

**Sau** (GOOD - chỉ refresh session):
```typescript
export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  try {
    // ✅ GOOD: Chỉ refresh session, không redirect
    await supabase.auth.getSession()
    return res
  } catch (error) {
    return res
  }
}
```

### Fix 2: Để Auth Context Xử Lý Redirect

**File**: `lib/auth-context.tsx`

Auth context đã xử lý redirect đúng:
```typescript
useEffect(() => {
  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    // ✅ Redirect nếu đã login và đang ở /login
    if (session && window.location.pathname === '/login') {
      window.location.replace('/dashboard')
    }
  }
  
  getSession()
}, [])
```

### Fix 3: Dashboard Page Auth Check

**File**: `app/dashboard/page.tsx`

Dashboard check auth và redirect nếu chưa login:
```typescript
useEffect(() => {
  if (!authLoading && !user) {
    window.location.href = '/login'
    return
  }
  
  if (user) {
    initializeDashboard()
  }
}, [user, authLoading])
```

## 🚀 DEPLOYMENT

### Đã push lên GitHub:
```bash
git commit -m "fix: Tắt middleware redirect để tránh redirect loop"
git push origin main
```

### Vercel sẽ auto-deploy:
- Detect commit mới
- Build với middleware mới
- Deploy trong 4-6 phút

## 🧪 TEST SAU KHI DEPLOY

### Test Case 1: Login Flow
```
1. Vào: https://planai.io.vn/login
2. Click "Đăng nhập bằng Google"
3. Expected: ✅ Redirect to /dashboard (không loop)
4. Expected: ✅ Dashboard loads correctly
```

### Test Case 2: Direct Dashboard Access
```
1. Chưa login, vào: https://planai.io.vn/dashboard
2. Expected: ✅ Redirect to /login (1 lần duy nhất)
3. Login với Google
4. Expected: ✅ Redirect to /dashboard (không loop)
```

### Test Case 3: Already Logged In
```
1. Đã login, vào: https://planai.io.vn/login
2. Expected: ✅ Redirect to /dashboard ngay lập tức
3. Expected: ✅ Không có loop
```

## 🔍 DEBUG

### Check Console Logs

**✅ Logs đúng** (không loop):
```javascript
=== AUTHCONTEXT: Khởi tạo ===
=== AUTHCONTEXT: Phiên ban đầu === { hasSession: true }
=== DASHBOARD: useEffect === { user: {...}, authLoading: false }
=== DASHBOARD: Có user, khởi tạo dashboard ===
```

**❌ Logs sai** (có loop):
```javascript
=== MIDDLEWARE: Chưa đăng nhập, chuyển hướng login ===
=== AUTHCONTEXT: Đã đăng nhập, chuyển hướng dashboard ===
=== MIDDLEWARE: Chưa đăng nhập, chuyển hướng login ===
// Lặp lại vô hạn...
```

### Check Network Tab

**✅ Network đúng**:
```
1. GET /dashboard → 200 OK
2. Load assets
3. No more redirects
```

**❌ Network sai** (loop):
```
1. GET /dashboard → 307 Redirect to /login
2. GET /login → 307 Redirect to /dashboard
3. GET /dashboard → 307 Redirect to /login
// Lặp lại vô hạn...
```

## 📋 CHECKLIST

### Pre-Deploy
- [x] Middleware chỉ refresh session
- [x] Auth-context xử lý redirect
- [x] Dashboard có auth check
- [x] Committed và pushed

### Post-Deploy (sau 5 phút)
- [ ] Clear browser cache
- [ ] Test login flow
- [ ] Test direct dashboard access
- [ ] Test already logged in
- [ ] Verify không có loop

## ⚠️ NẾU VẪN CÓ LOOP

### Solution 1: Clear Browser Cache
```
1. Mở DevTools (F12)
2. Right-click Refresh button
3. Click "Empty Cache and Hard Reload"
4. Test lại
```

### Solution 2: Clear Cookies
```
1. DevTools → Application → Cookies
2. Delete all cookies cho planai.io.vn
3. Test lại
```

### Solution 3: Incognito Mode
```
1. Mở Chrome Incognito (Ctrl+Shift+N)
2. Vào https://planai.io.vn/login
3. Test login flow
```

### Solution 4: Check Vercel Logs
```
1. Vercel Dashboard → Deployments
2. Click latest deployment
3. Tab "Functions" → Check logs
4. Look for redirect errors
```

## 🎯 EXPECTED RESULT

Sau khi deploy:

### ✅ Login Flow Hoạt Động:
1. User vào `/login`
2. Click Google OAuth
3. Callback xử lý
4. Redirect to `/dashboard` (1 lần duy nhất)
5. Dashboard loads

### ✅ Không Còn Loop:
- Trang không load liên tục
- URL không thay đổi liên tục
- Console không có redirect logs lặp lại
- Network tab không có 307 redirects lặp lại

---

**Vercel đang deploy! Đợi 5 phút rồi test lại!** 🚀
