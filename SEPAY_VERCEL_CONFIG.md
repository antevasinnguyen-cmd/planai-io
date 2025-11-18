# SePay Vercel Configuration Guide

## Environment Variables cần thêm vào Vercel

Vào **Vercel Dashboard** → Project `planai-io` → **Settings** → **Environment Variables**

### 1. SEPAY_SECRET_KEY (MỚI - cần thêm)

- **Name**: `SEPAY_SECRET_KEY`
- **Value**: `spsk_live_XqkQwjVfRkr3XsD3FeEXmuX25QNXecw2`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

**Mục đích**: Secret key để verify webhook signature (nếu SePay yêu cầu)

### 2. SEPAY_API_KEY (ĐÃ CÓ - kiểm tra lại)

- **Name**: `SEPAY_API_KEY`
- **Value**: `40KPESXRD5XUKP6WYLKYOJGMBMJBRQZ4SEXDLUNDTCBZVZFIJL5I1FVAMRZGVKWT`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

**Mục đích**: API key để xác thực webhook từ SePay

### 3. SEPAY_ACCOUNT_NUMBER (ĐÃ CÓ - kiểm tra lại)

- **Name**: `SEPAY_ACCOUNT_NUMBER`
- **Value**: `FLIOAI000`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

**Mục đích**: Số tài khoản ngân hàng nhận tiền

### 4. SEPAY_WEBHOOK_SECRET (TÙY CHỌN)

- **Name**: `SEPAY_WEBHOOK_SECRET`
- **Value**: `spsk_live_XqkQwjVfRkr3XsD3FeEXmuX25QNXecw2` (giống Secret Key)
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

**Mục đích**: Backup cho webhook verification

---

## Cấu hình SePay Dashboard

Đăng nhập vào **SePay Dashboard** (`https://my.sepay.vn`)

### 1. Cấu hình IPN (Instant Payment Notification)

Vào **Cài đặt** → **Tích hợp IPN**

#### A. IPN URL
```
https://planai.io.vn/api/webhook/sepay
```

#### B. Phương thức xác thực
- **Auth Type**: `Api Key` (hoặc `Apikey`)
- **Header Name**: `Authorization`
- **Header Value**: `Apikey 40KPESXRD5XUKP6WYLKYOJGMBMJBRQZ4SEXDLUNDTCBZVZFIJL5I1FVAMRZGVKWT`

#### C. Content-Type
```
application/json
```

#### D. Trạng thái
- ✅ **Bật** (Active/Enabled)

### 2. Cấu trúc mã thanh toán

Vào **Cài đặt** → **Cấu trúc mã thanh toán**

- **Tiền tố**: `PLAN`
- **Hậu tố**: 3-10 ký tự số nguyên
- **Ví dụ**: `PLAN3441547463`

### 3. Tài khoản ngân hàng

Vào **Tài khoản** → **Tài khoản ngân hàng**

Đảm bảo tài khoản sau đã được liên kết:
- **Số tài khoản**: `FLIOAI000`
- **Ngân hàng**: MB Bank (970422)
- **Chủ tài khoản**: NGUYEN THI KHANH HUYEN
- **Trạng thái**: ✅ Đã kích hoạt

---

## Kiểm tra sau khi cấu hình

### 1. Test Webhook từ SePay Dashboard

Trong SePay Dashboard, tìm chức năng **Test Webhook** hoặc **Gửi thử webhook**

Payload test:
```json
{
  "id": 12345,
  "gateway": "MB Bank",
  "transactionDate": "2025-11-18T05:00:00.000Z",
  "accountNumber": "FLIOAI000",
  "content": "PLAN1234567890",
  "transferType": "in",
  "transferAmount": 169000,
  "accumulated": 1000000,
  "referenceCode": "MBVCB.12345",
  "description": "Test webhook"
}
```

**Kết quả mong đợi**:
- HTTP Status: `200 OK`
- Response: `{"success": true, ...}`

### 2. Kiểm tra Vercel Logs

Sau khi gửi test webhook, vào **Vercel** → **Deployments** → **Latest** → **Logs**

