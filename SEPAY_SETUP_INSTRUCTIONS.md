# 🎯 SePay Integration - Setup Instructions for User

## 📋 Information Provided

```
MERCHANT ID: SP-LIVE-NHB84AA6
SECRET KEY: spsk_live_XqkQwjVfRkr3XsD3FeEXmuX25QNXecw2
SEPAY_API_KEY: 40KPESXRD5XUKP6WYLKYOJGMBMJBRQZ4SEXDLUNDTCBZVZFIJL5I1FVAMRZGVKWT
```

---

## ✅ SePay Dashboard Configuration

### Step 1: Go to IPN Settings
1. Login to SePay Dashboard: https://my.sepay.vn
2. Click on **"IPN"** tab (as shown in your screenshot)

### Step 2: Configure IPN

**Field: IPN URL**
```
https://planai.io.vn/api/webhook/sepay
```

**Field: Auth Type**
- Select: **"Không có"** (No Authentication)
- ✅ This is correct because we use API Key in the Authorization header

**Field: Content Type**
```
application/json
```

**Field: Trạng thái (Status)**
- ✅ Enable: **"Kích hoạt IPN"** (Enable IPN)

### Step 3: Save Configuration
- Click **"Cập nhật"** (Update) button

---

## 🔐 Backend Configuration (Already Done)

### Environment Variables in Vercel
```
SEPAY_API_KEY=40KPESXRD5XUKP6WYLKYOJGMBMJBRQZ4SEXDLUNDTCBZVZFIJL5I1FVAMRZGVKWT
SEPAY_ACCOUNT_NUMBER=FLIOAI000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Webhook Handler
- File: `/app/api/webhook/sepay/route.ts`
- Status: ✅ Ready
- Features:
  - ✅ Verifies API Key
  - ✅ Finds payment by transaction ID
  - ✅ Creates fallback payment if not found
  - ✅ Updates payment status
  - ✅ Updates user subscription
  - ✅ Returns HTTP 200 + `{ success: true }`

### Payment Creation
- File: `/app/api/payment/create/route.ts`
- Status: ✅ Fixed
- Features:
  - ✅ Generates transaction ID: `PLAN` + 10 digits
  - ✅ Saves payment to database
  - ✅ Returns QR code URL

---

## 🧪 Testing

### Test 1: SePay Dashboard Simulation
1. Go to SePay Dashboard
2. Menu: **Giao dịch** → **Giả lập giao dịch**
3. Create test transaction:
   - Amount: 169000
   - Content: `PLAN` + 10 digits (e.g., `PLAN3296079697`)
   - Account: Your MB Bank account
4. SePay will automatically call webhook
5. Check Vercel logs to verify webhook was processed

### Test 2: Real Transfer
1. Go to: `https://planai.io.vn/payment/checkout?plan=basic`
2. Select: **SePay**
3. Click: **"Thanh toán"**
4. Transfer money using SePay
5. Wait for automatic confirmation
6. Should redirect to success page

---

## 📊 Expected Behavior

### When User Transfers Money:
```
1. User chuyển khoản SePay
   ↓
2. MB Bank receives money
   ↓
3. SePay ghi nhận giao dịch
   ↓
4. SePay calls webhook: POST /api/webhook/sepay
   ↓
5. Our system:
   - Verifies API Key ✅
   - Finds payment record ✅
   - Updates status to 'completed' ✅
   - Cấp gói cho user ✅
   - Reset quota ✅
   ↓
6. Frontend auto-detects
   ↓
7. Redirect to success page ✅
```

---

## 🔍 Vercel Logs - What to Expect

### Successful Flow:
```
=== PAYMENT API: ENDPOINT CALLED === { requestId: 'req_...', timestamp: '...' }
=== PAYMENT API: Payment details === { planId: 'basic', amount: 169000, ... }
=== PAYMENT API: Payment record saved successfully === { id: '...', transactionId: 'PLAN...' }

(User transfers money)

=== SEPAY WEBHOOK: Received === { id: 92704, content: 'PLAN...', transferAmount: 169000 }
=== SEPAY WEBHOOK: API Key verified ===
=== SEPAY WEBHOOK: Processing === { orderId: 'PLAN...', amount: 169000 }
=== SEPAY WEBHOOK: Successfully upgraded subscription === { tier: 'basic' }
```

### If Payment Not Found (Fallback):
```
=== SEPAY WEBHOOK: Payment not found, attempting fallback creation ===
=== SEPAY WEBHOOK: Creating fallback payment record ===
=== SEPAY WEBHOOK: Fallback payment created successfully ===
```

---

## ⚠️ Troubleshooting

### Issue: Webhook not called
**Check**:
1. IPN URL is correct: `https://planai.io.vn/api/webhook/sepay`
2. IPN is enabled in SePay Dashboard
3. Check SePay Dashboard → Nhật ký webhooks (Webhook logs)

### Issue: 401 Unauthorized
**Check**:
1. SEPAY_API_KEY is correct in Vercel env vars
2. API Key matches: `40KPESXRD5XUKP6WYLKYOJGMBMJBRQZ4SEXDLUNDTCBZVZFIJL5I1FVAMRZGVKWT`

### Issue: Payment not found
**Expected**: Fallback mechanism will create payment record automatically

### Issue: Transaction not confirmed in SePay
**Check**:
1. Transaction ID format: `PLAN` + 10 digits (e.g., `PLAN3296079697`)
2. Amount matches: 169000 VND
3. Account number: FLIOAI000 (MB Bank)

---

## 📝 Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Payment Creation | ✅ Fixed | Now saves to database correctly |
| Webhook Handler | ✅ Ready | Verifies API Key, creates fallback |
| IPN Configuration | ⏳ Pending | You need to configure in SePay Dashboard |
| Transaction ID | ✅ Correct | Format: `PLAN` + 10 digits |
| Fallback Mechanism | ✅ Ready | Auto-creates payment if not found |
| Email Support | ✅ Updated | `webappsaas.ai@gmail.com` |

---

## 🎯 Next Action

**Configure IPN in SePay Dashboard**:
1. IPN URL: `https://planai.io.vn/api/webhook/sepay`
2. Auth Type: "Không có"
3. Enable IPN
4. Click "Cập nhật"

Then test with SePay simulation or real transfer.

---

## 📞 If Issues Persist

1. Check Vercel logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test webhook manually using curl command (see SEPAY_IPN_SETUP.md)
4. Contact SePay support if webhook logs show failures
