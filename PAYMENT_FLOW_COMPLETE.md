# 🎯 Luồng Thanh Toán Hoàn Thiện - PlanAI

## ✅ Tổng Quan Hệ Thống

Hệ thống thanh toán PlanAI hiện đã được hoàn thiện với các tính năng sau:

### 1. **Tạo Yêu Cầu Thanh Toán** (`/api/payment/create`)
- ✅ Tạo yêu cầu thanh toán với PayOS
- ✅ Lưu thông tin vào database
- ✅ Tạo mã QR VietQR
- ✅ Trả về thông tin thanh toán cho frontend

### 2. **Kiểm Tra Trạng Thái Thanh Toán** (`/api/payment/check-status`)
- ✅ **Kiểm tra PayOS API trực tiếp** - Lấy trạng thái thanh toán từ PayOS
- ✅ **Cập nhật database tự động** - Khi PayOS báo đã thanh toán
- ✅ **Cập nhật subscription cho user** - Nâng cấp gói khi thanh toán thành công
- ✅ **Xử lý các trạng thái lỗi** - EXPIRED, CANCELLED, FAILED

### 3. **Webhook từ PayOS** (`/api/payment/payos-webhook`)
- ✅ Nhận thông báo thanh toán từ PayOS
- ✅ Xác minh signature
- ✅ Cập nhật database
- ✅ Cập nhật subscription

### 4. **Giao Diện Xử Lý Thanh Toán** (`/payment/processing`)
- ✅ Hiển thị mã QR
- ✅ Hiển thị thông tin chuyển khoản
- ✅ Kiểm tra trạng thái mỗi 5 giây
- ✅ Countdown timer 30 phút
- ✅ Chuyển hướng khi thành công

### 5. **Trang Thành Công** (`/payment/success`)
- ✅ Hiển thị thông tin thanh toán
- ✅ Countdown chuyển về dashboard
- ✅ Nút tạo kế hoạch mới

### 6. **Trang Lỗi Chi Tiết** (`/payment/failed`) - ✨ MỚI
- ✅ Hiển thị lý do lỗi cụ thể
- ✅ Hướng dẫn khắc phục từng loại lỗi
- ✅ Liên hệ hỗ trợ
- ✅ Nút thử lại

---

## 🔄 Luồng Thanh Toán Chi Tiết

### **Kịch Bản 1: Thanh Toán Thành Công**

```
1. User chọn gói → /payment/checkout
2. Tạo yêu cầu → /api/payment/create
3. Hiển thị QR → /payment/processing
4. User quét QR & chuyển khoản
5. Kiểm tra status (mỗi 5 giây) → /api/payment/check-status
   ↓ (PayOS API trả về PAID)
6. Cập nhật database (status = completed)
7. Cập nhật subscription cho user
8. Chuyển hướng → /payment/success
9. Hiển thị thông báo thành công
10. Countdown chuyển về dashboard
```

### **Kịch Bản 2: Webhook từ PayOS (Nhanh hơn)**

```
1. User chuyển khoản thành công
2. PayOS gửi webhook → /api/payment/payos-webhook
3. Xác minh signature
4. Cập nhật database (status = completed)
5. Cập nhật subscription
6. Frontend kiểm tra status → /api/payment/check-status
7. Nhận được status = completed
8. Chuyển hướng → /payment/success
```

### **Kịch Bản 3: Thanh Toán Thất Bại - Hết Thời Gian**

```
1. User không chuyển khoản trong 30 phút
2. Countdown hết → status = failed
3. Chuyển hướng → /payment/failed?reason=timeout
4. Hiển thị hướng dẫn khắc phục
5. User có thể thử lại
```

### **Kịch Bản 4: Thanh Toán Thất Bại - Số Tiền Sai**

```
1. User chuyển khoản nhưng số tiền sai
2. PayOS API trả về PENDING (chưa xác nhận)
3. Hết thời gian → status = failed
4. Chuyển hướng → /payment/failed?reason=incorrect_amount
5. Hiển thị hướng dẫn chuyển lại với số tiền chính xác
```

### **Kịch Bản 5: Thanh Toán Thất Bại - Nội Dung Sai**

```
1. User chuyển khoản nhưng nội dung sai
2. PayOS API trả về PENDING (chưa xác nhận)
3. Hết thời gian → status = failed
4. Chuyển hướng → /payment/failed?reason=incorrect_content
5. Hiển thị hướng dẫn chuyển lại với nội dung chính xác
```

