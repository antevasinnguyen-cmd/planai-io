# Hướng dẫn xử lý lỗi PlanAI

## Lỗi xác thực

### Không đăng nhập được
- **Nguyên nhân**: Supabase URL hoặc Anon Key không đúng
- **Giải pháp**: Kiểm tra lại biến môi trường `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Không đăng ký được
- **Nguyên nhân**: Email confirmation không được cấu hình đúng
- **Giải pháp**: Kiểm tra cấu hình Email trong Supabase Dashboard

## Lỗi AI

### OpenAI không trả lời
- **Nguyên nhân**: API key không đúng hoặc hết hạn mức
- **Giải pháp**: Kiểm tra lại `OPENAI_API_KEY` và tài khoản OpenAI

### Claude không hoạt động
- **Nguyên nhân**: API key không đúng
- **Giải pháp**: Kiểm tra lại `ANTHROPIC_API_KEY`

### AI trả lời chậm
- **Nguyên nhân**: Không có caching hoặc server quá tải
- **Giải pháp**: Kiểm tra bảng `ai_response_cache` và cấu hình caching

## Lỗi thanh toán

### Không tạo được yêu cầu thanh toán
- **Nguyên nhân**: API key PayOS không đúng
- **Giải pháp**: Kiểm tra lại `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, và `PAYOS_CHECKSUM_KEY`

### Webhook không nhận được thông báo
- **Nguyên nhân**: URL webhook không đúng hoặc không public
- **Giải pháp**: Kiểm tra cấu hình webhook trong PayOS Dashboard

### Thanh toán thành công nhưng không cập nhật gói
- **Nguyên nhân**: Lỗi trong webhook handler
- **Giải pháp**: Kiểm tra logs và code trong `app/api/payment/webhook/route.ts`

## Lỗi export

### Không export được sang Google Sheets
- **Nguyên nhân**: OAuth không được cấu hình đúng
- **Giải pháp**: Kiểm tra lại `GOOGLE_SHEETS_CLIENT_ID` và `GOOGLE_SHEETS_CLIENT_SECRET`

### Không export được sang Notion
- **Nguyên nhân**: OAuth không được cấu hình đúng
- **Giải pháp**: Kiểm tra lại `NOTION_CLIENT_ID` và `NOTION_CLIENT_SECRET`

## Lỗi database

### Không lưu được dữ liệu
- **Nguyên nhân**: RLS không được cấu hình đúng
- **Giải pháp**: Kiểm tra policies trong Supabase Dashboard

### Không đọc được dữ liệu
- **Nguyên nhân**: RLS không được cấu hình đúng
- **Giải pháp**: Kiểm tra policies trong Supabase Dashboard

## Lỗi triển khai

### Vercel build lỗi
- **Nguyên nhân**: Lỗi cú pháp hoặc thiếu dependencies
- **Giải pháp**: Kiểm tra logs build trong Vercel Dashboard

### Domain không hoạt động
- **Nguyên nhân**: DNS không được cấu hình đúng
- **Giải pháp**: Kiểm tra cấu hình DNS và SSL trong Vercel Dashboard

## Kiểm tra logs

### Logs frontend
```javascript
// Thêm vào code để debug
console.log('Debug:', data);
```

### Logs backend
```javascript
// Thêm vào code để debug
console.error('Error:', error);
```

### Logs Vercel
1. Truy cập [Vercel Dashboard](https://vercel.com/dashboard)
2. Chọn dự án **planai**
3. Chọn tab **Logs**

### Logs Supabase
1. Truy cập [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project **planai**
3. Chọn **Database** > **Logs**

## Liên hệ hỗ trợ

Nếu bạn vẫn gặp vấn đề, hãy liên hệ:
- Email: support@planai.io.vn
- Telegram: @planai_support
