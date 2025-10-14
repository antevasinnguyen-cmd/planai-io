import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, supabase } from '@/lib/supabase'

// SePay configuration
const SEPAY_API_URL = 'https://my.sepay.vn/userapi/transactions/create'
const SEPAY_TOKEN = process.env.SEPAY_TOKEN || ''
const SEPAY_ACCOUNT_NUMBER = process.env.SEPAY_ACCOUNT_NUMBER || ''

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
    if (paymentMethod === 'sepay' && (!SEPAY_TOKEN || !SEPAY_ACCOUNT_NUMBER)) {
      console.error('Missing SePay configuration')
      return NextResponse.json({ 
        error: 'Payment provider configuration missing', 
        details: 'SePay configuration is not complete' 
      }, { status: 500 })
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
      console.log('=== PAYMENT API: Processing SePay payment (mock) ===')
      try {
        // Sử dụng URL thanh toán mô phỏng thay vì gọi API SePay thật
        // Điều này giúp chúng ta test luồng thanh toán mà không cần cấu hình API thật
        
        // Tạo URL thanh toán mô phỏng
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://planai.io.vn'
        paymentUrl = `${baseUrl}/payment/success?order=${transactionId}&amount=${amount}&plan=${planId}&provider=sepay`
        
        // Tạo mã QR cho URL thanh toán
        qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentUrl)}`
        
        console.log('SePay mock payment created:', { paymentUrl, qrCode })
      } catch (sePayError) {
        console.error('=== PAYMENT API: SePay error ===', sePayError)
        return NextResponse.json({ 
          error: 'Payment provider error',
          details: sePayError instanceof Error ? sePayError.message : 'Could not connect to SePay'
        }, { status: 500 })
      }
    } else if (paymentMethod === 'payos') {
      console.log('=== PAYMENT API: Processing PayOS payment (mock) ===')
      try {
        // Sử dụng URL thanh toán mô phỏng thay vì gọi API PayOS thật
        // Điều này giúp chúng ta test luồng thanh toán mà không cần cấu hình chữ ký
        
        // Tạo URL thanh toán mô phỏng
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://planai.io.vn'
        paymentUrl = `${baseUrl}/payment/success?order=${transactionId}&amount=${amount}&plan=${planId}`
        
        // Tạo mã QR cho URL thanh toán
        qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentUrl)}`
        
        console.log('PayOS mock payment created:', { paymentUrl, qrCode })
        
        console.log('PayOS payment created:', { paymentUrl, qrCode })
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
