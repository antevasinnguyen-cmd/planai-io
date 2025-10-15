# 🔍 Debug SEPAY_TOKEN trên Vercel - Hướng dẫn chi tiết

## ⚠️ Vấn đề hiện tại:
Mặc dù đã thêm `SEPAY_TOKEN` vào Vercel Environment Variables, nhưng application vẫn không đọc được token.

**Logs hiện tại:**
```
hasToken: false,
tokenLength: 0
```

---

## ✅ Giải pháp đã áp dụng:

### 1. Đọc biến môi trường động (không cache)
```typescript
function getSepayConfig() {
  return {
    SEPAY_TOKEN: process.env.SEPAY_TOKEN || '',
    SEPAY_ACCOUNT_NUMBER: process.env.SEPAY_ACCOUNT_NUMBER || 'FLIOAI000',
    // ...
  }
}
```

### 2. Thêm debug logs chi tiết
```typescript
console.log('=== SEPAY CONFIG CHECK (DYNAMIC) ===', {
  hasToken: !!sepayConfig.SEPAY_TOKEN,
  tokenLength: sepayConfig.SEPAY_TOKEN?.length || 0,
  tokenFirstChars: sepayConfig.SEPAY_TOKEN ? sepayConfig.SEPAY_TOKEN.substring(0, 10) + '...' : 'EMPTY',
  allEnvKeys: Object.keys(process.env).filter(k => k.includes('SEPAY')).join(', ')
});
```

---

## 🔧 Các bước kiểm tra trên Vercel:

### Bước 1: Xác nhận biến đã được thêm đúng

1. Vào **Vercel Dashboard** → **planai-io** → **Settings** → **Environment Variables**
2. Tìm biến `SEPAY_TOKEN`
3. Kiểm tra:
   - ✅ Name: `SEPAY_TOKEN` (chính xác, không có khoảng trắng)
   - ✅ Value: `40KPESXRD5XUKP6WYLKYOJGMBMJBRQZ4SEXDLUNDTCBZVZFIJL5I1FVAMRZGVKWT`
   - ✅ Environment: **Production** ✅ **Preview** ✅ **Development**

### Bước 2: Kiểm tra tên biến có đúng không

**QUAN TRỌNG:** Vercel phân biệt chữ hoa/thường!

- ❌ SAI: `sepay_token`, `Sepay_Token`, `SEPAY_token`
- ✅ ĐÚNG: `SEPAY_TOKEN`

### Bước 3: Xóa và thêm lại biến

Đôi khi Vercel cache biến cũ. Hãy thử:

1. **Xóa** biến `SEPAY_TOKEN` hiện tại
2. Click **Save**
3. Đợi 10 giây
4. **Thêm lại** biến `SEPAY_TOKEN` với value mới
5. Click **Save**

### Bước 4: Redeploy với "Clear Cache"

1. Vào **Deployments**
2. Click **...** → **Redeploy**
3. ✅ Chọn **"Use existing Build Cache"** → **BỎ CHỌN** (để clear cache)
4. Click **Redeploy**

### Bước 5: Kiểm tra logs sau khi deploy

1. Vào **Deployments** → Click deployment mới nhất
2. Click tab **Functions**
3. Tìm function `/api/payment/create`
4. Xem logs:

**Logs thành công sẽ hiển thị:**
```json
{
  "hasToken": true,
  "tokenLength": 66,
  "tokenFirstChars": "40KPESXRD5...",
  "allEnvKeys": "SEPAY_TOKEN, SEPAY_ACCOUNT_NUMBER, SEPAY_API_URL"
}
```

**Logs lỗi sẽ hiển thị:**
```json
{
  "hasToken": false,
  "tokenLength": 0,
  "tokenFirstChars": "EMPTY",
  "allEnvKeys": "SEPAY_ACCOUNT_NUMBER"  // Thiếu SEPAY_TOKEN
}
```

---

## 🔍 Troubleshooting nâng cao:

### Vấn đề 1: Token vẫn không được đọc sau khi redeploy

**Nguyên nhân có thể:**
- Vercel đang cache build cũ
- Biến chỉ được set cho Preview/Development, không có Production
- Tên biến sai (có khoảng trắng, chữ hoa/thường)

**Giải pháp:**
```bash
# Option 1: Redeploy với clear cache (như Bước 4)

# Option 2: Trigger redeploy từ Git
git commit --allow-empty -m "Force redeploy to reload env vars"
git push origin main

# Option 3: Xóa và tạo lại project Vercel (extreme case)
```

