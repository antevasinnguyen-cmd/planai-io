# 🧪 Testing Guide - Chat Usage & Plan Generation Fixes

**Date:** November 1, 2025
**Version:** v3.11
**Status:** Ready for Testing

---

## 📋 Test Scenarios

### ✅ Test 1: Chat Usage Tracking (Free Tier - 5 chats/month)

**Setup:**
- Login with free tier account
- Go to `/dashboard/create-plan`

**Steps:**
1. Send message 1 → Check usage: "1/5 chat"
2. Send message 2 → Check usage: "2/5 chat"
3. Send message 3 → Check usage: "3/5 chat"
4. Send message 4 → Check usage: "4/5 chat"
5. Send message 5 → Check usage: "5/5 chat"
6. Try to send message 6 → Should be BLOCKED with error: "Đã đạt giới hạn chat"

**Expected Result:**
- ✅ Usage updates immediately after each message
- ✅ Usage matches server-side count
- ✅ Cannot exceed limit (5 for free tier)
- ✅ Error message clear and helpful

**Logs to Check:**
```
=== CHAT USAGE UPDATED FROM API ===
{
  current: 1,
  limit: 5,
  tier: 'free',
  remaining: 4
}
```

---

### ✅ Test 2: Chat Usage Tracking (Basic Tier - 40 chats/month)

**Setup:**
- Upgrade to Basic tier (Gói 1)
- Go to `/dashboard/create-plan`

**Steps:**
1. Send 40 messages → Should all succeed
2. Send message 41 → Should be BLOCKED
3. Check usage display: "40/40 chat"

**Expected Result:**
- ✅ Can send up to 40 messages
- ✅ Blocked at 41st message
- ✅ Usage counter accurate

---

### ✅ Test 3: Chat Usage Tracking (Pro Tier - 90 chats/month)

**Setup:**
- Upgrade to Pro tier (Gói 2)
- Go to `/dashboard/create-plan`

**Steps:**
1. Send 90 messages → Should all succeed
2. Send message 91 → Should be BLOCKED
3. Check usage display: "90/90 chat"

**Expected Result:**
- ✅ Can send up to 90 messages
- ✅ Blocked at 91st message

---

### ✅ Test 4: Chat Usage Tracking (Pro Max Tier - 160 chats/month)

**Setup:**
- Upgrade to Pro Max tier (Gói 3)
- Go to `/dashboard/create-plan`

**Steps:**
1. Send 160 messages → Should all succeed
2. Send message 161 → Should be BLOCKED
3. Check usage display: "160/160 chat"

**Expected Result:**
- ✅ Can send up to 160 messages
- ✅ Blocked at 161st message

---

### ✅ Test 5: Plan Generation Completion (Progress Bar)

**Setup:**
- Login with any tier
- Go to `/dashboard/create-plan`
- Chat with AI to provide full information
- Click "Tạo Kế Hoạch Hoàn Chỉnh"

**Steps:**
1. Watch progress bar
2. Progress should go: 10% → 25% → 50% → 75% → 95% → **100%**
3. When progress reaches 100%, status should show "Hoàn thành!"
4. Should be redirected to `/dashboard/plans/{planId}` after 1.2 seconds
5. Plan should be visible and complete

**Expected Result:**
- ✅ Progress bar smoothly increases
- ✅ Progress reaches 100% (not stuck at 95%)
- ✅ Status shows "Hoàn thành!" when complete
- ✅ Redirected to plan detail page
- ✅ Plan content is visible

**Logs to Check:**
```
=== PLAN GENERATION: Processing ===
{ elapsed: 30, progress: 35 }

=== PLAN GENERATION: COMPLETED ===
{ planId: 'uuid-here' }
```

---

### ✅ Test 6: Plan Generation Error Handling

**Setup:**
- Go to `/dashboard/create-plan`
- Provide minimal information
- Click "Tạo Kế Hoạch Hoàn Chỉnh"

**Steps:**
1. If API fails, should show error message
2. Error should be clear and actionable
3. Should NOT show generic "Internal Server Error"

**Expected Result:**
- ✅ Specific error message
- ✅ User knows what went wrong
- ✅ Can retry or contact support

---

