# 🔍 Debug Auth Flow

## 🚨 Vấn Đề Hiện Tại

```
hasSession: false
→ Nghĩa là cookies chưa được set
→ Nghĩa là route handler `/auth/callback/route.ts` chưa được gọi
→ Nghĩa là Google redirect không tới `/auth/callback`
```

## 🔧 Cách Fix

### Bước 1: Kiểm Tra Supabase Redirect URLs

**Vào:** https://supabase.com/dashboard → Project → Settings > Auth

**Tìm mục "Additional Redirect URLs"**

Phải có:
```
https://planai.io.vn/auth/callback
https://planai.io.vn/dashboard
http://localhost:3000/auth/callback
```

**KHÔNG nên có:**
```
https://planai.io.vn/**
https://planai.io.vn/auth/v1/callback  ← Đây là của Supabase, không phải của bạn
```

### Bước 2: Xóa Redirect URLs Sai

Nếu có `https://planai.io.vn/**` hoặc `https://planai.io.vn/auth/v1/callback`, **XÓA chúng đi**.

Chỉ giữ lại:
```
https://planai.io.vn/auth/callback
https://planai.io.vn/dashboard
http://localhost:3000/auth/callback
```

### Bước 3: Rebuild Next.js

```bash
# Dừng dev server (Ctrl+C)
npm run dev
# Hoặc
yarn dev
```

### Bước 4: Test Lại

1. Mở http://localhost:3000/login
2. Bấm "Đăng nhập với Google"
3. Mở DevTools > Network tab
4. Tìm request tới `/auth/callback?code=...`
5. Kiểm tra Console xem có log `=== ROUTE HANDLER: Callback received ===` không

---

## 📋 Checklist

- [ ] Vào Supabase Dashboard
- [ ] Kiểm tra "Additional Redirect URLs"
- [ ] Xóa các URL sai (nếu có)
- [ ] Thêm `https://planai.io.vn/auth/callback` (nếu chưa có)
- [ ] Thêm `http://localhost:3000/auth/callback` (nếu chưa có)
- [ ] Save
- [ ] Rebuild Next.js (`npm run dev`)
- [ ] Test lại đăng nhập

---

## 🎯 Kỳ Vọng Sau Khi Fix

1. Bấm "Đăng nhập với Google"
2. Chuyển tới Google login
3. Sau khi login, quay về `http://localhost:3000/auth/callback`
4. Console hiển thị: `=== ROUTE HANDLER: Callback received ===`
5. Redirect tới `/dashboard`
6. Thấy dashboard (không lỗi)

---

## 🆘 Nếu Vẫn Lỗi

Gửi lại:
1. Screenshot Supabase Dashboard (Auth > URL Configuration)
2. Console log (F12 > Console)
3. Network tab (F12 > Network, filter "callback")

