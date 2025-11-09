# 📋 Cập Nhật Pricing - 9 Tháng 11, 2025

## 🎯 Tổng Quan

Đã cập nhật toàn bộ thông tin pricing, features, và limits cho tất cả các gói subscription trên PlanAI.

---

## 📝 Thay Đổi Chi Tiết

### 1. **Pricing Page** (`/app/pricing/page.tsx`)

#### Gói Free
- **Chat**: 5 (không thay đổi)
- **Plans**: 1 (không thay đổi)
- **Features**: 
  - 5 Chat với AI
  - Phân tích cơ bản
  - 1 Kế hoạch ngắn

#### Gói 1 (Basic)
- **Chat**: 40 (không thay đổi)
- **Plans**: 1 (không thay đổi)
- **Features** (CẬP NHẬT):
  - 40 Chat với AI lập kế hoạch
  - 1 Ebook plan cá nhân hóa độc quyền
  - Phân tích đầy đủ + Lộ trình
  - Đề xuất hành động để đạt được mục tiêu
  - Plan chuyên sâu + tất cả tài liệu liên quan
  - Xuất file PDF, Word, Docs
  - Xuất sang Notion, Google Trang tính, Google Tài liệu
  - (Add-on) Phân tích kết hợp tử vi, số mệnh, thần số học
  - Mở khoá tính năng đọc các bài blog trả phí

#### Gói 2 - Pro
- **Chat**: 100 (CẬP NHẬT từ 90)
- **Plans**: 2 (CẬP NHẬT từ 3)
- **Features** (CẬP NHẬT):
  - 100 Chat với AI lập kế hoạch
  - 2 Ebook plan cá nhân hóa độc quyền
  - Phân tích đầy đủ + Lộ trình
  - Đề xuất hành động để đạt được mục tiêu
  - Plan chuyên sâu + tất cả tài liệu liên quan
  - Xuất file PDF, Word, Docs
  - Xuất sang Notion, Google Trang tính, Google Tài liệu
  - (Add-on) Phân tích kết hợp tử vi, số mệnh, thần số học
  - Mở khóa tính năng đọc các bài Blog trả phí
  - Truy cập sớm các tính năng mới nhất

#### Gói 3 - Pro Max
- **Chat**: 270 (CẬP NHẬT từ 160)
- **Plans**: 5 (CẬP NHẬT từ 6)
- **Features** (CẬP NHẬT):
  - 270 Chat với AI lập kế hoạch
  - 5 Ebook plan cá nhân hóa độc quyền dài
  - Phân tích đầy đủ + Lộ trình
  - Đề xuất hành động để đạt được mục tiêu
  - Plan chuyên sâu + tất cả tài liệu liên quan
  - Xuất file PDF, Word, Docs
  - Xuất sang Notion, Google Trang Tính, Google Tài liệu
  - (Add-on) Phân tích kết hợp tử vi, số mệnh, thần số học
  - Mở khóa tính năng đọc các bài Blog trả phí
  - Truy cập sớm các tính năng mới nhất

---

### 2. **Word Count Limits** (Bản Kế Hoạch Hoàn Chỉnh)

#### Cập Nhật Logic:

| Gói | Word Count | Mô Tả |
|-----|-----------|-------|
| **Free** | 1000-1500 từ | Tuỳ vào độ phức tạp của thông tin user cung cấp |
| **Gói 1** | Tối đa 100.000 từ | 1 kế hoạch chuyên sâu (AI có thể viết tới ~100k từ) |
| **Gói 2** | Tối đa 100.000 từ mỗi kế hoạch | 2 kế hoạch, mỗi bản tối đa ~100k từ |
| **Gói 3** | Tối đa 100.000 từ mỗi kế hoạch | 5 kế hoạch, mỗi bản tối đa ~100k từ |

**Lưu ý**: 
- Free tier: Giới hạn cứng 1000-1500 từ
- Gói 1, 2, 3: Không giới hạn từ, AI sẽ tạo plan đầy đủ dựa trên độ phức tạp của thông tin

---

### 3. **Database Updates** (`supabase/migrations/20251109_update_subscription_tiers.sql`)

Đã tạo SQL migration file để cập nhật `subscription_tiers` table:

```sql
-- Update Free tier
UPDATE subscription_tiers 
SET chat_limit = 5, plan_limit = 1, word_limit = 5000
WHERE id = 'free';

-- Update Gói 1 (Basic)
UPDATE subscription_tiers 
SET chat_limit = 40, plan_limit = 1, word_limit = 9000
WHERE id = 'basic';

-- Update Gói 2 (Pro)
UPDATE subscription_tiers 
SET chat_limit = 100, plan_limit = 2, word_limit = 12000
WHERE id = 'pro';

-- Update Gói 3 (Pro Max)
UPDATE subscription_tiers 
SET chat_limit = 270, plan_limit = 5, word_limit = 20000
WHERE id = 'pro_max';
```

