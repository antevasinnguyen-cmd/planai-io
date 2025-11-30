import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import axios from 'axios'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const SEPAY_API_URL = process.env.SEPAY_API_URL || 'https://my.sepay.vn/userapi/transactions'
const SEPAY_API_KEY = process.env.SEPAY_API_KEY || process.env.SEPAY_TOKEN || ''
const SEPAY_ACCOUNT_NUMBER = process.env.SEPAY_ACCOUNT_NUMBER || 'VQRQAFKCR5422'

/**
 * API endpoint để xác nhận thanh toán SePay thủ công
 * Được gọi khi user đã chuyển khoản thành công
 * 
 * POST /api/payment/confirm-sepay
 * Body: { orderId: string }
 * 
 * Bảo vệ chống lạm dụng:
 * 1. Kiểm tra giao dịch thực tế từ SePay API
 * 2. Xác thực số tiền và nội dung chuyển khoản
 * 3. Idempotency - chỉ xử lý 1 lần
 * 4. Rate limiting per user
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
      subscription_tier: payment.subscription_tier,
      amount: payment.amount
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

    // Nếu đang processing, trả về error để tránh xử lý 2 lần
    if (payment.status === 'processing') {
      console.log('Payment is already being processed')
      return NextResponse.json(
        { error: 'Payment is being processed, please wait', status: 'processing' },
        { status: 409 }
      )
    }

    // ===== LỚAP BẢO VỆ 1: Xác thực giao dịch thực tế từ SePay =====
    // Kiểm tra xem có giao dịch thực từ SePay API hay không
    let transactionVerified = false
    let verificationError = null

    if (SEPAY_API_KEY && SEPAY_ACCOUNT_NUMBER) {
      try {
        console.log('=== VERIFY TRANSACTION WITH SEPAY API ===', {
          orderId,
          accountNumber: SEPAY_ACCOUNT_NUMBER,
          expectedAmount: payment.amount
        })

        // Gọi SePay API để lấy danh sách giao dịch
        const response = await axios.get(
          `${SEPAY_API_URL}?limit=100&offset=0`,
          {
            headers: {
              'Authorization': `Apikey ${SEPAY_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        )

        console.log('SePay API response:', {
          statusCode: response.status,
          transactionCount: response.data?.data?.length || 0
        })

        // Tìm giao dịch trùng khớp
        const transactions = response.data?.data || []
        const matchedTransaction = transactions.find((tx: any) => {
          // Kiểm tra:
          // 1. Nội dung chuyển khoản chứa orderId
          // 2. Số tiền trùng khớp
          // 3. Loại giao dịch là "in" (tiền vào)
          const contentMatch = (tx.content || tx.code || '').includes(orderId)
          const amountMatch = tx.transferAmount === payment.amount
          const typeMatch = tx.transferType === 'in'

          return contentMatch && amountMatch && typeMatch
        })

        if (matchedTransaction) {
          console.log('=== TRANSACTION VERIFIED ===', {
            orderId,
            transactionId: matchedTransaction.id,
            amount: matchedTransaction.transferAmount,
            content: matchedTransaction.content
          })
          transactionVerified = true
        } else {
          verificationError = 'No matching transaction found in SePay'
          console.warn('=== TRANSACTION NOT FOUND ===', {
            orderId,
            expectedAmount: payment.amount,
            foundTransactions: transactions.length
          })
        }
      } catch (apiError) {
        verificationError = apiError instanceof Error ? apiError.message : 'SePay API error'
        console.error('=== SEPAY API ERROR ===', {
          orderId,
          error: verificationError
        })
      }
    } else {
      console.warn('=== SEPAY API NOT CONFIGURED ===', {
        hasApiKey: !!SEPAY_API_KEY,
        hasAccountNumber: !!SEPAY_ACCOUNT_NUMBER
      })
    }

    // Nếu không thể xác thực với SePay API, từ chối xác nhận
    if (!transactionVerified) {
      console.error('=== PAYMENT VERIFICATION FAILED ===', {
        orderId,
        reason: verificationError || 'SePay API not configured'
      })
      return NextResponse.json(
        {
          error: 'Cannot verify transaction with SePay',
          details: verificationError || 'SePay API not configured',
          status: 'verification_failed'
        },
        { status: 403 }
      )
    }

    // ===== LỚAP BẢO VỆ 2: Idempotency - Đặt status thành "processing" trước =====
    // Cập nhật payment status thành "processing" để tránh xử lý 2 lần
    const { error: processingError } = await supabase
      .from('payments')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id)
      .eq('status', 'pending') // Chỉ update nếu vẫn pending

    if (processingError) {
      console.error('Error setting payment to processing:', processingError)
      return NextResponse.json(
        { error: 'Failed to process payment', status: 'failed' },
        { status: 500 }
      )
    }

    // ===== LỚAP BẢO VỆ 3: Rate limiting per user =====
    // Kiểm tra xem user đã xác nhận bao nhiêu lần trong 1 giờ
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: recentConfirmations, error: rateCheckError } = await supabase
      .from('payments')
      .select('id')
      .eq('user_id', payment.user_id)
      .eq('status', 'completed')
      .gte('updated_at', oneHourAgo)

    if (!rateCheckError && recentConfirmations && recentConfirmations.length > 10) {
      console.warn('=== RATE LIMIT EXCEEDED ===', {
        userId: payment.user_id,
        confirmationsInLastHour: recentConfirmations.length
      })
      
      // Revert status back to pending
      await supabase
        .from('payments')
        .update({ status: 'pending', updated_at: new Date().toISOString() })
        .eq('id', payment.id)

      return NextResponse.json(
        { error: 'Too many confirmations, please try again later', status: 'rate_limited' },
        { status: 429 }
      )
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

    // Get current profile to check existing tier (moved up for logic)
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('subscription_tier, chat_count, plan_count')
      .eq('id', payment.user_id)
      .single()

    const currentTier = currentProfile?.subscription_tier || 'free'
    const newTier = payment.subscription_tier
    const isPaidToPaid = currentTier !== 'free' && newTier !== 'free'

    // Cập nhật hoặc tạo subscription record với logic cộng dồn limits
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id, tier, plan_limit, chat_limit')
      .eq('user_id', payment.user_id)
      .eq('status', 'active')
      .single()

    // Get limits for new tier
    const { getSubscriptionLimits } = await import('@/lib/supabase')
    const newTierLimits = getSubscriptionLimits(payment.subscription_tier)
    
    let finalLimits = {
      plan_limit: newTierLimits.plans,
      chat_limit: newTierLimits.chats
    }
    
    if (existingSub && isPaidToPaid) {
      // Paid -> Paid: Accumulate limits
      const currentLimits = {
        plans: existingSub.plan_limit || getSubscriptionLimits(existingSub.tier || 'free').plans,
        chats: existingSub.chat_limit || getSubscriptionLimits(existingSub.tier || 'free').chats
      }
      
      finalLimits = {
        plan_limit: currentLimits.plans + newTierLimits.plans,
        chat_limit: currentLimits.chats + newTierLimits.chats
      }
      
      console.log('=== CONFIRM SEPAY: Accumulating limits ===', {
        userId: payment.user_id,
        currentLimits,
        newTierLimits,
        finalLimits
      })
    }

    if (existingSub) {
      // Cập nhật subscription hiện tại
      const { error: subUpdateError } = await supabase
        .from('subscriptions')
        .update({
          tier: payment.subscription_tier,
          plan_limit: finalLimits.plan_limit,
          chat_limit: finalLimits.chat_limit,
          current_period_end: endDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSub.id)
      
      if (subUpdateError) {
        console.error('=== CONFIRM SEPAY: Error updating subscription ===', subUpdateError)
      }
    } else {
      // Tạo subscription mới
      const { error: subInsertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: payment.user_id,
          tier: payment.subscription_tier,
          status: 'active',
          plan_limit: finalLimits.plan_limit,
          chat_limit: finalLimits.chat_limit,
          current_period_start: now.toISOString(),
          current_period_end: endDate.toISOString(),
          created_at: now.toISOString()
        })
      
      if (subInsertError) {
        console.error('=== CONFIRM SEPAY: Error creating subscription ===', subInsertError)
      }
    }

    // Determine if this is Free->Paid (reset) or Paid->Paid (accumulate)
    const isFreeToPaid = currentTier === 'free' && newTier !== 'free'
    
    let updateData: any = {
      subscription_tier: newTier,
      updated_at: new Date().toISOString()
    }
    
    if (isFreeToPaid) {
      // Free -> Paid: Reset usage to 0
      updateData.chat_count = 0
      updateData.plan_count = 0
      console.log('=== CONFIRM SEPAY: Free->Paid upgrade, resetting usage ===', {
        userId: payment.user_id,
        from: currentTier,
        to: newTier
      })
    } else if (isPaidToPaid) {
      // Paid -> Paid: Keep current usage, limits will be accumulated
      console.log('=== CONFIRM SEPAY: Paid->Paid upgrade, keeping usage ===', {
        userId: payment.user_id,
        from: currentTier,
        to: newTier,
        currentUsage: { chats: currentProfile?.chat_count, plans: currentProfile?.plan_count }
      })
    } else {
      // Other cases (e.g., same tier): reset to be safe
      updateData.chat_count = 0
      updateData.plan_count = 0
    }

    // Cập nhật subscription cho user
    const { error: profileError } = await supabase
      .from('profiles')
      .update(updateData)
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
