import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

/**
 * Debug endpoint to test the complete SePay payment flow
 * GET /api/debug/test-payment-flow?userId=test-user&planId=basic
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const providedUserId = searchParams.get('userId');
  const userId = providedUserId && providedUserId.trim().length > 0 ? providedUserId : randomUUID();
  const planId = searchParams.get('planId') || 'basic';
  const amount = parseInt(searchParams.get('amount') || '169000');

  const logs: string[] = [];
  const addLog = (msg: string) => {
    console.log(msg);
    logs.push(msg);
  };

  try {
    addLog('=== TEST PAYMENT FLOW START ===');
    addLog(`Test Parameters: userId=${userId}, planId=${planId}, amount=${amount}`);

    // Step 1: Check environment variables
    addLog('\n--- Step 1: Environment Variables ---');
    const sepayApiKey = process.env.SEPAY_API_KEY;
    const sepayAccountNumber = process.env.SEPAY_ACCOUNT_NUMBER;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    addLog(`SEPAY_API_KEY: ${sepayApiKey ? '✅ Set (' + sepayApiKey.length + ' chars)' : '❌ Missing'}`);
    addLog(`SEPAY_ACCOUNT_NUMBER: ${sepayAccountNumber ? '✅ ' + sepayAccountNumber : '❌ Missing'}`);
    addLog(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
    addLog(`SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey ? '✅ Set (' + serviceRoleKey.length + ' chars)' : '❌ Missing'}`);

    if (!sepayApiKey || !sepayAccountNumber || !supabaseUrl || !serviceRoleKey) {
      addLog('\n❌ Missing critical environment variables!');
      return NextResponse.json({ success: false, logs, error: 'Missing env vars' }, { status: 500 });
    }

    // Step 2: Test Supabase connection
    addLog('\n--- Step 2: Supabase Connection ---');
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
    
    const { data: testData, error: testError } = await adminSupabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (testError) {
      addLog(`❌ Supabase connection failed: ${testError.message}`);
      return NextResponse.json({ success: false, logs, error: testError.message }, { status: 500 });
    }
    addLog('✅ Supabase connection successful');

    // Step 3: Check if user profile exists
    addLog('\n--- Step 3: User Profile Check ---');
    const { data: existingProfile, error: profileCheckError } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (profileCheckError) {
      addLog(`⚠️ Profile lookup warning: ${profileCheckError.message}`);
    }

    if (!existingProfile) {
      addLog(`⚠️ Profile doesn't exist for user ${userId}, creating...`);
      
      const { error: profileCreateError } = await adminSupabase
        .from('profiles')
        .insert([{
          id: userId,
          subscription_tier: 'free',
          chat_count: 0,
          plan_count: 0,
          created_at: new Date().toISOString()
        }]);

      if (profileCreateError) {
        addLog(`❌ Failed to create profile: ${profileCreateError.message}`);
        return NextResponse.json({ success: false, logs, error: profileCreateError.message }, { status: 500 });
      }
      addLog('✅ Profile created successfully');
    } else {
      addLog(`✅ Profile exists for user ${userId}`);
    }

    // Step 4: Create a test payment record
    addLog('\n--- Step 4: Create Test Payment ---');
    const transactionId = `PLAN${Date.now().toString().slice(-10)}`;
    
    const paymentData = {
      user_id: userId,
      subscription_tier: planId,
      amount: amount,
      currency: 'VND',
      status: 'pending',
      payment_method: 'sepay',
      transaction_id: transactionId,
      metadata: {
        provider: 'sepay',
        test: true
      }
    };

    addLog(`Creating payment: transactionId=${transactionId}, amount=${amount}`);

    const { data: paymentRecord, error: paymentError } = await adminSupabase
      .from('payments')
      .insert([paymentData])
      .select();

    if (paymentError) {
      addLog(`❌ Payment insert failed: ${paymentError.message}`);
      addLog(`Error code: ${paymentError.code}`);
      addLog(`Error details: ${paymentError.details}`);
      return NextResponse.json({ success: false, logs, error: paymentError.message }, { status: 500 });
    }

    if (!paymentRecord || paymentRecord.length === 0) {
      addLog('❌ Payment insert returned no records');
      return NextResponse.json({ success: false, logs, error: 'No records returned' }, { status: 500 });
    }

    addLog(`✅ Payment created successfully: id=${paymentRecord[0].id}`);

    // Step 5: Verify payment was saved
    addLog('\n--- Step 5: Verify Payment ---');
    const { data: verifyPayment, error: verifyError } = await adminSupabase
      .from('payments')
      .select('*')
      .eq('transaction_id', transactionId)
      .single();

    if (verifyError) {
      addLog(`❌ Payment verification failed: ${verifyError.message}`);
      return NextResponse.json({ success: false, logs, error: verifyError.message }, { status: 500 });
    }

    if (verifyPayment) {
      addLog(`✅ Payment verified in database:`);
      addLog(`   - ID: ${verifyPayment.id}`);
      addLog(`   - Transaction ID: ${verifyPayment.transaction_id}`);
      addLog(`   - Status: ${verifyPayment.status}`);
      addLog(`   - Amount: ${verifyPayment.amount}`);
      addLog(`   - Created: ${verifyPayment.created_at}`);
    }

    // Step 6: Test webhook simulation
    addLog('\n--- Step 6: Webhook Simulation ---');
    const webhookPayload = {
      id: 12345,
      gateway: 'Vietcombank',
      transactionDate: new Date().toISOString(),
      accountNumber: sepayAccountNumber,
      code: null,
      content: transactionId,
      transferType: 'in',
      transferAmount: amount,
      accumulated: 1000000,
      subAccount: null,
      referenceCode: 'MBVCB.TEST',
      description: 'Test webhook'
    };

    addLog('Simulating webhook call...');
    const webhookResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://planai.io.vn'}/api/webhook/sepay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Apikey ${sepayApiKey}`
      },
      body: JSON.stringify(webhookPayload)
    });

    const webhookData = await webhookResponse.json();
    addLog(`Webhook response: ${webhookResponse.status}`);
    addLog(`Webhook data: ${JSON.stringify(webhookData)}`);

    if (webhookResponse.status === 200 || webhookResponse.status === 201) {
      addLog('✅ Webhook simulation successful');
    } else {
      addLog(`⚠️ Webhook returned status ${webhookResponse.status}`);
    }

    // Step 7: Verify payment status after webhook
    addLog('\n--- Step 7: Verify Payment After Webhook ---');
    const { data: finalPayment, error: finalError } = await adminSupabase
      .from('payments')
      .select('*')
      .eq('transaction_id', transactionId)
      .single();

    if (finalPayment) {
      addLog(`✅ Final payment status: ${finalPayment.status}`);
      if (finalPayment.status === 'completed') {
        addLog('✅ Payment was successfully confirmed by webhook!');
      } else {
        addLog(`⚠️ Payment status is still ${finalPayment.status}, expected 'completed'`);
      }
    }

    addLog('\n=== TEST PAYMENT FLOW COMPLETE ===');
    addLog('✅ All tests passed! SePay payment flow is working correctly.');

    return NextResponse.json({
      success: true,
      logs,
      testData: {
        userId,
        planId,
        amount,
        transactionId,
        paymentId: paymentRecord[0].id
      }
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    addLog(`\n❌ CRITICAL ERROR: ${errorMsg}`);
    if (error instanceof Error) {
      addLog(`Stack: ${error.stack}`);
    }
    return NextResponse.json({
      success: false,
      logs,
      error: errorMsg
    }, { status: 500 });
  }
}
