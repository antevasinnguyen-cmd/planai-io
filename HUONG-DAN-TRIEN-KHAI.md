# Hướng dẫn triển khai flow xác thực mới

## Vấn đề hiện tại

Sau nhiều lần chỉnh sửa, có thể có cache hoặc phiên bản cũ vẫn tồn tại, dẫn đến tình trạng "lỗi vẫn vậy". Các vấn đề chính:

1. **Xung đột cache**: LocalStorage có thể chứa dữ liệu cũ gây xung đột
2. **Cấu hình Supabase**: Thiếu các cấu hình rõ ràng cho client Supabase
3. **Middleware**: Không xử lý đúng các trường hợp chuyển hướng
4. **Callback**: Không xử lý đúng session sau khi OAuth
5. **Thông báo thành công**: Không hiển thị thông báo chúc mừng sau khi đăng nhập

## Giải pháp

Đã tạo các file mới để thiết lập lại toàn bộ flow xác thực từ đầu:

1. `lib/supabase-new.ts`: Client Supabase mới với cấu hình rõ ràng
2. `lib/auth-context-new.tsx`: Context xác thực mới với xử lý session tốt hơn
3. `app/auth/callback/page-new.tsx`: Trang callback mới xử lý OAuth tốt hơn
4. `middleware-new.ts`: Middleware mới xử lý chuyển hướng chính xác hơn
5. `components/auth-success-message.tsx`: Component hiển thị thông báo thành công
6. `app/layout-new.tsx`: Layout mới tích hợp thông báo thành công
7. `app/login/page-new.tsx`: Trang đăng nhập mới với xử lý lỗi tốt hơn

## Các bước triển khai

### 1. Sao lưu các file hiện tại

```bash
cp lib/supabase.ts lib/supabase.ts.bak
cp lib/auth-context.tsx lib/auth-context.tsx.bak
cp app/auth/callback/page.tsx app/auth/callback/page.tsx.bak
cp middleware.ts middleware.ts.bak
cp app/layout.tsx app/layout.tsx.bak
cp app/login/page.tsx app/login/page.tsx.bak
```

### 2. Thay thế các file cũ bằng file mới

```bash
mv lib/supabase-new.ts lib/supabase.ts
mv lib/auth-context-new.tsx lib/auth-context.tsx
mv app/auth/callback/page-new.tsx app/auth/callback/page.tsx
mv middleware-new.ts middleware.ts
mv app/layout-new.tsx app/layout.tsx
mv app/login/page-new.tsx app/login/page.tsx
```

### 3. Xóa cache trình duyệt

Sau khi triển khai, yêu cầu người dùng:

1. Xóa cache trình duyệt
2. Xóa cookies của trang web
3. Xóa localStorage của trang web

### 4. Kiểm tra cấu hình Supabase

Đảm bảo cấu hình Supabase đã được thiết lập đúng:

1. Đăng nhập vào [dashboard Supabase](https://app.supabase.io/)
2. Chọn dự án của bạn
3. Vào phần "Authentication" > "URL Configuration"
4. Đảm bảo "Site URL" được đặt thành `https://planai.io.vn`
5. Thêm `https://planai.io.vn/auth/callback` vào "Redirect URLs"

### 5. Kiểm tra biến môi trường

Đảm bảo các biến môi trường đã được thiết lập đúng trong file `.env.local` và trên Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 6. Triển khai lên Vercel

```bash
git add .
git commit -m "fix: Thiết lập lại toàn bộ flow xác thực"
git push origin main
```

### 7. Kiểm tra sau khi triển khai

1. Truy cập trang đăng nhập: `https://planai.io.vn/login`
2. Đăng nhập bằng email/password hoặc Google
3. Kiểm tra xem có được chuyển hướng đến dashboard không
4. Kiểm tra xem có hiển thị thông báo chúc mừng không

## Cách hoạt động của flow mới

### 1. Đăng nhập bằng email/password

```
User nhập email/password -> signIn() -> AuthContext SIGNED_IN -> Chuyển hướng đến dashboard -> Hiển thị thông báo chúc mừng
```

### 2. Đăng nhập bằng Google

```
User click "Google" -> signInWithGoogle() -> Chuyển hướng đến Google -> Google xác thực -> Chuyển hướng đến /auth/callback -> Xử lý session -> Chuyển hướng đến dashboard -> Hiển thị thông báo chúc mừng
```

### 3. Middleware bảo vệ các trang

```
User truy cập /dashboard -> Middleware kiểm tra session -> Nếu không có session, chuyển hướng đến /login
```

### 4. Thông báo chúc mừng

```
User đăng nhập thành công -> localStorage.setItem('auth_success', 'true') -> AuthSuccessMessage kiểm tra và hiển thị thông báo
```

## Xử lý sự cố

### 1. Vẫn không thể đăng nhập

- Kiểm tra console trình duyệt để xem lỗi
- Kiểm tra Network tab để xem các request đến Supabase
- Đảm bảo đã xóa cache trình duyệt và localStorage

### 2. Không chuyển hướng đến dashboard

- Kiểm tra middleware.ts để đảm bảo đúng logic chuyển hướng
- Kiểm tra auth-context.tsx để đảm bảo xử lý sự kiện SIGNED_IN đúng

### 3. Không hiển thị thông báo chúc mừng

- Kiểm tra localStorage có auth_success không
- Kiểm tra AuthSuccessMessage component đã được tích hợp vào layout chưa

## Kết luận

Flow xác thực mới đã được thiết kế lại từ đầu với các cải tiến:

1. **Logging chi tiết** để dễ dàng debug
2. **Xóa cache** để tránh xung đột
3. **Cấu hình rõ ràng** cho Supabase client
4. **Xử lý session** tốt hơn trong AuthContext
5. **Thông báo chúc mừng** sau khi đăng nhập thành công

Nếu vẫn gặp vấn đề, hãy kiểm tra logs trong console trình duyệt và server logs trên Vercel để tìm nguyên nhân.
