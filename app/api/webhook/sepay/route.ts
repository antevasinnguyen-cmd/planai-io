import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// API Key từ SePay để xác thực webhook
const SEPAY_API_KEY = process.env.SEPAY_TOKEN || ''

export async function POST(request: NextRequest) {
  try {
    console.log('=== SEPAY WEBHOOK: Received webhook ===')
    
    // Xác thực API Key từ header
    const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '') || 
                   request.headers.get('X-API-Key') || 
                   request.headers.get('api-key')
    
    if (!apiKey || apiKey !== SEPAY_API_KEY) {
      console.error('=== SEPAY WEBHOOK: Invalid API key ===')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse webhook data
    const data = await request.json()
    console.log('=== SEPAY WEBHOOK: Data received ===', data)

    // SePay webhook format:
    // {
    //   "id": "transaction_id",
    //   "gateway": "sepay",
    //   "transaction_date": "2024-01-01 12:00:00",
    //   "account_number": "FLIOAI000",
    //   "sub_account": "",
    //   "amount_in": 50000,
    //   "amount_out": 0,
    //   "accumulated": 1000000,
    //   "code": "PLANAI_ORDER_123",
    //   "transaction_content": "PLANAI_ORDER_123",
    //   "reference_number": "FT24001123456",
    //   "body": "..."
    // }

    const {
      id: transactionId,
      amount_in: amountIn,
      transaction_content: content,
      code,
      account_number: accountNumber
    } = data

    // Kiểm tra dữ liệu hợp lệ
    if (!transactionId || !amountIn || !content) {
      console.error('=== SEPAY WEBHOOK: Missing required fields ===')
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Kiểm tra account number có đúng không
    if (accountNumber !== process.env.SEPAY_ACCOUNT_NUMBER) {
      console.error('=== SEPAY WEBHOOK: Invalid account number ===')
      return NextResponse.json({ error: 'Invalid account number' }, { status: 400 })
    }

    // Lấy order ID từ transaction content hoặc code
    const orderId = code || content

    console.log('=== SEPAY WEBHOOK: Processing payment ===', {
      orderId,
      amount: amountIn,
      transactionId
    })

    // Tìm payment trong database
    const { data: payment, error: findError } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_id', orderId)
      .single()

    if (findError || !payment) {
      console.error('=== SEPAY WEBHOOK: Payment not found ===', orderId)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Kiểm tra số tiền có khớp không
    if (payment.amount !== amountIn) {
      console.error('=== SEPAY WEBHOOK: Amount mismatch ===', {
        expected: payment.amount,
        received: amountIn
      })
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
    }

    // Kiểm tra payment đã được xử lý chưa
    if (payment.status === 'completed') {
      console.log('=== SEPAY WEBHOOK: Payment already processed ===')
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
          sepay_transaction_id: transactionId,
          sepay_reference: data.reference_number,
          completed_at: new Date().toISOString()
        }
      })
      .eq('id', payment.id)

    if (updateError) {
      console.error('=== SEPAY WEBHOOK: Failed to update payment ===', updateError)
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
      console.error('=== SEPAY WEBHOOK: Failed to upgrade user ===', upgradeError)
      return NextResponse.json({ error: 'Failed to upgrade user' }, { status: 500 })
    }

    console.log('=== SEPAY WEBHOOK: Payment completed successfully ===', {
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
    console.error('=== SEPAY WEBHOOK: Error ===', error)
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
    webhook: 'sepay',
    timestamp: new Date().toISOString()
  })
}
