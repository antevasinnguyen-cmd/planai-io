# Hướng dẫn cấu hình SePay cho PlanAI

## Tổng quan

SePay là dịch vụ thanh toán chuyển khoản ngân hàng tự động cho PlanAI. Hướng dẫn này sẽ giúp bạn cấu hình SePay để xử lý thanh toán.

## Yêu cầu

- Tài khoản SePay đã được kích hoạt
- API Token từ SePay
- Số tài khoản ngân hàng đã liên kết với SePay

## Cấu hình biến môi trường

### 1. Cập nhật file `.env.local`

Thêm các biến môi trường sau vào file `.env.local`:

```bash
# SePay Configuration
SEPAY_TOKEN=40KPESXRD5XUKP6WYLKYOJGMBMJBRQZ4SEXDLUNDTCBZVZFIJL5I1FVAMRZGVKWT
SEPAY_ACCOUNT_NUMBER=FLIOAI000
SEPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

### 2. Giải thích các biến

- **SEPAY_TOKEN**: API Key từ SePay để xác thực các request
- **SEPAY_ACCOUNT_NUMBER**: Mã tài khoản SePay (ví dụ: FLIOAI000)
- **SEPAY_WEBHOOK_SECRET**: Secret key để xác thực webhook callbacks từ SePay

## Cấu hình Webhook trên SePay

### 1. Truy cập trang cấu hình Webhook

1. Đăng nhập vào tài khoản SePay
2. Vào phần **Cài đặt** → **Webhooks**
3. Nhấn **Thêm Webhook mới**

### 2. Cấu hình Webhook

Điền các thông tin sau:

- **URL Webhook**: `https://planai.io.vn/api/webhook/sepay`
- **Kiểu chứng thực**: `API Key`
- **API Key**: `40KPESXRD5XUKP6WYLKYOJGMBMJBRQZ4SEXDLUNDTCBZVZFIJL5I1FVAMRZGVKWT`
- **Request Content Type**: `application/json`

### 3. Header Authorization

SePay sẽ gửi webhook với header:
```
Authorization: Apikey 40KPESXRD5XUKP6WYLKYOJGMBMJBRQZ4SEXDLUNDTCBZVZFIJL5I1FVAMRZGVKWT
```

## Kiểm tra cấu hình

### 1. Test Webhook

Sau khi cấu hình, bạn có thể test webhook bằng cách:

1. Tạo một giao dịch test trên SePay
2. Kiểm tra logs trong console:
   ```bash
   npm run dev
   ```
3. Xem logs webhook trong terminal

### 2. Logs cần kiểm tra

Nếu cấu hình đúng, bạn sẽ thấy:
```
=== SEPAY WEBHOOK: Received ===
=== SEPAY WEBHOOK: API Key verified ===
=== SEPAY WEBHOOK: Processing ===
=== SEPAY WEBHOOK: Successfully upgraded subscription ===
```

Nếu có lỗi:
```
=== SEPAY WEBHOOK: Invalid API Key ===
```

## Xử lý lỗi thường gặp

### 1. Lỗi "Invalid API Key"

**Nguyên nhân**: API Key không khớp hoặc header Authorization sai format

**Giải pháp**:
- Kiểm tra lại `SEPAY_TOKEN` trong `.env.local`
- Đảm bảo format header là: `Apikey YOUR_API_KEY`
- Không có khoảng trắng thừa

### 2. Lỗi "Payment not found"

**Nguyên nhân**: Transaction ID không tồn tại trong database

**Giải pháp**:
- Kiểm tra xem payment đã được tạo trong database chưa
- Xem logs để biết transaction ID
- Kiểm tra bảng `payments` trong Supabase

### 3. Lỗi "Subscription update failed"

**Nguyên nhân**: Không thể cập nhật subscription tier cho user

**Giải pháp**:
- Kiểm tra quyền của Service Role Key
- Xem bảng `admin_notifications` để biết chi tiết lỗi
- Kiểm tra user_id có tồn tại trong bảng `profiles`

## Cấu hình trên Vercel

### 1. Thêm Environment Variables

1. Vào Vercel Dashboard
2. Chọn project **planai-io**
3. Vào **Settings** → **Environment Variables**
4. Thêm các biến:
   - `SEPAY_TOKEN`
   - `SEPAY_ACCOUNT_NUMBER`
   - `SEPAY_WEBHOOK_SECRET`

### 2. Redeploy

Sau khi thêm biến môi trường:
1. Vào tab **Deployments**
2. Nhấn **Redeploy** cho deployment mới nhất
3. Chọn **Use existing Build Cache** để deploy nhanh hơn

## Monitoring và Debugging

### 1. Xem logs trên Vercel

1. Vào **Deployments** → chọn deployment hiện tại
2. Nhấn **View Function Logs**
3. Tìm kiếm `SEPAY WEBHOOK` để xem logs webhook

### 2. Kiểm tra database

Kiểm tra các bảng sau trong Supabase:

- **payments**: Xem trạng thái thanh toán
- **profiles**: Xem subscription tier đã được cập nhật chưa
- **error_logs**: Xem các lỗi đã được ghi lại
- **admin_notifications**: Xem thông báo lỗi cho admin

### 3. Test Payment Flow

1. Tạo payment mới từ frontend
2. Quét QR code và chuyển khoản
3. Kiểm tra webhook được gọi trong vòng 30 giây
4. Xác nhận subscription tier đã được nâng cấp

## Bảo mật

### 1. Bảo vệ API Key

- **KHÔNG** commit API Key vào Git
- Chỉ lưu trong `.env.local` (đã được gitignore)
- Sử dụng Environment Variables trên Vercel

### 2. Xác thực Webhook

Code đã implement xác thực webhook bằng API Key:
```typescript
const authHeader = headers['authorization'] || '';
const expectedAuth = `Apikey ${SEPAY_TOKEN}`;

if (authHeader !== expectedAuth) {
  return NextResponse.json({ 
    success: false,
    error: 'Unauthorized - Invalid API Key' 
  }, { status: 401 });
}
```

### 3. Rate Limiting

Nên implement rate limiting cho webhook endpoint để tránh abuse:
- Giới hạn số request từ cùng một IP
- Implement CAPTCHA cho các request đáng ngờ

## Hỗ trợ

Nếu gặp vấn đề, hãy:

1. Kiểm tra logs trong Vercel
2. Xem error_logs trong Supabase
3. Liên hệ support của SePay nếu vấn đề liên quan đến API
4. Tham khảo tài liệu API của SePay: https://docs.sepay.vn

## Changelog

- **2025-01-15**: Cập nhật API Key mới và cải thiện xác thực webhook
- **2025-01-10**: Thêm retry mechanism cho database operations
- **2025-01-05**: Khởi tạo cấu hình SePay
