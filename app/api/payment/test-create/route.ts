import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Test endpoint để tạo payment và kiểm tra xem có được lưu vào database không
 * POST /api/payment/test-create
 * Body: { planId: "basic", amount: 169000, userId: "test-user-id" }
 */

export async function POST(request: NextRequest) {
  try {
    const { planId = 'basic', amount = 169000, userId = 'test-user-id' } = await request.json();

    console.log('=== TEST CREATE PAYMENT ===', {
      planId,
      amount,
      userId,
      timestamp: new Date().toISOString()
    });

    // Tạo transaction ID
    const timestamp = Date.now().toString().slice(-10);
    const transactionId = `PLAN${timestamp}`;

    // Chuẩn bị payment data (không gửi created_at, Supabase sẽ tự động tạo)
    const paymentData = {
      user_id: userId,
      subscription_tier: planId,
      amount: amount,
      currency: 'VND',
      status: 'pending',
      payment_method: 'sepay',
      transaction_id: transactionId,
      provider: 'sepay'
    };

    console.log('=== TEST: Payment data ===', paymentData);

    // Sử dụng admin client
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // Insert payment
    const { data: paymentRecord, error } = await adminSupabase
      .from('payments')
      .insert([paymentData])
      .select();

    console.log('=== TEST: Insert result ===', {
      error: error ? { code: error.code, message: error.message } : null,
      recordCount: paymentRecord?.length || 0,
      record: paymentRecord?.[0]
    });

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Insert failed',
        details: {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        },
        transactionId
      }, { status: 500 });
    }

    // Verify insert by reading back
    const { data: verifyRecord, error: verifyError } = await adminSupabase
      .from('payments')
      .select('*')
      .eq('transaction_id', transactionId)
      .single();

    console.log('=== TEST: Verify read ===', {
      error: verifyError ? { code: verifyError.code, message: verifyError.message } : null,
      record: verifyRecord
    });

    return NextResponse.json({
      success: true,
      message: 'Payment created successfully',
      transactionId,
      inserted: paymentRecord?.[0],
      verified: verifyRecord,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('=== TEST: Exception ===', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test payment creation endpoint',
    usage: 'POST /api/payment/test-create with { planId, amount, userId }',
    example: {
      planId: 'basic',
      amount: 169000,
      userId: 'test-user-id'
    }
  });
}
