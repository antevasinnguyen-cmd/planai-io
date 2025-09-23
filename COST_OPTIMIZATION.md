# PlanAI Cost Optimization Strategy

## Chiến Lược Model Selection & Tích Hợp (Đã Cập Nhật)

### 🎯 **Chiến Lược AI Hiện Tại:**
- **Chat thường:** GPT-3.5-turbo (tiết kiệm tối đa)
- **Kế hoạch phức tạp:** GPT-4o-mini (cân bằng chi phí/chất lượng)
- **Fallback:** Claude-3.5-Haiku (backup rẻ hơn)

### 🔗 **Tích Hợp Bổ Sung:**
- **Google Sheets API:** Xuất kế hoạch tài chính (miễn phí)
- **Notion API:** Đồng bộ hóa dữ liệu (miễn phí với giới hạn)
- **VietQR pro (Payos):** Thay thế SePay cho thanh toán

### 💰 **So Sánh Chi Phí:**

| Model | Chat Thường | Kế hoạch Phức Tạp | Giá 1K tokens (Input) | Giá 1K tokens (Output) |
|-------|-------------|-------------------|----------------------|-----------------------|
| **GPT-3.5-turbo** | ✅ | ❌ | $0.0015 | $0.002 |
| **GPT-4o-mini** | ❌ | ✅ | $0.00015 | $0.0006 |
| **GPT-4o** | ❌ | ❌ | $0.005 | $0.015 |
| **Claude-3.5-Haiku** | Fallback | Fallback | $0.00025 | $0.00125 |

### 📊 **Lợi Ích Chi Phí:**

#### Trước (Chiến lược cũ):
- Chat: GPT-4o-mini → tiết kiệm 70% so với GPT-4
- Planning: GPT-4o → đắt nhất

#### Sau (Chiến lược mới):
- Chat: GPT-3.5-turbo → tiết kiệm **90%** so với GPT-4
- Planning: GPT-4o-mini → tiết kiệm **70%** so với GPT-4

### 🚀 **Ưu Điểm:**

1. **Tiết kiệm tối đa:** Sử dụng model rẻ nhất cho từng tác vụ
2. **Caching:** Giảm 50-80% API calls cho câu hỏi phổ biến
3. **RAG:** Cải thiện chất lượng phản hồi, giảm token usage
4. **Fallback:** Claude đảm bảo hệ thống luôn hoạt động
5. **Tích hợp miễn phí:** Google Sheets & Notion API

### 🔧 **Cách Test:**

```bash
node test-hybrid-approach.js
```

### 📈 **Kết Quả Dự Kiến:**

- **Giảm 80-90% chi phí** cho chat thường
- **Giảm 50-70% chi phí** cho planning phức tạp
- **Tăng tốc độ phản hồi** nhờ caching
- **Cải thiện chất lượng** nhờ RAG context
- **Tăng tính năng** với các tích hợp miễn phí
