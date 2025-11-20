# Cấu hình biến môi trường cho PlanAI

Sao chép nội dung dưới đây vào file `.env.local` trong thư mục gốc của dự án:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Anthropic Configuration (for Claude)
ANTHROPIC_API_KEY=your_anthropic_api_key

# SePay Configuration
SEPAY_TOKEN=40KPESXRD5XUKP6WYLKYOJGMBMJBRQZ4SEXDLUNDTCBZVZFIJL5I1FVAMRZGVKWT
SEPAY_ACCOUNT_NUMBER=VQRQAFKCR5422
SEPAY_API_URL=https://my.sepay.vn/userapi/transactions/create
SEPAY_WEBHOOK_SECRET=https://planai.io.vn/api/webhook/sepay

# PayOS Configuration
PAYOS_CLIENT_ID=2d884d13-bf7d-4733-89e4-2624b976aff2
PAYOS_API_KEY=f9e1a148-cbf3-4f24-be35-dfe90a5a14a9
PAYOS_CHECKSUM_KEY=a3b3caf969522d63ac1a656fb14ef14208b46acc8432f5e28b38c1ba8087dc03
PAYOS_API_URL=https://api-merchant.payos.vn/v2/payment-requests
PAYOS_WEBHOOK_SECRET=https://planai.io.vn/api/payment/payos-webhook

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Notion API Configuration
NOTION_API_KEY=your_notion_api_key
NOTION_CLIENT_ID=your_notion_client_id
NOTION_CLIENT_SECRET=your_notion_client_secret
NOTION_REDIRECT_URI=https://planai.io.vn/api/notion/callback
NOTION_AUTHORIZATION_URL=https://api.notion.com/v1/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=code&owner=user&redirect_uri=https%3A%2F%2Fplanai.io.vn

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_key
NEXTAUTH_URL=https://planai.io.vn

# App Configuration
NEXT_PUBLIC_APP_URL=https://planai.io.vn
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
