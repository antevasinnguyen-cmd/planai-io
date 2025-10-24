# 🚀 Background Job System - Deployment Guide

## Overview

The application now uses a **Background Job System** to handle plan generation independently. Users can:
- ✅ Close the tab during plan generation
- ✅ Switch to other tabs
- ✅ Come back later to check status
- ✅ AI continues processing in the background

---

## 🔧 Step 1: Setup Supabase Database

### Execute SQL in Supabase SQL Editor

Go to: **Supabase Dashboard → SQL Editor → New Query**

Copy and paste the entire content from `BACKGROUND_JOB_SETUP.sql`:

```sql
-- [Copy entire BACKGROUND_JOB_SETUP.sql content here]
```

This creates:
- ✅ `plan_jobs` table for tracking background jobs
- ✅ `subscriptions` table with auto-creation trigger
- ✅ Row Level Security (RLS) policies
- ✅ Auto-timestamp triggers

### Verify Tables Created

In Supabase Dashboard → Table Editor:
- [ ] `plan_jobs` table exists
- [ ] `subscriptions` table exists
- [ ] Both have proper indexes
- [ ] RLS is enabled

---

## 📝 Step 2: Verify API Endpoints

The following new endpoints are now available:

### 1. Start Background Job
```
POST /api/plans/generate-background
Headers: Authorization: Bearer {token}
Body: {
  planName: string,
  goals: string,
  collectedInfo: object
}
Response: { job_id: string, message: string }
Status: 202 Accepted (returns immediately)
```

### 2. Check Job Status
```
GET /api/plans/job-status?job_id={jobId}
Headers: Authorization: Bearer {token}
Response: {
  job_id: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  error_message?: string,
  plan_id?: string,
  elapsed_seconds: number
}
```

---

## 🧪 Step 3: Test the System

### Test 1: Start Plan Generation
```bash
curl -X POST https://planai.io.vn/api/plans/generate-background \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planName": "Test Plan",
    "goals": "Save money",
    "collectedInfo": {}
  }'

# Expected response (202 Accepted):
# { "job_id": "uuid-here", "message": "Plan generation started..." }
```

### Test 2: Check Job Status
```bash
curl https://planai.io.vn/api/plans/job-status?job_id=YOUR_JOB_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected response:
# { "job_id": "...", "status": "processing", "elapsed_seconds": 5 }
```

### Test 3: Full User Flow
1. Go to https://planai.io.vn/dashboard/create-plan
2. Chat with AI to provide information
3. Click "Tạo Kế Hoạch"
4. **NEW:** You can now close the tab or switch tabs!
5. Check back later - plan will be ready

---

## 🔍 Step 4: Monitor Background Jobs

### View Active Jobs
```sql
-- In Supabase SQL Editor
SELECT * FROM plan_jobs 
WHERE status IN ('pending', 'processing')
ORDER BY created_at DESC;
```

### View Failed Jobs
```sql
SELECT id, user_id, status, error_message, created_at
FROM plan_jobs 
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### View Completed Jobs
```sql
SELECT id, user_id, plan_id, completed_at, 
  EXTRACT(EPOCH FROM (completed_at - started_at)) as duration_seconds
FROM plan_jobs 
WHERE status = 'completed'
ORDER BY completed_at DESC;
```

---

## 📊 Step 5: Performance Tuning

### Timeout Settings
- **Frontend polling timeout:** 10 minutes (600 attempts × 1 second)
- **Backend AI timeout:** 2 minutes (120 seconds)
- **Polling interval:** 1 second

To adjust, edit:
- Frontend: `app/dashboard/plans/generate/page.tsx` line 120
- Backend: `app/api/plans/generate-background/route.ts` line 95

### Database Cleanup (Optional)
```sql
-- Archive old completed jobs (older than 30 days)
DELETE FROM plan_jobs 
WHERE status = 'completed' 
  AND completed_at < NOW() - INTERVAL '30 days';
```

---

## 🚨 Troubleshooting

### Issue: "No user found when loading subscription"
**Solution:** Ensure subscription was auto-created
```sql
-- Check if subscription exists
SELECT * FROM subscriptions WHERE user_id = 'USER_ID_HERE';

-- If missing, create manually
INSERT INTO subscriptions (user_id, tier, status, plan_limit, chat_limit, word_limit)
VALUES ('USER_ID_HERE', 'free', 'active', 1, 5, 1000);
```

### Issue: Job stuck in "processing"
**Solution:** Check error logs
```sql
SELECT * FROM plan_jobs 
WHERE status = 'processing' 
  AND started_at < NOW() - INTERVAL '5 minutes';
```

### Issue: AI response too slow
**Solution:** Check OpenAI API status
- Visit: https://status.openai.com
- Check rate limits in OpenAI dashboard
- Consider upgrading API tier

---

## 📋 Deployment Checklist

- [ ] SQL executed in Supabase
- [ ] `plan_jobs` table verified
- [ ] `subscriptions` table verified
- [ ] RLS policies enabled
- [ ] API endpoints tested
- [ ] Frontend UI updated (shows "can switch tabs" message)
- [ ] Environment variables configured
- [ ] Vercel deployment successful
- [ ] User flow tested end-to-end
- [ ] Error handling verified

---

## 🎯 Key Features

### ✅ What's New
1. **Background Processing** - AI works independently
2. **Job Tracking** - Track plan generation status
3. **Tab Switching** - Users can safely switch tabs
4. **Auto-Subscription** - Created automatically on signup
5. **Better Error Handling** - Specific error messages
6. **Polling System** - Real-time status updates

### ✅ User Experience
- User starts plan generation
- Gets job_id immediately (202 Accepted)
- Can close tab or switch tabs
- AI continues in background
- Frontend polls status every 1 second
- Auto-redirects when complete

### ✅ Technical Benefits
- No more timeouts
- Scalable to many concurrent users
- Better resource utilization
- Easier to add WebSocket later
- Clear job tracking

---

## 🔗 Related Files

- **SQL Setup:** `BACKGROUND_JOB_SETUP.sql`
- **Backend API:** `app/api/plans/generate-background/route.ts`
- **Status API:** `app/api/plans/job-status/route.ts`
- **Frontend UI:** `app/dashboard/plans/generate/page.tsx`

---

## 📞 Support

For issues or questions:
1. Check Supabase logs: Dashboard → Logs
2. Check Vercel logs: Dashboard → Deployments
3. Check browser console: F12 → Console tab
4. Check network tab: F12 → Network tab

---

## 🚀 Next Steps

### Immediate (This Week)
- [ ] Deploy to production
- [ ] Monitor job completion rates
- [ ] Gather user feedback

### Short Term (Next Week)
- [ ] Add WebSocket for real-time updates
- [ ] Add job history page
- [ ] Add email notifications

### Medium Term (Next Month)
- [ ] Add job retry mechanism
- [ ] Add priority queue for jobs
- [ ] Add analytics dashboard

---

**Status:** ✅ Ready for Production  
**Last Updated:** 24/10/2025  
**Version:** 1.0
