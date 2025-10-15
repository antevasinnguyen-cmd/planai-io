import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, supabase } from '@/lib/supabase'
import crypto from 'crypto'

// SePay configuration
const SEPAY_API_URL = 'https://my.sepay.vn/userapi/transactions/create'
const SEPAY_TOKEN = process.env.SEPAY_TOKEN || ''
const SEPAY_ACCOUNT_NUMBER = process.env.SEPAY_ACCOUNT_NUMBER || 'FLIOAI000' // Fallback value
const SEPAY_WEBHOOK_SECRET = process.env.SEPAY_WEBHOOK_SECRET || ''

// Hàm tạo chữ ký webhook
function generateWebhookSignature(payload: any, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  return hmac.update(JSON.stringify(payload)).digest('hex');
}

// Hàm tạo mã giao dịch duy nhất
function generateTransactionId(prefix = 'PLANAI'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Hàm tạo URL xử lý thanh toán
function createPaymentProcessingUrl(params: {
  orderId: string;
  amount: number;
  planId: string;
  qrCode: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://planai.io.vn';
  const { orderId, amount, planId, qrCode, accountNumber, accountName, bankName } = params;
  
  return `${baseUrl}/payment/processing?${new URLSearchParams({
    order: orderId,
    amount: amount.toString(),
    plan: planId,
    provider: 'sepay',
    qr: qrCode,
    account: accountNumber,
    name: accountName,
    bank: bankName,
    timestamp: Date.now().toString()
  })}`;
}

// PayOS configuration
const PAYOS_API_URL = process.env.PAYOS_API_URL || 'https://api-merchant.payos.vn/v2/payment-requests'
const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || ''
const PAYOS_API_KEY = process.env.PAYOS_API_KEY || ''
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || ''
const PAYOS_WEBHOOK_SECRET = process.env.PAYOS_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
  try {
    console.log('=== PAYMENT API: Received payment request ===')
    const { planId, amount, userId, paymentMethod } = await request.json()
    console.log('Payment details:', { planId, amount, userId, paymentMethod })
    
    // Bỏ qua hoàn toàn phần kiểm tra xác thực người dùng
    console.log('=== PAYMENT API: Skipping user verification for all requests ===')
    console.log('=== PAYMENT API: Requested userId ===', userId)

    // Generate unique transaction ID
    const transactionId = `PLANAI_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Kiểm tra biến môi trường
    if (paymentMethod === 'sepay') {
      console.log('=== SEPAY CONFIG CHECK ===', {
        hasToken: !!SEPAY_TOKEN,
        tokenLength: SEPAY_TOKEN?.length || 0,
        hasAccountNumber: !!SEPAY_ACCOUNT_NUMBER,
        accountNumber: SEPAY_ACCOUNT_NUMBER
      });
      
      if (!SEPAY_TOKEN) {
        console.error('Missing SEPAY_TOKEN environment variable');
        return NextResponse.json({ 
          error: 'Payment provider configuration missing', 
          details: 'SEPAY_TOKEN is not configured. Please contact support.' 
        }, { status: 500 });
      }
      
      if (!SEPAY_ACCOUNT_NUMBER) {
        console.error('Missing SEPAY_ACCOUNT_NUMBER environment variable');
        return NextResponse.json({ 
          error: 'Payment provider configuration missing', 
          details: 'SEPAY_ACCOUNT_NUMBER is not configured. Please contact support.' 
        }, { status: 500 });
      }
    }
    
    if (paymentMethod === 'payos' && (!PAYOS_CLIENT_ID || !PAYOS_API_KEY || !PAYOS_CHECKSUM_KEY)) {
      console.error('Missing PayOS configuration')
      return NextResponse.json({ 
        error: 'Payment provider configuration missing', 
        details: 'PayOS configuration is not complete' 
      }, { status: 500 })
    }

    let paymentUrl = ''
    let qrCode = ''
    
    if (paymentMethod === 'sepay') {
      console.log('=== PAYMENT API: Processing SePay payment ===', {
        transactionId,
        amount,
        planId,
        timestamp: new Date().toISOString()
      });
      
      try {
        // Thông tin tài khoản SePay
        const bankName = 'MB Bank';
        const bankCode = '970422'; // MB Bank BIN
        const accountName = 'NGUYEN THI KHANH HUYEN';
        const accountNumber = SEPAY_ACCOUNT_NUMBER;
        
        if (!accountNumber) {
          throw new Error('SePay account number is not configured');
        }
        
        // Tạo nội dung chuyển khoản
        const transferContent = transactionId;
        
        // Tạo QR code bằng VietQR (SePay sẽ tự động nhận diện giao dịch)
        qrCode = `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.jpg?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`;
        
        // Tạo URL xử lý thanh toán
        paymentUrl = createPaymentProcessingUrl({
          orderId: transactionId,
          amount,
          planId,
          qrCode,
          accountNumber,
          accountName,
          bankName
        });
        
        console.log('SePay payment created:', { 
          paymentUrl, 
          qrCode: qrCode ? 'QR code generated' : 'No QR code',
          transactionId,
          timestamp: new Date().toISOString()
        });
        
      } catch (sePayError) {
        const errorId = `err_${Date.now()}`;
        console.error('=== PAYMENT API: SePay error ===', {
          errorId,
          error: sePayError,
          timestamp: new Date().toISOString()
        });
        
        // Log lỗi vào database
        try {
          await supabase
            .from('error_logs')
            .insert([{
              type: 'payment_error',
              error_id: errorId,
              message: sePayError instanceof Error ? sePayError.message : 'Unknown SePay error',
              metadata: {
                transactionId,
                amount,
                planId,
                userId,
                error: sePayError
              },
              created_at: new Date().toISOString()
            }]);
        } catch (logError) {
          console.error('Failed to log payment error:', logError);
        }
        
        return NextResponse.json({ 
          success: false,
          error: 'Payment provider error',
          error_id: errorId,
          details: sePayError instanceof Error ? sePayError.message : 'Could not process payment',
          timestamp: new Date().toISOString()
        }, { status: 500 });
      }
    } else if (paymentMethod === 'payos') {
      console.log('=== PAYMENT API: Processing PayOS payment ===')
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://planai.io.vn'
        
        // Thông tin tài khoản PayOS
        const bankCode = '970422' // Mã BIN của MBBank
        const bankName = 'MB Bank'
        const accountName = 'NGUYEN THI KHANH HUYEN'
        const accountNumber = '5428960265186'
        
        // Tạo nội dung chuyển khoản
        const transferContent = transactionId
        
        // Tạo URL VietQR với định dạng đúng
        // Format: https://img.vietqr.io/image/{BANK_BIN}-{ACCOUNT_NUMBER}-{TEMPLATE}.jpg?amount={AMOUNT}&addInfo={CONTENT}&accountName={NAME}
        qrCode = `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.jpg?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`
        
        // URL chuyển đến trang processing
        paymentUrl = `${baseUrl}/payment/processing?${new URLSearchParams({
          order: transactionId,
          amount: amount.toString(),
          plan: planId,
          provider: 'payos',
          qr: qrCode,
          account: accountNumber,
          name: accountName,
          bank: bankName,
          timestamp: Date.now().toString()
        })}`
        
        console.log('PayOS payment created:', { 
          paymentUrl, 
          qrCode: qrCode ? 'QR code generated' : 'No QR code',
          transactionId,
          timestamp: new Date().toISOString()
        })
      } catch (payosError) {
        console.error('=== PAYMENT API: PayOS error ===', payosError)
        return NextResponse.json({ 
          error: 'Payment provider error',
          details: payosError instanceof Error ? payosError.message : 'Could not connect to PayOS'
        }, { status: 500 })
      }
    }

    // Lưu bản ghi thanh toán vào database
    console.log('=== PAYMENT API: Saving payment record to database ===')
    try {
      // Đảm bảo userId luôn hợp lệ
      const safeUserId = userId || 'anonymous'
      
      const { data: paymentRecord, error } = await supabase
        .from('payments')
        .insert([{
          user_id: safeUserId,
          subscription_tier: planId,
          amount: amount,
          currency: 'VND',
          status: 'pending',
          payment_method: paymentMethod,
          transaction_id: transactionId,
          created_at: new Date().toISOString()
        }])
        .select()

      if (error) {
        // Ghi log lỗi nhưng không trả về lỗi cho client
        console.error('=== PAYMENT API: Database error (non-blocking) ===', error)
      } else {
        console.log('=== PAYMENT API: Payment record saved successfully ===', paymentRecord)
      }
    } catch (dbError) {
      // Ghi log lỗi nhưng không trả về lỗi cho client
      console.error('=== PAYMENT API: Database exception (non-blocking) ===', dbError)
    }

    // Kiểm tra URL thanh toán có trống không
    if (!paymentUrl) {
      console.error('=== PAYMENT API: Empty payment URL ===', { paymentMethod })
      return NextResponse.json({ 
        error: 'Invalid payment URL', 
        details: 'Payment URL is empty. Please try again or contact support.' 
      }, { status: 500 })
    }
    
    // Return success response
    console.log('=== PAYMENT API: Returning success response ===', { paymentUrl, transactionId })
    return NextResponse.json({
      success: true,
      paymentUrl: paymentUrl,
      transactionId: transactionId,
      qrCode: qrCode
    })

  } catch (error) {
    console.error('Payment API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
