import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    // 1. Get user and tier information
    const { tierId } = await req.json();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;

    // 2. Get tier details from database
    const { data: tier, error: tierError } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('id', tierId)
      .single();

    if (tierError || !tier) {
      console.error('Tier error:', tierError);
      return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 });
    }

    // 3. Create unique order code
    const orderCode = Date.now().toString();
    const amount = tier.price;
    const description = `PlanAI - ${tier.name}`;
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`;

    // 4. Create signature for PayOS
    const dataStr = [
      orderCode,
      amount,
      description,
      cancelUrl,
      returnUrl
    ].join('|') + `|${process.env.PAYOS_CHECKSUM_KEY}`;
    
    const signature = createHash('md5').update(dataStr).digest('hex');

    // 5. Call PayOS API
    const payosResponse = await fetch(process.env.PAYOS_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': process.env.PAYOS_CLIENT_ID!,
        'x-api-key': process.env.PAYOS_API_KEY!,
      },
      body: JSON.stringify({
        orderCode,
        amount,
        description,
        cancelUrl,
        returnUrl,
        signature
      }),
    });

    const paymentData = await payosResponse.json();
    
    if (!paymentData.checkoutUrl) {
      console.error('PayOS error:', paymentData);
      return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
    }

    // 6. Save payment to database
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        subscription_tier: tierId,
        amount,
        currency: 'VND',
        status: 'pending',
        payment_method: 'payos',
        transaction_id: orderCode,
        metadata: paymentData
      });

    if (paymentError) {
      console.error('Payment save error:', paymentError);
      return NextResponse.json({ error: 'Failed to save payment' }, { status: 500 });
    }

    // 7. Return checkout URL
    return NextResponse.json({ 
      success: true,
      paymentUrl: paymentData.checkoutUrl,
      orderId: orderCode
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
