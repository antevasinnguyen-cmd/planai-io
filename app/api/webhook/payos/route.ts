import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

// PayOS configuration
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || ''

// Hàm verify signature từ PayOS
function verifyPayOSSignature(data: any, signature: string): boolean {
  try {
    // PayOS sử dụng HMAC SHA256 để tạo signature
    // Format: HMAC_SHA256(checksum_key, sorted_params)
    const sortedData = Object.keys(data)
      .sort()
      .reduce((acc: any, key) => {
        acc[key] = data[key]
        return acc
      }, {})

    const dataString = JSON.stringify(sortedData)
    const hmac = crypto.createHmac('sha256', PAYOS_CHECKSUM_KEY)
    hmac.update(dataString)
    const calculatedSignature = hmac.digest('hex')

    return calculatedSignature === signature
  } catch (error) {
    console.error('=== PAYOS WEBHOOK: Signature verification error ===', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== PAYOS WEBHOOK: Received webhook ===')
    
    // Lấy signature từ header
    const signature = request.headers.get('x-payos-signature') || 
                     request.headers.get('signature') || ''

    // Parse webhook data
    const data = await request.json()
    console.log('=== PAYOS WEBHOOK: Data received ===', data)

    // Verify signature
    if (!verifyPayOSSignature(data, signature)) {
      console.error('=== PAYOS WEBHOOK: Invalid signature ===')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // PayOS webhook format:
    // {
    //   "code": "00",
    //   "desc": "success",
    //   "data": {
    //     "orderCode": 123456,
    //     "amount": 50000,
    //     "description": "PLANAI_ORDER_123",
    //     "accountNumber": "5428960265186",
    //     "reference": "FT24001123456",
    //     "transactionDateTime": "2024-01-01 12:00:00",
    //     "currency": "VND",
    //     "paymentLinkId": "...",
    //     "code": "00",
    //     "desc": "Thành công",
    //     "counterAccountBankId": "",
    //     "counterAccountBankName": "",
    //     "counterAccountName": "",
    //     "counterAccountNumber": "",
    //     "virtualAccountName": "",
    //     "virtualAccountNumber": ""
    //   },
    //   "signature": "..."
    // }

    const {
      code,
      desc,
      data: paymentData
    } = data

    // Kiểm tra trạng thái thanh toán
    if (code !== '00') {
      console.error('=== PAYOS WEBHOOK: Payment failed ===', { code, desc })
      return NextResponse.json({ error: 'Payment failed', code, desc }, { status: 400 })
    }

    const {
      orderCode,
      amount,
      description,
      reference,
      transactionDateTime
    } = paymentData

    // Kiểm tra dữ liệu hợp lệ
    if (!orderCode || !amount || !description) {
      console.error('=== PAYOS WEBHOOK: Missing required fields ===')
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Lấy order ID từ description
    const orderId = description

    console.log('=== PAYOS WEBHOOK: Processing payment ===', {
      orderId,
      amount,
      orderCode
    })

    // Tìm payment trong database
    const { data: payment, error: findError } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_id', orderId)
      .single()

    if (findError || !payment) {
      console.error('=== PAYOS WEBHOOK: Payment not found ===', orderId)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Kiểm tra số tiền có khớp không
    if (payment.amount !== amount) {
      console.error('=== PAYOS WEBHOOK: Amount mismatch ===', {
        expected: payment.amount,
        received: amount
      })
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
    }

    // Kiểm tra payment đã được xử lý chưa
    if (payment.status === 'completed') {
      console.log('=== PAYOS WEBHOOK: Payment already processed ===')
      return NextResponse.json({ message: 'Payment already processed' })
    }

    // Cập nhật trạng thái payment
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
        payment_details: {
          ...payment.payment_details,
          payos_order_code: orderCode,
          payos_reference: reference,
          payos_transaction_time: transactionDateTime,
          completed_at: new Date().toISOString()
        }
      })
      .eq('id', payment.id)

    if (updateError) {
      console.error('=== PAYOS WEBHOOK: Failed to update payment ===', updateError)
      return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
    }

    // Nâng cấp tài khoản người dùng
    const planDurations: { [key: string]: number } = {
      'basic': 30,
      'pro': 30,
      'premium': 30
    }

    const duration = planDurations[payment.subscription_tier] || 30
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + duration)

    const { error: upgradeError } = await supabase
      .from('users')
      .update({
        subscription_tier: payment.subscription_tier,
        subscription_status: 'active',
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: expiryDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.user_id)

    if (upgradeError) {
      console.error('=== PAYOS WEBHOOK: Failed to upgrade user ===', upgradeError)
      return NextResponse.json({ error: 'Failed to upgrade user' }, { status: 500 })
    }

    console.log('=== PAYOS WEBHOOK: Payment completed successfully ===', {
      orderId,
      userId: payment.user_id,
      plan: payment.subscription_tier
    })

    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully',
      orderId
    })

  } catch (error) {
    console.error('=== PAYOS WEBHOOK: Error ===', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    webhook: 'payos',
    timestamp: new Date().toISOString()
  })
}
