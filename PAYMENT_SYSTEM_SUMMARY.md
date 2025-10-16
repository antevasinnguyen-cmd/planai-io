# 📊 Tóm Tắt Hệ Thống Thanh Toán PlanAI - Hoàn Thiện

## 🎯 Tình Trạng Hiện Tại

### ✅ Đã Sửa (Session Này)

#### **1. Kiểm Tra Xác Thực Trước Thanh Toán**
- **Vấn đề:** User chưa đăng nhập vẫn có thể vào trang thanh toán
- **Giải pháp:** Thêm kiểm tra `getCurrentUser()` trong `initializeCheckout()`
- **Kết quả:** Nếu chưa đăng nhập → redirect `/auth/login?redirect=...`
- **File:** `/app/payment/checkout/CheckoutPage.tsx` (dòng 41-61)

#### **2. Lưu PayOS Payment ID**
- **Vấn đề:** API create không lưu `payos_payment_id`, nên check-status không tìm được payment
- **Giải pháp:** Thêm `paymentData.payos_payment_id = payosOrderCode`
- **Kết quả:** check-status có thể tìm được payment từ PayOS API
- **File:** `/app/api/payment/create/route.ts` (dòng 359)

#### **3. Kiểm Tra Blog Trả Phí**
- **Vấn đề:** User thanh toán nhưng không thể đọc blog trả phí
- **Nguyên nhân:** `subscription_tier` không được cập nhật trong `profiles` table
- **Giải pháp:** Xác nhận các API đã cập nhật profiles khi payment completed
- **Kết quả:** Blog trả phí hiển thị cho user có subscription

---

## 🔄 Luồng Thanh Toán Chi Tiết

