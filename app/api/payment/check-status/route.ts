import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import axios from 'axios'

// Tắt static optimization vì route này cần đọc searchParams động
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Khởi tạo admin Supabase client để bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

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
      console.error('=== PAYMENT STATUS CHECK: Database error ===', {
        orderId,
        errorCode: error.code,
        errorMessage: error.message
      })
      return NextResponse.json({
        status: 'pending',
        message: 'Database error'
      })
    }

    const payment = payments

    // Log khi payment không tìm thấy
    if (!payment) {
      console.log('=== PAYMENT STATUS CHECK: Payment not found ===', {
        orderId,
        reason: 'No record in database with this transaction_id'
      })
    } else {
      console.log('=== PAYMENT STATUS CHECK: Payment found ===', {
        orderId,
        status: payment.status,
        userId: payment.user_id,
        amount: payment.amount
      })
    }

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
        console.log('=== UPDATING SUBSCRIPTION ON SUCCESS ===', {
          paymentId: paymentRecord.id,
          userId: paymentRecord.user_id,
          tier: paymentRecord.subscription_tier
        })
        
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
        
        // Get subscription limits
        const { getSubscriptionLimits } = await import('@/lib/supabase')
        const limits = getSubscriptionLimits(paymentRecord.subscription_tier)
        console.log('Subscription limits:', limits)

        // Cập nhật hoặc tạo subscription record
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', paymentRecord.user_id)
          .eq('status', 'active')
          .single()

        if (existingSub) {
          // Cập nhật subscription hiện tại - bao gồm limits
          await supabase
            .from('subscriptions')
            .update({
              tier: paymentRecord.subscription_tier,
              plan_limit: limits.plans,
              chat_limit: limits.chats,
              current_period_start: now.toISOString(),
              current_period_end: endDate.toISOString(),
              updated_at: now.toISOString()
            })
            .eq('id', existingSub.id)
          console.log('Subscription updated:', existingSub.id)
        } else {
          // Tạo subscription mới - bao gồm limits
          await supabase
            .from('subscriptions')
            .insert({
              user_id: paymentRecord.user_id,
              tier: paymentRecord.subscription_tier,
              status: 'active',
              plan_limit: limits.plans,
              chat_limit: limits.chats,
              current_period_start: now.toISOString(),
              current_period_end: endDate.toISOString(),
              created_at: now.toISOString()
            })
          console.log('New subscription created for user:', paymentRecord.user_id)
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
        // PayOS API cần orderCode (số nguyên) - lấy từ metadata.payos_order_code hoặc transaction_id
        // KHÔNG dùng payos_payment_id vì cột này không tồn tại trong DB
        const orderCode = payment.metadata?.payos_order_code || payment.transaction_id?.replace(/[^0-9]/g, '').slice(0, 9)
        console.log('=== PAYOS API CHECK ===', {
          orderId,
          orderCode,
          metadata_payos_order_code: payment.metadata?.payos_order_code,
          transaction_id: payment.transaction_id
        })

        const response = await axios.get(
          `${PAYOS_API_URL}/v2/payment-requests/${orderCode}`,
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

    // Nếu provider là SePay, kiểm tra trực tiếp từ SePay API
    // Tự động kiểm tra giao dịch thực tế mà không cần user nhấn nút
    if (provider === 'sepay' && payment) {
      console.log('Checking SePay payment status from SePay API:', { 
        orderId, 
        paymentStatus: payment.status,
        expectedAmount: payment.amount
      })

      // Nếu đã completed, trả về success ngay
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

      // Kiểm tra timeout (30 phút)
      const createdAt = new Date(payment.created_at)
      const now = new Date()
      const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60)

      if (diffMinutes > 30) {
        console.log('SePay payment timeout after 30 minutes')
        // Cập nhật status thành failed
        await supabase
          .from('payments')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.id)

        return NextResponse.json({
          status: 'failed',
          reason: 'Payment timeout - no transaction received within 30 minutes'
        })
      }

      // ===== WEBHOOK XỬ LÝ SEPAY =====
      // SePay webhook sẽ cập nhật payment status khi có giao dịch
      // Không gọi SePay API để tránh lỗi 501
      console.log('=== SEPAY PAYMENT: Waiting for webhook confirmation ===', {
        orderId,
        paymentStatus: payment.status,
        expectedAmount: payment.amount
      })

      return NextResponse.json({
        status: 'pending',
        message: 'Waiting for payment confirmation from SePay webhook',
        source: 'sepay_webhook'
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
