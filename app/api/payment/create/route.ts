import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, supabase } from '@/lib/supabase'

// SePay configuration
const SEPAY_API_URL = 'https://my.sepay.vn/userapi/transactions/create'
const SEPAY_TOKEN = process.env.SEPAY_TOKEN || ''
const SEPAY_ACCOUNT_NUMBER = process.env.SEPAY_ACCOUNT_NUMBER || ''

// PayOS configuration
const PAYOS_API_URL = process.env.PAYOS_API_URL || 'https://api-merchant.payos.vn'
const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || ''
const PAYOS_API_KEY = process.env.PAYOS_API_KEY || ''
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const { planId, amount, userId, paymentMethod } = await request.json()
    
    // Verify user
    const user = await getCurrentUser()
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      // Create payment with SePay
      const sePayData = {
        account_number: SEPAY_ACCOUNT_NUMBER,
        amount: amount,
        content: `Thanh toan goi ${planId} - ${transactionId}`,
        transaction_id: transactionId
      }

      const response = await fetch(SEPAY_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SEPAY_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sePayData)
      })
      
      const sePayResult = await response.json()
      
      if (sePayResult.status !== 200) {
        return NextResponse.json({ 
          error: 'Payment creation failed',
          details: sePayResult.message 
        }, { status: 400 })
      }
      
      paymentUrl = sePayResult.data.payment_url || ''
      qrCode = sePayResult.data.qr_code || ''
    } else if (paymentMethod === 'payos') {
      // Xử lý thanh toán PayOS (mô phỏng)
      // Trong thực tế, bạn sẽ gọi API của PayOS ở đây
      paymentUrl = `https://sandbox.payos.vn/payment?id=${transactionId}`
      qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentUrl)}`
    }

    // Save payment record to database
    const { data: paymentRecord, error } = await supabase
      .from('payments')
      .insert([{
        user_id: userId,
        subscription_tier: planId,
        amount: amount,
        currency: 'VND',
        status: 'pending',
        payment_method: paymentMethod,
        transaction_id: transactionId
      }])
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

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
