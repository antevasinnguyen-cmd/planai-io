# Cấu hình biến môi trường cho PlanAI

Sao chép nội dung dưới đây vào file `.env` trong thư mục gốc của dự án:

```
# PayOS Configuration
PAYOS_CLIENT_ID=2d884d13-bf7d-4733-89e4-2624b976aff2
PAYOS_API_KEY=f9e1a148-cbf3-4f24-be35-dfe90a5a14a9
PAYOS_CHECKSUM_KEY=a3b3caf969522d63ac1a656fb14ef14208b46acc8432f5e28b38c1ba8087dc03
PAYOS_API_URL=https://api-merchant.payos.vn/v2/payment-requests
PAYOS_WEBHOOK_SECRET=https://planai.io.vn/api/payment/payos-webhook

# SePay Configuration
SEPAY_TOKEN=40KPESXRD5XUKP6WYLKYOJGMBMJBRQZ4SEXDLUNDTCBZVZFIJL5I1FVAMRZGVK
SEPAY_ACCOUNT_NUMBER=3963
SEPAY_WEBHOOK_SECRET=https://planai.io.vn/api/webhook/sepay
```

## Hướng dẫn cập nhật

1. Tìm file `.env` trong thư mục gốc của dự án
2. Mở file `.env` bằng trình soạn thảo văn bản
3. Sao chép nội dung trên vào file
4. Lưu file
5. Khởi động lại server bằng lệnh `npm run dev` hoặc `yarn dev`

## Kiểm tra cấu hình

Sau khi cập nhật và khởi động lại server, truy cập trang `/payment/test` để kiểm tra xem cấu hình đã hoạt động chưa.

## Lưu ý bảo mật

File `.env` chứa thông tin nhạy cảm, đảm bảo rằng:
- File này đã được thêm vào `.gitignore` để không bị đẩy lên GitHub
- Không chia sẻ nội dung của file này với người khác
- Chỉ những người có quyền quản trị hệ thống mới được truy cập file này
