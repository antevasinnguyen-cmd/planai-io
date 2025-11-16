# SePay Payment Flow - Comprehensive Guide

## 🔍 Vấn Đề Chính
- ❌ Payment không được lưu vào database từ lúc tạo
- ❌ SePay không ghi nhận giao dịch
- ❌ Trang thanh toán không xác nhận thành công/thất bại

## ✅ Giải Pháp Triệt Để

### 1. Transaction ID Format (✅ FIXED)
- **Format**: `PLAN` + 10 ký tự số (SePay requirement)
- **Ví dụ**: `PLAN1763282825`
- **Code**: `generateTransactionId()` trong `/app/api/payment/create/route.ts`

### 2. Payment Insert Fallback (✅ FIXED)
- **Vấn đề**: Payment không được lưu từ checkout
- **Giải pháp**: Webhook sẽ tự động tạo payment record nếu không tìm thấy
- **Code**: Fallback mechanism trong `/app/api/webhook/sepay/route.ts` (lines 169-225)

### 3. Webhook Response Status (✅ FIXED)
- **Requirement**: HTTP 200 hoặc 201 (SePay docs)
- **Fix**: Thêm `{ status: 200 }` vào webhook response
- **Code**: `/app/api/webhook/sepay/route.ts` (line 408)

### 4. Webhook Authentication (✅ VERIFIED)
- **Format**: `Authorization: Apikey YOUR_API_KEY`
- **Support**: 3 formats (Apikey, Bearer, plain)
- **Code**: Lines 66-84 trong `/app/api/webhook/sepay/route.ts`

### 5. Webhook URL (✅ CORRECT)
- **URL**: `https://planai.io.vn/api/webhook/sepay`
- **Auth Type**: API Key
- **Configured**: ✅ Đúng

---

## 📊 Luồng Thanh Toán Hoàn Chỉnh

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER CHECKOUT                                            │
│    - Chọn gói + phương thức SePay                          │
│    - Nhấn "Thanh toán"                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. API /api/payment/create                                  │
│    - Tạo transaction ID: PLAN + 10 số                      │
│    - Insert payment record (admin client bypass RLS)        │
│    - Trả về QR code URL                                    │
│    - Status: pending                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. FRONTEND REDIRECT                                        │
│    - Hiển thị QR code                                      │
│    - Countdown 30 phút                                     │
│    - Check status mỗi 5 giây                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. USER TRANSFER (SePay)                                    │
│    - Chuyển khoản SePay                                    │
│    - Nội dung: PLAN1763282825                             │
│    - Số tiền: 169000 VND                                  │
│    - Tài khoản: 0123499999 (MB Bank)                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. BANK RECEIVES MONEY                                      │
│    - MBbank (PlanAI) nhận tiền                            │
│    - SePay ghi nhận giao dịch                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. SEPAY WEBHOOK CALL                                       │
│    POST /api/webhook/sepay                                 │
│    Authorization: Apikey YOUR_KEY                          │
│    Body: {                                                 │
│      id: 92704,                                           │
│      content: "PLAN1763282825",                           │
│      transferType: "in",                                  │
│      transferAmount: 169000,                              │
│      ...                                                  │
│    }                                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. WEBHOOK HANDLER                                          │
│    - Xác thực API Key ✅                                   │
│    - Tìm payment record (hoặc tạo fallback) ✅            │
│    - Cập nhật status = completed ✅                       │
│    - Cấp gói + reset quota ✅                             │
│    - Gửi notification ✅                                  │
│    - Trả về: { success: true } + HTTP 200 ✅             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. FRONTEND AUTO-DETECT                                     │
│    - Check-status phát hiện completed                      │
│    - Redirect success page                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. SUCCESS PAGE                                             │
│    - "Thanh toán thành công" ✅                            │
│    - Gói đã được cấp ✅                                    │
│    - Quota đã được reset ✅                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Endpoints

### Test 1: Force Insert Payment
```bash
curl -X POST https://planai.io.vn/api/debug/force-insert-payment \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user","planId":"basic","amount":169000}'
```
✅ Nếu thành công → Database hoạt động bình thường

