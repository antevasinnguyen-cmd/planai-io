import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Webhook received:', body);
    console.log('Headers:', Object.fromEntries(request.headers.entries()));

    // Check payment provider from headers
    const provider = request.headers.get('x-payment-provider') || 'payos';

    if (provider === 'payos') {
      // PayOS webhook handling
      const signature = request.headers.get('x-signature');

      console.log('PayOS signature:', signature);
      console.log('PayOS checksum key exists:', !!process.env.PAYOS_CHECKSUM_KEY);

      if (!signature) {
        console.error('Missing PayOS signature');
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
      }

      // Verify signature
      const dataStr = [
        body.code,
        body.amount,
        body.status
      ].join('|') + `|${process.env.PAYOS_CHECKSUM_KEY}`;

      console.log('Data string for signature:', dataStr);

      const computedSignature = createHash('md5').update(dataStr).digest('hex');

      console.log('Computed signature:', computedSignature);
      console.log('Received signature:', signature);

      if (signature !== computedSignature) {
        console.error('Invalid PayOS signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }

      // Process PayOS payment
      const transaction_id = body.code.toString();
      const status = body.status === 'PAID' ? 'completed' : 'failed';
      
      // Update payment status
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .update({ 
          status: status,
          metadata: { ...body, provider: 'payos' }
        })
        .eq('transaction_id', transaction_id)
        .select()
        .single();
      
      if (paymentError || !payment) {
        console.error('Payment update error:', paymentError);
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }
      
      // If payment successful, update user subscription
      if (status === 'completed') {
        const { error: subscriptionError } = await supabase
          .from('profiles')
          .update({
            subscription_tier: payment.subscription_tier,
            chat_count: 0, // Reset chat count for new subscription
            plan_count: 0, // Reset plan count for new subscription
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.user_id);
        
        if (subscriptionError) {
          console.error('Subscription update error:', subscriptionError);
          return NextResponse.json({ error: 'Subscription update failed' }, { status: 500 });
        }
      }
      
      return NextResponse.json({ success: true, message: `Payment ${status}` });
    } else {
      // SePay webhook handling (legacy)
      const signature = request.headers.get('x-sepay-signature');
      if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
      }
      
      // Process payment status update
      const { transaction_id, status, amount } = body;
      
      if (status === 'success') {
        // Update payment status
        const { data: payment, error: paymentError } = await supabase
          .from('payments')
          .update({ 
            status: 'completed',
            metadata: { ...body, provider: 'sepay' }
          })
          .eq('transaction_id', transaction_id)
          .select()
          .single();

        if (paymentError || !payment) {
          console.error('Payment update error:', paymentError);
          return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        // Update user subscription in profiles table
        const { error: subscriptionError } = await supabase
          .from('profiles')
          .update({
            subscription_tier: payment.subscription_tier,
            chat_count: 0,
            plan_count: 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.user_id);

        if (subscriptionError) {
          console.error('Subscription update error:', subscriptionError);
          return NextResponse.json({ error: 'Subscription update failed' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Payment processed successfully' });
      } else if (status === 'failed') {
        // Update payment status to failed
        await supabase
          .from('payments')
          .update({ 
            status: 'failed',
            metadata: { ...body, provider: 'sepay' }
          })
          .eq('transaction_id', transaction_id);

        return NextResponse.json({ success: true, message: 'Payment failed processed' });
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook received' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' }, 
      { status: 500 }
    );
  }
}

// Hàm GET để xử lý yêu cầu kiểm tra kết nối
export async function GET() {
  // Luôn trả về 200 OK cho tất cả các request GET
  // Để phục vụ việc kiểm tra kết nối từ PayOS
  return NextResponse.json({ 
    success: true,
    message: 'Webhook is running',
    timestamp: new Date().toISOString(),
    note: 'This endpoint is for PayOS health check only'
  });
}

// Thêm hàm OPTIONS để xử lý CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-signature, x-payment-provider',
    },
  });
}
