import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Tắt static optimization vì route này cần đọc searchParams động
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    // Sử dụng URL constructor thay vì nextUrl để tránh lỗi static generation
    const url = new URL(request.url)
    const orderId = url.searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    console.log('=== PAYMENT STATUS CHECK: Checking payment status ===', orderId)

    // Kiểm tra trạng thái thanh toán trong database
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_id', orderId)

    if (error) {
      console.error('=== PAYMENT STATUS CHECK: Database error ===', error)
      return NextResponse.json({
        status: 'pending',
        message: 'Database error',
        error: error.message
      })
    }

    // Nếu không tìm thấy payment hoặc chưa có trong DB
    if (!payments || payments.length === 0) {
      console.log('=== PAYMENT STATUS CHECK: Payment not found in database ===', orderId)
      return NextResponse.json({
        status: 'pending',
        message: 'Payment not found or still pending'
      })
    }

    const payment = payments[0]
    console.log('=== PAYMENT STATUS CHECK: Payment found ===', payment)

    return NextResponse.json({
      status: payment.status,
      payment: {
        id: payment.id,
        amount: payment.amount,
        planId: payment.subscription_tier,
        paymentMethod: payment.payment_method,
        createdAt: payment.created_at,
        updatedAt: payment.updated_at
      }
    })
  } catch (error) {
    console.error('=== PAYMENT STATUS CHECK: Error ===', error)
    return NextResponse.json({
      error: 'Internal server error',
      status: 'pending'
    }, { status: 500 })
  }
}
