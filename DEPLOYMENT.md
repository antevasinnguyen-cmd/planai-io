# Hướng dẫn triển khai PlanAI

## Triển khai lên Vercel

### Bước 1: Đăng nhập vào Vercel
```bash
npx vercel login
```

### Bước 2: Triển khai dự án
```bash
npx vercel
```

Khi được hỏi, hãy chọn các tùy chọn sau:
- Set up and deploy: **Yes**
- Which scope: **Chọn tài khoản của bạn**
- Link to existing project: **No**
- Project name: **planai**
- Root directory: **.**
- Override settings: **No**

### Bước 3: Thiết lập biến môi trường
Sau khi triển khai, truy cập [Vercel Dashboard](https://vercel.com/dashboard), chọn dự án **planai**, và thiết lập các biến môi trường sau:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://wjzmscsoiibzlxejqpgg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqem1zY3NvaWJiemx4ZWpxcGdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NzQwODIsImV4cCI6MjA3MzM1MDA4Mn0.w6EeucNqmyNahoA8KZVjDYLy3ZgbTyqzVuiOq9MCZGA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqem1zY3NvaWJiemx4ZWpxcGdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc3NDA4MiwiZXhwIjoyMDczMzUwMDgyfQ.C0OlpsyqnnG6CaMDnhv4M6GI4lTN3AyK4sldWl_UpZk

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Anthropic Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key

# SePay Configuration
SEPAY_API_KEY=your_sepay_api_key

# Payos Configuration
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key
PAYOS_API_URL=https://api-merchant.payos.vn/v2/payment-requests

# Google Sheets API
GOOGLE_SHEETS_CLIENT_ID=your_google_sheets_client_id
GOOGLE_SHEETS_CLIENT_SECRET=your_google_sheets_client_secret

# Notion API
NOTION_API_KEY=your_notion_api_key
NOTION_CLIENT_ID=27ad872b-594c-807a-bcfe-00377831ac86
NOTION_CLIENT_SECRET=your_notion_api_key
NOTION_REDIRECT_URI=https://planai.io.vn/api/notion/callback

# App Configuration
NEXTAUTH_SECRET=planai-secret-key-for-authentication-security-2025
NEXTAUTH_URL=https://planai.io.vn
NEXT_PUBLIC_APP_URL=https://planai.io.vn
```

### Bước 4: Triển khai lại
```bash
npx vercel --prod
```

## Cấu hình domain planai.io.vn

### Bước 1: Truy cập Vercel Dashboard
1. Đăng nhập vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Chọn dự án **planai**
3. Chọn tab **Domains**
4. Nhấp vào **Add Domain**
5. Nhập domain: **planai.io.vn**

### Bước 2: Cấu hình DNS
Vercel sẽ cung cấp các bản ghi DNS cần thiết. Thêm chúng vào nhà cung cấp DNS của bạn:

1. **Bản ghi A**:
   - Name: `@` hoặc `planai.io.vn`
   - Value: `76.76.21.21`

2. **Bản ghi CNAME**:
   - Name: `www`
   - Value: `cname.vercel-dns.com`

### Bước 3: Xác minh domain
Đợi DNS được cập nhật (có thể mất đến 48 giờ), sau đó Vercel sẽ tự động xác minh domain.

## Kiểm tra và sửa lỗi

### Kiểm tra các tính năng chính
1. **Đăng ký/Đăng nhập**: Tạo tài khoản mới và đăng nhập
2. **Chat với AI**: Kiểm tra tính năng chat
3. **Tạo kế hoạch tài chính**: Tạo kế hoạch mới
4. **Thanh toán**: Kiểm tra quy trình thanh toán
5. **Export**: Kiểm tra xuất ra Google Sheets và Notion

### Sửa lỗi phổ biến
- **Lỗi CORS**: Kiểm tra cấu hình trong `vercel.json`
- **Lỗi API**: Kiểm tra logs trong Vercel Dashboard
- **Lỗi thanh toán**: Kiểm tra webhook URL và cấu hình PayOS

## Giám sát và bảo trì

### Giám sát
1. Thiết lập cảnh báo trong Vercel Dashboard
2. Kiểm tra logs thường xuyên

### Bảo trì
1. Cập nhật API keys khi cần thiết
2. Sao lưu dữ liệu Supabase định kỳ
3. Kiểm tra và cập nhật dependencies
