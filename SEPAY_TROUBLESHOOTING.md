# SePay Troubleshooting Guide

## Vấn đề hiện tại

Webhook đang nhận **test transaction** từ SePay, không phải giao dịch thực tế:

```json
{
  "id": 12345,
  "gateway": "Vietcombank",
  "content": "PLAN3441540181",
  "referenceCode": "MBVCB.TEST",
  "description": "Test webhook"
}
```

## Nguyên nhân

1. **SePay đang gửi test webhook** với transaction ID ngẫu nhiên
2. **Giao dịch thực tế không được SePay ghi nhận** → Không có webhook thật
3. **Tài khoản SePay chưa được cấu hình đúng** hoặc chưa kích hoạt

## Kiểm tra cần làm

### 1. SePay Dashboard (https://my.sepay.vn)

Đăng nhập và kiểm tra:

#### A. Cấu hình IPN
- **IPN URL**: `https://planai.io.vn/api/webhook/sepay`
- **Auth Type**: `Api Key` (hoặc `Apikey`)
- **API Key**: `40KPESXRD5XUKP6WYLKYOJGMBMJBRQZ4SEXDLUNDTCBZVZFIJL5I1FVAMRZGVKWT`
- **Content-Type**: `application/json`
- **Trạng thái**: `Đang hoạt động` (Active)

#### B. Cấu trúc mã thanh toán
- **Tiền tố**: `PLAN`
- **Hậu tố**: 3-10 ký tự số nguyên
- **Ví dụ**: `PLAN3441547463`

#### C. Tài khoản ngân hàng
- **Số tài khoản**: `FLIOAI000`
- **Ngân hàng**: MB Bank (970422)
- **Chủ tài khoản**: NGUYEN THI KHANH HUYEN
- **Trạng thái**: Đang hoạt động
- **Liên kết với SePay**: ✅ Đã liên kết

#### D. Lịch sử giao dịch
- Kiểm tra xem các giao dịch từ MB Bank có được SePay ghi nhận không
- Nếu không có giao dịch nào → Tài khoản chưa được liên kết đúng

### 2. Test Webhook

Trong SePay Dashboard, thử gửi **Test Webhook** với:
- **Transaction ID**: `PLAN3441547463` (transaction ID thực tế từ `/api/payment/create`)
- **Amount**: `169000`
- **Transfer Type**: `in`

Kiểm tra Vercel logs xem webhook có nhận được không.

### 3. Giao dịch thực tế

Khi chuyển khoản qua MB Bank:
- **Số tài khoản**: `FLIOAI000`
- **Số tiền**: `169000`
- **Nội dung**: `PLAN3441547463` (chính xác từ QR code)

Sau đó kiểm tra:
1. **MB Bank**: Giao dịch thành công ✅
2. **SePay Dashboard**: Giao dịch có xuất hiện không? ❓
3. **Vercel logs**: Webhook có được gọi không? ❓

## Các trường hợp có thể xảy ra

### Case 1: SePay chưa liên kết với tài khoản ngân hàng
**Triệu chứng**: 
- MB Bank nhận tiền ✅
- SePay Dashboard không có giao dịch ❌
- Webhook không được gọi ❌

**Giải pháp**:
- Liên hệ SePay support để kích hoạt liên kết tài khoản
- Email: support@sepay.vn
- Cung cấp: Mã đơn vị `SP-LIVE-NHB84AA6`, số tài khoản `FLIOAI000`

### Case 2: IPN URL chưa được cấu hình đúng
**Triệu chứng**:
- MB Bank nhận tiền ✅
- SePay Dashboard có giao dịch ✅
- Webhook không được gọi ❌

**Giải pháp**:
- Kiểm tra lại IPN URL trong SePay Dashboard
- Đảm bảo URL chính xác: `https://planai.io.vn/api/webhook/sepay`
- Đảm bảo Auth Type: `Api Key`

### Case 3: API Key sai
**Triệu chứng**:
- MB Bank nhận tiền ✅
- SePay Dashboard có giao dịch ✅
- Webhook được gọi nhưng bị reject (401/403) ❌

**Giải pháp**:
- Kiểm tra API Key trong SePay Dashboard
- So sánh với `SEPAY_API_KEY` trong Vercel env vars
- Đảm bảo format: `Apikey <API_KEY>` hoặc `Bearer <API_KEY>`

### Case 4: Tài khoản SePay chưa được kích hoạt
**Triệu chứng**:
- Chỉ nhận được test webhook ✅
- Không nhận được webhook thật ❌

**Giải pháp**:
- Liên hệ SePay support để kích hoạt tài khoản production
- Xác nhận tài khoản đã được verify và có thể nhận giao dịch thực

## Hành động tiếp theo

1. **Ngay lập tức**:
   - Đăng nhập SePay Dashboard
   - Kiểm tra **Lịch sử giao dịch** xem có giao dịch nào không
   - Kiểm tra **Cấu hình IPN** xem đã đúng chưa

2. **Nếu không có giao dịch trong SePay**:
   - Liên hệ SePay support
   - Yêu cầu kiểm tra liên kết tài khoản `FLIOAI000`
   - Yêu cầu kích hoạt tài khoản production

3. **Nếu có giao dịch trong SePay nhưng không có webhook**:
   - Kiểm tra lại IPN URL
   - Test webhook từ SePay Dashboard
   - Kiểm tra Vercel logs

## Liên hệ SePay Support

- **Email**: support@sepay.vn
- **Hotline**: (nếu có)
- **Thông tin cần cung cấp**:
  - Mã đơn vị: `SP-LIVE-NHB84AA6`
  - Số tài khoản: `FLIOAI000`
  - Ngân hàng: MB Bank
  - Vấn đề: Giao dịch không được ghi nhận, webhook không được gọi

## Webhook endpoint status

Endpoint: `https://planai.io.vn/api/webhook/sepay`
Status: ✅ Hoạt động (đang nhận test webhook)

Test bằng cURL:
```bash
curl -X POST https://planai.io.vn/api/webhook/sepay \
  -H "Content-Type: application/json" \
  -H "Authorization: Apikey 40KPESXRD5XUKP6WYLKYOJGMBMJBRQZ4SEXDLUNDTCBZVZFIJL5I1FVAMRZGVKWT" \
  -d '{
    "id": 12345,
    "gateway": "MB Bank",
    "transactionDate": "2025-11-18T04:52:20.284Z",
    "accountNumber": "FLIOAI000",
    "content": "PLAN3441547463",
    "transferType": "in",
    "transferAmount": 169000,
    "accumulated": 1000000,
    "referenceCode": "MBVCB.12345",
    "description": "Manual test"
  }'
```

Kết quả mong đợi: HTTP 200 với `{"success": true, ...}`