### Vấn đề 2: Token có giá trị nhưng bị truncate

**Kiểm tra:**
- Token phải có đúng **66 ký tự**
- Không có khoảng trắng đầu/cuối
- Không có ký tự xuống dòng

**Cách kiểm tra:**
```javascript
// Trong Vercel Function Logs, xem:
tokenLength: 66  // ✅ ĐÚNG
tokenLength: 65  // ❌ SAI - bị thiếu
tokenLength: 67  // ❌ SAI - có khoảng trắng thừa
```

### Vấn đề 3: Biến chỉ hoạt động ở local, không hoạt động trên Vercel

**Nguyên nhân:**
- Local đọc từ `.env.local`
- Vercel đọc từ Environment Variables settings
- Hai nguồn này độc lập

**Giải pháp:**
- Đảm bảo đã thêm biến vào **Vercel Dashboard**
- Không chỉ thêm vào `.env.local`

### Vấn đề 4: Vercel báo "Environment variable not found"

**Kiểm tra:**
1. Vào **Settings** → **Environment Variables**
2. Click vào biến `SEPAY_TOKEN`
3. Xem phần **"Used in"**:
   - ✅ Phải có: Production, Preview, Development
   - ❌ Nếu thiếu: Click **Edit** → Chọn thêm environment

---

## 📋 Checklist đầy đủ:

### Environment Variables cần có trên Vercel:

```bash
# SePay (QUAN TRỌNG!)
SEPAY_TOKEN=40KPESXRD5XUKP6WYLKYOJGMBMJBRQZ4SEXDLUNDTCBZVZFIJL5I1FVAMRZGVKWT
SEPAY_ACCOUNT_NUMBER=FLIOAI000
SEPAY_API_URL=https://my.sepay.vn/userapi/transactions/create
SEPAY_WEBHOOK_SECRET=https://planai.io.vn/api/webhook/sepay

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://wjzmscsoiibzlxejqpgg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your_key]
SUPABASE_SERVICE_ROLE_KEY=[your_key]

# AI APIs
OPENAI_API_KEY=[your_key]
ANTHROPIC_API_KEY=[your_key]

# PayOS
PAYOS_CLIENT_ID=[your_key]
PAYOS_API_KEY=[your_key]
PAYOS_CHECKSUM_KEY=[your_key]

# App
NEXT_PUBLIC_APP_URL=https://planai.io.vn
```

### Sau khi thêm biến:

- [ ] Đã xóa và thêm lại `SEPAY_TOKEN`
- [ ] Đã chọn cả 3 environments (Production, Preview, Development)
- [ ] Đã redeploy với "Clear Cache"
- [ ] Đã đợi deployment hoàn tất (2-3 phút)
- [ ] Đã kiểm tra Function Logs
- [ ] Đã test payment flow

---

## 🆘 Nếu vẫn không hoạt động:

### Option 1: Sử dụng Vercel CLI để kiểm tra

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Pull environment variables
vercel env pull .env.vercel

# Kiểm tra file .env.vercel
cat .env.vercel | grep SEPAY_TOKEN
```

### Option 2: Tạo API endpoint để debug

Tạo file `/app/api/debug-env/route.ts`:

```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasSepayToken: !!process.env.SEPAY_TOKEN,
    tokenLength: process.env.SEPAY_TOKEN?.length || 0,
    tokenFirst10: process.env.SEPAY_TOKEN?.substring(0, 10) || 'none',
    allSepayKeys: Object.keys(process.env).filter(k => k.includes('SEPAY')),
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV
  })
}
```

Sau đó truy cập: `https://planai.io.vn/api/debug-env`

**⚠️ LƯU Ý:** Xóa endpoint này sau khi debug xong!

### Option 3: Liên hệ Vercel Support

Nếu tất cả đều thất bại, có thể là bug của Vercel:

1. Vào **Vercel Dashboard** → **Help**
2. Mô tả vấn đề: "Environment variable SEPAY_TOKEN not loading in production"
3. Cung cấp:
   - Project name: planai-io
   - Deployment URL
   - Screenshot của Environment Variables settings
   - Function logs

---

## 📞 Liên hệ:

Nếu cần hỗ trợ thêm:
- Email: support@planai.io.vn
- Gửi kèm:
  1. Screenshot Environment Variables page
  2. Function logs từ Vercel
  3. Kết quả từ `/api/debug-env`
