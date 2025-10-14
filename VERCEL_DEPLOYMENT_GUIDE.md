# 🚀 Hướng Dẫn Triển Khai Thanh Toán Lên Vercel

## 📋 Tổng Quan

Hướng dẫn này sẽ giúp bạn cấu hình đầy đủ các biến môi trường cần thiết trên Vercel để hệ thống thanh toán hoạt động chính xác.

---

## 🔧 Bước 1: Truy Cập Vercel Dashboard

1. Đăng nhập vào [Vercel](https://vercel.com)
2. Chọn project **planai-io**
3. Vào **Settings** → **Environment Variables**

---

## 🔑 Bước 2: Thêm Biến Môi Trường

### A. SePay Configuration (VietQR Pro)

Thêm các biến sau:

| Tên Biến | Giá Trị | Môi Trường |
|----------|---------|------------|
| `SEPAY_ACCOUNT_NUMBER` | `FLIOAI000` | Production, Preview, Development |
| `SEPAY_TOKEN` | `40KPESXRD5XUKP6WYLKYOJGMBMJBRQZ4SEXDLUNDTCBZVZFIJL5I1FVAMRZGVK` | Production, Preview, Development |
| `SEPAY_API_URL` | `https://my.sepay.vn/userapi/transactions/create` | Production, Preview, Development |
| `SEPAY_WEBHOOK_SECRET` | `https://planai.io.vn/api/webhook/sepay` | Production, Preview, Development |

### B. PayOS Configuration

Thêm các biến sau:

| Tên Biến | Giá Trị | Môi Trường |
|----------|---------|------------|
| `PAYOS_CLIENT_ID` | `2d884d13-bf7d-4733-89e4-2624b976aff2` | Production, Preview, Development |
| `PAYOS_API_KEY` | `f9e1a148-cbf3-4f24-be35-dfe90a5a14a9` | Production, Preview, Development |
| `PAYOS_CHECKSUM_KEY` | `a3b3caf969522d63ac1a656fb14ef14208b46acc8432f5e28b38c1ba8087dc03` | Production, Preview, Development |
| `PAYOS_API_URL` | `https://api-merchant.payos.vn/v2/payment-requests` | Production, Preview, Development |
| `PAYOS_WEBHOOK_SECRET` | `https://planai.io.vn/api/payment/payos-webhook` | Production, Preview, Development |

### C. App URL

| Tên Biến | Giá Trị | Môi Trường |
|----------|---------|------------|
| `NEXT_PUBLIC_APP_URL` | `https://planai.io.vn` | Production, Preview, Development |

---

## 🔔 Bước 3: Cấu Hình Webhook Trên SePay

1. Đăng nhập vào [SePay Dashboard](https://my.sepay.vn)
2. Vào **Cài đặt** → **Webhooks**
3. Thêm webhook mới với thông tin:
   - **URL**: `https://planai.io.vn/api/webhook/sepay`
   - **Kiểu chứng thực**: API Key
   - **Request Content Type**: application/json
   - **API Key**: `40KPESXRD5XUKP6WYLKYOJGMBMJBRQZ4SEXDLUNDTCBZVZFIJL5I1FVAMRZGVKWT`
4. Lưu cấu hình

---

## 🔔 Bước 4: Cấu Hình Webhook Trên PayOS

1. Đăng nhập vào [PayOS Dashboard](https://my.payos.vn)
2. Vào **Cài đặt** → **Webhooks**
3. Thêm webhook mới với thông tin:
   - **URL**: `https://planai.io.vn/api/payment/payos-webhook`
   - **Events**: Chọn tất cả payment events
4. Lưu cấu hình

---

## ✅ Bước 5: Kiểm Tra Cấu Hình

### Test Webhooks

Sau khi deploy, kiểm tra webhooks hoạt động:

```bash
# Test SePay webhook
curl https://planai.io.vn/api/webhook/sepay

# Test PayOS webhook
curl https://planai.io.vn/api/payment/payos-webhook
```

Cả hai endpoint phải trả về status `ok`.

### Test Payment Flow

1. Truy cập: https://planai.io.vn/pricing
2. Chọn một gói dịch vụ
3. Chọn phương thức thanh toán (SePay hoặc PayOS)
4. Quét mã QR và chuyển khoản
5. Kiểm tra:
   - ✅ QR code hiển thị đúng
   - ✅ Thông tin chuyển khoản chính xác
   - ✅ Lưu ý thanh toán hiển thị rõ ràng
   - ✅ Hệ thống tự động xác nhận sau 1-2 phút

---

## 🐛 Xử Lý Lỗi Thường Gặp

### 1. Webhook không nhận được thông báo

**Nguyên nhân**: URL webhook chưa được cấu hình đúng trên SePay/PayOS

**Giải pháp**:
- Kiểm tra lại URL webhook trên dashboard
- Đảm bảo URL là `https://planai.io.vn/api/webhook/sepay` (không có dấu `/` cuối)
- Kiểm tra API key đã đúng chưa

### 2. Payment không được xác nhận tự động

**Nguyên nhân**: 
- Số tiền chuyển khoản không khớp
- Nội dung chuyển khoản không đúng
- Webhook chưa được kích hoạt

**Giải pháp**:
- Kiểm tra logs trong Vercel Dashboard → Functions → Logs
- Tìm kiếm `SEPAY WEBHOOK` hoặc `PAYOS WEBHOOK`
- Xem chi tiết lỗi trong logs

### 3. QR code không hiển thị

**Nguyên nhân**: 
- API SePay không trả về QR code
- URL VietQR không đúng định dạng

**Giải pháp**:
- Kiểm tra logs API `/api/payment/create`
- Verify SEPAY_TOKEN còn hiệu lực
- Kiểm tra account number đúng chưa

---

## 📊 Monitoring

### Xem Logs Realtime

```bash
vercel logs --follow
```

### Xem Logs Webhook

```bash
vercel logs --follow | grep "WEBHOOK"
```

### Xem Logs Payment

```bash
vercel logs --follow | grep "PAYMENT"
```

---

## 🔒 Bảo Mật

### ⚠️ QUAN TRỌNG

- **KHÔNG** commit file `.env` vào Git
- **KHÔNG** chia sẻ API keys/tokens công khai
- Chỉ thêm environment variables qua Vercel Dashboard
- Định kỳ rotate API keys (3-6 tháng/lần)

### Checklist Bảo Mật

- [ ] File `.env` đã được thêm vào `.gitignore`
- [ ] Tất cả API keys đã được thêm vào Vercel
- [ ] Webhooks chỉ chấp nhận requests từ SePay/PayOS
- [ ] API keys được verify trong webhook handlers
- [ ] HTTPS được bật cho tất cả endpoints

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề, kiểm tra:

1. **Vercel Logs**: Settings → Functions → Logs
2. **SePay Dashboard**: Xem transaction history
3. **PayOS Dashboard**: Xem payment history
4. **Supabase**: Kiểm tra bảng `payments` và `users`

---

## 🎯 Checklist Triển Khai

- [ ] Đã thêm tất cả environment variables vào Vercel
- [ ] Đã cấu hình webhook trên SePay
- [ ] Đã cấu hình webhook trên PayOS
- [ ] Đã test webhook endpoints (GET request)
- [ ] Đã test payment flow end-to-end
- [ ] Đã kiểm tra logs không có lỗi
- [ ] Đã verify thanh toán tự động hoạt động

---

## 🚀 Deploy

Sau khi hoàn thành tất cả các bước trên:

```bash
git add .
git commit -m "feat: Complete payment integration with webhooks"
git push origin main
```

Vercel sẽ tự động deploy. Theo dõi quá trình deploy tại: https://vercel.com/dashboard

---

**✅ Hoàn tất! Hệ thống thanh toán đã sẵn sàng hoạt động.**