---

## 🛠️ Cấu Hình Cần Thiết

### **Environment Variables**

```env
# PayOS Configuration
PAYOS_API_KEY=your_api_key
PAYOS_CLIENT_ID=your_client_id
PAYOS_CHECKSUM_KEY=your_checksum_key

# App URL
NEXT_PUBLIC_APP_URL=https://planai.io.vn

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### **Webhook URL trên PayOS Dashboard**

```
https://planai.io.vn/api/payment/payos-webhook
```

---

## 📊 Database Schema

### **payments table**

```sql
- id: UUID (primary key)
- user_id: UUID (foreign key → profiles)
- transaction_id: VARCHAR (mã đơn hàng)
- payos_payment_id: VARCHAR (ID từ PayOS)
- amount: INTEGER (số tiền VND)
- subscription_tier: VARCHAR (basic, pro, pro_max)
- status: VARCHAR (pending, completed, failed)
- payment_method: VARCHAR (payos, sepay)
- metadata: JSONB (dữ liệu webhook)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### **profiles table - Cập nhật**

```sql
- subscription_tier: VARCHAR (free, basic, pro, pro_max)
- chat_count: INTEGER (số chat còn lại)
- plan_count: INTEGER (số plan còn lại)
- updated_at: TIMESTAMP
```

---

## 🔍 Các Trạng Thái Thanh Toán

| Status | Ý Nghĩa | Hành Động |
|--------|---------|----------|
| `pending` | Đang chờ thanh toán | Hiển thị QR, chờ user chuyển khoản |
| `checking` | Đang kiểm tra | Gọi PayOS API kiểm tra |
| `completed` | Thanh toán thành công | Cập nhật subscription, chuyển hướng success |
| `failed` | Thanh toán thất bại | Chuyển hướng failed page với lý do |
| `expired` | Hết hạn | Chuyển hướng failed page |
| `cancelled` | Bị hủy | Chuyển hướng failed page |

---

## 🚀 Cách Hoạt Động Chi Tiết

### **1. Kiểm Tra Trạng Thái từ PayOS API**

```typescript
// /api/payment/check-status

1. Lấy orderId từ query parameter
2. Kiểm tra database xem payment có tồn tại không
3. Nếu status đã là 'completed' → trả về ngay
4. Nếu provider là 'payos' → gọi PayOS API:
   - GET /v2/payment-requests/{paymentId}
   - Kiểm tra status từ PayOS
5. Nếu PayOS trả về PAID:
   - Cập nhật database status = completed
   - Cập nhật subscription cho user
   - Trả về status = completed
6. Nếu PayOS trả về EXPIRED/CANCELLED:
   - Cập nhật database status = failed
   - Trả về status = failed với reason
7. Nếu PayOS trả về PENDING:
   - Trả về status = pending
```

### **2. Webhook từ PayOS**

```typescript
// /api/payment/payos-webhook

1. Nhận POST request từ PayOS
2. Xác minh signature:
   - Tạo chuỗi dữ liệu: amount|cancelUrl|description|orderCode|returnUrl|status|checksumKey
   - Tính MD5 hash
   - So sánh với signature nhận được
3. Nếu signature hợp lệ:
   - Cập nhật database: status = completed
   - Cập nhật subscription cho user
   - Trả về success
4. Nếu signature không hợp lệ:
   - Log error
   - Trả về error (nhưng vẫn HTTP 200 để PayOS không gửi lại)
```

### **3. Frontend Kiểm Tra Status**

```typescript
// /payment/processing

1. Mỗi 5 giây gọi /api/payment/check-status?orderId=...&provider=payos
2. Nếu status = completed:
   - Hiển thị "Thanh toán thành công!"
   - Chuyển hướng đến /payment/success sau 2 giây
3. Nếu status = failed:
   - Hiển thị "Thanh toán thất bại"
   - Chuyển hướng đến /payment/failed?reason=... sau 2 giây
4. Nếu countdown hết (30 phút):
   - Đặt status = failed
   - Chuyển hướng đến /payment/failed?reason=timeout
5. Nếu status = pending:
   - Tiếp tục chờ
```

---

## 📝 Các Lý Do Lỗi Thanh Toán

