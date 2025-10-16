# Hướng dẫn cấu hình thanh toán cho PlanAI

Tài liệu này hướng dẫn cách cấu hình các phương thức thanh toán cho PlanAI.

## Cấu hình biến môi trường

Tạo hoặc chỉnh sửa file `.env` trong thư mục gốc của dự án và thêm các biến môi trường sau:

```
# SePay
SEPAY_TOKEN=your_sepay_token
SEPAY_ACCOUNT_NUMBER=your_sepay_account

# PayOS
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key
PAYOS_API_URL=https://api-merchant.payos.vn
```

## Lấy thông tin SePay

1. Đăng nhập vào tài khoản SePay của bạn tại [https://my.sepay.vn/](https://my.sepay.vn/)
2. Vào phần "API & Webhooks" trong menu
3. Tạo API token mới nếu chưa có
4. Sao chép API token và số tài khoản
5. Thêm vào file `.env` như hướng dẫn ở trên

## Lấy thông tin PayOS

1. Đăng nhập vào tài khoản PayOS của bạn
2. Vào phần "Developers" hoặc "API Settings"
3. Sao chép Client ID, API Key và Checksum Key
4. Thêm vào file `.env` như hướng dẫn ở trên

## Kiểm tra cấu hình

Sau khi cấu hình xong, bạn có thể kiểm tra bằng cách:

1. Khởi động lại server: `npm run dev` hoặc `yarn dev`
2. Truy cập trang kiểm tra thanh toán: [https://planai.io.vn/payment/test](https://planai.io.vn/payment/test)
3. Kiểm tra xem các biến môi trường đã được cấu hình đúng chưa
4. Thử kiểm tra API thanh toán với cả SePay và PayOS

## Xử lý sự cố

### Lỗi "Payment provider configuration missing"

- Kiểm tra lại file `.env` và đảm bảo các biến môi trường đã được cấu hình đúng
- Khởi động lại server sau khi cập nhật biến môi trường

### Lỗi "Could not connect to payment provider"

- Kiểm tra kết nối internet
- Kiểm tra xem API token có hợp lệ không
- Kiểm tra xem tài khoản SePay/PayOS có đang hoạt động không

### Lỗi "Database error"

- Kiểm tra kết nối đến Supabase
- Đảm bảo bảng `payments` đã được tạo trong cơ sở dữ liệu
- Kiểm tra quyền truy cập của service role key

## Liên hệ hỗ trợ

Nếu bạn vẫn gặp vấn đề sau khi thực hiện các bước trên, vui lòng liên hệ với đội hỗ trợ kỹ thuật qua email: webappsaas.ai@gmail.com