Tìm log:
```
=== SEPAY WEBHOOK: Received ===
=== SEPAY WEBHOOK: API Key verified ===
```

### 3. Test thanh toán thật

1. Tạo payment mới qua `/api/payment/create`
2. Lấy transaction ID (ví dụ: `PLAN3441547463`)
3. Chuyển khoản qua MB Bank:
   - Số TK: `FLIOAI000`
   - Số tiền: `169000`
   - Nội dung: `PLAN3441547463` (chính xác từ QR code)
4. Kiểm tra:
   - ✅ MB Bank: Giao dịch thành công
   - ✅ SePay Dashboard: Giao dịch xuất hiện
   - ✅ Vercel Logs: Webhook được gọi
   - ✅ PlanAI: Thanh toán được xác nhận

---

## Database (Supabase) - KHÔNG CẦN CHẠY SQL MỚI

Tất cả các bảng cần thiết **đã tồn tại**:

### ✅ Bảng `payments`
```sql
-- Đã có, không cần tạo lại
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  subscription_tier TEXT,
  amount DECIMAL,
  currency TEXT DEFAULT 'VND',
  status TEXT,
  payment_method TEXT,
  transaction_id TEXT,
  order_code BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);
```

### ✅ Bảng `profiles`
```sql
-- Đã có, không cần tạo lại
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  subscription_tier TEXT DEFAULT 'free',
  chat_count INTEGER DEFAULT 0,
  plan_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### ✅ Bảng `subscriptions`
```sql
-- Đã có, không cần tạo lại
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  tier TEXT,
  status TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Kết luận**: ❌ **KHÔNG CẦN** chạy SQL migration mới trong Supabase.

---

## Checklist cấu hình

### Vercel Environment Variables
- [ ] `SEPAY_SECRET_KEY` = `spsk_live_XqkQwjVfRkr3XsD3FeEXmuX25QNXecw2`
- [x] `SEPAY_API_KEY` = `40KPESXRD5XUKP6WYLKYOJGMBMJBRQZ4SEXDLUNDTCBZVZFIJL5I1FVAMRZGVKWT`
- [x] `SEPAY_ACCOUNT_NUMBER` = `FLIOAI000`
- [x] `NEXT_PUBLIC_SUPABASE_URL` = (đã có)
- [x] `SUPABASE_SERVICE_ROLE_KEY` = (đã có)

### SePay Dashboard
- [ ] IPN URL: `https://planai.io.vn/api/webhook/sepay`
- [ ] Auth Type: `Api Key`
- [ ] API Key: `40KPESXRD5XUKP6WYLKYOJGMBMJBRQZ4SEXDLUNDTCBZVZFIJL5I1FVAMRZGVKWT`
- [ ] Content-Type: `application/json`
- [ ] Trạng thái: Bật (Active)
- [ ] Cấu trúc mã: `PLAN` + 3-10 số
- [ ] Tài khoản ngân hàng: `FLIOAI000` đã liên kết

### Test
- [ ] Test webhook từ SePay Dashboard → HTTP 200
- [ ] Test thanh toán thật → Webhook được gọi
- [ ] Vercel logs hiển thị webhook received
- [ ] Payment status updated to `completed`
- [ ] User subscription upgraded

---

## Liên hệ hỗ trợ

Nếu vẫn gặp vấn đề sau khi cấu hình:

### SePay Support
- **Email**: support@sepay.vn
- **Thông tin cần cung cấp**:
  - Mã đơn vị: `SP-LIVE-NHB84AA6`
  - Số tài khoản: `FLIOAI000`
  - IPN URL: `https://planai.io.vn/api/webhook/sepay`
  - Vấn đề: Webhook không được gọi sau khi chuyển khoản

### Kiểm tra Webhook Endpoint
```bash
# Test webhook endpoint
curl -X GET https://planai.io.vn/api/webhook/sepay

# Kết quả mong đợi: HTTP 200
```

### Debug Logs
Xem Vercel logs real-time:
```
Vercel Dashboard → Deployments → Latest → Logs → Live
```

Filter logs:
```
/api/webhook/sepay
SEPAY WEBHOOK
```
