import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Full flow test endpoint
 * Tests: 1. Create payment 2. Find payment 3. Update payment 4. Check webhook
 * 
 * POST /api/debug/full-flow-test
 * Body: { userId: "test-user", planId: "basic", amount: 169000 }
 */

export async function POST(request: NextRequest) {
  try {
    const { userId = 'test-user-debug', planId = 'basic', amount = 169000 } = await request.json();

    console.log('=== FULL FLOW TEST START ===', {
      userId,
      planId,
      amount,
      timestamp: new Date().toISOString()
    });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // Step 1: Create transaction ID
    const timestamp = Date.now().toString().slice(-10);
    const transactionId = `PLAN${timestamp}`;
    console.log('Step 1: Generated transaction ID:', transactionId);

    // Step 2: Create payment record
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

    console.log('Step 2: Attempting to insert payment:', paymentData);

    const { data: insertedPayment, error: insertError } = await supabase
      .from('payments')
      .insert([paymentData])
      .select();

    if (insertError) {
      console.error('Step 2 FAILED: Insert error:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
      return NextResponse.json({
        success: false,
        step: 2,
        error: 'Insert failed',
        details: {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details
        }
      }, { status: 500 });
    }

    console.log('Step 2 SUCCESS: Payment inserted:', insertedPayment?.[0]?.id);

    // Step 3: Verify insert by reading back
    const { data: foundPayment, error: findError } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_id', transactionId)
      .single();

    if (findError) {
      console.error('Step 3 FAILED: Find error:', {
        code: findError.code,
        message: findError.message
      });
      return NextResponse.json({
        success: false,
        step: 3,
        error: 'Find failed',
        details: {
          code: findError.code,
          message: findError.message
        }
      }, { status: 500 });
    }

    console.log('Step 3 SUCCESS: Payment found:', foundPayment?.id);

    // Step 4: Simulate webhook update
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', foundPayment.id);

    if (updateError) {
      console.error('Step 4 FAILED: Update error:', {
        code: updateError.code,
        message: updateError.message
      });
      return NextResponse.json({
        success: false,
        step: 4,
        error: 'Update failed',
        details: {
          code: updateError.code,
          message: updateError.message
        }
      }, { status: 500 });
    }

    console.log('Step 4 SUCCESS: Payment updated to completed');

    // Step 5: Verify update
    const { data: updatedPayment, error: verifyError } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_id', transactionId)
      .single();

    if (verifyError) {
      console.error('Step 5 FAILED: Verify error:', {
        code: verifyError.code,
        message: verifyError.message
      });
      return NextResponse.json({
        success: false,
        step: 5,
        error: 'Verify failed',
        details: {
          code: verifyError.code,
          message: verifyError.message
        }
      }, { status: 500 });
    }

    console.log('Step 5 SUCCESS: Payment verified as completed');

    return NextResponse.json({
      success: true,
      message: 'Full flow test completed successfully',
      steps: {
        '1_transaction_id': transactionId,
        '2_insert': { id: insertedPayment?.[0]?.id, status: insertedPayment?.[0]?.status },
        '3_find': { id: foundPayment.id, status: foundPayment.status },
        '4_update': 'completed',
        '5_verify': { id: updatedPayment.id, status: updatedPayment.status }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('=== FULL FLOW TEST EXCEPTION ===', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Full flow test endpoint',
    usage: 'POST /api/debug/full-flow-test with { userId, planId, amount }',
    example: {
      userId: 'test-user-debug',
      planId: 'basic',
      amount: 169000
    },
    description: 'Tests: 1. Create payment 2. Find payment 3. Update payment 4. Verify'
  });
}