---

### 4. **Code Updates** (`lib/supabase.ts`)

Cập nhật function `getSubscriptionLimits()` với limits mới:

```typescript
export const getSubscriptionLimits = (tier: string) => {
  const defaultLimits = {
    'free': { plans: 1, chats: 5, words: 5000, allowSheets: false, allowNotion: false },
    'basic': { plans: 1, chats: 40, words: 999999, allowSheets: true, allowNotion: true },
    'pro': { plans: 2, chats: 100, words: 999999, allowSheets: true, allowNotion: true },
    'pro_max': { plans: 5, chats: 270, words: 999999, allowSheets: true, allowNotion: true }
  }
  return defaultLimits[tier as keyof typeof defaultLimits] || defaultLimits.free
}
```

**Lưu ý**: 
- `words: 999999` = Unlimited (AI sẽ tạo plan dựa trên độ phức tạp)
- Chỉ Free tier có giới hạn cứng (5000 từ)

---

## 📊 Bảng So Sánh

| Tiêu Chí | Free | Gói 1 | Gói 2 | Gói 3 |
|---------|------|-------|-------|-------|
| **Giá** | Miễn phí | 169K | 289K | 499K |
| **Chat/tháng** | 5 | 40 | 100 | 270 |
| **Plans/tháng** | 1 | 1 | 2 | 5 |
| **Word Count** | 1000-1500 | Unlimited | Unlimited | Unlimited |
| **Ebook Plans** | 1 ngắn | 1 độc quyền | 2 độc quyền | 5 độc quyền dài |
| **Export Formats** | PDF | PDF/Word/Docs | PDF/Word/Docs | PDF/Word/Docs |
| **Google Sheets** | ❌ | ✅ | ✅ | ✅ |
| **Notion** | ❌ | ✅ | ✅ | ✅ |
| **Spiritual Analysis** | ❌ | ✅ | ✅ | ✅ |
| **Blog Trả Phí** | ❌ | ✅ | ✅ | ✅ |
| **Early Access** | ❌ | ❌ | ✅ | ✅ |

---

## 🔧 Cách Triển Khai

### Bước 1: Chạy SQL Migration

1. Vào Supabase Dashboard: https://supabase.com/dashboard
2. Chọn project: `wjzmscsoiibzlxejqpgg`
3. Vào **SQL Editor**
4. Copy nội dung từ: `supabase/migrations/20251109_update_subscription_tiers.sql`
5. Click **Run**

### Bước 2: Deploy Code

1. Commit changes:
```bash
git add app/pricing/page.tsx lib/supabase.ts supabase/migrations/20251109_update_subscription_tiers.sql
git commit -m "feat: Update pricing tiers, features, and word count limits (Nov 9, 2025)"
```

2. Push to main:
```bash
git push origin main
```

3. Vercel sẽ auto-deploy

### Bước 3: Verify

1. Vào https://planai.io.vn/pricing
2. Kiểm tra:
   - ✅ Gói 1: 40 chats, 1 plan, features mới
   - ✅ Gói 2: 100 chats, 2 plans, features mới
   - ✅ Gói 3: 270 chats, 5 plans, features mới

3. Test plan generation:
   - Free tier: Plan có ~1000-1500 từ
   - Gói 1+: Plan không giới hạn từ

---

## 📌 Lưu Ý Quan Trọng

### Không Thay Đổi:
- ✅ Giá tiền (169K, 289K, 499K)
- ✅ Giao diện pricing page
- ✅ Các tính năng khác của ứng dụng

### Thay Đổi:
- 🔄 Features description (thêm chi tiết hơn)
- 🔄 Chat limits (Gói 2: 90→100, Gói 3: 160→270)
- 🔄 Plan limits (Gói 2: 3→2, Gói 3: 6→5)
- 🔄 Word count logic (Gói 1-3: Unlimited)

---

## ✅ Checklist

- [x] Cập nhật pricing page features
- [x] Cập nhật chat limits (40, 100, 270)
- [x] Cập nhật plan limits (1, 2, 5)
- [x] Cập nhật word count logic
- [x] Tạo SQL migration file
- [x] Cập nhật `getSubscriptionLimits()` function
- [x] Tạo documentation file

---

## 🚀 Status

**Status**: ✅ READY FOR DEPLOYMENT

Tất cả thay đổi đã hoàn thành. Chỉ cần:
1. Chạy SQL migration trên Supabase
2. Push code lên Github
3. Vercel sẽ auto-deploy

---

**Date**: 9 Tháng 11, 2025  
**Updated By**: Cascade AI Assistant  
**Version**: 1.0
