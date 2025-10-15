# 🔴 SỬA LỖI: SePay Configuration is Not Complete

## Vấn Đề Phát Hiện

Webhook SePay đang hoạt động ✅ nhưng **thiếu biến môi trường** trên Vercel:

```json
{
  "sepay": {
    "token": null,           // ❌ THIẾU
    "account": null,         // ❌ THIẾU
    "webhook": "https://planai.io.vn/api/webhook/sepay",  // ✅ OK
    "configured": false      // ❌ CHƯA HOÀN CHỈNH
  }
}
```

---

## 🔧 Giải Pháp: Thêm Biến Môi Trường Vào Vercel

### Bước 1: Truy Cập Vercel Dashboard

1. Đăng nhập: https://vercel.com
2. Chọn project **planai-io**
3. Vào **Settings** → **Environment Variables**

### Bước 2: Thêm Các Biến Sau

Click **Add New** và thêm từng biến:

#### 1. SEPAY_ACCOUNT_NUMBER
- **Name**: `SEPAY_ACCOUNT_NUMBER`
- **Value**: `FLIOAI000`
- **Environment**: Chọn tất cả (Production, Preview, Development)
- Click **Save**

#### 2. SEPAY_TOKEN
- **Name**: `SEPAY_TOKEN`
- **Value**: `40KPESXRD5XUKP6WYLKYOJGMBMJBRQZ4SEXDLUNDTCBZVZFIJL5I1FVAMRZGVK`
- **Environment**: Chọn tất cả (Production, Preview, Development)
- Click **Save**

#### 3. SEPAY_API_URL
- **Name**: `SEPAY_API_URL`
- **Value**: `https://my.sepay.vn/userapi/transactions/create`
- **Environment**: Chọn tất cả (Production, Preview, Development)
- Click **Save**

#### 4. SEPAY_WEBHOOK_SECRET
- **Name**: `SEPAY_WEBHOOK_SECRET`
- **Value**: `https://planai.io.vn/api/webhook/sepay`
- **Environment**: Chọn tất cả (Production, Preview, Development)
- Click **Save**

### Bước 3: Redeploy

Sau khi thêm xong tất cả biến:

1. Vào tab **Deployments**
2. Click vào deployment mới nhất
3. Click nút **⋯** (3 chấm)
4. Chọn **Redeploy**
5. Chọn **Use existing Build Cache**
6. Click **Redeploy**

---

## ✅ Kiểm Tra Sau Khi Deploy

### 1. Kiểm tra config
Truy cập: https://planai.io.vn/api/payment/check-config

Kết quả mong đợi:
```json
{
  "sepay": {
    "token": "40KP...",      // ✅ Có giá trị
    "account": "FLIO...",    // ✅ Có giá trị
    "webhook": "https://planai.io.vn/api/webhook/sepay",
    "configured": true       // ✅ TRUE
  }
}
```

### 2. Test thanh toán
1. Vào https://planai.io.vn/pricing
2. Chọn gói bất kỳ
3. Chọn phương thức **VietQR Pro (SePay)**
4. Click **Thanh toán**
5. **KHÔNG** còn lỗi "SePay configuration is not complete"

---

## 📸 Screenshot Hướng Dẫn

### Thêm Environment Variable:

1. Click **Add New**
2. Nhập **Name** và **Value**
3. Chọn **All Environments** (Production, Preview, Development)
4. Click **Save**

### Redeploy:

1. Deployments → Click deployment mới nhất
2. Click **⋯** → **Redeploy**
3. Chọn **Use existing Build Cache**
4. Click **Redeploy**

---

## 🎯 Checklist

- [ ] Thêm `SEPAY_ACCOUNT_NUMBER` vào Vercel
- [ ] Thêm `SEPAY_TOKEN` vào Vercel
- [ ] Thêm `SEPAY_API_URL` vào Vercel
- [ ] Thêm `SEPAY_WEBHOOK_SECRET` vào Vercel
- [ ] Redeploy project
- [ ] Kiểm tra `/api/payment/check-config` → `configured: true`
- [ ] Test thanh toán SePay → Không còn lỗi

---

## 💡 Lưu Ý

- Webhook SePay đã hoạt động: https://planai.io.vn/api/webhook/sepay ✅
- Chỉ thiếu biến môi trường trên Vercel
- Sau khi thêm biến và redeploy, SePay sẽ hoạt động ngay

---

**Thời gian ước tính: 5 phút**
