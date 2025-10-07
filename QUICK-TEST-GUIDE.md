# 🚀 HƯỚNG DẪN TEST NHANH LUỒNG OAUTH

## ⚡ QUICK START

### 1. Setup Environment (Chỉ làm 1 lần)
```bash
cd "/Users/mf840/Documents/BUILD APP/SaaS 1"

# Tạo .env.local với Supabase credentials
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://wjzmscsoiibzlxejqpgg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqem1zY3NvaWliemx4ZWpxcGdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NzQwODIsImV4cCI6MjA3MzM1MDA4Mn0.w6EeucNqmyNahoA8KZVjDYLy3ZgbTyqzVuiOq9MCZGA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqem1zY3NvaWliemx4ZWpxcGdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc3NDA4MiwiZXhwIjoyMDczMzUwMDgyfQ.C0OlpsyqnnG6CaMDnhv4M6GI4lTN3AyK4sldWl_UpZk
NEXT_PUBLIC_APP_URL=https://planai.io.vn
EOF
```

### 2. Build & Deploy
```bash
# Clean build
rm -rf .next

# Build production
npm run build

# Deploy to Vercel
npx vercel --prod
```

## 🧪 TEST CASES

### Test 1: Đăng Ký Mới (2 phút)
```
1. Mở Chrome Incognito
2. Vào: https://planai.io.vn/signup
3. Click: "Đăng ký bằng Google"
4. Chọn tài khoản Google
5. ✅ EXPECTED: Redirect to https://planai.io.vn/dashboard
6. ✅ EXPECTED: Thấy thông báo "Đăng nhập thành công"
7. ✅ EXPECTED: Dashboard hiển thị đầy đủ
```

### Test 2: Đăng Nhập (2 phút)
```
1. Mở Chrome Incognito
2. Vào: https://planai.io.vn/login
3. Click: "Đăng nhập bằng Google"
4. Chọn tài khoản Google
5. ✅ EXPECTED: Redirect to https://planai.io.vn/dashboard
6. ✅ EXPECTED: Thấy thông báo "Đăng nhập thành công"
7. ✅ EXPECTED: Dashboard hiển thị đầy đủ
```

### Test 3: Trang Account (1 phút)
```
1. Đăng nhập thành công
2. Vào: https://planai.io.vn/account
3. ✅ EXPECTED: Account page load đúng
4. ✅ EXPECTED: Hiển thị user info, subscription, settings
```

### Test 4: Logout (1 phút)
```
1. Đăng nhập thành công
2. Click avatar → Logout
3. ✅ EXPECTED: Redirect to https://planai.io.vn/
4. ✅ EXPECTED: Không còn session
```

## 🔍 DEBUG NHANH

### Mở Browser Console (F12)
Khi test, check các logs sau:

#### ✅ Logs Đúng (Signup/Login)
```javascript
// 1. Click "Đăng nhập bằng Google"
=== SUPABASE: Bắt đầu đăng nhập với Google ===

// 2. Tại /auth/callback
=== CALLBACK: Starting ===
=== CALLBACK: Success === user@example.com
=== CALLBACK: Redirecting to /dashboard ===

// 3. Tại /dashboard
=== AUTHCONTEXT: SIGNED_IN event === user@example.com
=== DASHBOARD: Có user, khởi tạo dashboard ===
=== DASHBOARD: Hiển thị thông báo thành công ===
```

#### ❌ Logs Lỗi (Cần Fix)
```javascript
// Nếu thấy:
=== CALLBACK: No session ===
// → Check Supabase credentials trong .env.local

// Nếu thấy:
=== DASHBOARD: Không có user, chuyển hướng login ===
// → Check auth context có load session không

// Nếu thấy:
redirect_uri_mismatch
// → Check Google Console redirect URIs
```

### Check LocalStorage
```javascript
// Mở Console, chạy:
console.log({
  auth_success: localStorage.getItem('auth_success'),
  auth_user_email: localStorage.getItem('auth_user_email')
})

// ✅ Sau login thành công:
// { auth_success: "true", auth_user_email: "user@example.com" }

// ✅ Sau dashboard load:
// { auth_success: null, auth_user_email: null }
```

### Check Network Tab
```
1. Mở Network tab (F12 → Network)
2. Filter: "auth"
3. ✅ Phải thấy:
   - Request to: accounts.google.com
   - Callback to: planai.io.vn/auth/callback
   - Supabase token: wjzmscsoiibzlxejqpgg.supabase.co/auth/v1/token
   - Dashboard: planai.io.vn/dashboard
```

## 🐛 COMMON ERRORS & QUICK FIX

### Error 1: "redirect_uri_mismatch"
```
❌ Lỗi: Google OAuth error
✅ Fix: 
1. Vào Google Cloud Console
2. Check "Authorized redirect URIs" có:
   - https://wjzmscsoiibzlxejqpgg.supabase.co/auth/v1/callback
   - https://planai.io.vn/auth/v1/callback
```

### Error 2: Redirect về trang chủ
```
❌ Lỗi: Sau OAuth redirect về / thay vì /dashboard
✅ Fix:
1. Check .env.local có đúng credentials
2. Clear browser cache
3. Test lại trong incognito
```

### Error 3: Dashboard loading vô hạn
```
❌ Lỗi: Dashboard hiển thị "Đang tải..." mãi
✅ Fix:
1. Check console có lỗi không
2. Verify Supabase connection
3. Check middleware logs
```

### Error 4: Success message không hiển thị
```
❌ Lỗi: Không thấy "Đăng nhập thành công"
✅ Fix:
1. Check localStorage có auth_success
2. Verify SuccessAlert component
3. Check dashboard useEffect
```

## 📊 CHECKLIST TRƯỚC KHI TEST

- [ ] `.env.local` đã tạo với đúng credentials
- [ ] `npm run build` thành công
- [ ] Deploy to Vercel thành công
- [ ] Supabase URL Configuration đúng
- [ ] Google Console OAuth đúng
- [ ] Browser cache đã clear
- [ ] Sử dụng incognito mode

## 🎯 SUCCESS CRITERIA

### ✅ Test Passed Khi:
1. **Signup**: Google OAuth → Dashboard (có success message)
2. **Login**: Google OAuth → Dashboard (có success message)
3. **Dashboard**: Load đầy đủ user info, usage stats
4. **Account**: Page load đúng, hiển thị settings
5. **Logout**: Redirect về trang chủ, session cleared

### ❌ Test Failed Khi:
1. Redirect về trang chủ thay vì dashboard
2. Dashboard loading vô hạn
3. Success message không hiển thị
4. Account page không mở được
5. Console có errors

## 📞 SUPPORT

Nếu gặp vấn đề:
1. Check console logs
2. Check network tab
3. Verify .env.local
4. Clear cache và test lại
5. Check LUONG-AUTH-FIXED.md để debug chi tiết

---

**Chúc bạn test thành công!** 🎉
