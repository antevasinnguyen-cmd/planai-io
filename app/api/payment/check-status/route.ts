import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    console.log('=== PAYMENT STATUS CHECK: Checking payment status ===', orderId)

    // Kiểm tra trạng thái thanh toán trong database
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_id', orderId)
      .single()

    if (error) {
      console.error('=== PAYMENT STATUS CHECK: Database error ===', error)
      return NextResponse.json({ 
        status: 'pending',
        message: 'Payment not found or still pending'
      })
    }

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
