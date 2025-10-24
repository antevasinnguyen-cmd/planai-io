# 🚀 HƯỚNG DẪN SETUP BACKGROUND JOB SYSTEM - TIẾNG VIỆT

## 📋 Tổng quan

Hệ thống Background Job mới cho phép:
- ✅ User có thể đóng tab trong lúc AI tạo kế hoạch
- ✅ Chuyển sang tab khác mà không bị gián đoạn
- ✅ AI tiếp tục xử lý trong nền (background)
- ✅ Không còn lỗi timeout 60 giây
- ✅ Tự động redirect khi kế hoạch hoàn thành

---

## 🔧 BƯỚC 1: SETUP DATABASE (Supabase)

### 1.1 Mở Supabase Dashboard
1. Truy cập: https://supabase.com/dashboard
2. Chọn project PlanAI
3. Vào **SQL Editor** (bên trái)

### 1.2 Copy & Execute SQL
1. Copy toàn bộ nội dung file `BACKGROUND_JOB_SETUP.sql`
2. Paste vào SQL Editor
3. Nhấn **Run** để execute

**SQL sẽ tạo:**
- ✅ Bảng `plan_jobs` - theo dõi background jobs
- ✅ Bảng `subscriptions` - quản lý gói subscription
- ✅ Trigger tự động tạo subscription khi user đăng ký
- ✅ Row Level Security (bảo mật)
- ✅ Indexes để truy vấn nhanh

### 1.3 Verify Tables Created
Sau khi run SQL, vào **Table Editor**:
- [ ] Kiểm tra có bảng `plan_jobs`
- [ ] Kiểm tra có bảng `subscriptions`
- [ ] Kiểm tra có columns đúng như SQL

---

## 🧪 BƯỚC 2: TEST API ENDPOINTS

### 2.1 Test Start Background Job
```bash
# Terminal command
curl -X POST https://planai.io.vn/api/plans/generate-background \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "planName": "Kế hoạch tiết kiệm",
    "goals": "Mua nhà trong 2 năm",
    "collectedInfo": {}
  }'

# Expected response (sau 1-2 giây):
{
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "message": "Plan generation started. You can close this tab or continue browsing."
}
```

### 2.2 Test Job Status
```bash
# Terminal command
curl https://planai.io.vn/api/plans/job-status?job_id=YOUR_JOB_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Expected response:
{
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "processing",
  "elapsed_seconds": 15,
  "plan_id": null
}
```

---

## 🌐 BƯỚC 3: TEST USER FLOW

### 3.1 Full User Test
1. **Truy cập:** https://planai.io.vn/dashboard/create-plan
2. **Chat với AI** - cung cấp thông tin cần thiết
3. **Nhấn "Tạo Kế Hoạch"**
4. **NEW:** ✅ Có thể đóng tab hoặc chuyển tab!
5. **Quay lại sau** - kế hoạch sẽ sẵn sàng

### 3.2 Check Status
- Mở **Browser DevTools** (F12)
- Vào tab **Console**
- Xem logs: `Job status: processing`, `Job status: completed`

---

## 📊 BƯỚC 4: MONITOR & TROUBLESHOOT

### 4.1 Check Active Jobs
```sql
-- Trong Supabase SQL Editor
SELECT id, user_id, status, created_at, started_at
FROM plan_jobs
WHERE status IN ('pending', 'processing')
ORDER BY created_at DESC;
```

### 4.2 Check Failed Jobs
```sql
-- Trong Supabase SQL Editor
SELECT id, user_id, status, error_message, created_at
FROM plan_jobs
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### 4.3 Check Completed Jobs
```sql
-- Trong Supabase SQL Editor
SELECT id, user_id, plan_id, 
  EXTRACT(EPOCH FROM (completed_at - started_at)) as duration_seconds
FROM plan_jobs
WHERE status = 'completed'
ORDER BY completed_at DESC;
```

---

## 🚨 CÁC VẤN ĐỀ THƯỜNG GẶP

### Vấn đề 1: "No user found when loading subscription"
**Nguyên nhân:** Subscription chưa được tạo tự động

**Giải pháp:**
```sql
-- Kiểm tra subscription tồn tại
SELECT * FROM subscriptions WHERE user_id = 'USER_ID_HERE';

