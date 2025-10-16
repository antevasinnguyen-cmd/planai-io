# 🚨 KHẮC PHỤC LỖI "No Data Available" TRÊN VERCEL

## 🔍 Nguyên nhân lỗi:
Lỗi "No Data Available" xảy ra vì các biến môi trường cần thiết chưa được thiết lập trên Vercel, khiến ứng dụng không thể kết nối tới database và các services khác.

## ✅ Giải pháp: Thiết lập Environment Variables trên Vercel

### Bước 1: Truy cập Vercel Dashboard
1. Đăng nhập vào [vercel.com](https://vercel.com)
2. Vào project **planai-io** (hoặc tên project của bạn)
3. Chọn tab **Settings** > **Environment Variables**

### Bước 2: Thêm các biến môi trường cần thiết

**Copy và paste các giá trị sau vào Vercel Dashboard:**

#### 🔧 **SUPABASE (BẮT BUỘC)**
```
NEXT_PUBLIC_SUPABASE_URL=https://wjzmscsoiibzlxejqpgg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqem1zY3NvaWliemx4ZWpxcGdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NzQwODIsImV4cCI6MjA3MzM1MDA4Mn0.w6EeucNqmyNahoA8KZVjDYLy3ZgbTyqzVuiOq9MCZGA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqem1zY3NvaWliemx4ZWpxcGdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc3NDA4MiwiZXhwIjoyMDczMzUwMDgyfQ.C0OlpsyqnnG6CaMDnhv4M6GI4lTN3AyK4sldWl_UpZk
```

#### 🤖 **OPENAI API (ĐỂ AI CHAT HOẠT ĐỘNG)**
```
OPENAI_API_KEY=sk-your-openai-api-key-here
ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

#### 💳 **PAYMENT PROVIDERS (ĐỂ THANH TOÁN HOẠT ĐỘNG)**
```
# PayOS (Chính)
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key

# SePay (Phụ)
SEPAY_ACCOUNT_NUMBER=your_sepay_account_number
SEPAY_TOKEN=your_sepay_token
```

#### 🌐 **APP CONFIGURATION**
```
NEXT_PUBLIC_APP_URL=https://planai-io.vercel.app
NODE_ENV=production
```

### Bước 3: Redeploy sau khi thêm biến
1. Sau khi thêm xong tất cả biến môi trường
2. Trigger một deploy mới bằng cách push code lên GitHub
3. Hoặc chọn **Redeploy** trong Vercel Dashboard

### Bước 4: Kiểm tra kết quả
1. Kiểm tra deployment logs để đảm bảo không còn lỗi
2. Truy cập ứng dụng và kiểm tra các chức năng:
   - ✅ Database kết nối thành công
   - ✅ AI chat hoạt động (nếu có API keys)
   - ✅ Thanh toán hoạt động (nếu có payment configs)

## 🔧 Các biến môi trường quan trọng nhất:

| Biến | Mô tả | Bắt buộc |
|------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL của Supabase project | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public API key của Supabase | ✅ |
| `OPENAI_API_KEY` | API key để AI chat hoạt động | ⚠️ (cần cho AI) |
| `PAYOS_CLIENT_ID` | ID của PayOS merchant | ⚠️ (cần cho thanh toán) |
| `PAYOS_API_KEY` | API key của PayOS | ⚠️ (cần cho thanh toán) |

## 🚨 Lưu ý quan trọng:
- **Không commit file `.env`** vào Git (đã được ignore)
- Các biến có prefix `NEXT_PUBLIC_` sẽ được expose cho client-side
- Các biến không có prefix sẽ chỉ có ở server-side
- Nếu thiếu bất kỳ biến nào ở trên, ứng dụng sẽ không hoạt động

## 🔍 Debug lỗi:
Nếu vẫn gặp lỗi sau khi thiết lập, kiểm tra:
1. Vercel deployment logs để xem lỗi chi tiết
2. Console browser để xem lỗi JavaScript
3. Network tab để xem API calls bị fail

---
**Sau khi thiết lập xong, ứng dụng sẽ hoạt động bình thường mà không còn lỗi "No Data Available"!** 🎉
