# Tính năng AI trong PlanAI

Tài liệu này mô tả chi tiết về các tính năng AI được triển khai trong PlanAI, cách chúng hoạt động và cách sử dụng chúng.

## Tổng quan

PlanAI sử dụng các mô hình AI tiên tiến để tạo kế hoạch tài chính cá nhân hóa. Hệ thống được thiết kế để cung cấp trải nghiệm người dùng tốt nhất với hiệu suất cao và chi phí hợp lý.

### Mô hình AI được sử dụng

1. **GPT-4o-mini**: Mô hình chính cho chat thông thường và phân tích dữ liệu
2. **GPT-4o**: Mô hình mạnh hơn cho việc tạo kế hoạch tài chính phức tạp
3. **Claude-3.5-Sonnet**: Mô hình thay thế khi GPT-4o không khả dụng
4. **Claude-3.5-Haiku**: Mô hình dự phòng (fallback) khi các mô hình khác gặp lỗi

## Luồng tạo kế hoạch tài chính

1. **Thu thập thông tin**: Người dùng cung cấp thông tin qua giao diện chat
2. **Phân tích dữ liệu**: Hệ thống phân tích thông tin và xác định mục tiêu tài chính
3. **Tạo kế hoạch**: Sử dụng GPT-4o hoặc Claude-3.5-Sonnet để tạo kế hoạch chi tiết
4. **Xử lý RAG**: Lưu trữ và đánh chỉ mục kế hoạch để truy vấn sau này
5. **Xuất dữ liệu**: Cho phép xuất kế hoạch sang Google Sheets hoặc định dạng khác

## Tính năng chính

### 1. Chat AI thông minh

- Sử dụng GPT-4o-mini cho phản hồi nhanh và tiết kiệm chi phí
- Phân tích thông tin người dùng để cá nhân hóa trải nghiệm
- Lưu trữ lịch sử chat để tham khảo sau này

### 2. Tạo kế hoạch tài chính

- Sử dụng GPT-4o cho kế hoạch chi tiết và chính xác
- Fallback sang Claude-3.5-Sonnet khi cần thiết
- Cấu trúc kế hoạch bao gồm:
  - Tóm tắt mục tiêu
  - Phân tích tình hình hiện tại
  - Lộ trình chi tiết
  - Ngân sách và phân bổ tài chính
  - Timeline thực hiện
  - Checklist hành động
  - Rủi ro và giải pháp
  - Lời khuyên và động viên

### 3. RAG (Retrieval-Augmented Generation)

- Chia nhỏ kế hoạch thành các phần nhỏ (chunks)
- Tạo embeddings cho từng phần
- Lưu trữ trong Supabase để truy vấn vector
- Cho phép người dùng đặt câu hỏi về kế hoạch của họ

### 4. Xuất dữ liệu

- Xuất sang Google Sheets với định dạng đẹp
- Hỗ trợ trong tương lai: Xuất PDF và đồng bộ với Notion

### 5. Cache thông minh

- Lưu trữ kết quả AI để tái sử dụng
- Giảm thời gian phản hồi và chi phí API
- Tự động xóa cache hết hạn

## Cấu hình môi trường

Để sử dụng đầy đủ tính năng AI, cần cấu hình các biến môi trường sau:

```
# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# Anthropic API (Claude)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Google Sheets API
GOOGLE_CLIENT_EMAIL=your_service_account_email
GOOGLE_PRIVATE_KEY=your_service_account_private_key
GOOGLE_SHEETS_TEMPLATE_ID=your_template_spreadsheet_id
```

## Giới hạn và lưu ý

- Mỗi gói người dùng có giới hạn số lượng kế hoạch và chat khác nhau
- Kế hoạch tài chính được tạo bởi AI nên cần được xem xét bởi chuyên gia tài chính
- Dữ liệu người dùng được bảo mật và không được sử dụng để đào tạo mô hình AI

## Phát triển trong tương lai

- Tích hợp với Notion API
- Thêm tính năng phân tích tài chính nâng cao
- Cải thiện RAG với mô hình embeddings mới hơn
- Thêm tính năng tạo kế hoạch theo nhóm/gia đình
