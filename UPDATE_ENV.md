# CẬP NHẬT FILE .env

Vui lòng thêm các dòng sau vào file `.env` của bạn:

```bash
# SePay Configuration
SEPAY_ACCOUNT_NUMBER=FLIOAI000
SEPAY_TOKEN=40KPESXRD5XUKP6WYLKYOJGMBMJBRQZ4SEXDLUNDTCBZVZFIJL5I1FVAMRZGVK
SEPAY_API_URL=https://my.sepay.vn/userapi/transactions/create
SEPAY_WEBHOOK_SECRET=https://planai.io.vn/api/webhook/sepay

# PayOS Configuration
PAYOS_CLIENT_ID=2d884d13-bf7d-4733-89e4-2624b976aff2
PAYOS_API_KEY=f9e1a148-cbf3-4f24-be35-dfe90a5a14a9
PAYOS_CHECKSUM_KEY=a3b3caf969522d63ac1a656fb14ef14208b46acc8432f5e28b38c1ba8087dc03
PAYOS_API_URL=https://api-merchant.payos.vn/v2/payment-requests
PAYOS_WEBHOOK_SECRET=https://planai.io.vn/api/payment/payos-webhook

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Sau khi cập nhật, khởi động lại server:
```bash
npm run dev
```