### Test 2: Full Flow Test
```bash
curl -X POST https://planai.io.vn/api/debug/full-flow-test \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user","planId":"basic","amount":169000}'
```
✅ Nếu thành công → Toàn bộ luồng hoạt động

### Test 3: Webhook Test
```bash
curl -X POST https://planai.io.vn/api/debug/webhook-test \
  -H "Content-Type: application/json" \
  -d '{"transactionId":"PLAN1234567890","amount":169000,"userId":"test-user"}'
```
✅ Nếu thành công → Webhook handler hoạt động

### Test 4: Payment Creation Test
```bash
curl -X POST https://planai.io.vn/api/payment/test-create \
  -H "Content-Type: application/json" \
  -d '{"planId":"basic","amount":169000,"userId":"test-user"}'
```
✅ Nếu thành công → Payment insert hoạt động

---

## 🔍 Vercel Logs - Cách Kiểm Tra

### Logs Khi User Chuyển Khoản
```
=== PAYMENT API: Attempting to insert payment ===
=== PAYMENT API: Payment record saved successfully ===
=== SEPAY WEBHOOK: Received ===
=== SEPAY WEBHOOK: API Key verified ===
=== SEPAY WEBHOOK: Processing ===
=== SEPAY WEBHOOK: Successfully upgraded subscription ===
```

### Logs Nếu Payment Không Được Lưu
```
=== PAYMENT STATUS CHECK === { orderId: 'PLAN3287108825', provider: 'sepay' }
Payment not found in database: PLAN3287108825
```
→ **Fallback**: Webhook sẽ tự động tạo payment record

### Logs Nếu Webhook Không Được Gọi
```
=== PAYMENT STATUS CHECK === { orderId: 'PLAN3287108825', provider: 'sepay' }
Payment not found in database: PLAN3287108825
```
→ **Kiểm tra**: Webhook URL có đúng không? API Key có đúng không?

---

## 📋 Checklist - Cấu Hình SePay

- ✅ Webhook URL: `https://planai.io.vn/api/webhook/sepay`
- ✅ Kiểu chứng thực: **API Key**
- ✅ API Key: Được cấu hình trong Vercel env vars
- ✅ Transaction ID Format: `PLAN` + 10 số
- ✅ Webhook Response: HTTP 200 + `{ success: true }`

---

## 🚀 Cách Sử Dụng

### Cách 1: Chuyển Khoản Thực
1. Vào: `https://planai.io.vn/payment/checkout?plan=basic`
2. Chọn SePay
3. Nhấn "Thanh toán"
4. Chuyển khoản SePay (nội dung: `PLAN` + 10 số)
5. Hệ thống tự động xác nhận ✅

### Cách 2: Test Webhook (SePay Dashboard)
1. Vào SePay Dashboard
2. Giao dịch → Giả lập giao dịch
3. Tạo giao dịch test
4. SePay sẽ gọi webhook tự động
5. Kiểm tra Vercel logs

---

## 🔧 Files Đã Sửa

| File | Thay Đổi |
|------|----------|
| `/app/api/webhook/sepay/route.ts` | Thêm fallback payment creation, sửa status code |
| `/app/api/payment/create/route.ts` | Thêm logging chi tiết, sửa transaction ID |
| `/app/api/payment/check-status/route.ts` | Xóa SePay API calls |
| `/app/payment/failed/PaymentFailedClient.tsx` | Sửa email hỗ trợ |

---

## 📞 Support
- Email: `webappsaas.ai@gmail.com`
- SePay Docs: https://docs.sepay.vn/
- Webhook Docs: https://docs.sepay.vn/tich-hop-webhooks.html

---

## 🎯 Kết Luận

**Vấn đề gốc**: Payment không được lưu từ checkout endpoint
**Giải pháp**: Webhook fallback mechanism sẽ tự động tạo payment record

**Kết quả**: Ngay cả nếu payment creation endpoint thất bại, webhook vẫn có thể xử lý giao dịch và cấp gói cho user.

**Status**: ✅ Ready for testing