| Reason | Lý Do | Hướng Dẫn |
|--------|------|----------|
| `timeout` | Hết thời gian 30 phút | Tạo yêu cầu mới |
| `expired` | Mã QR hết hạn | Tạo yêu cầu mới |
| `cancelled` | User hủy thanh toán | Thử lại |
| `incorrect_amount` | Số tiền sai | Chuyển lại với số tiền chính xác |
| `incorrect_content` | Nội dung sai | Chuyển lại với nội dung chính xác |
| `unknown` | Lỗi không xác định | Liên hệ hỗ trợ |

---

## ✨ Tính Năng Mới Thêm

### **1. Trang Lỗi Chi Tiết** (`/payment/failed`)
- ✅ Hiển thị lý do lỗi cụ thể
- ✅ Hướng dẫn khắc phục từng loại lỗi
- ✅ Liên hệ hỗ trợ
- ✅ Nút thử lại

### **2. Kiểm Tra PayOS API Trực Tiếp**
- ✅ Không chỉ kiểm tra database
- ✅ Gọi PayOS API để lấy trạng thái thực tế
- ✅ Cập nhật database nếu PayOS báo đã thanh toán
- ✅ Xử lý các trạng thái lỗi từ PayOS

### **3. Cập Nhật Subscription Tự Động**
- ✅ Khi thanh toán thành công
- ✅ Reset chat_count và plan_count
- ✅ Cập nhật subscription_tier

---

## 🧪 Cách Kiểm Tra

### **1. Kiểm Tra Thanh Toán Thành Công**

```bash
1. Truy cập /pricing
2. Chọn gói → Thanh toán
3. Quét mã QR hoặc chuyển khoản thủ công
4. Chờ 1-2 phút
5. Hệ thống tự động xác nhận
6. Chuyển hướng đến /payment/success
7. Kiểm tra dashboard xem subscription đã cập nhật
```

### **2. Kiểm Tra Lỗi Thanh Toán**

```bash
1. Truy cập /pricing
2. Chọn gói → Thanh toán
3. Chờ 30 phút hoặc chuyển khoản với số tiền sai
4. Hệ thống tự động chuyển hướng đến /payment/failed
5. Kiểm tra lý do lỗi và hướng dẫn
```

### **3. Kiểm Tra Webhook**

```bash
1. Gọi endpoint: POST /api/payment/payos-webhook
2. Body:
{
  "data": {
    "orderCode": "PLANAI_...",
    "amount": 169000,
    "status": "00",
    "description": "PlanAI Subscription"
  },
  "signature": "..."
}
3. Kiểm tra database xem payment đã cập nhật
```

---

## 🐛 Troubleshooting

### **Vấn đề: Thanh toán không được xác nhận**

**Nguyên nhân có thể:**
1. Webhook không được nhận từ PayOS
2. Signature không hợp lệ
3. Database không được cập nhật

**Giải pháp:**
1. Kiểm tra webhook URL trên PayOS dashboard
2. Kiểm tra PAYOS_CHECKSUM_KEY có chính xác không
3. Kiểm tra logs trên Vercel
4. Kiểm tra database xem payment record có tồn tại không

### **Vấn đề: Mã QR không hiển thị**

**Nguyên nhân có thể:**
1. URL QR không hợp lệ
2. Lỗi khi gọi VietQR API

**Giải pháp:**
1. Kiểm tra console logs
2. Kiểm tra accountNumber và accountName từ PayOS
3. Kiểm tra URL VietQR format

### **Vấn đề: Subscription không được cập nhật**

**Nguyên nhân có thể:**
1. User ID không chính xác
2. Lỗi khi cập nhật database

**Giải pháp:**
1. Kiểm tra user_id trong payments table
2. Kiểm tra profiles table có record không
3. Kiểm tra logs trên Vercel

---

## 📞 Liên Hệ Hỗ Trợ

- **Email:** webappsaas.ai@gmail.com
- **Thời gian:** Thứ Hai - Chủ Nhật, 8:00 - 22:00

---

## 📚 Tài Liệu Tham Khảo

- [PayOS API Documentation](https://payos.vn/docs)
- [VietQR API Documentation](https://vietqr.io)
- [Supabase Documentation](https://supabase.com/docs)

---

**Cập nhật lần cuối:** Oct 16, 2025
**Phiên bản:** 2.0 (Hoàn Thiện)
