# Hướng dẫn cài đặt Environment Variables trên Vercel

Để tính năng AI hoạt động đúng, bạn cần cấu hình các biến môi trường sau trên Vercel:

## 1. OpenAI API Key

1. Đăng nhập vào tài khoản OpenAI của bạn tại [platform.openai.com](https://platform.openai.com)
2. Truy cập vào mục API Keys
3. Tạo một API key mới
4. Sao chép API key

## 2. Anthropic API Key (Cho Claude fallback)

1. Đăng nhập vào tài khoản Anthropic của bạn tại [console.anthropic.com](https://console.anthropic.com)
2. Truy cập vào mục API Keys
3. Tạo một API key mới
4. Sao chép API key

## 3. Cấu hình trên Vercel

1. Đăng nhập vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Chọn dự án PlanAI
3. Vào mục **Settings**
4. Chọn tab **Environment Variables**
5. Thêm các biến môi trường sau:

| Tên biến | Giá trị | Môi trường |
|----------|---------|------------|
| `OPENAI_API_KEY` | [API key của OpenAI] | Production, Preview, Development |
| `ANTHROPIC_API_KEY` | [API key của Anthropic] | Production, Preview, Development |

6. Nhấn **Save** để lưu lại cấu hình

## 4. Redeploy ứng dụng

1. Vào tab **Deployments**
2. Chọn deployment gần nhất
3. Nhấn nút **Redeploy** để triển khai lại ứng dụng với các biến môi trường mới

## 5. Kiểm tra

Sau khi redeploy, hãy kiểm tra tính năng AI để đảm bảo nó hoạt động đúng:

1. Truy cập vào trang [https://planai.io.vn/dashboard/create-plan](https://planai.io.vn/dashboard/create-plan)
2. Thử chat với AI để xem phản hồi

## Lưu ý

- Không bao giờ chia sẻ API key với người khác
- Nếu nghi ngờ API key bị lộ, hãy tạo key mới và cập nhật trên Vercel
- Kiểm tra giới hạn sử dụng API của OpenAI và Anthropic để tránh chi phí không mong muốn
