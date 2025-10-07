# ✅ DEPLOYMENT CHECKLIST - PLANAI OAUTH FIX

## 📋 PRE-DEPLOYMENT

### 1. Environment Variables
```bash
# Verify .env.local exists and has correct values
cat .env.local

# Should contain:
NEXT_PUBLIC_SUPABASE_URL=https://wjzmscsoiibzlxejqpgg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=https://planai.io.vn
```

### 2. Code Changes Verification
- [x] `lib/auth-context.tsx` - Fixed (148 lines)
- [x] `app/auth/callback/page.tsx` - Redirect to `/dashboard`
- [x] `middleware.ts` - Removed `/welcome` from protected paths
- [x] `.env.example` - Updated with new credentials

### 3. Build Test
```bash
cd "/Users/mf840/Documents/BUILD APP/SaaS 1"
rm -rf .next
npm run build
```

**Expected**: Build completes without errors

## 🚀 DEPLOYMENT STEPS

### Step 1: Clean Build
```bash
cd "/Users/mf840/Documents/BUILD APP/SaaS 1"
rm -rf .next
rm -rf node_modules/.cache
```

### Step 2: Install Dependencies (if needed)
```bash
npm install
```

### Step 3: Build Production
```bash
npm run build
```

**Wait for**: "Compiled successfully" message

### Step 4: Deploy to Vercel
```bash
npx vercel --prod
```

**Follow prompts**:
1. Confirm project: `planai-io` (or your project name)
2. Confirm production deployment: `Yes`
3. Wait for deployment to complete

### Step 5: Verify Deployment
```bash
# Vercel will output deployment URL
# Example: https://planai-io.vercel.app
# Or custom domain: https://planai.io.vn
```

## 🧪 POST-DEPLOYMENT TESTING

### Test 1: Health Check
```bash
# Open browser to:
https://planai.io.vn

# Should see: Landing page loads correctly
```

### Test 2: Google OAuth Signup
1. Open incognito: `https://planai.io.vn/signup`
2. Click "Đăng ký bằng Google"
3. Select Google account
4. **Expected**: Redirect to `https://planai.io.vn/dashboard`
5. **Expected**: Success message appears
6. **Expected**: Dashboard loads with user data

### Test 3: Google OAuth Login
1. Open incognito: `https://planai.io.vn/login`
2. Click "Đăng nhập bằng Google"
3. Select Google account
4. **Expected**: Redirect to `https://planai.io.vn/dashboard`
5. **Expected**: Success message appears
6. **Expected**: Dashboard loads with user data

### Test 4: Account Page
1. After login: Navigate to `https://planai.io.vn/account`
2. **Expected**: Account page loads
3. **Expected**: User info, subscription, settings visible

### Test 5: Logout
1. Click avatar → Logout
2. **Expected**: Redirect to `https://planai.io.vn/`
3. **Expected**: Session cleared

## 🔍 MONITORING

### Check Vercel Logs
```bash
# In Vercel dashboard:
1. Go to Deployments
2. Click on latest deployment
3. Click "Functions" tab
4. Monitor for errors
```

### Check Supabase Logs
```bash
# In Supabase dashboard:
1. Go to Authentication → Logs
2. Monitor OAuth attempts
3. Check for errors
```

### Browser Console Logs
```javascript
// Should see in order:
=== SUPABASE: Bắt đầu đăng nhập với Google ===
=== CALLBACK: Starting ===
=== CALLBACK: Success === user@example.com
=== CALLBACK: Redirecting to /dashboard ===
=== AUTHCONTEXT: SIGNED_IN event === user@example.com
=== DASHBOARD: Có user, khởi tạo dashboard ===
```

## ⚠️ ROLLBACK PLAN

If deployment fails:

### Option 1: Revert to Previous Deployment
```bash
# In Vercel dashboard:
1. Go to Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"
```

### Option 2: Fix and Redeploy
```bash
# Fix the issue locally
# Then redeploy:
npm run build
npx vercel --prod
```

## 📊 SUCCESS METRICS

### ✅ Deployment Successful If:
- [ ] Build completes without errors
- [ ] Vercel deployment succeeds
- [ ] Landing page loads
- [ ] Google OAuth signup works
- [ ] Google OAuth login works
- [ ] Dashboard loads correctly
- [ ] Account page accessible
- [ ] Logout works
- [ ] No console errors
- [ ] No Vercel function errors

### ❌ Deployment Failed If:
- [ ] Build errors
- [ ] Vercel deployment fails
- [ ] OAuth redirect errors
- [ ] Dashboard doesn't load
- [ ] Console shows errors
- [ ] Users can't login

## 🎯 FINAL VERIFICATION

### Production URLs to Test
```
✅ https://planai.io.vn/
✅ https://planai.io.vn/login
✅ https://planai.io.vn/signup
✅ https://planai.io.vn/dashboard
✅ https://planai.io.vn/account
✅ https://planai.io.vn/auth/callback (auto-redirect)
```

### Expected Behavior
1. **Landing** → Loads correctly
2. **Login** → Google OAuth → Dashboard
3. **Signup** → Google OAuth → Dashboard
4. **Dashboard** → Shows user data, success message
5. **Account** → Shows settings, subscription
6. **Callback** → Auto-redirects to dashboard

## 📞 SUPPORT CONTACTS

### If Issues Occur:
1. Check `LUONG-AUTH-FIXED.md` for detailed fixes
2. Check `QUICK-TEST-GUIDE.md` for testing steps
3. Review console logs and network tab
4. Check Vercel and Supabase dashboards

---

**Ready to deploy!** 🚀
