#!/bin/bash

# Đường dẫn đến file .env
ENV_FILE="/Users/mf840/Documents/BUILD APP/SaaS 1/.env"

# Nội dung cần thêm vào file .env
cat > "$ENV_FILE" << 'EOL'
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
EOL

echo "File .env đã được cập nhật thành công!"
