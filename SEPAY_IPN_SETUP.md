# SePay IPN Configuration Guide

## 🎯 SePay Credentials (Provided)

```
MERCHANT ID: SP-LIVE-NHB84AA6
SECRET KEY: spsk_live_XqkQwjVfRkr3XsD3FeEXmuX25QNXecw2
SEPAY_API_KEY: 40KPESXRD5XUKP6WYLKYOJGMBMJBRQZ4SEXDLUNDTCBZVZFIJL5I1FVAMRZGVKWT
```

---

## 📋 IPN Configuration in SePay Dashboard

### IPN URL
```
https://planai.io.vn/api/webhook/sepay
```

### Auth Type
**Select: "Không có" (No Authentication)**

Why? Because we're using API Key in the Authorization header instead.

### Content Type
```
application/json
```

### Status
✅ **Kích hoạt IPN** (Enable IPN)

---

## 🔐 Webhook Authentication

**Method**: API Key in Authorization Header

**Format**:
```
Authorization: Apikey 40KPESXRD5XUKP6WYLKYOJGMBMJBRQZ4SEXDLUNDTCBZVZFIJL5I1FVAMRZGVKWT
```

**Supported Formats** (our webhook supports all):
1. `Authorization: Apikey YOUR_API_KEY`
2. `Authorization: Bearer YOUR_API_KEY`
3. `x-api-key: YOUR_API_KEY`

---

## 📤 Webhook Payload Format

SePay sends:
```json
{
  "id": 92704,
  "gateway": "Vietcombank",
  "transactionDate": "2023-03-25 14:02:37",
  "accountNumber": "0123499999",
  "code": null,
  "content": "PLAN3296079697",
  "transferType": "in",
  "transferAmount": 169000,
  "accumulated": 19077000,
  "subAccount": null,
  "referenceCode": "MBVCB.3278907687",
  "description": ""
}
```

**Key Fields**:
- `content`: Transaction ID (should be `PLAN` + 10 digits)
- `transferAmount`: Payment amount (must match order amount)
- `transferType`: "in" = money received, "out" = money sent
- `id`: SePay transaction ID (for reference)

---

## ✅ Webhook Response Requirements

**Status Code**: 200 or 201

**Body**:
```json
{
  "success": true,
  "message": "Payment processed",
  "orderId": "PLAN3296079697",
  "status": "completed"
}
```

**Our Implementation**: ✅ Correct
- File: `/app/api/webhook/sepay/route.ts`
- Status: 200
- Body: `{ success: true, ... }`

---

## 🔄 Webhook Flow

```
1. User transfers money to MB Bank account
   ↓
2. Bank notifies SePay
   ↓
3. SePay calls webhook: POST /api/webhook/sepay
   Authorization: Apikey YOUR_API_KEY
   Body: { id, content, transferAmount, ... }
   ↓
4. Our webhook handler:
   - Verifies API Key ✅
   - Finds payment by transaction_id (content) ✅
   - If not found, creates fallback payment ✅
   - Updates payment status to 'completed' ✅
   - Updates user subscription ✅
   - Returns { success: true } + HTTP 200 ✅
   ↓
5. Frontend auto-detects completion
   ↓
6. Redirect to success page ✅
```

---

## 🧪 Testing SePay IPN

### Method 1: SePay Dashboard Simulation
1. Go to SePay Dashboard
2. Menu: Giao dịch → Giả lập giao dịch
3. Create test transaction with:
   - Amount: 169000
   - Content: `PLAN` + 10 digits (e.g., `PLAN3296079697`)
   - Account: Your MB Bank account
4. SePay will automatically call webhook
5. Check Vercel logs for webhook processing

### Method 2: Manual Webhook Test
```bash
curl -X POST https://planai.io.vn/api/webhook/sepay \
  -H "Content-Type: application/json" \
  -H "Authorization: Apikey 40KPESXRD5XUKP6WYLKYOJGMBMJBRQZ4SEXDLUNDTCBZVZFIJL5I1FVAMRZGVKWT" \
  -d '{
    "id": 92704,
    "gateway": "Vietcombank",
    "transactionDate": "2023-03-25 14:02:37",
    "accountNumber": "0123499999",
    "code": null,
    "content": "PLAN3296079697",
    "transferType": "in",
    "transferAmount": 169000,
    "accumulated": 19077000,
    "subAccount": null,
    "referenceCode": "MBVCB.3278907687",
    "description": ""
  }'
```

Expected Response:
```json
{
  "success": true,
  "message": "Payment completed",
  "orderId": "PLAN3296079697",
  "status": "completed"
}
```

---

## 🔍 Vercel Logs to Expect

### Successful Webhook:
```
=== SEPAY WEBHOOK: Received ===
=== SEPAY WEBHOOK: API Key verified ===
=== SEPAY WEBHOOK: Processing ===
=== SEPAY WEBHOOK: Successfully upgraded subscription ===
```

### If Payment Not Found (Fallback):
```
=== SEPAY WEBHOOK: Payment not found, attempting fallback creation ===
=== SEPAY WEBHOOK: Creating fallback payment record ===
=== SEPAY WEBHOOK: Fallback payment created successfully ===
```

### If Error:
```
=== SEPAY WEBHOOK: Invalid API Key ===
=== SEPAY WEBHOOK: Database error ===
```

---

## ⚠️ Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Webhook not called | IPN URL incorrect | Verify: `https://planai.io.vn/api/webhook/sepay` |
| 401 Unauthorized | API Key mismatch | Check: `SEPAY_API_KEY` in Vercel env vars |
| 404 Payment not found | Payment not in DB | Fallback mechanism will create it |
| Webhook timeout | Endpoint too slow | Check Vercel logs for performance issues |
| Duplicate payments | Webhook retried | Webhook checks `payment.status === 'completed'` to skip |

---

## 📝 Environment Variables Required

In Vercel:
```
SEPAY_API_KEY=40KPESXRD5XUKP6WYLKYOJGMBMJBRQZ4SEXDLUNDTCBZVZFIJL5I1FVAMRZGVKWT
SEPAY_ACCOUNT_NUMBER=FLIOAI000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## ✅ Checklist

- [x] IPN URL: `https://planai.io.vn/api/webhook/sepay`
- [x] Auth Type: "Không có"
- [x] Content Type: `application/json`
- [x] IPN Status: Enabled
- [x] API Key in Vercel env vars
- [x] Webhook handler returns HTTP 200 + `{ success: true }`
- [x] Webhook verifies API Key
- [x] Webhook creates fallback payment if not found
- [x] Webhook updates payment status
- [x] Webhook updates user subscription
- [x] Frontend auto-detects completion

---

## 🎯 Next Steps

1. **Configure IPN in SePay Dashboard**:
   - IPN URL: `https://planai.io.vn/api/webhook/sepay`
   - Auth Type: "Không có"
   - Enable IPN

2. **Test with SePay Simulation**:
   - Create test transaction
   - Verify webhook is called
   - Check Vercel logs

3. **Test with Real Transfer**:
   - Transfer money to MB Bank account
   - SePay will call webhook
   - Payment should be confirmed automatically

---

## 📞 Support

If webhook is not being called:
1. Check SePay Dashboard → Nhật ký webhooks (Webhook logs)
2. Verify IPN URL is correct
3. Check Vercel logs for errors
4. Contact SePay support: support@sepay.vn
