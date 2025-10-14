# Hướng dẫn cập nhật biến môi trường trên Vercel

## Bước 1: Truy cập Vercel Dashboard

1. Đăng nhập vào [Vercel](https://vercel.com)
2. Chọn project **planai-io**
3. Vào **Settings** → **Environment Variables**

## Bước 2: Thêm các biến môi trường sau

### SePay Configuration

```
SEPAY_ACCOUNT_NUMBER=FLIOAI000
SEPAY_TOKEN=40KPESXRD5XUKP6WYLKYOJGMBMJBRQZ4SEXDLUNDTCBZVZFIJL5I1FVAMRZGVK
SEPAY_WEBHOOK_SECRET=https://planai.io.vn/api/webhook/sepay
```

### PayOS Configuration

```
PAYOS_CLIENT_ID=2d884d13-bf7d-4733-89e4-2624b976aff2
PAYOS_API_KEY=f9e1a148-cbf3-4f24-be35-dfe90a5a14a9
PAYOS_CHECKSUM_KEY=a3b3caf969522d63ac1a656fb14ef14208b46acc8432f5e28b38c1ba8087dc03
PAYOS_API_URL=https://api-merchant.payos.vn/v2/payment-requests
PAYOS_WEBHOOK_SECRET=https://planai.io.vn/api/payment/payos-webhook
```

### App URL

```
NEXT_PUBLIC_APP_URL=https://planai.io.vn
```

## Bước 3: Lưu và Redeploy

1. Nhấn **Save** cho mỗi biến
2. Vercel sẽ tự động redeploy
3. Đợi khoảng 2-3 phút để deployment hoàn tất

## Thông tin tài khoản đã cập nhật trong code

### SePay (MBBank)
- **Ngân hàng**: TMCP Quân đội MBBank  
- **Thụ hưởng**: NGUYEN THI KHANH HUYEN  
- **Số tài khoản**: FLIOAI000

### PayOS (MBBank)
- **Ngân hàng**: TMCP Quân đội MBBank  
- **Chủ tài khoản**: NGUYEN THI KHANH HUYEN  
- **Số tài khoản**: 5428960265186

## Cách thức hoạt động

Hệ thống sẽ **tự động tạo QR code động** cho mỗi giao dịch với:
- ✅ Số tiền chính xác theo gói (169.000đ / 289.000đ / 499.000đ)
- ✅ Nội dung chuyển khoản unique (PLANAI_timestamp_random)
- ✅ Thông tin tài khoản ngân hàng của bạn

**Không cần tạo QR tĩnh trên SePay/PayOS!** Mỗi lần thanh toán sẽ có QR riêng với số tiền và nội dung khác nhau.

## Kiểm tra sau khi deploy

1. Truy cập: https://planai.io.vn/payment/checkout?plan=basic
2. Chọn phương thức thanh toán (SePay hoặc PayOS)
3. Nhấn "Thanh toán"
4. Kiểm tra:
   - ✅ Có chuyển đến trang `/payment/processing`
   - ✅ Hiển thị QR code
   - ✅ Hiển thị thông tin tài khoản đúng
   - ✅ Số tiền đúng với gói đã chọn
   - ✅ Có nội dung chuyển khoản unique

## Lưu ý quan trọng

- Mỗi giao dịch sẽ có mã riêng (transaction ID) để hệ thống có thể xác định thanh toán
- Người dùng cần chuyển khoản **đúng số tiền** và **đúng nội dung** để hệ thống tự động xác nhận
- Webhook sẽ nhận thông báo từ SePay/PayOS khi có giao dịch thành công
