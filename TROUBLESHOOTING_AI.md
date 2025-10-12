# Hướng dẫn khắc phục lỗi AI không hoạt động

Nếu tính năng AI của PlanAI không hoạt động đúng, hãy làm theo các bước sau để khắc phục:

## 1. Kiểm tra API Keys trên Vercel

### 1.1. Kiểm tra OpenAI API Key
1. Đăng nhập vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Chọn dự án PlanAI
3. Vào mục **Settings** > **Environment Variables**
4. Kiểm tra xem đã có biến `OPENAI_API_KEY` chưa
5. Nếu chưa có, thêm mới với giá trị là API key của OpenAI
6. Nếu đã có, kiểm tra xem giá trị có đúng không

### 1.2. Kiểm tra Anthropic API Key (cho Claude fallback)
1. Tương tự, kiểm tra biến `ANTHROPIC_API_KEY` trong Environment Variables
2. Thêm hoặc cập nhật nếu cần thiết

## 2. Kiểm tra Supabase Configuration

### 2.1. Kiểm tra Supabase URL và Anon Key
1. Đảm bảo các biến sau đã được cấu hình đúng trên Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2.2. Kiểm tra Supabase Functions
1. Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn dự án PlanAI
3. Vào mục **Database** > **Functions**
4. Kiểm tra các functions sau đã tồn tại và hoạt động đúng:
   - `increment_cache_access`
   - `cleanup_expired_cache`

## 3. Kiểm tra Logs

### 3.1. Logs trên Vercel
1. Vào mục **Deployments** > chọn deployment gần nhất
2. Chọn tab **Logs**
3. Tìm kiếm các lỗi liên quan đến API calls, authentication, hoặc Supabase

### 3.2. Logs trên Supabase
1. Vào mục **Database** > **Logs**
2. Kiểm tra các lỗi liên quan đến functions hoặc queries

## 4. Kiểm tra Authentication

### 4.1. Kiểm tra phiên đăng nhập
1. Đăng xuất và đăng nhập lại vào PlanAI
2. Kiểm tra xem có nhận được thông báo lỗi nào không

### 4.2. Kiểm tra Row Level Security (RLS)
1. Vào Supabase Dashboard > **Authentication** > **Policies**
2. Đảm bảo các bảng sau có policies phù hợp:
   - `ai_response_cache`
   - `chat_messages`
   - `profiles`
   - `subscriptions`

## 5. Khắc phục lỗi cụ thể

### 5.1. Lỗi "Unauthorized"
- Đảm bảo đã đăng nhập
- Kiểm tra xem token có được truyền đúng trong API calls không
- Kiểm tra RLS policies

### 5.2. Lỗi "OpenAI API key không được cấu hình"
- Kiểm tra lại API key trên Vercel
- Redeploy ứng dụng sau khi cập nhật API key

### 5.3. Lỗi nhấp nháy và không thể cuộn
- Đã được khắc phục trong commit gần nhất
- Nếu vẫn còn, hãy xóa cache trình duyệt và thử lại

## 6. Các bước cuối cùng

1. Sau khi thực hiện các thay đổi, hãy redeploy ứng dụng
2. Xóa cache trình duyệt và thử lại
3. Nếu vẫn gặp lỗi, hãy kiểm tra console của trình duyệt để xem lỗi chi tiết

## Liên hệ hỗ trợ

Nếu đã thử tất cả các bước trên mà vẫn gặp lỗi, vui lòng liên hệ:
- Email: webappsaas.ai@gmail.com
- Với thông tin chi tiết về lỗi và các bước đã thử
