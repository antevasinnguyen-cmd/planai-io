import { NextRequest, NextResponse } from 'next/server'
import { supabase, getClientUser } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * API endpoint để xác nhận thanh toán SePay thủ công
 * Được gọi khi user đã chuyển khoản thành công
 * 
 * POST /api/payment/confirm-sepay
 * Body: { orderId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    console.log('=== CONFIRM SEPAY PAYMENT ===', { orderId })

    // Kiểm tra payment trong database
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_id', orderId)
      .single()

    if (error || !payment) {
      console.error('Payment not found:', orderId)
      return NextResponse.json(
        { error: 'Payment not found', status: 'failed' },
        { status: 404 }
      )
    }

    console.log('Found payment:', { 
      id: payment.id, 
      status: payment.status, 
      user_id: payment.user_id,
      subscription_tier: payment.subscription_tier 
    })

    // Nếu đã completed, trả về success
    if (payment.status === 'completed') {
      console.log('Payment already completed')
      return NextResponse.json({
        status: 'completed',
        message: 'Payment already confirmed',
        payment: {
          id: payment.id,
          amount: payment.amount,
          planId: payment.subscription_tier
        }
      })
    }

    // Cập nhật payment status thành completed
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id)

    if (updateError) {
      console.error('Error updating payment:', updateError)
      return NextResponse.json(
        { error: 'Failed to update payment', status: 'failed' },
        { status: 500 }
      )
    }

    // Tính toán ngày kết thúc (30 ngày từ bây giờ)
    const now = new Date()
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Cập nhật hoặc tạo subscription record
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', payment.user_id)
      .eq('status', 'active')
      .single()

    if (existingSub) {
      // Cập nhật subscription hiện tại
      await supabase
        .from('subscriptions')
        .update({
          tier: payment.subscription_tier,
          current_period_end: endDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSub.id)
    } else {
      // Tạo subscription mới
      await supabase
        .from('subscriptions')
        .insert({
          user_id: payment.user_id,
          tier: payment.subscription_tier,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: endDate.toISOString(),
          created_at: now.toISOString()
        })
    }

    // Cập nhật subscription cho user
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        subscription_tier: payment.subscription_tier,
        chat_count: 0,
        plan_count: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.user_id)

    if (profileError) {
      console.error('Error updating profile:', profileError)
      // Không trả về error, vì payment đã cập nhật thành công
    }

    console.log('=== SEPAY PAYMENT CONFIRMED ===', {
      orderId,
      userId: payment.user_id,
      tier: payment.subscription_tier
    })

    return NextResponse.json({
      status: 'completed',
      message: 'Payment confirmed successfully',
      payment: {
        id: payment.id,
        amount: payment.amount,
        planId: payment.subscription_tier
      }
    })
  } catch (error) {
    console.error('Confirm SePay payment error:', error)
    return NextResponse.json(
      { error: 'Internal server error', status: 'failed' },
      { status: 500 }
    )
  }
}
