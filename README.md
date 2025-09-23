# PlanAI - AI Financial Planning SaaS

Webapp SaaS áp dụng AI giúp người dùng lập kế hoạch / xây dựng chiến lược cá nhân hoá cho mục tiêu tài chính, kiếm tiền, tăng thu nhập. AI tạo plan độc quyền như 1 cuốn Ebook cho mục tiêu của bạn.

**Slogan:** "Biến dữ liệu thô thành bản kế hoạch đáng mơ ước"

## Người dùng mục tiêu

- **Độ tuổi:** 23 - 35 tuổi
- **Đối tượng:** Người đã đi làm / nhân viên văn phòng / làm việc tự do
- **Thu nhập:** Từ 5 triệu trở lên
- **Khu vực:** Việt Nam (tập trung tại Hà Nội/TP.HCM/Đà Nẵng/Bắc Ninh)
- **Trình độ:** Đại Học/ trên Đại Học
- **Ngôn ngữ:** Tiếng Việt

## Tính năng chính

### Chat Mode
- Trò chuyện với AI để thu thập thông tin cá nhân
- Progressive profiling (thu thập thông tin từng bước)
- Gợi ý trường thông tin cần thiết

### Plan Mode  
- Sinh kế hoạch tài chính cá nhân hóa chi tiết
- Format như cuốn Ebook (5,000 - 20,000 từ)
- Bao gồm: phân tích, lộ trình, checklist, tài liệu học tập
- Export PDF, Word, Docs, Google Sheets, Notion

### Spiritual Add-on
- Tử vi, thần số học (tùy chọn bật/tắt)

## Gói dịch vụ

- **Free:** 5 Chat, 1 kế hoạch ngắn
- **Gói 1 (169,000đ):** 30 Chat, 1 Ebook plan (5-8k từ)
- **Gói 2 (289,000đ):** 70 Chat, 3 Ebook plan (9-12k từ)  
- **Gói 3 (499,000đ):** 150 Chat, 6 Ebook plan (15-20k từ)

## Tech Stack

- **Frontend:** Next.js + React + Tailwind CSS
- **Backend:** Supabase (Database + Auth)
- **AI:** 
  - OpenAI GPT-3.5-turbo (chat thường - tiết kiệm tối đa)
  - OpenAI GPT-4o-mini (kế hoạch phức tạp - cân bằng chi phí/chất lượng)
  - Claude-3.5-Haiku (fallback)
  - Chunking/RAG cho quản lý context
  - Caching responses với Supabase
- **Payment:** VietQR pro (Payos)
- **Hosting:** Vercel
- **Domain:** planai.io
- **Tích hợp bổ sung:**
  - Google Sheets API (miễn phí) để xuất dữ liệu kế hoạch
  - Notion API (miễn phí với giới hạn) để đồng bộ hóa

## Cài đặt

1. Clone repository
2. Copy `.env.local.example` thành `.env.local` và điền các API keys
3. Cài đặt dependencies:
```bash
npm install
```

4. Chạy development server:
```bash
npm run dev
```

5. Mở [http://localhost:3000](http://localhost:3000)

## Cấu trúc dự án

```
/
├── app/                 # Next.js App Router
├── components/          # React components
├── lib/                # Utilities và configurations
├── types/              # TypeScript type definitions
├── public/             # Static assets
└── supabase/           # Database schemas và migrations
```

## API Keys và Environment Variables cần thiết

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anonymous Key
- `OPENAI_API_KEY`: OpenAI API Key
- `ANTHROPIC_API_KEY`: Anthropic API Key (cho Claude)
- `SEPAY_API_KEY`: SePay API Key
- `GOOGLE_SHEETS_API_KEY`: Google Sheets API Key
- `NOTION_API_KEY`: Notion API Key

## License

MIT
