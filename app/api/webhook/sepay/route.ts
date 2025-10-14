import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('=== SEPAY WEBHOOK: Received ===', body);
    console.log('=== SEPAY WEBHOOK: Headers ===', Object.fromEntries(request.headers.entries()));

    // SePay webhook data format
    const {
      transaction_id,
      status,
      amount,
      code,
      transaction_content,
      amount_in
    } = body;

    // Lấy order ID từ code hoặc transaction_content
    const orderId = code || transaction_content || transaction_id;
    const paymentAmount = amount_in || amount;

    console.log('=== SEPAY WEBHOOK: Processing ===', {
      orderId,
      status,
      amount: paymentAmount
    });

    if (!orderId) {
      console.error('=== SEPAY WEBHOOK: Missing order ID ===');
      return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });
    }

    // Tìm payment trong database
    const { data: payment, error: findError } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_id', orderId)
      .single();

    if (findError || !payment) {
      console.error('=== SEPAY WEBHOOK: Payment not found ===', orderId, findError);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Kiểm tra payment đã completed chưa
    if (payment.status === 'completed') {
      console.log('=== SEPAY WEBHOOK: Already processed ===');
      return NextResponse.json({ success: true, message: 'Payment already processed' });
    }

    // Cập nhật payment status
    const paymentStatus = status === 'success' || paymentAmount > 0 ? 'completed' : 'failed';

    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: paymentStatus,
        metadata: { ...body, provider: 'sepay' },
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id);

    if (updateError) {
      console.error('=== SEPAY WEBHOOK: Update failed ===', updateError);
      return NextResponse.json({ error: 'Payment update failed' }, { status: 500 });
    }

    // Nếu thanh toán thành công, nâng cấp tài khoản
    if (paymentStatus === 'completed') {
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
        console.error('=== SEPAY WEBHOOK: Subscription update failed ===', subscriptionError);
        return NextResponse.json({ error: 'Subscription update failed' }, { status: 500 });
      }

      console.log('=== SEPAY WEBHOOK: Success ===', {
        orderId,
        userId: payment.user_id,
        tier: payment.subscription_tier
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Payment ${paymentStatus}` 
    });

  } catch (error) {
    console.error('=== SEPAY WEBHOOK: Error ===', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// GET endpoint cho health check
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'SePay webhook is running',
    timestamp: new Date().toISOString()
  });
}

// OPTIONS cho CORS
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-sepay-signature',
    },
  });
}
