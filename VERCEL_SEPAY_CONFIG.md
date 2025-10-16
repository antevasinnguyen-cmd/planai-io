# 🔧 Hướng dẫn cấu hình SEPAY_TOKEN trên Vercel

## ❌ Lỗi hiện tại:
```
SEPAY_TOKEN is not configured. Please contact support.
```

## ✅ Giải pháp:

### Bước 1: Truy cập Vercel Dashboard

1. Mở trình duyệt và truy cập: **https://vercel.com**
2. Đăng nhập vào tài khoản Vercel của bạn
3. Chọn project: **planai-io**

### Bước 2: Vào Settings → Environment Variables

1. Click vào tab **Settings** (ở menu bên trái)
2. Click vào **Environment Variables** (trong menu Settings)

### Bước 3: Thêm biến SEPAY_TOKEN

Click nút **Add New** và điền thông tin:

#### Variable 1: SEPAY_TOKEN
```
Name: SEPAY_TOKEN
Value: 40KPESXRD5XUKP6WYLKYOJGMBMJBRQZ4SEXDLUNDTCBZVZFIJL5I1FVAMRZGVKWT
```

**Environment:** ✅ Chọn cả 3:
- ✅ Production
- ✅ Preview  
- ✅ Development

Click **Save**

#### Variable 2: SEPAY_ACCOUNT_NUMBER (nếu chưa có)
```
Name: SEPAY_ACCOUNT_NUMBER
Value: FLIOAI000
```

**Environment:** ✅ Chọn cả 3:
- ✅ Production
- ✅ Preview
- ✅ Development

Click **Save**

#### Variable 3: SEPAY_API_URL (nếu chưa có)
```
Name: SEPAY_API_URL
Value: https://my.sepay.vn/userapi/transactions/create
```

**Environment:** ✅ Chọn cả 3

Click **Save**

#### Variable 4: SEPAY_WEBHOOK_SECRET (nếu chưa có)
```
Name: SEPAY_WEBHOOK_SECRET
Value: https://planai.io.vn/api/webhook/sepay
```

**Environment:** ✅ Chọn cả 3

Click **Save**

### Bước 4: Redeploy Application

1. Vào tab **Deployments** (ở menu trên cùng)
2. Tìm deployment mới nhất (thường là ở đầu danh sách)
3. Click vào **3 chấm (...)** bên phải
4. Chọn **Redeploy**
5. Trong popup, click **Redeploy** để confirm

### Bước 5: Đợi deployment hoàn tất

- Deployment sẽ mất khoảng **2-3 phút**
- Bạn sẽ thấy status chuyển từ "Building" → "Ready"
- Khi thấy ✅ màu xanh là đã xong

### Bước 6: Test thanh toán SePay

1. Truy cập: https://planai.io.vn/payment/checkout?plan=basic
2. Chọn phương thức thanh toán: **SePay**
3. Click **Thanh toán**
4. Kiểm tra:
   - ✅ Không còn lỗi "SEPAY_TOKEN is not configured"
   - ✅ Hiển thị QR code
   - ✅ Hiển thị thông tin chuyển khoản

---

## 📋 Danh sách đầy đủ Environment Variables cần có:

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://wjzmscsoiibzlxejqpgg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your_key]
SUPABASE_SERVICE_ROLE_KEY=[your_key]
```

### AI APIs
```
OPENAI_API_KEY=[your_key]
ANTHROPIC_API_KEY=[your_key]
```

### SePay (QUAN TRỌNG!)
```
SEPAY_TOKEN=40KPESXRD5XUKP6WYLKYOJGMBMJBRQZ4SEXDLUNDTCBZVZFIJL5I1FVAMRZGVKWT
SEPAY_ACCOUNT_NUMBER=FLIOAI000
SEPAY_API_URL=https://my.sepay.vn/userapi/transactions/create
SEPAY_WEBHOOK_SECRET=https://planai.io.vn/api/webhook/sepay
```

### PayOS
```
PAYOS_CLIENT_ID=[your_key]
PAYOS_API_KEY=[your_key]
PAYOS_CHECKSUM_KEY=[your_key]
PAYOS_API_URL=https://api-merchant.payos.vn/v2/payment-requests
PAYOS_WEBHOOK_SECRET=https://planai.io.vn/api/payment/payos-webhook
```

### Google OAuth
```
GOOGLE_CLIENT_ID=[your_key]
GOOGLE_CLIENT_SECRET=[your_key]
```

### Notion
```
NOTION_API_KEY=[your_key]
NOTION_CLIENT_ID=[your_key]
NOTION_CLIENT_SECRET=[your_key]
NOTION_REDIRECT_URI=https://planai.io.vn/api/notion/callback
NOTION_AUTHORIZATION_URL=[your_url]
```

### NextAuth
```
NEXTAUTH_SECRET=[your_key]
NEXTAUTH_URL=https://planai.io.vn
```

### App
```
NEXT_PUBLIC_APP_URL=https://planai.io.vn
```

---

## 🔍 Kiểm tra logs sau khi deploy:

1. Vào **Deployments** → Click vào deployment mới nhất
2. Click tab **Functions**
3. Tìm function `/api/payment/create`
4. Xem logs để kiểm tra:

**Logs thành công sẽ hiển thị:**
```
=== SEPAY CONFIG CHECK ===
{
  hasToken: true,
  tokenLength: 66,
  hasAccountNumber: true,
  accountNumber: 'FLIOAI000'
}
```

**Logs lỗi sẽ hiển thị:**
```
Missing SEPAY_TOKEN environment variable
```

---

## ⚠️ Lưu ý quan trọng:

1. **Không commit SEPAY_TOKEN vào Git**
   - File `ENVIRONMENT_VARIABLES_PRODUCTION.md` đã được gitignore
   - Chỉ cấu hình trên Vercel

2. **Phải chọn cả 3 environments**
   - Production: Cho production deployment
   - Preview: Cho preview deployments
   - Development: Cho local development

3. **Phải redeploy sau khi thêm biến**
   - Vercel không tự động apply biến mới
   - Cần redeploy để load biến mới

4. **Check logs nếu vẫn lỗi**
   - Vào Deployments → Function Logs
   - Tìm `SEPAY CONFIG CHECK`
   - Xem `hasToken` và `tokenLength`

---

## 🆘 Troubleshooting:

### Vấn đề 1: Vẫn báo lỗi sau khi thêm biến
**Giải pháp:**
- Đảm bảo đã **Redeploy**
- Clear browser cache (Ctrl+Shift+R)
- Đợi 2-3 phút sau khi redeploy

### Vấn đề 2: Token không đúng
**Giải pháp:**
- Copy lại token từ file `ENVIRONMENT_VARIABLES_PRODUCTION.md`
- Đảm bảo không có khoảng trắng thừa
- Token phải có đúng 66 ký tự

### Vấn đề 3: Biến không được load
**Giải pháp:**
- Kiểm tra đã chọn đúng environment (Production)
- Xóa biến cũ và thêm lại
- Redeploy lại

---

## 📞 Liên hệ hỗ trợ:

Nếu vẫn gặp vấn đề sau khi làm theo hướng dẫn:
- Email: webappsaas.ai@gmail.com
- Gửi kèm screenshot của:
  1. Environment Variables page trên Vercel
  2. Function logs từ deployment
  3. Error message trên browser
