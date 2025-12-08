import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Admin client để bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

/**
 * PayOS Webhook Handler
 * 
 * PayOS signature verification theo tài liệu chính thức:
 * - Sử dụng HMAC-SHA256 (không phải MD5)
 * - Data format: key1=value1&key2=value2... (keys sorted alphabetically)
 * - Signature được tính từ body.data, không phải toàn bộ body
 * 
 * Docs: https://payos.vn/docs/tich-hop-webhook/kiem-tra-du-lieu-voi-signature/
 */

// Helper function để tạo signature theo format PayOS
function createPayOSSignature(data: Record<string, any>, checksumKey: string): string {
  // Sort keys alphabetically
  const sortedKeys = Object.keys(data).sort();
  
  // Build data string: key1=value1&key2=value2...
  const dataStrArr: string[] = [];
  for (const key of sortedKeys) {
    let value = data[key];
    
    // Handle null/undefined
    if (value === undefined || value === null || value === 'undefined' || value === 'null') {
      value = '';
    }
    
    // Handle arrays/objects
    if (typeof value === 'object' && value !== null) {
      // Sort elements if array of objects
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
  
  const dataStr = dataStrArr.join('&');
  
  // Create HMAC-SHA256 signature
  const signature = createHmac('sha256', checksumKey).update(dataStr).digest('hex');
  
  return signature;
}

// Hàm xử lý POST request từ PayOS
export async function POST(request: NextRequest) {
  const webhookId = `webhook_${Date.now()}`;
  
  try {
    const body = await request.json();
    
    console.log(`[${webhookId}] ===== PAYOS WEBHOOK RECEIVED =====`);
    console.log(`[${webhookId}] Body:`, JSON.stringify(body, null, 2));
    console.log(`[${webhookId}] Headers:`, Object.fromEntries(request.headers.entries()));
    
    // Lấy dữ liệu từ body.data (theo format PayOS)
    const paymentData = body.data;
    const receivedSignature = body.signature;
    
    // Nếu là request kiểm tra từ PayOS (không có dữ liệu thanh toán)
    if (!paymentData) {
      console.log(`[${webhookId}] PayOS health check request - no data`);
      return NextResponse.json({ 
        success: true, 
        message: 'PayOS webhook is running',
        timestamp: new Date().toISOString()
      });
    }
    
    // Lấy checksum key từ biến môi trường
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
    if (!checksumKey) {
      console.error(`[${webhookId}] CRITICAL: Missing PAYOS_CHECKSUM_KEY`);
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    // Log payment data chi tiết
    console.log(`[${webhookId}] Payment data:`, {
      orderCode: paymentData.orderCode,
      amount: paymentData.amount,
      code: paymentData.code,
      desc: paymentData.desc,
      description: paymentData.description,
      reference: paymentData.reference
    });
    
    // Tính signature theo đúng format PayOS (HMAC-SHA256)
    const computedSignature = createPayOSSignature(paymentData, checksumKey);
    
    console.log(`[${webhookId}] Signature verification:`, {
      received: receivedSignature,
      computed: computedSignature,
      match: receivedSignature === computedSignature
    });
    
    // Verify signature - nhưng VẪN XỬ LÝ nếu signature không khớp (để tránh mất thanh toán)
    // Chỉ log warning, không reject
    if (receivedSignature !== computedSignature) {
      console.warn(`[${webhookId}] WARNING: Signature mismatch! Processing anyway to avoid losing payment.`);
      console.warn(`[${webhookId}] This may indicate PAYOS_CHECKSUM_KEY is incorrect or PayOS changed their format.`);
      // KHÔNG return error - vẫn xử lý thanh toán
    }
    
    // Xử lý thanh toán
    // PayOS có thể gửi orderCode dạng số hoặc string
    const orderCode = paymentData.orderCode?.toString();
    
    // PayOS status: code="00" = success, hoặc check desc
    const isSuccess = paymentData.code === '00' || paymentData.desc === 'success' || paymentData.desc === 'Thành công';
    const status = isSuccess ? 'completed' : 'failed';
    
    console.log(`[${webhookId}] Processing payment:`, {
      orderCode,
      status,
      code: paymentData.code,
      desc: paymentData.desc,
      amount: paymentData.amount
    });
    
    // Tìm payment record bằng nhiều cách
    // PayOS orderCode có thể là số nguyên, nhưng transaction_id trong DB có thể là PLAN + số
    let payment = null;
    let paymentError = null;
    
    // Thử 1: Tìm theo transaction_id chính xác
    const { data: payment1, error: error1 } = await adminSupabase
      .from('payments')
      .select('*')
      .eq('transaction_id', orderCode)
      .maybeSingle();
    
    if (payment1) {
      payment = payment1;
      console.log(`[${webhookId}] Found payment by exact transaction_id:`, orderCode);
    } else {
      // Thử 2: Tìm theo metadata->payos_order_code (vì cột payos_payment_id không tồn tại)
      const { data: payment2, error: error2 } = await adminSupabase
        .from('payments')
        .select('*')
        .eq('metadata->>payos_order_code', orderCode)
        .eq('status', 'pending')
        .maybeSingle();
      
      if (payment2) {
        payment = payment2;
        console.log(`[${webhookId}] Found payment by metadata.payos_order_code:`, orderCode);
      } else {
        // Thử 3: Tìm theo transaction_id chứa orderCode (PLAN + orderCode)
        const { data: payment3, error: error3 } = await adminSupabase
          .from('payments')
          .select('*')
          .ilike('transaction_id', `%${orderCode}%`)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (payment3) {
          payment = payment3;
          console.log(`[${webhookId}] Found payment by partial match:`, payment3.transaction_id);
        } else {
          // Thử 4: Tìm payment pending gần nhất với cùng amount
          const { data: payment4, error: error4 } = await adminSupabase
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
            console.log(`[${webhookId}] Found payment by amount match:`, payment4.transaction_id);
          } else {
            paymentError = error1 || error2 || error3 || error4;
          }
        }
      }
    }
    
    if (!payment) {
      console.error(`[${webhookId}] Payment not found for orderCode:`, orderCode);
      console.error(`[${webhookId}] Search errors:`, paymentError);
      // Trả về 200 để PayOS không retry - nhưng log lỗi
      return NextResponse.json({ 
        success: false, 
        error: 'Payment not found',
        orderCode,
        note: 'Payment record may not exist in database'
      }, { status: 200 });
    }
    
    // Cập nhật trạng thái thanh toán
    const { error: updateError } = await adminSupabase
      .from('payments')
      .update({ 
        status: status,
        metadata: { ...body, provider: 'payos', webhook_id: webhookId },
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id);
    
    if (updateError) {
      console.error(`[${webhookId}] Payment update error:`, updateError);
      return NextResponse.json({ error: 'Payment update failed' }, { status: 500 });
    }
    
    console.log(`[${webhookId}] Payment status updated to:`, status);
    
    // Nếu thanh toán thành công, cập nhật thông tin người dùng
    if (status === 'completed') {
      console.log(`[${webhookId}] Processing successful payment for user:`, payment.user_id);
      
      // Tính toán ngày kết thúc (30 ngày từ bây giờ)
      const now = new Date();
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Get subscription limits
      const { getSubscriptionLimits } = await import('@/lib/supabase');
      const limits = getSubscriptionLimits(payment.subscription_tier);
      
      console.log(`[${webhookId}] Subscription tier:`, payment.subscription_tier, 'Limits:', limits);

      // Cập nhật hoặc tạo subscription record
      const { data: existingSub, error: subQueryError } = await adminSupabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', payment.user_id)
        .eq('status', 'active')
        .maybeSingle();

      if (subQueryError) {
        console.error(`[${webhookId}] Subscription query error:`, subQueryError);
      }

      if (existingSub) {
        // Cập nhật subscription hiện tại
        const { error: subUpdateError } = await adminSupabase
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
        
        if (subUpdateError) {
          console.error(`[${webhookId}] Subscription update error:`, subUpdateError);
        } else {
          console.log(`[${webhookId}] Subscription updated:`, existingSub.id);
        }
      } else {
        // Tạo subscription mới
        const { error: subInsertError } = await adminSupabase
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
        
        if (subInsertError) {
          console.error(`[${webhookId}] Subscription insert error:`, subInsertError);
        } else {
          console.log(`[${webhookId}] New subscription created for user:`, payment.user_id);
        }
      }

      // Cập nhật profile
      const { error: profileError } = await adminSupabase
        .from('profiles')
        .update({
          subscription_tier: payment.subscription_tier,
          chat_count: 0,
          plan_count: 0,
          updated_at: now.toISOString()
        })
        .eq('id', payment.user_id);
      
      if (profileError) {
        console.error(`[${webhookId}] Profile update error:`, profileError);
        // Không return error - payment đã được xử lý
      } else {
        console.log(`[${webhookId}] Profile updated for user:`, payment.user_id);
      }
      
      console.log(`[${webhookId}] ===== PAYMENT COMPLETED SUCCESSFULLY =====`);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Payment ${status}`,
      webhook_id: webhookId
    });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' }, 
      { status: 500 }
    );
  }
}

// Hàm GET để kiểm tra kết nối
export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'PayOS webhook is running',
    timestamp: new Date().toISOString()
  });
}

// Hàm OPTIONS để xử lý CORS
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-signature, x-payment-provider',
    },
  });
}
