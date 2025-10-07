# 🚀 HƯỚNG DẪN DEPLOY LÊN VERCEL QUA GITHUB

## 📋 CHUẨN BỊ

### 1. Kiểm tra thay đổi
```bash
cd "/Users/mf840/Documents/BUILD APP/SaaS 1"
git status
```

### 2. Files đã thay đổi (cần commit):
**Core Auth Files**:
- ✅ `lib/auth-context.tsx` - Fixed auth context
- ✅ `app/auth/callback/page.tsx` - Redirect to /dashboard
- ✅ `middleware.ts` - Removed /welcome from protected
- ✅ `.env.example` - Updated Supabase credentials

**New Components**:
- ✅ `components/AuthSuccessModal.tsx`
- ✅ `components/UpgradePrompt.tsx`
- ✅ `components/UsageProgressBar.tsx`

**Documentation**:
- ✅ `LUONG-AUTH-FIXED.md`
- ✅ `QUICK-TEST-GUIDE.md`
- ✅ `DEPLOYMENT-CHECKLIST.md`

## 🔐 QUAN TRỌNG: Environment Variables

### ⚠️ KHÔNG commit .env.local
File `.env.local` chứa credentials nhạy cảm, đã được gitignore.

### ✅ Cấu hình trên Vercel Dashboard
1. Vào: https://vercel.com/dashboard
2. Chọn project: `planai-io` (hoặc tên project của bạn)
3. Settings → Environment Variables
4. Add các biến sau:

```
NEXT_PUBLIC_SUPABASE_URL=https://wjzmscsoiibzlxejqpgg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqem1zY3NvaWliemx4ZWpxcGdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NzQwODIsImV4cCI6MjA3MzM1MDA4Mn0.w6EeucNqmyNahoA8KZVjDYLy3ZgbTyqzVuiOq9MCZGA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqem1zY3NvaWliemx4ZWpxcGdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc3NDA4MiwiZXhwIjoyMDczMzUwMDgyfQ.C0OlpsyqnnG6CaMDnhv4M6GI4lTN3AyK4sldWl_UpZk
NEXT_PUBLIC_APP_URL=https://planai.io.vn
```

**Chọn Environment**: Production, Preview, Development (tất cả)

## 📤 PUSH LÊN GITHUB

### Bước 1: Add files
```bash
cd "/Users/mf840/Documents/BUILD APP/SaaS 1"

# Add tất cả files đã thay đổi
git add .
```

### Bước 2: Commit với message rõ ràng
```bash
git commit -m "fix: Khắc phục luồng đăng ký/đăng nhập Google OAuth

- Fixed auth-context.tsx (khôi phục 148 lines)
- Updated callback redirect to /dashboard
- Removed /welcome from protected paths
- Updated Supabase credentials in .env.example
- Added AuthSuccessModal component
- Added comprehensive documentation

Fixes: OAuth redirect về trang chủ thay vì dashboard
Fixes: Trang quản trị không mở được
"
```

### Bước 3: Push lên GitHub
```bash
git push origin main
```

## 🔄 VERCEL AUTO-DEPLOY

### Sau khi push, Vercel sẽ tự động:
1. ✅ Detect commit mới trên GitHub
2. ✅ Trigger build tự động
3. ✅ Run `npm run build`
4. ✅ Deploy to production
5. ✅ Update domain: https://planai.io.vn

### Theo dõi deployment:
1. Vào: https://vercel.com/dashboard
2. Chọn project của bạn
3. Tab "Deployments"
4. Xem deployment mới nhất (status: Building → Ready)

### Thời gian deploy:
- **Building**: 2-5 phút
- **Deploying**: 30 giây - 1 phút
- **Total**: ~3-6 phút

## 📊 VERIFY DEPLOYMENT

### 1. Check Vercel Dashboard
```
Status: ✅ Ready
Domain: https://planai.io.vn
Build Time: ~3-5 minutes
```

### 2. Check Build Logs
- Click vào deployment
- Tab "Building" → Xem logs
- Ensure: "Build completed successfully"

### 3. Check Function Logs
- Tab "Functions"
- Monitor for errors
- Should see: No errors

## 🧪 TEST PRODUCTION

### Test 1: Landing Page
```
URL: https://planai.io.vn
Expected: Page loads correctly
```

### Test 2: Google OAuth Signup
```
1. https://planai.io.vn/signup
2. Click "Đăng ký bằng Google"
3. Expected: Redirect to /dashboard
4. Expected: Success message appears
```

### Test 3: Google OAuth Login
```
1. https://planai.io.vn/login
2. Click "Đăng nhập bằng Google"
3. Expected: Redirect to /dashboard
4. Expected: Success message appears
```

### Test 4: Dashboard
```
URL: https://planai.io.vn/dashboard
Expected: Loads with user data
```

### Test 5: Account Page
```
URL: https://planai.io.vn/account
Expected: Loads correctly
```

## 🐛 TROUBLESHOOTING

### Issue 1: Build Failed
```
Solution:
1. Check Vercel build logs
2. Look for error messages
3. Fix locally and push again
```

### Issue 2: Environment Variables Missing
```
Solution:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add missing variables
3. Redeploy: Deployments → Latest → "Redeploy"
```

### Issue 3: OAuth Still Not Working
```
Solution:
1. Verify Vercel env vars are correct
2. Check Supabase URL Configuration
3. Check Google Console redirect URIs
4. Clear browser cache and test again
```

## 📝 DEPLOYMENT CHECKLIST

### Pre-Deploy
- [x] Code changes committed
- [x] .env.local NOT committed (gitignored)
- [ ] Vercel env vars configured
- [ ] Git push to main branch

### During Deploy
- [ ] Vercel detects new commit
- [ ] Build starts automatically
- [ ] Build completes successfully
- [ ] Deployment ready

### Post-Deploy
- [ ] Landing page loads
- [ ] Signup flow works
- [ ] Login flow works
- [ ] Dashboard loads
- [ ] Account page loads
- [ ] No console errors

## 🎯 EXPECTED TIMELINE

```
Push to GitHub          → Immediate
Vercel detects commit   → 10-30 seconds
Build starts            → Immediate
Build completes         → 3-5 minutes
Deployment ready        → 30 seconds
Total time              → ~4-6 minutes
```

## ✅ SUCCESS CRITERIA

### Deployment successful khi:
1. ✅ Vercel shows "Ready" status
2. ✅ https://planai.io.vn loads
3. ✅ Google OAuth signup works
4. ✅ Google OAuth login works
5. ✅ Dashboard loads correctly
6. ✅ No build errors
7. ✅ No runtime errors

---

**Sẵn sàng push lên GitHub!** 🚀