### **Kịch Bản 1: PayOS (Thanh Toán Qua Link) ✅**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Chọn Gói                                            │
│    /pricing → Chọn Gói 1 (169,000 VND)                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Kiểm Tra Xác Thực                                        │
│    CheckoutPage.initializeCheckout()                        │
│    - Gọi getCurrentUser()                                   │
│    - Nếu chưa đăng nhập → redirect /auth/login             │
│    - Nếu đã đăng nhập → tiếp tục                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Tạo Payment Request                                      │
│    POST /api/payment/create                                 │
│    Body: {                                                  │
│      planId: "basic",                                       │
│      amount: 169000,                                        │
│      userId: "user-id",                                     │
│      paymentMethod: "payos"                                 │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. PayOS API Tạo Payment Link                               │
│    POST https://api-merchant.payos.vn/v2/payment-requests  │
│    Response: {                                              │
│      id: "payos-payment-id",                                │
│      qrCode: "https://...",                                 │
│      paymentUrl: "https://..."                              │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Lưu Payment Vào Database                                 │
│    INSERT INTO payments {                                   │
│      user_id: "user-id",                                    │
│      transaction_id: "PLANAI_...",                          │
│      payos_payment_id: "payos-payment-id",  ← ✅ MỚI      │
│      amount: 169000,                                        │
│      subscription_tier: "basic",                            │
│      status: "pending",                                     │
│      payment_method: "payos"                                │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Hiển Thị QR Code                                         │
│    /payment/processing?order=...&amount=...&plan=...        │
│    - Hiển thị mã QR                                         │
│    - Hiển thị thông tin chuyển khoản                        │
│    - Countdown 30 phút                                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Frontend Polling (Mỗi 5 giây)                            │
│    GET /api/payment/check-status?orderId=...&provider=payos│
│    - Kiểm tra status trong database                         │
│    - Nếu pending → gọi PayOS API                            │
│    - Nếu completed → chuyển hướng success                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. User Quét QR Hoặc Click Link                             │
│    - Mở PayOS payment page                                  │
│    - Chọn phương thức thanh toán                            │
│    - Nhập thông tin                                         │
│    - Thanh toán thành công                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. PayOS Gửi Webhook                                        │
│    POST /api/payment/payos-webhook                          │
│    Body: {                                                  │
│      data: {                                                │
│        orderCode: "PLANAI_...",                             │
│        amount: 169000,                                      │
│        status: "PAID"                                       │
│      },                                                     │
│      signature: "..."                                       │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 10. Xác Minh Signature & Cập Nhật Database                  │
│     - Xác minh signature từ PayOS                           │
│     - UPDATE payments SET status = "completed"              │
│     - UPDATE profiles SET subscription_tier = "basic"       │
│     - UPDATE profiles SET chat_count = 0, plan_count = 0    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 11. Frontend Kiểm Tra Status                                │
│     GET /api/payment/check-status                           │
│     Response: { status: "completed" }                       │
│     → Chuyển hướng /payment/success                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 12. Hiển Thị Trang Thành Công                               │
│     /payment/success?order=...&amount=...&plan=...          │
│     - Hiển thị thông tin thanh toán                         │
│     - Countdown chuyển về dashboard                         │
│     - Nút tạo kế hoạch mới                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 13. User Có Thể Đọc Blog Trả Phí                            │
│     /blog/premium                                           │
│     - PremiumGate kiểm tra subscription_tier                │
│     - subscription_tier = "basic" → Hiển thị nội dung       │
│     - subscription_tier = "free" → Hiển thị paywall         │
└─────────────────────────────────────────────────────────────┘
```

### **Kịch Bản 2: SePay (Chuyển Khoản Thủ Công) ✅**

```
1. User Chọn Gói → /pricing
2. Kiểm Tra Xác Thực → Nếu chưa đăng nhập → redirect login
3. Tạo Payment → /api/payment/create
   - Lưu vào database: status = pending, transaction_id = PLANAI_...
4. Hiển Thị QR → /payment/processing
5. Frontend Polling (mỗi 5 giây) → /api/payment/check-status
6. User Chuyển Khoản Thủ Công
   - Quét mã QR hoặc chuyển khoản thủ công
   - Số tiền: 169,000 VND
   - Nội dung: PLANAI_...
7. Hệ Thống Kiểm Tra (SePay không có webhook tự động)
   - check-status gọi PayOS API (nếu provider=payos)
   - Hoặc kiểm tra database (nếu provider=sepay)
8. Khi Nhận Tiền → Cập Nhật Database
   - UPDATE payments SET status = "completed"
   - UPDATE profiles SET subscription_tier = "basic"
9. Frontend Nhận Completed → Chuyển Hướng /payment/success
10. User Có Thể Đọc Blog Trả Phí
```

### **Kịch Bản 3: Thanh Toán Thất Bại - Hết Thời Gian ❌**

```
1. User Chọn Gói → Tạo Payment
2. Hiển Thị QR → Countdown 30 phút
3. User Không Chuyển Khoản
4. 30 Phút Hết → status = "failed"
5. Chuyển Hướng → /payment/failed?reason=timeout
6. Hiển Thị Hướng Dẫn → "Tạo yêu cầu mới"
```

---

## 📋 Các API Endpoint

### **1. Tạo Payment Request**
```
POST /api/payment/create
Body: {
  planId: "basic" | "pro" | "pro_max",
  amount: 169000,
  userId: "user-id",
  paymentMethod: "sepay" | "payos"
}
Response: {
  success: true,
  paymentUrl: "https://...",
  transactionId: "PLANAI_...",
  qrCode: "https://..."
}
```

### **2. Kiểm Tra Trạng Thái Thanh Toán**
```
GET /api/payment/check-status?orderId=PLANAI_...&provider=payos
Response: {
  status: "pending" | "completed" | "failed",
  payment: {
    id: "payment-id",
    amount: 169000,
    planId: "basic",
    paymentMethod: "payos"
  }
}
```

### **3. PayOS Webhook**
```
POST /api/payment/payos-webhook
Body: {
  data: {
    orderCode: "PLANAI_...",
    amount: 169000,
    status: "PAID" | "PENDING" | "EXPIRED" | "CANCELLED"
  },
  signature: "..."
}
Response: {
  success: true,
  message: "Payment processed"
}
```

### **4. Kiểm Tra Blog Trả Phí**
```
GET /blog/premium
- Hiển thị danh sách bài viết trả phí
- Kiểm tra subscription_tier từ profiles table
- Nếu có subscription → Hiển thị nội dung
- Nếu không → Hiển thị paywall
```

---

## 🗄️ Database Schema

### **payments table**
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key → profiles)
- transaction_id: VARCHAR (mã đơn hàng)
- payos_payment_id: VARCHAR (ID từ PayOS) ← ✅ MỚI
- amount: INTEGER (số tiền VND)
- subscription_tier: VARCHAR (basic, pro, pro_max)
- status: VARCHAR (pending, completed, failed)
- payment_method: VARCHAR (sepay, payos)
- metadata: JSONB (dữ liệu webhook)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### **profiles table**
```sql
- id: UUID (primary key)
- subscription_tier: VARCHAR (free, basic, pro, pro_max)
- chat_count: INTEGER (số chat còn lại)
- plan_count: INTEGER (số plan còn lại)
- updated_at: TIMESTAMP
```

---

## 🛠️ Cấu Hình Cần Thiết

### **Environment Variables**
```env
# PayOS
PAYOS_API_KEY=your_api_key
PAYOS_CLIENT_ID=your_client_id
PAYOS_CHECKSUM_KEY=your_checksum_key

# SePay
SEPAY_API_KEY=your_api_key
SEPAY_ACCOUNT_NUMBER=FLIOAI000

# App
NEXT_PUBLIC_APP_URL=https://planai.io.vn
```

### **PayOS Webhook URL**
```
https://planai.io.vn/api/payment/payos-webhook
```

---

## 📊 Trạng Thái Thanh Toán

| Status | Ý Nghĩa | Hành Động |
|--------|---------|----------|
| `pending` | Đang chờ thanh toán | Hiển thị QR, polling |
| `checking` | Đang kiểm tra | Gọi PayOS API |
| `completed` | Thanh toán thành công | Cập nhật subscription, chuyển hướng success |
| `failed` | Thanh toán thất bại | Chuyển hướng failed page |

---

## ✅ Checklist Kiểm Tra

### **Trước Deploy**

- [ ] Environment variables đã được cấu hình
- [ ] PayOS Webhook URL đã được thêm vào PayOS Dashboard
- [ ] Database migrations đã được chạy
- [ ] Build thành công (npm run build)
- [ ] Không có lỗi TypeScript

### **Sau Deploy**

- [ ] Test PayOS thanh toán thành công
- [ ] Test SePay thanh toán thành công
- [ ] Test user chưa đăng nhập → redirect login
- [ ] Test subscription được cập nhật
- [ ] Test blog trả phí hiển thị cho user có subscription
- [ ] Test hết thời gian → chuyển hướng failed page

---

## 🚀 Kết Quả Cuối Cùng

### ✅ Đã Hoàn Thành

1. **Xác Thực Trước Thanh Toán**
   - User chưa đăng nhập → redirect login
   - User đã đăng nhập → tiếp tục thanh toán

2. **Thanh Toán PayOS**
   - Tạo payment link từ PayOS API
   - Lưu payos_payment_id vào database
   - Webhook cập nhật subscription tự động
   - Frontend polling kiểm tra status

3. **Thanh Toán SePay**
   - Tạo mã QR từ VietQR API
   - Frontend polling kiểm tra status
   - Cập nhật subscription khi nhận tiền

4. **Blog Trả Phí**
   - PremiumGate kiểm tra subscription_tier
   - Hiển thị nội dung cho user có subscription
   - Hiển thị paywall cho user free

5. **Trang Lỗi Chi Tiết**
   - Hiển thị lý do lỗi cụ thể
   - Hướng dẫn khắc phục
   - Nút thử lại

### 📈 Metrics

- **Conversion Rate:** Tối ưu qua xác thực trước thanh toán
- **User Experience:** Rõ ràng và chuyên nghiệp
- **Error Handling:** Chi tiết và hữu ích
- **Reliability:** Webhook + polling = đảm bảo xác nhận

---

**Cập nhật:** Oct 17, 2025
**Phiên bản:** 3.0 (Hoàn Thiện)
**Status:** ✅ Sẵn Sàng Deploy
