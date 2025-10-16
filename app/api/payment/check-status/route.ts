import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import axios from 'axios'

// Tắt static optimization vì route này cần đọc searchParams động
export const dynamic = 'force-dynamic'
export const revalidate = 0

const PAYOS_API_URL = 'https://api-merchant.payos.vn'
const PAYOS_API_KEY = process.env.PAYOS_API_KEY
const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const orderId = url.searchParams.get('orderId')
    const provider = url.searchParams.get('provider') || 'payos'

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    console.log('=== PAYMENT STATUS CHECK ===', { orderId, provider })

    // Kiểm tra trạng thái thanh toán trong database trước
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_id', orderId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Database error:', error)
      return NextResponse.json({
        status: 'pending',
        message: 'Database error'
      })
    }

    const payment = payments

    // Nếu thanh toán đã hoàn thành trong DB, trả về ngay
    if (payment && payment.status === 'completed') {
      console.log('Payment already completed in DB:', orderId)
      return NextResponse.json({
        status: 'completed',
        payment: {
          id: payment.id,
          amount: payment.amount,
          planId: payment.subscription_tier,
          paymentMethod: payment.payment_method
        }
      })
    }

    // Nếu provider là PayOS, kiểm tra với PayOS API
    if (provider === 'payos' && payment && PAYOS_API_KEY && PAYOS_CLIENT_ID) {
      try {
        const paymentId = payment.payos_payment_id || payment.id
        console.log('Checking PayOS status for payment:', paymentId)

        const response = await axios.get(
          `${PAYOS_API_URL}/v2/payment-requests/${paymentId}`,
          {
            headers: {
              'x-client-id': PAYOS_CLIENT_ID,
              'x-api-key': PAYOS_API_KEY
            }
          }
        )

        if (response.data.code === '00') {
          const payosStatus = response.data.data.status
          console.log('PayOS status:', payosStatus)

          if (payosStatus === 'PAID') {
            // Cập nhật database nếu PayOS báo đã thanh toán
            if (payment && payment.status !== 'completed') {
              console.log('Updating payment status to completed:', { paymentId: payment.id, userId: payment.user_id })
              
              // Cập nhật payment status
              const { error: paymentUpdateError } = await supabase
                .from('payments')
                .update({ 
                  status: 'completed',
                  updated_at: new Date().toISOString()
                })
                .eq('id', payment.id)
              
              if (paymentUpdateError) {
                console.error('Error updating payment status:', paymentUpdateError)
              } else {
                console.log('Payment status updated successfully')
              }

              // Cập nhật subscription cho user
              console.log('Updating user subscription:', {
                userId: payment.user_id,
                tier: payment.subscription_tier,
                amount: payment.amount
              })
              
              const { error: subscriptionError } = await supabase
                .from('profiles')
                .update({
                  subscription_tier: payment.subscription_tier,
                  chat_count: 0,
                  plan_count: 0,
                  updated_at: new Date().toISOString()
                })
                .eq('id', payment.user_id)
              
              if (subscriptionError) {
                console.error('Error updating subscription:', subscriptionError)
              } else {
                console.log('Subscription updated successfully')
              }
            }

            return NextResponse.json({
              status: 'completed',
              source: 'payos',
              payment: {
                id: payment.id,
                amount: payment.amount,
                planId: payment.subscription_tier
              }
            })
          } else if (payosStatus === 'EXPIRED' || payosStatus === 'CANCELLED') {
            // Cập nhật status nếu hết hạn hoặc bị hủy
            await supabase
              .from('payments')
              .update({ 
                status: 'failed',
                updated_at: new Date().toISOString()
              })
              .eq('id', payment.id)

            return NextResponse.json({
              status: 'failed',
              reason: payosStatus === 'EXPIRED' ? 'Payment expired' : 'Payment cancelled',
              source: 'payos'
            })
          }
        }
      } catch (payosError) {
        console.error('PayOS API error:', payosError)
        // Tiếp tục với database check nếu PayOS API lỗi
      }
    }

    // Nếu không tìm thấy payment hoặc chưa có trong DB
    if (!payment) {
      console.log('Payment not found in database:', orderId)
      return NextResponse.json({
        status: 'pending',
        message: 'Payment not found'
      })
    }

    // Trả về status từ database
    return NextResponse.json({
      status: payment.status || 'pending',
      payment: {
        id: payment.id,
        amount: payment.amount,
        planId: payment.subscription_tier,
        paymentMethod: payment.payment_method
      }
    })
  } catch (error) {
    console.error('Payment status check error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      status: 'pending'
    }, { status: 500 })
  }
}
