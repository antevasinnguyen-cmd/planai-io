-- Update subscription tiers with new features and word limits
-- Date: 2025-11-09
-- Version: Final - 50k word limit for paid tiers

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

-- Update Gói 1 (Basic) tier
UPDATE subscription_tiers 
SET 
  chat_limit = 40,
  plan_limit = 1,
  word_limit = 50000,
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

-- Update Gói 2 (Pro) tier
UPDATE subscription_tiers 
SET 
  chat_limit = 100,
  plan_limit = 2,
  word_limit = 50000,
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

-- Update Gói 3 (Pro Max) tier
UPDATE subscription_tiers 
SET 
  chat_limit = 270,
  plan_limit = 5,
  word_limit = 50000,
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

-- Verify the updates
SELECT id, name, chat_limit, plan_limit, word_limit FROM subscription_tiers ORDER BY id;