### ✅ Test 7: Plan Limits (Free Tier - 1 plan/month)

**Setup:**
- Login with free tier
- Go to `/dashboard/create-plan`
- Create 1 plan successfully

**Steps:**
1. Try to create 2nd plan
2. Should be BLOCKED with error: "Đã đạt giới hạn kế hoạch"

**Expected Result:**
- ✅ Can create 1 plan
- ✅ Blocked from creating 2nd plan
- ✅ Error message clear

---

### ✅ Test 8: Plan Limits (Pro Tier - 3 plans/month)

**Setup:**
- Upgrade to Pro tier (Gói 2)
- Go to `/dashboard/create-plan`

**Steps:**
1. Create plan 1 → Success
2. Create plan 2 → Success
3. Create plan 3 → Success
4. Try to create plan 4 → BLOCKED

**Expected Result:**
- ✅ Can create up to 3 plans
- ✅ Blocked at 4th plan

---

### ✅ Test 9: Plan Limits (Pro Max Tier - 6 plans/month)

**Setup:**
- Upgrade to Pro Max tier (Gói 3)
- Go to `/dashboard/create-plan`

**Steps:**
1. Create plans 1-6 → All succeed
2. Try to create plan 7 → BLOCKED

**Expected Result:**
- ✅ Can create up to 6 plans
- ✅ Blocked at 7th plan

---

### ✅ Test 10: Cross-Tab Usage Sync

**Setup:**
- Open 2 browser tabs with same account
- Go to `/dashboard/create-plan` in both tabs

**Steps:**
1. Tab 1: Send message 1 → Usage shows "1/5"
2. Tab 2: Refresh page → Usage should show "1/5" (synced from server)
3. Tab 2: Send message 2 → Usage shows "2/5"
4. Tab 1: Refresh page → Usage should show "2/5" (synced from server)

**Expected Result:**
- ✅ Usage syncs across tabs
- ✅ No duplicate counting
- ✅ Server is source of truth

---

## 📊 Subscription Limits Reference

| Tier | Chats/Month | Plans/Month | Words/Plan |
|------|-------------|------------|-----------|
| **Free** | 5 | 1 | 1,000 |
| **Basic (Gói 1)** | 40 | 1 | 6,500 |
| **Pro (Gói 2)** | 90 | 3 | 10,500 |
| **Pro Max (Gói 3)** | 160 | 6 | 17,500 |

---

## 🔍 Debugging Checklist

### If Chat Usage Not Updating:
- [ ] Check browser console for errors
- [ ] Check API response includes `usage` field
- [ ] Verify `data.usage.current` is being read
- [ ] Check server logs for chat API errors
- [ ] Verify subscription is loaded correctly

### If Progress Bar Stuck at 95%:
- [ ] Check browser console for SSE errors
- [ ] Check server logs for job status update errors
- [ ] Verify job status is actually 'completed' in database
- [ ] Check if plan was saved successfully
- [ ] Verify plan_id is being returned

### If Plan Not Created:
- [ ] Check server logs for plan insert errors
- [ ] Verify profile exists for user
- [ ] Check if database columns exist (collected_info, model_used, etc.)
- [ ] Verify AI API is working (OpenAI/Claude)
- [ ] Check if user hit plan limit

---

## 🚀 Deployment Checklist

- [ ] All tests pass locally
- [ ] Commit pushed to main branch
- [ ] Vercel deployment successful
- [ ] Test on production URL: https://planai.io.vn
- [ ] Monitor error logs for 24 hours
- [ ] Get user feedback

---

## 📝 Notes

**Key Changes:**
1. Chat usage now updates from API response (server-authoritative)
2. Plan generation job status update has error handling
3. Progress bar logging added for debugging
4. All subscription limits verified

**Potential Issues:**
- If API response doesn't include `usage`, usage won't update
- If job status update fails silently, progress bar will stick at 95%
- If profile doesn't exist, plan creation will fail

**Monitoring:**
- Watch for "CHAT USAGE UPDATED FROM API" logs
- Watch for "PLAN GENERATION: COMPLETED" logs
- Monitor error rates in Vercel dashboard

---

**Created:** 2025-11-01
**Status:** Ready for Testing
**Version:** v3.11
