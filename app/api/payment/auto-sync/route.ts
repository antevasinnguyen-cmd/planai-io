import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

/**
 * Auto-sync endpoint để tự động hoàn thiện thanh toán
 * Chạy mỗi khi có request hoặc theo schedule
 * 
 * GET /api/payment/auto-sync
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const SEPAY_API_URL = process.env.SEPAY_API_URL || 'https://my.sepay.vn/userapi/transactions';
const SEPAY_API_KEY = process.env.SEPAY_API_KEY || process.env.SEPAY_TOKEN || '';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

async function syncSePay() {
  try {
    if (!SEPAY_API_KEY) {
      console.log('=== AUTO-SYNC: SEPAY_API_KEY not configured ===');
      return { success: false, error: 'SEPAY_API_KEY not configured', synced: 0 };
    }

    console.log('=== AUTO-SYNC: Starting SePay sync ===', {
      timestamp: new Date().toISOString()
    });

    // Lấy danh sách giao dịch từ SePay API
    const response = await axios.get(
      `${SEPAY_API_URL}?limit=100&offset=0`,
      {
        headers: {
          'Authorization': `Apikey ${SEPAY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const transactions = response.data?.data || [];
    console.log('=== AUTO-SYNC: Found transactions ===', {
      count: transactions.length
    });

    // Lấy danh sách pending payments từ database
    const { data: pendingPayments, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('provider', 'sepay')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(50);

    if (paymentError) {
      console.error('=== AUTO-SYNC: Error fetching payments ===', paymentError);
      return { success: false, error: 'Failed to fetch payments', synced: 0 };
    }

    console.log('=== AUTO-SYNC: Found pending payments ===', {
      count: pendingPayments?.length || 0
    });

    let syncedCount = 0;
    const syncResults = [];

    // Kiểm tra từng pending payment
    for (const payment of pendingPayments || []) {
      const orderId = payment.transaction_id;
      
      // Tìm giao dịch trùng khớp
      const matchedTransaction = transactions.find((tx: any) => {
        const contentMatch = (tx.content || tx.code || '').includes(orderId);
        const typeMatch = tx.transferType === 'in';
        const amountMatch = tx.transferAmount >= payment.amount;
        return contentMatch && typeMatch && amountMatch;
      });

      if (matchedTransaction) {
        console.log('=== AUTO-SYNC: Found matching transaction ===', {
          orderId,
          transactionId: matchedTransaction.id,
          amount: matchedTransaction.transferAmount,
          requiredAmount: payment.amount
        });

        try {
          const now = new Date().toISOString();
          const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

          // 1. Cập nhật payment status thành completed
          const { error: updatePaymentError } = await supabase
            .from('payments')
            .update({
              status: 'completed',
              metadata: {
                ...(payment.metadata || {}),
                ...matchedTransaction,
                provider: 'sepay',
                auto_synced_at: now
              },
              updated_at: now
            })
            .eq('id', payment.id);

          if (updatePaymentError) {
            console.error('=== AUTO-SYNC: Error updating payment ===', updatePaymentError);
            syncResults.push({
              orderId,
              status: 'error',
              message: 'Failed to update payment'
            });
            continue;
          }

          // 2. Cập nhật hoặc tạo subscription
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

          // 3. Cập nhật profile
          const { error: updateProfileError } = await supabase
            .from('profiles')
            .update({
              subscription_tier: payment.subscription_tier,
              chat_count: 0,
              plan_count: 0,
              updated_at: now
            })
            .eq('id', payment.user_id);

          if (updateProfileError) {
            console.error('=== AUTO-SYNC: Error updating profile ===', updateProfileError);
          }

          // 4. Tạo notification cho user
          await supabase
            .from('notifications')
            .insert({
              user_id: payment.user_id,
              type: 'payment_success',
              title: 'Thanh toán thành công',
              message: `Bạn đã nâng cấp lên gói ${payment.subscription_tier} thành công`,
              metadata: {
                payment_id: payment.id,
                amount: matchedTransaction.transferAmount,
                tier: payment.subscription_tier
              },
              created_at: now
            });

          syncedCount++;
          syncResults.push({
            orderId,
            status: 'synced',
            message: 'Payment completed and subscription updated',
            amount: matchedTransaction.transferAmount
          });

          console.log('=== AUTO-SYNC: Successfully synced payment ===', {
            orderId,
            userId: payment.user_id,
            tier: payment.subscription_tier
          });
        } catch (error) {
          console.error('=== AUTO-SYNC: Error processing payment ===', error);
          syncResults.push({
            orderId,
            status: 'error',
            message: 'Error processing payment'
          });
        }
      }
    }

    console.log('=== AUTO-SYNC: Completed ===', {
      totalPending: pendingPayments?.length || 0,
      synced: syncedCount,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Auto-sync completed',
      synced: syncedCount,
      total: pendingPayments?.length || 0,
      results: syncResults
    };
  } catch (error) {
    console.error('=== AUTO-SYNC: Error ===', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      synced: 0
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const result = await syncSePay();
    return NextResponse.json(result);
  } catch (error) {
    console.error('=== AUTO-SYNC: Unhandled error ===', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run auto-sync',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Cũng hỗ trợ POST để dễ trigger từ webhook hoặc cron job
  try {
    const result = await syncSePay();
    return NextResponse.json(result);
  } catch (error) {
    console.error('=== AUTO-SYNC: Unhandled error ===', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run auto-sync',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
