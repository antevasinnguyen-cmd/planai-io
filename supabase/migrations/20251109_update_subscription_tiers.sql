-- Update subscription tiers with new features and word limits
-- Date: 2025-11-09

-- Update Free tier
UPDATE subscription_tiers 
SET 
  chat_limit = 5,
  plan_limit = 1,
  word_limit = 5000,
  features = '[
    "5 Chat với AI",
    "Phân tích cơ bản",
    "1 Kế hoạch ngắn",
    "Giới hạn 5,000 từ (tùy độ phức tạp)",
    "Không có tính năng nâng cao"
  ]'::jsonb
WHERE id = 'free';

UPDATE subscription_tiers 
SET 
  chat_limit = 40,
  plan_limit = 1,
  word_limit = 100000,
  features = '[
    "40 Chat với AI lập kế hoạch",
    "1 Ebook plan cá nhân hóa độc quyền",
    "Phân tích đầy đủ + Lộ trình",
    "Đề xuất hành động để đạt được mục tiêu",
    "Plan chuyên sâu + tất cả tài liệu liên quan",
    "Xuất file PDF, Word, Docs",
    "Xuất sang Notion, Google Trang tính, Google Tài liệu",
    "(Add-on) Phân tích kết hợp tử vi, số mệnh, thần số học",
    "Mở khoá tính năng đọc các bài blog trả phí"
  ]'::jsonb
WHERE id = 'basic';

UPDATE subscription_tiers 
SET 
  chat_limit = 100,
  plan_limit = 2,
  word_limit = 100000,
  features = '[
    "100 Chat với AI lập kế hoạch",
    "2 Ebook plan cá nhân hóa độc quyền",
    "Phân tích đầy đủ + Lộ trình",
    "Đề xuất hành động để đạt được mục tiêu",
    "Plan chuyên sâu + tất cả tài liệu liên quan",
    "Xuất file PDF, Word, Docs",
    "Xuất sang Notion, Google Trang tính, Google Tài liệu",
    "(Add-on) Phân tích kết hợp tử vi, số mệnh, thần số học",
    "Mở khóa tính năng đọc các bài Blog trả phí",
    "Truy cập sớm các tính năng mới nhất"
  ]'::jsonb
WHERE id = 'pro';

UPDATE subscription_tiers 
SET 
  chat_limit = 270,
  plan_limit = 5,
  word_limit = 100000,
  features = '[
    "270 Chat với AI lập kế hoạch",
    "5 Ebook plan cá nhân hóa độc quyền dài",
    "Phân tích đầy đủ + Lộ trình",
    "Đề xuất hành động để đạt được mục tiêu",
    "Plan chuyên sâu + tất cả tài liệu liên quan",
    "Xuất file PDF, Word, Docs",
    "Xuất sang Notion, Google Trang Tính, Google Tài liệu",
    "(Add-on) Phân tích kết hợp tử vi, số mệnh, thần số học",
    "Mở khóa tính năng đọc các bài Blog trả phí",
    "Truy cập sớm các tính năng mới nhất"
  ]'::jsonb
WHERE id = 'pro_max';

-- Note: Word count limits for plans:
-- Free: 1000-1500 từ (tuỳ vào độ phức tạp)
-- Gói 1: Không giới hạn từ (tuỳ vào độ phức tạp)
-- Gói 2: Không giới hạn từ (tuỳ vào độ phức tạp)
-- Gói 3: Không giới hạn từ (tuỳ vào độ phức tạp)
