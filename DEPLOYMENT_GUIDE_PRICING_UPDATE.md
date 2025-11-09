# 🚀 Hướng Dẫn Triển Khai Cập Nhật Pricing

**Date**: 9 Tháng 11, 2025  
**Status**: Ready for Deployment  
**Estimated Time**: 10 phút

---

## 📋 Tóm Tắt Thay Đổi

### Files Đã Cập Nhật:
1. ✅ `/app/pricing/page.tsx` - Features mới cho Gói 1, 2, 3
2. ✅ `/lib/supabase.ts` - Limits mới trong `getSubscriptionLimits()`
3. ✅ `/supabase/migrations/20251109_update_subscription_tiers.sql` - SQL migration
4. ✅ `/PRICING_UPDATE_NOV_9_2025.md` - Documentation

### Thay Đổi Chính:
```
Gói 1: 40 chats, 1 plan, 9 features
Gói 2: 100 chats (↑10), 2 plans (↓1), 10 features
Gói 3: 270 chats (↑110), 5 plans (↓1), 10 features

Word Count:
- Free: 1000-1500 từ (cứng)
- Gói 1-3: Unlimited (tuỳ độ phức tạp)
```

---

## 🔧 Bước Triển Khai

### **BƯỚC 1: Chạy SQL Migration trên Supabase** (5 phút)

#### 1.1 Vào Supabase Dashboard
- URL: https://supabase.com/dashboard
- Chọn project: `wjzmscsoiibzlxejqpgg`

#### 1.2 Vào SQL Editor
1. Click **SQL Editor** (bên trái)
2. Click **New Query**

#### 1.3 Copy & Run SQL
1. Mở file: `/supabase/migrations/20251109_update_subscription_tiers.sql`
2. Copy toàn bộ nội dung
3. Paste vào SQL Editor
4. Click **Run** (hoặc Cmd+Enter)

#### 1.4 Verify
Chạy query này để verify:
```sql
SELECT id, name, chat_limit, plan_limit, word_limit 
FROM subscription_tiers 
ORDER BY id;
```

**Expected Result**:
```
id       | name            | chat_limit | plan_limit | word_limit
---------|-----------------|------------|------------|----------
free     | Free            | 5          | 1          | 5000
basic    | Gói 1           | 40         | 1          | 9000
pro      | Gói 2 - Pro     | 100        | 2          | 12000
pro_max  | Gói 3 - Pro Max | 270        | 5          | 20000
```

✅ Nếu kết quả đúng, SQL migration thành công!

---

### **BƯỚC 2: Git Commit & Push** (3 phút)

#### 2.1 Stage Files
```bash
git add app/pricing/page.tsx
git add lib/supabase.ts
git add supabase/migrations/20251109_update_subscription_tiers.sql
git add PRICING_UPDATE_NOV_9_2025.md
git add DEPLOYMENT_GUIDE_PRICING_UPDATE.md
```

#### 2.2 Commit
```bash
git commit -m "feat: Update pricing tiers, features, and word count limits (Nov 9, 2025)

- Gói 1: 40 chats, 1 plan, 9 features
- Gói 2: 100 chats (↑10), 2 plans (↓1), 10 features  
- Gói 3: 270 chats (↑110), 5 plans (↓1), 10 features
- Word count: Free 1000-1500, Gói 1-3 unlimited
- Updated getSubscriptionLimits() function
- Added SQL migration for subscription_tiers table"
```

#### 2.3 Push to Main
```bash
git push origin main
```

---

### **BƯỚC 3: Verify Deployment** (2 phút)

#### 3.1 Check Vercel Deployment
1. Vào https://vercel.com/dashboard
2. Chọn project `planai-io`
3. Chờ deployment hoàn thành (thường 2-3 phút)
4. Xem status: **Ready** hoặc **Building**

#### 3.2 Test Pricing Page
1. Vào https://planai.io.vn/pricing
2. Kiểm tra:
   - ✅ Gói 1: 40 chats, 1 plan
   - ✅ Gói 2: 100 chats, 2 plans
   - ✅ Gói 3: 270 chats, 5 plans
   - ✅ Features mới hiển thị đúng

#### 3.3 Test Plan Generation (Optional)
1. Đăng nhập vào dashboard
2. Tạo plan mới
3. Kiểm tra:
   - ✅ Free tier: Plan ~1000-1500 từ
   - ✅ Gói 1+: Plan không giới hạn từ

---

## 🔍 Troubleshooting

### ❌ SQL Migration Fails
**Lỗi**: "Column does not exist" hoặc "Table does not exist"

**Giải pháp**:
1. Kiểm tra database schema có đủ columns không
2. Chạy migration file: `/supabase/migrations/20251024_fix_plans_table.sql` trước
3. Retry SQL migration

### ❌ Pricing Page Shows Old Data
**Lỗi**: Pricing page vẫn hiển thị 90 chats cho Gói 2

**Giải pháp**:
1. Hard refresh: `Cmd+Shift+R` (Mac) hoặc `Ctrl+Shift+R` (Windows)
2. Clear browser cache
3. Chờ Vercel deployment hoàn thành

### ❌ Plan Generation Fails
**Lỗi**: "Đã đạt giới hạn tạo kế hoạch"

**Giải pháp**:
1. Kiểm tra user subscription tier
2. Kiểm tra usage stats: `SELECT * FROM chat_messages WHERE user_id = 'xxx' AND created_at >= NOW() - INTERVAL '1 month'`
3. Nếu cần, reset usage stats

---

## 📊 Verification Checklist

- [ ] SQL migration chạy thành công trên Supabase
- [ ] Verify query trả về kết quả đúng
- [ ] Git commit & push thành công
- [ ] Vercel deployment hoàn thành (status: Ready)
- [ ] Pricing page hiển thị features mới
- [ ] Chat limits hiển thị đúng (40, 100, 270)
- [ ] Plan limits hiển thị đúng (1, 2, 5)
- [ ] Test plan generation với Free tier (1000-1500 từ)
- [ ] Test plan generation với Gói 1+ (unlimited)
- [ ] No errors trong browser console

---

## 🎯 Rollback Plan (Nếu Cần)

Nếu có vấn đề, có thể rollback:

### 1. Revert Git Commit
```bash
git revert HEAD
git push origin main
```

### 2. Revert SQL Changes
```sql
-- Restore old limits
UPDATE subscription_tiers 
SET chat_limit = 5, plan_limit = 1, word_limit = 5000
WHERE id = 'free';

UPDATE subscription_tiers 
SET chat_limit = 40, plan_limit = 1, word_limit = 11000
WHERE id = 'basic';

UPDATE subscription_tiers 
SET chat_limit = 90, plan_limit = 3, word_limit = 17000
WHERE id = 'pro';

UPDATE subscription_tiers 
SET chat_limit = 160, plan_limit = 6, word_limit = 23000
WHERE id = 'pro_max';
```

---

## 📞 Support

Nếu có vấn đề:
1. Kiểm tra Vercel logs: https://vercel.com/dashboard
2. Kiểm tra Supabase logs: https://supabase.com/dashboard
3. Kiểm tra browser console (F12)
4. Liên hệ team support

---

## ✅ Final Status

**Status**: ✅ READY FOR DEPLOYMENT

Tất cả files đã chuẩn bị. Chỉ cần:
1. Chạy SQL migration
2. Git push
3. Verify deployment

**Estimated Downtime**: 0 (zero downtime deployment)

---

**Date**: 9 Tháng 11, 2025  
**Prepared By**: Cascade AI Assistant  
**Version**: 1.0