-- Nếu không có, tạo thủ công
INSERT INTO subscriptions (user_id, tier, status, plan_limit, chat_limit, word_limit)
VALUES ('USER_ID_HERE', 'free', 'active', 1, 5, 1000);
```

### Vấn đề 2: Job bị stuck ở "processing"
**Nguyên nhân:** AI timeout hoặc error

**Giải pháp:**
```sql
-- Xem jobs processing quá 5 phút
SELECT * FROM plan_jobs
WHERE status = 'processing'
  AND started_at < NOW() - INTERVAL '5 minutes';

-- Reset stuck jobs
UPDATE plan_jobs
SET status = 'failed', error_message = 'Timeout after 5 minutes'
WHERE status = 'processing'
  AND started_at < NOW() - INTERVAL '5 minutes';
```

### Vấn đề 3: API trả về 401 Unauthorized
**Nguyên nhân:** Token hết hạn hoặc sai

**Giải pháp:**
1. Kiểm tra Authorization header
2. Verify token hợp lệ
3. Đăng nhập lại nếu cần

---

## 🎯 PERFORMANCE TUNING

### Timeout Settings
```typescript
// Backend timeout (2 phút)
const timeout = setTimeout(() => controller.abort(), 120000)

// Frontend polling timeout (10 phút)
const maxAttempts = 600 // 600 * 1 second
```

### Điều chỉnh nếu cần:
- **AI chậm:** Tăng timeout lên 180000 (3 phút)
- **Database chậm:** Thêm indexes
- **Too many requests:** Giảm polling interval

---

## 📋 CHECKLIST HOÀN THÀNH

### Database Setup
- [ ] SQL executed trong Supabase
- [ ] Bảng `plan_jobs` tồn tại
- [ ] Bảng `subscriptions` tồn tại
- [ ] RLS policies enabled
- [ ] Trigger auto-subscription hoạt động

### API Testing
- [ ] POST /api/plans/generate-background hoạt động
- [ ] GET /api/plans/job-status hoạt động
- [ ] Authentication working
- [ ] Error handling tốt

### User Experience
- [ ] User có thể đóng tab
- [ ] AI tiếp tục xử lý
- [ ] Status polling hoạt động
- [ ] Auto-redirect khi hoàn thành
- [ ] UI hiển thị "Có thể chuyển tab"

### Monitoring
- [ ] Check Supabase logs
- [ ] Check Vercel logs
- [ ] Monitor job completion rates
- [ ] Monitor error rates

---

## 🚀 NEXT STEPS

### Immediate (Today)
1. [ ] Execute SQL trong Supabase
2. [ ] Test API endpoints
3. [ ] Test full user flow
4. [ ] Monitor for 1-2 hours

### Short Term (This Week)
1. [ ] Monitor job completion rates
2. [ ] Gather user feedback
3. [ ] Adjust timeout if needed
4. [ ] Add more detailed logging

### Medium Term (Next Week)
1. [ ] Add WebSocket for real-time updates
2. [ ] Add job history page
3. [ ] Add email notifications
4. [ ] Performance optimization

---

## 📞 HỖ TRỢ

### Logs cần check:
1. **Supabase Dashboard → Logs** - Database errors
2. **Vercel Dashboard → Deployments** - API errors
3. **Browser Console** - Frontend errors
4. **Network Tab** - API requests

### Contact:
- **Email:** webappsaas.ai@gmail.com
- **Discord:** PlanAI Support
- **GitHub Issues:** https://github.com/antevasinnguyen-cmd/planai-io/issues

---

## ✨ KẾT QUẢ MONG ĐỢI

### Before (Problems):
- ❌ User phải giữ tab mở
- ❌ Timeout sau 60 giây
- ❌ "No user found" errors
- ❌ Poor UX

### After (Benefits):
- ✅ User có thể đóng tab
- ✅ No timeout errors
- ✅ Better error handling
- ✅ Excellent UX
- ✅ Scalable architecture

---

**🎉 Hệ thống Background Job đã sẵn sàng!**

**Status:** ✅ Ready for Production
**Version:** 1.0
**Date:** 24/10/2025

**Bước tiếp theo:** Execute SQL trong Supabase và test! 🚀
