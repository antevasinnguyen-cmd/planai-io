import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Manual confirm endpoint - user nhấn nút "Xác nhận thanh toán đã chuyển khoản"
 * Kiểm tra xem payment đã được webhook xử lý chưa
 * Nếu chưa, cho phép user trigger lại
 * 
 * POST /api/payment/manual-confirm
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const { orderId, userId } = await request.json();

    if (!orderId || !userId) {
      return NextResponse.json(
        { error: 'Missing orderId or userId' },
        { status: 400 }
      );
    }

    console.log('=== MANUAL-CONFIRM: Received request ===', {
      orderId,
      userId,
      timestamp: new Date().toISOString()
    });

    // Tìm payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_id', orderId)
      .eq('user_id', userId)
      .single();

    if (paymentError || !payment) {
      console.error('=== MANUAL-CONFIRM: Payment not found ===', {
        orderId,
        userId,
        error: paymentError
      });
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    console.log('=== MANUAL-CONFIRM: Found payment ===', {
      orderId,
      status: payment.status,
      amount: payment.amount
    });

    // Nếu đã completed, trả về success
    if (payment.status === 'completed') {
      console.log('=== MANUAL-CONFIRM: Payment already completed ===', { orderId });
      return NextResponse.json({
        success: true,
        message: 'Payment already completed',
        status: 'completed',
        orderId
      });
    }

    // Nếu đang processing, chờ
    if (payment.status === 'processing') {
      console.log('=== MANUAL-CONFIRM: Payment is processing ===', { orderId });
      return NextResponse.json({
        success: false,
        message: 'Payment is being processed, please wait',
        status: 'processing',
        orderId
      }, { status: 429 });
    }

    // Nếu pending, cập nhật thành completed (user xác nhận đã chuyển khoản)
    if (payment.status === 'pending') {
      const now = new Date().toISOString();
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      try {
        // 1. Cập nhật payment status
        const { error: updatePaymentError } = await supabase
          .from('payments')
          .update({
            status: 'completed',
            metadata: {
              ...(payment.metadata || {}),
              manual_confirmed_at: now,
              manual_confirmed_by: userId
            },
            updated_at: now
          })
          .eq('id', payment.id);

        if (updatePaymentError) {
          throw updatePaymentError;
        }

        // 2. Cập nhật profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            subscription_tier: payment.subscription_tier,
            chat_count: 0,
            plan_count: 0,
            updated_at: now,
            subscription_updated_at: now
          })
          .eq('id', payment.user_id);

        if (profileError) {
          console.error('=== MANUAL-CONFIRM: Profile update error ===', profileError);
        }

        // 3. Tạo hoặc cập nhật subscription
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', payment.user_id)
          .eq('status', 'active')
          .single();

        if (existingSub) {
          await supabase
            .from('subscriptions')
            .update({
              tier: payment.subscription_tier,
              current_period_end: endDate,
              updated_at: now
            })
            .eq('id', existingSub.id);
        } else {
          await supabase
            .from('subscriptions')
            .insert({
              user_id: payment.user_id,
              tier: payment.subscription_tier,
              status: 'active',
              current_period_start: now,
              current_period_end: endDate,
              created_at: now
            });
        }

        // 4. Gửi notification
        await supabase
          .from('notifications')
          .insert({
            user_id: payment.user_id,
            type: 'payment_success',
            title: 'Thanh toán thành công',
            message: `Bạn đã nâng cấp lên gói ${payment.subscription_tier} thành công`,
            metadata: {
              payment_id: payment.id,
              amount: payment.amount,
              tier: payment.subscription_tier
            },
            created_at: now
          });

        console.log('=== MANUAL-CONFIRM: Successfully completed payment ===', {
          orderId,
          userId,
          tier: payment.subscription_tier
        });

        return NextResponse.json({
          success: true,
          message: 'Payment confirmed successfully',
          status: 'completed',
          orderId,
          tier: payment.subscription_tier
        });
      } catch (error) {
        console.error('=== MANUAL-CONFIRM: Error updating payment ===', error);
        return NextResponse.json(
          {
            error: 'Failed to confirm payment',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }

    // Nếu status khác (failed, cancelled), không thể xác nhận
    return NextResponse.json(
      {
        error: `Cannot confirm payment with status: ${payment.status}`,
        status: payment.status
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('=== MANUAL-CONFIRM: Unhandled error ===', error);
    return NextResponse.json(
      {
        error: 'Failed to confirm payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
