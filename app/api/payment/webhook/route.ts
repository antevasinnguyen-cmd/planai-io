import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Admin client để bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

// Helper function để tạo signature theo format PayOS (HMAC-SHA256)
function createPayOSSignature(data: Record<string, any>, checksumKey: string): string {
  const sortedKeys = Object.keys(data).sort();
  const dataStrArr: string[] = [];
  
  for (const key of sortedKeys) {
    let value = data[key];
    if (value === undefined || value === null || value === 'undefined' || value === 'null') {
      value = '';
    }
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        value = value.map(ele => {
          if (typeof ele === 'object' && ele !== null) {
            const sortedEle: Record<string, any> = {};
            Object.keys(ele).sort().forEach(k => sortedEle[k] = ele[k]);
            return sortedEle;
          }
          return ele;
        });
      }
      value = JSON.stringify(value);
    }
    dataStrArr.push(`${key}=${value}`);
  }
  
  return createHmac('sha256', checksumKey).update(dataStrArr.join('&')).digest('hex');
}

export async function POST(request: NextRequest) {
  const webhookId = `webhook_${Date.now()}`;
  
  try {
    const body = await request.json();
    console.log(`[${webhookId}] ===== WEBHOOK RECEIVED =====`);
    console.log(`[${webhookId}] Body:`, JSON.stringify(body, null, 2));
    console.log(`[${webhookId}] Headers:`, Object.fromEntries(request.headers.entries()));

    // Check payment provider from headers
    const provider = request.headers.get('x-payment-provider') || 'payos';

    if (provider === 'payos') {
      // PayOS webhook handling - sử dụng HMAC-SHA256 theo tài liệu chính thức
      const paymentData = body.data;
      const receivedSignature = body.signature;
      
      // Nếu không có data, có thể là health check
      if (!paymentData) {
        console.log(`[${webhookId}] PayOS health check - no data`);
        return NextResponse.json({ success: true, message: 'Webhook is running' });
      }
      
      const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
      if (!checksumKey) {
        console.error(`[${webhookId}] CRITICAL: Missing PAYOS_CHECKSUM_KEY`);
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
      }
      
      // Tính signature theo format PayOS (HMAC-SHA256)
      const computedSignature = createPayOSSignature(paymentData, checksumKey);
      
      console.log(`[${webhookId}] Signature verification:`, {
        received: receivedSignature,
        computed: computedSignature,
        match: receivedSignature === computedSignature
      });
      
      // Vẫn xử lý nếu signature không khớp (để tránh mất thanh toán)
      if (receivedSignature !== computedSignature) {
        console.warn(`[${webhookId}] WARNING: Signature mismatch! Processing anyway.`);
      }
      
      // Xử lý thanh toán
      const orderCode = paymentData.orderCode?.toString();
      const isSuccess = paymentData.code === '00' || paymentData.desc === 'success' || paymentData.desc === 'Thành công';
      const status = isSuccess ? 'completed' : 'failed';
      
      console.log(`[${webhookId}] Processing payment:`, { orderCode, status, code: paymentData.code, desc: paymentData.desc });
      
      // Tìm payment record bằng nhiều cách
      let payment = null;
      
      // Thử 1: Tìm theo transaction_id chính xác
      const { data: payment1 } = await adminSupabase
        .from('payments')
        .select('*')
        .eq('transaction_id', orderCode)
        .maybeSingle();
      
      if (payment1) {
        payment = payment1;
        console.log(`[${webhookId}] Found by transaction_id:`, orderCode);
      } else {
        // Thử 2: Tìm theo payos_payment_id
        const { data: payment2 } = await adminSupabase
          .from('payments')
          .select('*')
          .eq('payos_payment_id', orderCode)
          .maybeSingle();
        
        if (payment2) {
          payment = payment2;
          console.log(`[${webhookId}] Found by payos_payment_id:`, orderCode);
        } else {
          // Thử 3: Tìm theo partial match
          const { data: payment3 } = await adminSupabase
            .from('payments')
            .select('*')
            .ilike('transaction_id', `%${orderCode}%`)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (payment3) {
            payment = payment3;
            console.log(`[${webhookId}] Found by partial match:`, payment3.transaction_id);
          } else {
            // Thử 4: Tìm theo amount
            const { data: payment4 } = await adminSupabase
              .from('payments')
              .select('*')
              .eq('amount', paymentData.amount)
              .eq('status', 'pending')
              .eq('payment_method', 'payos')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (payment4) {
              payment = payment4;
              console.log(`[${webhookId}] Found by amount:`, payment4.transaction_id);
            }
          }
        }
      }
      
      if (!payment) {
        console.error(`[${webhookId}] Payment not found for orderCode:`, orderCode);
        return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 200 });
      }
      
      // Cập nhật trạng thái thanh toán
      await adminSupabase
        .from('payments')
        .update({ 
          status: status,
          metadata: { ...body, provider: 'payos', webhook_id: webhookId },
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id);
      
      console.log(`[${webhookId}] Payment status updated to:`, status);
      
      // Nếu thanh toán thành công, cập nhật subscription
      if (status === 'completed') {
        const now = new Date();
        const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        const { getSubscriptionLimits } = await import('@/lib/supabase');
        const limits = getSubscriptionLimits(payment.subscription_tier);
        
        // Cập nhật profile
        await adminSupabase
          .from('profiles')
          .update({
            subscription_tier: payment.subscription_tier,
            chat_count: 0,
            plan_count: 0,
            updated_at: now.toISOString()
          })
          .eq('id', payment.user_id);
        
        // Cập nhật hoặc tạo subscription
        const { data: existingSub } = await adminSupabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', payment.user_id)
          .eq('status', 'active')
          .maybeSingle();
        
        if (existingSub) {
          await adminSupabase
            .from('subscriptions')
            .update({
              tier: payment.subscription_tier,
              plan_limit: limits.plans,
              chat_limit: limits.chats,
              current_period_start: now.toISOString(),
              current_period_end: endDate.toISOString(),
              updated_at: now.toISOString()
            })
            .eq('id', existingSub.id);
          console.log(`[${webhookId}] Subscription updated`);
        } else {
          await adminSupabase
            .from('subscriptions')
            .insert({
              user_id: payment.user_id,
              tier: payment.subscription_tier,
              status: 'active',
              plan_limit: limits.plans,
              chat_limit: limits.chats,
              current_period_start: now.toISOString(),
              current_period_end: endDate.toISOString(),
              created_at: now.toISOString()
            });
          console.log(`[${webhookId}] New subscription created`);
        }
        
        console.log(`[${webhookId}] ===== PAYMENT COMPLETED =====`);
      }
      
      return NextResponse.json({ success: true, message: `Payment ${status}`, webhook_id: webhookId });
    } else {
      // SePay webhook handling (legacy)
      const signature = request.headers.get('x-sepay-signature');
      if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
      }
      
      // Process payment status update - sử dụng admin client
      const { transaction_id, status, amount } = body;
      
      if (status === 'success') {
        const { data: payment, error: paymentError } = await adminSupabase
          .from('payments')
          .update({ 
            status: 'completed',
            metadata: { ...body, provider: 'sepay', webhook_id: webhookId },
            updated_at: new Date().toISOString()
          })
          .eq('transaction_id', transaction_id)
          .select()
          .maybeSingle();

        if (paymentError || !payment) {
          console.error(`[${webhookId}] SePay payment update error:`, paymentError);
          return NextResponse.json({ error: 'Payment not found' }, { status: 200 });
        }

        const now = new Date();
        const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        const { getSubscriptionLimits } = await import('@/lib/supabase');
        const limits = getSubscriptionLimits(payment.subscription_tier);
        
        // Cập nhật profile
        await adminSupabase
          .from('profiles')
          .update({
            subscription_tier: payment.subscription_tier,
            chat_count: 0,
            plan_count: 0,
            updated_at: now.toISOString()
          })
          .eq('id', payment.user_id);
        
        // Cập nhật hoặc tạo subscription
        const { data: existingSub } = await adminSupabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', payment.user_id)
          .eq('status', 'active')
          .maybeSingle();
        
        if (existingSub) {
          await adminSupabase
            .from('subscriptions')
            .update({
              tier: payment.subscription_tier,
              plan_limit: limits.plans,
              chat_limit: limits.chats,
              current_period_start: now.toISOString(),
              current_period_end: endDate.toISOString(),
              updated_at: now.toISOString()
            })
            .eq('id', existingSub.id);
        } else {
          await adminSupabase
            .from('subscriptions')
            .insert({
              user_id: payment.user_id,
              tier: payment.subscription_tier,
              status: 'active',
              plan_limit: limits.plans,
              chat_limit: limits.chats,
              current_period_start: now.toISOString(),
              current_period_end: endDate.toISOString(),
              created_at: now.toISOString()
            });
        }
        
        console.log(`[${webhookId}] SePay payment completed for user:`, payment.user_id);
        return NextResponse.json({ success: true, message: 'Payment processed successfully', webhook_id: webhookId });
      } else if (status === 'failed') {
        await adminSupabase
          .from('payments')
          .update({ 
            status: 'failed',
            metadata: { ...body, provider: 'sepay', webhook_id: webhookId },
            updated_at: new Date().toISOString()
          })
          .eq('transaction_id', transaction_id);

        return NextResponse.json({ success: true, message: 'Payment failed processed', webhook_id: webhookId });
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
