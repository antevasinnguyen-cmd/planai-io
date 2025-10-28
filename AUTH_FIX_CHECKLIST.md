# 🔧 Checklist Sửa Lỗi Đăng Nhập OAuth

## ✅ Bước 1: Kiểm Tra Supabase Dashboard

### 1.1 Auth > URL Configuration
Vào: https://supabase.com/dashboard → Project → Settings > Auth

**Cần kiểm tra:**
- [ ] **Site URL**: `https://planai.io.vn` (KHÔNG có trailing slash)
- [ ] **Additional Redirect URLs** (nhập từng cái một, mỗi dòng riêng):
  ```
  https://planai.io.vn/auth/callback
  https://planai.io.vn/dashboard
  http://localhost:3000/auth/callback
  ```

**Lưu ý:**
- Không dùng wildcard `https://planai.io.vn/**`
- Mỗi URL phải chính xác, không có trailing slash

### 1.2 Auth > Providers > Google
Vào: https://supabase.com/dashboard → Project → Auth > Providers > Google

**Cần kiểm tra:**
- [ ] **Enabled**: Bật (toggle ON)
- [ ] **Client ID**: Khớp với Google Console (OAuth 2.0 Client IDs)
- [ ] **Client Secret**: Khớp với Google Console

**Nếu không có Client ID/Secret:**
1. Vào Google Console: https://console.cloud.google.com/
2. Chọn project
3. Vào APIs & Services > Credentials
4. Tìm OAuth 2.0 Client IDs (tên "PlanAI")
5. Copy Client ID và Client Secret
6. Paste vào Supabase

---

## ✅ Bước 2: Kiểm Tra Google Console

### 2.1 OAuth 2.0 Client IDs
Vào: https://console.cloud.google.com/ → APIs & Services > Credentials

**Authorized JavaScript origins:**
- [ ] `https://planai.io.vn`
- [ ] `http://localhost:3000` (nếu vẫn test local)
- [ ] `https://wjzmscsoiibzlxejqpgg.supabase.co` (Supabase domain)

**Authorized redirect URIs:**
- [ ] `https://wjzmscsoiibzlxejqpgg.supabase.co/auth/v1/callback` (BẮTBUỘC)
- [ ] `https://planai.io.vn/auth/v1/callback` (optional)
- [ ] `https://planai.io.vn/auth/callback` (optional, nhưng nên thêm)

### 2.2 OAuth Consent Screen
Vào: https://console.cloud.google.com/ → APIs & Services > OAuth consent screen

**Branding:**
- [ ] **App name**: PlanAI
- [ ] **User support email**: rosanguyen20s@gmail.com
- [ ] **Application home page**: https://planai.io.vn/
- [ ] **Privacy policy**: https://planai.io.vn/cookies
- [ ] **Terms of service**: https://planai.io.vn/terms

**Authorized domains:**
- [ ] `wjzmscsoiibzlxejqpgg.supabase.co`
- [ ] `planai.io.vn`

---

## ✅ Bước 3: Kiểm Tra Code

### 3.1 Route Handler Tạo Mới
File: `app/auth/callback/route.ts`

**Kiểm tra:**
- [ ] File tồn tại
- [ ] Có hàm `GET` để xử lý callback
- [ ] Gọi `exchangeCodeForSession(code)`
- [ ] Redirect tới `/dashboard` nếu thành công
- [ ] Redirect tới `/login?error=...` nếu thất bại

### 3.2 Callback Page
File: `app/auth/callback/page.tsx`

**Kiểm tra:**
- [ ] Là client component (`'use client'`)
- [ ] Chỉ hiển thị UI loading
- [ ] Không xử lý code exchange (route handler làm việc đó)

### 3.3 signInWithGoogle
File: `lib/supabase.ts` (dòng 28-69)

**Kiểm tra:**
- [ ] `redirectTo: ${window.location.origin}/auth/callback` (KHÔNG phải `/auth/v1/callback`)
- [ ] Gọi `supabase.auth.signInWithOAuth({ provider: 'google', ... })`

---

## ✅ Bước 4: Test Đăng Nhập

### 4.1 Local Test
```bash
npm run dev
# Vào http://localhost:3000/login
# Bấm "Đăng nhập với Google"
# Kiểm tra console (F12 > Console)
```

**Kỳ vọng:**
1. Chuyển tới Google login
2. Sau khi login, quay về `http://localhost:3000/auth/callback`
3. Route handler xử lý code exchange
4. Redirect tới `http://localhost:3000/dashboard`
5. Thấy dashboard (không lỗi)

**Nếu lỗi:**
- Mở DevTools > Console
- Tìm log `=== ROUTE HANDLER: ...`
- Copy log gửi lại

### 4.2 Production Test
```bash
# Deploy lên Vercel (nếu chưa)
# Vào https://planai.io.vn/login
# Bấm "Đăng nhập với Google"
# Kiểm tra console (F12 > Console)
```

---

## ✅ Bước 5: Debug Nếu Vẫn Lỗi

### 5.1 Kiểm Tra Console Log
Mở DevTools > Console, tìm:
```
=== ROUTE HANDLER: Callback received ===
=== ROUTE HANDLER: Exchanging code for session ===
```

**Nếu không thấy:**
- Route handler không được gọi
- Kiểm tra lại Supabase Redirect URLs

**Nếu thấy error:**
```
=== ROUTE HANDLER: Exchange error ===
```
- Copy error message
- Gửi lại cho mình

### 5.2 Kiểm Tra Cookies
Mở DevTools > Application > Cookies > https://planai.io.vn

**Sau khi login thành công, phải có:**
- `sb-wjzmscsoiibzlxejqpgg-auth-token` (access token)
- `sb-wjzmscsoiibzlxejqpgg-auth-token-code-verifier` (PKCE)

**Nếu không có:**
- Route handler không set cookies
- Kiểm tra lại `exchangeCodeForSession`

### 5.3 Kiểm Tra Network
Mở DevTools > Network, filter "callback"

**Kỳ vọng:**
1. Request tới `/auth/callback?code=...&state=...` (GET)
2. Response: 302 redirect tới `/dashboard`
3. Request tới `/dashboard` (GET)
4. Response: 200 OK

**Nếu khác:**
- Route handler có vấn đề
- Kiểm tra lại code

---

## 📋 Tóm Lại

| Bước | Kiểm Tra | Status |
|------|----------|--------|
| 1 | Supabase URL Config | [ ] |
| 2 | Supabase Google Provider | [ ] |
| 3 | Google Console OAuth Client | [ ] |
| 4 | Google Console Consent Screen | [ ] |
| 5 | Route Handler Tạo Mới | [ ] |
| 6 | Callback Page Đơn Giản | [ ] |
| 7 | signInWithGoogle Đúng | [ ] |
| 8 | Local Test | [ ] |
| 9 | Production Test | [ ] |

---

## 🚀 Tiếp Theo

1. Hoàn thành checklist trên
2. Test đăng nhập
3. Nếu vẫn lỗi, gửi lại console log + network tab
4. Mình sẽ debug thêm

---

**Created:** 28/10/2025
**Status:** 🔧 In Progress
