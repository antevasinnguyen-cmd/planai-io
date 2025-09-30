# Checklist kiểm tra PlanAI trước khi ra mắt

## 1. Xác thực và Phân quyền

- [ ] Đăng ký tài khoản mới hoạt động bình thường
- [ ] Đăng nhập hoạt động bình thường
- [ ] Đăng xuất hoạt động bình thường
- [ ] Quên mật khẩu hoạt động bình thường
- [ ] Row Level Security (RLS) được cấu hình đúng trong Supabase
- [ ] Người dùng chỉ có thể xem dữ liệu của chính họ

## 2. Tính năng Chat

- [ ] Gửi tin nhắn đến AI hoạt động bình thường
- [ ] AI trả lời đúng và nhanh chóng
- [ ] Tin nhắn được lưu vào database
- [ ] Giới hạn số lượng tin nhắn theo gói dịch vụ
- [ ] Hiển thị số tin nhắn còn lại
- [ ] Fallback sang Claude khi OpenAI gặp lỗi

## 3. Tính năng Plan

- [ ] Tạo kế hoạch tài chính mới hoạt động bình thường
- [ ] Giới hạn số lượng kế hoạch theo gói dịch vụ
- [ ] Hiển thị số kế hoạch còn lại
- [ ] Giới hạn số từ theo gói dịch vụ
- [ ] Hiển thị danh sách kế hoạch đã tạo
- [ ] Xem chi tiết kế hoạch hoạt động bình thường

## 4. Tính năng Export

- [ ] Export sang PDF hoạt động bình thường
- [ ] Export sang Word hoạt động bình thường
- [ ] Export sang Google Sheets hoạt động bình thường
- [ ] Export sang Notion hoạt động bình thường
- [ ] Xác thực OAuth với Google hoạt động bình thường
- [ ] Xác thực OAuth với Notion hoạt động bình thường

## 5. Thanh toán

- [ ] Hiển thị các gói dịch vụ đúng
- [ ] Chọn gói và thanh toán hoạt động bình thường
- [ ] Tạo yêu cầu thanh toán với PayOS thành công
- [ ] Webhook nhận thông báo thanh toán thành công
- [ ] Cập nhật gói dịch vụ sau khi thanh toán thành công
- [ ] Hiển thị lịch sử thanh toán

## 6. Tính năng Spiritual Add-on

- [ ] Phân tích tử vi hoạt động bình thường
- [ ] Phân tích số mệnh hoạt động bình thường
- [ ] Tích hợp với kế hoạch tài chính

## 7. Giao diện người dùng

- [ ] Responsive trên desktop, tablet và mobile
- [ ] Các nút và liên kết hoạt động đúng
- [ ] Không có lỗi CSS
- [ ] Thông báo lỗi rõ ràng và hữu ích
- [ ] Thông báo thành công rõ ràng
- [ ] Dark mode hoạt động bình thường (nếu có)

## 8. Hiệu suất

- [ ] Trang tải nhanh (< 3 giây)
- [ ] API phản hồi nhanh
- [ ] Không có memory leaks
- [ ] Caching hoạt động đúng
- [ ] Không có lỗi trong console

## 9. Bảo mật

- [ ] API keys không bị lộ trong frontend
- [ ] Xác thực webhook đúng
- [ ] HTTPS được cấu hình đúng
- [ ] Headers bảo mật được cấu hình đúng
- [ ] Không có lỗ hổng XSS, CSRF

## 10. SEO và Analytics

- [ ] Meta tags được cấu hình đúng
- [ ] OG tags được cấu hình đúng
- [ ] Sitemap được tạo
- [ ] robots.txt được cấu hình
- [ ] Google Analytics được cấu hình (nếu có)

## 11. Nội dung

- [ ] Không có lỗi chính tả
- [ ] Nội dung landing page đầy đủ
- [ ] Nội dung blog đầy đủ
- [ ] Trang pricing hiển thị đúng
- [ ] Trang điều khoản và chính sách đầy đủ

## 12. Triển khai

- [ ] Biến môi trường được cấu hình đúng trên Vercel
- [ ] Domain được cấu hình đúng
- [ ] SSL hoạt động bình thường
- [ ] Không có lỗi 404
- [ ] Không có lỗi 500
- [ ] Logs được cấu hình đúng

## Hướng dẫn kiểm tra

1. Đăng ký tài khoản mới
2. Đăng nhập
3. Chat với AI
4. Tạo kế hoạch tài chính
5. Export kế hoạch
6. Thanh toán gói Pro
7. Kiểm tra giới hạn mới
8. Tạo thêm kế hoạch
9. Kiểm tra tính năng Spiritual Add-on
10. Đăng xuất và đăng nhập lại
