import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

/**
 * Endpoint để sync tất cả giao dịch từ SePay API
 * Kiểm tra xem có giao dịch nào chưa được xử lý không
 * 
 * GET /api/webhook/sepay/sync
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const SEPAY_API_URL = process.env.SEPAY_API_URL || 'https://my.sepay.vn/userapi/transactions';
const SEPAY_API_KEY = process.env.SEPAY_API_KEY || process.env.SEPAY_TOKEN || '';

export async function GET(request: NextRequest) {
  try {
    if (!SEPAY_API_KEY) {
      return NextResponse.json(
        { error: 'SEPAY_API_KEY not configured' },
        { status: 500 }
      );
    }

    console.log('=== SYNC WEBHOOK: Fetching transactions from SePay ===', {
      timestamp: new Date().toISOString()
    });

    // Lấy danh sách giao dịch từ SePay API
    const response = await axios.get(
      `${SEPAY_API_URL}?limit=100&offset=0`,
      {
        headers: {
          'Authorization': `Apikey ${SEPAY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const transactions = response.data?.data || [];
    console.log('=== SYNC WEBHOOK: Found transactions ===', {
      count: transactions.length,
      timestamp: new Date().toISOString()
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
      console.error('=== SYNC WEBHOOK: Error fetching payments ===', paymentError);
      return NextResponse.json(
        { error: 'Failed to fetch payments', details: paymentError },
        { status: 500 }
      );
    }

    console.log('=== SYNC WEBHOOK: Found pending payments ===', {
      count: pendingPayments?.length || 0
    });

    // Kiểm tra từng pending payment
    const results = [];
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
        console.log('=== SYNC WEBHOOK: Found matching transaction ===', {
          orderId,
          transactionId: matchedTransaction.id,
          amount: matchedTransaction.transferAmount
        });

        // Cập nhật payment status thành completed
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: 'completed',
            metadata: {
              ...(payment.metadata || {}),
              ...matchedTransaction,
              provider: 'sepay',
              synced_at: new Date().toISOString()
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.id);

        if (updateError) {
          console.error('=== SYNC WEBHOOK: Error updating payment ===', updateError);
          results.push({
            orderId,
            status: 'error',
            message: 'Failed to update payment',
            error: updateError
          });
        } else {
          // Cập nhật subscription
          const now = new Date().toISOString();
          const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

          await supabase
            .from('profiles')
            .update({
              subscription_tier: payment.subscription_tier,
              chat_count: 0,
              plan_count: 0,
              updated_at: now
            })
            .eq('id', payment.user_id);

          results.push({
            orderId,
            status: 'synced',
            message: 'Payment synced and subscription updated',
            amount: matchedTransaction.transferAmount
          });
        }
      } else {
        results.push({
          orderId,
          status: 'not_found',
          message: 'No matching transaction found'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sync completed',
      summary: {
        totalTransactions: transactions.length,
        totalPendingPayments: pendingPayments?.length || 0,
        synced: results.filter(r => r.status === 'synced').length,
        notFound: results.filter(r => r.status === 'not_found').length,
        errors: results.filter(r => r.status === 'error').length
      },
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('=== SYNC WEBHOOK: Error ===', error);
    return NextResponse.json(
      {
        error: 'Failed to sync transactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
