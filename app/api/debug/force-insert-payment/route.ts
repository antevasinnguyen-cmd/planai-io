import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Force insert payment endpoint - để test xem database có vấn đề không
 * POST /api/debug/force-insert-payment
 * Body: { userId: "test", planId: "basic", amount: 169000 }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId = 'force-test', planId = 'basic', amount = 169000 } = body;

    console.log('=== FORCE INSERT PAYMENT ===', {
      userId,
      planId,
      amount,
      timestamp: new Date().toISOString()
    });

    // Step 1: Check env vars
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('=== ENV CHECK ===', {
      hasUrl: !!supabaseUrl,
      urlLength: supabaseUrl?.length || 0,
      hasKey: !!serviceRoleKey,
      keyLength: serviceRoleKey?.length || 0
    });

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase configuration',
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!serviceRoleKey
        }
      }, { status: 500 });
    }

    // Step 2: Create admin client
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    // Step 3: Generate transaction ID
    const timestamp = Date.now().toString().slice(-10);
    const transactionId = `PLAN${timestamp}`;

    // Step 4: Prepare payment data
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

    console.log('=== PAYMENT DATA ===', paymentData);

    // Step 5: Insert
    const { data, error } = await adminSupabase
      .from('payments')
      .insert([paymentData])
      .select();

    console.log('=== INSERT RESULT ===', {
      error: error ? {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      } : null,
      dataCount: data?.length || 0,
      data: data?.[0]
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
        }
      }, { status: 500 });
    }

    // Step 6: Verify by reading back
    const { data: verified, error: verifyError } = await adminSupabase
      .from('payments')
      .select('*')
      .eq('transaction_id', transactionId)
      .single();

    console.log('=== VERIFY RESULT ===', {
      error: verifyError ? {
        code: verifyError.code,
        message: verifyError.message
      } : null,
      verified: verified ? {
        id: verified.id,
        status: verified.status,
        transaction_id: verified.transaction_id
      } : null
    });

    return NextResponse.json({
      success: true,
      message: 'Payment inserted successfully',
      transactionId,
      inserted: data?.[0],
      verified: verified,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('=== FORCE INSERT ERROR ===', error);
    return NextResponse.json({
      success: false,
      error: 'Force insert failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Force insert payment endpoint',
    usage: 'POST /api/debug/force-insert-payment with { userId, planId, amount }',
    description: 'Tests direct database insert with admin client'
  });
}
