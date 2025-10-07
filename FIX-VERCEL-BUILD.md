# 🔧 FIX VERCEL BUILD FAILED - MISSING OPENAI_API_KEY

## ❌ LỖI HIỆN TẠI

```
Build Failed
Command "npm run build" exited with 1

Error: The OPENAI_API_KEY environment variable is missing or empty
```

## 🎯 NGUYÊN NHÂN

Vercel cần **OPENAI_API_KEY** (và các API keys khác) để build thành công, nhưng hiện tại chưa có trong Environment Variables.

## ✅ GIẢI PHÁP - ADD ENVIRONMENT VARIABLES

### Bước 1: Vào Vercel Dashboard
```
1. Truy cập: https://vercel.com/dashboard
2. Chọn project: planai-io (hoặc tên project của bạn)
3. Click "Settings" (thanh bên trái)
4. Click "Environment Variables"
```

### Bước 2: Add TẤT CẢ các biến sau

#### **REQUIRED (Bắt buộc để build)**

**Supabase** (đã có):
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://wjzmscsoiibzlxejqpgg.supabase.co
Environment: Production, Preview, Development
```

```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqem1zY3NvaWliemx4ZWpxcGdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NzQwODIsImV4cCI6MjA3MzM1MDA4Mn0.w6EeucNqmyNahoA8KZVjDYLy3ZgbTyqzVuiOq9MCZGA
Environment: Production, Preview, Development
```

```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqem1zY3NvaWliemx4ZWpxcGdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc3NDA4MiwiZXhwIjoyMDczMzUwMDgyfQ.C0OlpsyqnnG6CaMDnhv4M6GI4lTN3AyK4sldWl_UpZk
Environment: Production, Preview, Development
```

**OpenAI** (THIẾU - cần add ngay):
```
Name: OPENAI_API_KEY
Value: sk-proj-... (API key của bạn từ OpenAI)
Environment: Production, Preview, Development
```

**Anthropic** (THIẾU - cần add):
```
Name: ANTHROPIC_API_KEY
Value: sk-ant-... (API key của bạn từ Anthropic)
Environment: Production, Preview, Development
```

**App URL**:
```
Name: NEXT_PUBLIC_APP_URL
Value: https://planai.io.vn
Environment: Production, Preview, Development
```

#### **OPTIONAL (Có thể add sau)**

**PayOS** (Payment):
```
Name: PAYOS_CLIENT_ID
Value: your_payos_client_id
Environment: Production, Preview, Development
```

```
Name: PAYOS_API_KEY
Value: your_payos_api_key
Environment: Production, Preview, Development
```

```
Name: PAYOS_CHECKSUM_KEY
Value: your_payos_checksum_key
Environment: Production, Preview, Development
```

```
Name: PAYOS_API_URL
Value: https://api-merchant.payos.vn/v2/payment-requests
Environment: Production, Preview, Development
```

**SePay** (Alternative payment):
```
Name: SEPAY_API_KEY
Value: your_sepay_api_key
Environment: Production, Preview, Development
```

**Google Sheets** (Export):
```
Name: GOOGLE_SHEETS_CLIENT_ID
Value: your_google_sheets_client_id
Environment: Production, Preview, Development
```

```
Name: GOOGLE_SHEETS_CLIENT_SECRET
Value: your_google_sheets_client_secret
Environment: Production, Preview, Development
```

**Notion** (Export):
```
Name: NOTION_API_KEY
Value: your_notion_api_key
Environment: Production, Preview, Development
```

```
Name: NOTION_CLIENT_ID
Value: your_notion_client_id
Environment: Production, Preview, Development
```

```
Name: NOTION_CLIENT_SECRET
Value: your_notion_client_secret
Environment: Production, Preview, Development
```

```
Name: NOTION_REDIRECT_URI
Value: https://planai.io.vn/api/notion/callback
Environment: Production, Preview, Development
```

### Bước 3: Redeploy

Sau khi add environment variables:

```
1. Vào tab "Deployments"
2. Click vào deployment failed (màu đỏ)
3. Click nút "Redeploy" (góc trên bên phải)
4. Confirm "Redeploy"
```

Vercel sẽ build lại với environment variables mới.

## 🚨 QUAN TRỌNG

### Nếu CHƯA CÓ OpenAI API Key:

**Option 1: Lấy API Key từ OpenAI**
```
1. Vào: https://platform.openai.com/api-keys
2. Login với tài khoản OpenAI
3. Click "Create new secret key"
4. Copy key (bắt đầu với sk-proj-...)
5. Paste vào Vercel environment variables
```

**Option 2: Tạm thời dùng placeholder (để build pass)**
```
Name: OPENAI_API_KEY
Value: sk-placeholder-key-for-build
Environment: Production, Preview, Development

⚠️ Lưu ý: App sẽ build được nhưng chat AI sẽ không hoạt động
```

**Option 3: Disable OpenAI trong code (không khuyến nghị)**
```typescript
// Trong lib/modelSelection.ts hoặc api/chat/route.ts
// Thêm check:
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Và handle khi openai = null
```

## 📋 CHECKLIST

### Minimum để build pass:
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] OPENAI_API_KEY (quan trọng!)
- [ ] ANTHROPIC_API_KEY (nếu dùng Claude)
- [ ] NEXT_PUBLIC_APP_URL

### Optional (có thể add sau):
- [ ] PAYOS_* (payment)
- [ ] SEPAY_API_KEY (payment)
- [ ] GOOGLE_SHEETS_* (export)
- [ ] NOTION_* (export)

## 🎯 EXPECTED RESULT

Sau khi add OPENAI_API_KEY và redeploy:

```
✅ Build starts
✅ Compiled successfully
✅ Deployment ready
✅ https://planai.io.vn works
```

## ⏱️ TIMELINE

```
Add env vars         → 2-3 phút
Click Redeploy       → Immediate
Build starts         → 10-30 giây
Build completes      → 3-5 phút
Deployment ready     → 30 giây
Total                → ~5-7 phút
```

## 🔍 VERIFY

### Check build logs:
```
1. Vào Deployments
2. Click vào deployment mới
3. Tab "Building"
4. Should see: "✓ Compiled successfully"
```

### Check function logs:
```
1. Tab "Functions"
2. Should see: No errors
3. OPENAI_API_KEY should be available
```

---

**Fix ngay để build pass!** 🚀
