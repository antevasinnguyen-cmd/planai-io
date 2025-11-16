import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import axios from 'axios'

// Tắt static optimization vì route này cần đọc searchParams động
export const dynamic = 'force-dynamic'
export const revalidate = 0

const PAYOS_API_URL = 'https://api-merchant.payos.vn'
const PAYOS_API_KEY = process.env.PAYOS_API_KEY
const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID
const SEPAY_API_URL = process.env.SEPAY_API_URL || 'https://my.sepay.vn/userapi/transactions'
const SEPAY_API_KEY = process.env.SEPAY_API_KEY || process.env.SEPAY_TOKEN || ''

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

    // Hàm chung để cập nhật subscription khi thanh toán thành công
    const updateSubscriptionOnSuccess = async (paymentRecord: any) => {
      if (paymentRecord && paymentRecord.status !== 'completed') {
        // Cập nhật payment status
        await supabase
          .from('payments')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentRecord.id)

        // Tính toán ngày kết thúc (30 ngày từ bây giờ)
        const now = new Date()
        const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

        // Cập nhật hoặc tạo subscription record
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', paymentRecord.user_id)
          .eq('status', 'active')
          .single()

        if (existingSub) {
          // Cập nhật subscription hiện tại
          await supabase
            .from('subscriptions')
            .update({
              tier: paymentRecord.subscription_tier,
              current_period_end: endDate.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', existingSub.id)
        } else {
          // Tạo subscription mới
          await supabase
            .from('subscriptions')
            .insert({
              user_id: paymentRecord.user_id,
              tier: paymentRecord.subscription_tier,
              status: 'active',
              current_period_start: now.toISOString(),
              current_period_end: endDate.toISOString(),
              created_at: now.toISOString()
            })
        }

        // Cập nhật subscription cho user
        await supabase
          .from('profiles')
          .update({
            subscription_tier: paymentRecord.subscription_tier,
            chat_count: 0,
            plan_count: 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentRecord.user_id)
      }
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
            // Cập nhật subscription khi thanh toán thành công
            await updateSubscriptionOnSuccess(payment)

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

    // Nếu provider là SePay, kiểm tra trực tiếp trong database
    // SePay không có webhook tự động, nên phải kiểm tra từ database
    if (provider === 'sepay' && payment) {
      console.log('Checking SePay payment status from database:', { 
        orderId, 
        paymentStatus: payment.status,
        transactionId: payment.transaction_id 
      })

      // Nếu payment đã pending lâu (> 30 phút), kiểm tra xem có giao dịch nào vào tài khoản không
      // Lưu ý: SePay không cung cấp webhook tự động, nên cần kiểm tra thủ công
      // Tạm thời, nếu payment vẫn pending sau 30 phút, coi như thất bại
      const createdAt = new Date(payment.created_at)
      const now = new Date()
      const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60)

      console.log('SePay payment age:', { diffMinutes, createdAt, now })

      // Nếu payment vẫn pending sau 30 phút, coi như thất bại
      if (diffMinutes > 30 && payment.status === 'pending') {
        console.log('SePay payment timeout after 30 minutes')
        return NextResponse.json({
          status: 'pending',
          message: 'Payment still pending. Please check your bank transfer status.'
        })
      }

      // Nếu payment đã completed, trả về success
      if (payment.status === 'completed') {
        return NextResponse.json({
          status: 'completed',
          source: 'sepay',
          payment: {
            id: payment.id,
            amount: payment.amount,
            planId: payment.subscription_tier
          }
        })
      }

      // Vẫn pending, trả về pending
      return NextResponse.json({
        status: 'pending',
        message: 'Waiting for payment confirmation'
      })
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
