import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Debug endpoint để test webhook SePay
 * Simulates SePay webhook call
 * 
 * POST /api/debug/webhook-test
 * Body: {
 *   "transactionId": "PLAN1234567890",
 *   "amount": 169000,
 *   "userId": "test-user"
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const { transactionId, amount, userId } = await request.json();

    console.log('=== DEBUG WEBHOOK TEST ===', {
      transactionId,
      amount,
      userId,
      timestamp: new Date().toISOString()
    });

    // 1. Kiểm tra xem payment có tồn tại không
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { data: payment, error: findError } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_id', transactionId)
      .single();

    console.log('=== DEBUG: Find payment ===', {
      error: findError ? { code: findError.code, message: findError.message } : null,
      payment: payment ? { id: payment.id, status: payment.status, user_id: payment.user_id } : null
    });

    if (!payment) {
      // 2. Nếu không tìm thấy, tạo payment test
      console.log('=== DEBUG: Payment not found, creating test payment ===');

      const testPaymentData = {
        user_id: userId || 'test-user',
        subscription_tier: 'basic',
        amount: amount || 169000,
        currency: 'VND',
        status: 'pending',
        payment_method: 'sepay',
        transaction_id: transactionId,
        provider: 'sepay'
      };

      const { data: createdPayment, error: createError } = await supabase
        .from('payments')
        .insert([testPaymentData])
        .select();

      console.log('=== DEBUG: Create payment result ===', {
        error: createError ? { code: createError.code, message: createError.message, details: createError.details } : null,
        payment: createdPayment?.[0]
      });

      if (createError) {
        return NextResponse.json({
          success: false,
          error: 'Failed to create test payment',
          details: {
            code: createError.code,
            message: createError.message,
            details: createError.details
          }
        }, { status: 500 });
      }

      // 3. Simulate webhook update
      if (createdPayment && createdPayment[0]) {
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', createdPayment[0].id);

        console.log('=== DEBUG: Update payment result ===', {
          error: updateError ? { code: updateError.code, message: updateError.message } : null
        });

        return NextResponse.json({
          success: true,
          message: 'Test payment created and updated',
          payment: createdPayment[0],
          timestamp: new Date().toISOString()
        });
      }
    } else {
      // 4. Nếu tìm thấy, update status
      console.log('=== DEBUG: Payment found, updating status ===');

      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      console.log('=== DEBUG: Update payment result ===', {
        error: updateError ? { code: updateError.code, message: updateError.message } : null
      });

      return NextResponse.json({
        success: true,
        message: 'Payment updated',
        payment: { id: payment.id, status: 'completed' },
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Unexpected error'
    }, { status: 500 });
  } catch (error) {
    console.error('=== DEBUG: Exception ===', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Debug webhook test endpoint',
    usage: 'POST /api/debug/webhook-test with { transactionId, amount, userId }',
    example: {
      transactionId: 'PLAN1234567890',
      amount: 169000,
      userId: 'test-user'
    }
  });
}
