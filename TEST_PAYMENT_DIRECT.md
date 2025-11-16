# Test Payment Creation - Direct API Call

## Vấn Đề
Payment creation endpoint KHÔNG được gọi từ frontend.
Vercel logs không có `=== PAYMENT API: ENDPOINT CALLED ===`

## Test Trực Tiếp API

### Test 1: Gọi API từ browser console
```javascript
// Mở browser console (F12) tại https://planai.io.vn/payment/checkout?plan=basic
// Paste và chạy code này:

fetch('/api/payment/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    planId: 'basic',
    amount: 169000,
    userId: 'test-user-console',
    paymentMethod: 'sepay'
  })
})
.then(res => res.json())
.then(data => {
  console.log('✅ API Response:', data);
  if (data.success) {
    console.log('✅ Payment URL:', data.paymentUrl);
    console.log('✅ Transaction ID:', data.transactionId);
  } else {
    console.error('❌ Error:', data.error, data.details);
  }
})
.catch(err => {
  console.error('❌ Fetch Error:', err);
});
```

### Test 2: Gọi từ curl
```bash
curl -X POST https://planai.io.vn/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "basic",
    "amount": 169000,
    "userId": "test-user-curl",
    "paymentMethod": "sepay"
  }'
```

### Test 3: Gọi test endpoint
```bash
curl -X POST https://planai.io.vn/api/payment/test-create \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "basic",
    "amount": 169000,
    "userId": "test-user-endpoint"
  }'
```

## Kết Quả Mong Đợi

### Nếu API hoạt động:
```json
{
  "success": true,
  "paymentUrl": "https://planai.io.vn/payment/processing?orderId=PLAN...",
  "transactionId": "PLAN1234567890",
  "qrCode": "https://img.vietqr.io/image/..."
}
```

### Vercel Logs sẽ hiển thị:
```
=== PAYMENT API: ENDPOINT CALLED === { requestId: 'req_...', timestamp: '...' }
=== PAYMENT API: Payment details === { planId: 'basic', amount: 169000, userId: 'test-user-console', paymentMethod: 'sepay' }
=== PAYMENT API: Attempting to insert payment === { transactionId: 'PLAN...' }
=== PAYMENT API: Payment record saved successfully === { id: '...', transactionId: 'PLAN...' }
=== PAYMENT API: Returning success response === { paymentUrl: '...', paymentSaved: true }
```

## Nếu API KHÔNG hoạt động

### Scenario 1: Endpoint không được gọi
- Không có log nào trong Vercel
- **Nguyên nhân**: Routing issue, middleware block, hoặc frontend không gọi

### Scenario 2: API trả về error
```json
{
  "error": "Internal server error",
  "details": "..."
}
```
- **Nguyên nhân**: Database error, env vars missing, etc.

### Scenario 3: Timeout
- Frontend: "Yêu cầu thanh toán đã hết thời gian chờ"
- **Nguyên nhân**: API quá chậm (>15s)

## Debug Steps

1. **Test từ browser console** → Xác định API có hoạt động không
2. **Kiểm tra Vercel logs** → Xem endpoint có được gọi không
3. **Kiểm tra browser Network tab** → Xem request có được gửi không
4. **Kiểm tra user authentication** → User có được set không

## Giải Pháp Tạm Thời

Nếu API hoạt động nhưng frontend không gọi được:
1. Thêm logging vào `handlePayment()` trong CheckoutPage
2. Kiểm tra `user` object có tồn tại không
3. Kiểm tra `selectedPlan` có tồn tại không
4. Bypass authentication check tạm thời
