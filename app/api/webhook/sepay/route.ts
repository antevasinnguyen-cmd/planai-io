import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Khởi tạo Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Hàm xác thực chữ ký webhook
function verifyWebhookSignature(signature: string, payload: any, secret: string): boolean {
  try {
    const hmac = crypto.createHmac('sha256', secret);
    const expectedSignature = hmac.update(JSON.stringify(payload)).digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

// Kiểm tra webhook secret và API key
const sepayToken = process.env.SEPAY_API_KEY || process.env.SEPAY_TOKEN || '';
// SEPAY_WEBHOOK_SECRET không được sử dụng - SePay gửi API Key trong Authorization header
// Nếu cần webhook signature verification, cần cấu hình trong SePay dashboard

console.log('=== SEPAY WEBHOOK: Config check ===', {
  hasToken: !!sepayToken,
  tokenLength: sepayToken.length,
  envVars: Object.keys(process.env).filter(k => k.includes('SEPAY')).join(', ')
});

// Số lần thử lại tối đa khi cập nhật database
const MAX_RETRIES = 3;

// Hàm chờ với thời gian chờ tăng dần
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
  // Log request ban đầu
  const requestClone = request.clone();
  const body = await requestClone.json();
  const headers = Object.fromEntries(request.headers.entries());
  
  console.log('=== SEPAY WEBHOOK: Received ===', {
    headers,
    body,
    timestamp: new Date().toISOString()
  });

  // Xác thực webhook bằng API Key
  // SePay có thể gửi API Key dưới dạng Authorization header hoặc x-api-key header
  const authHeader = headers['authorization'] || headers['x-api-key'] || '';
  const expectedAuth = `Apikey ${sepayToken}`;
  
  // Kiểm tra cả hai format: "Apikey KEY" hoặc chỉ "KEY"
  const isValidAuth = authHeader === expectedAuth || authHeader === sepayToken;
  
  if (!isValidAuth) {
    console.error('=== SEPAY WEBHOOK: Invalid API Key ===', {
      received: authHeader ? 'API Key present but invalid' : 'No API Key',
      expected: 'Apikey API_KEY_CUA_BAN or just API_KEY_CUA_BAN'
    });
    return NextResponse.json({ 
      success: false,
      error: 'Unauthorized - Invalid API Key' 
    }, { status: 401 });
  }
  
  console.log('=== SEPAY WEBHOOK: API Key verified ===');

  try {
    // SePay webhook data format theo docs: https://docs.sepay.vn/tich-hop-webhooks.html
    const {
      id,
      gateway,
      transactionDate,
      accountNumber,
      code,
      content,
      transferType,
      transferAmount,
      accumulated,
      subAccount,
      referenceCode,
      description
    } = body;

    // Lấy order ID từ code hoặc content (nội dung chuyển khoản)
    const orderId = code || content;
    const paymentAmount = transferAmount;

    console.log('=== SEPAY WEBHOOK: Processing ===', {
      id,
      orderId,
      gateway,
      transferType,
      amount: paymentAmount,
      transactionDate,
      timestamp: new Date().toISOString()
    });

    if (!orderId) {
      const errorMsg = 'Missing order ID in webhook payload';
      console.error(`=== SEPAY WEBHOOK: ${errorMsg} ===`, { body });
      return NextResponse.json({ 
        success: false, 
        error: errorMsg 
      }, { status: 400 });
    }

    // Thử tìm payment với retry
    let payment = null;
    let lastError = null;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .eq('transaction_id', orderId)
          .single();

        if (!error && data) {
          payment = data;
          break;
        }
        lastError = error;
        
        if (attempt < MAX_RETRIES) {
          await wait(1000 * attempt); // Tăng thời gian chờ sau mỗi lần thử
        }
      } catch (error) {
        lastError = error;
        console.error(`=== SEPAY WEBHOOK: Payment lookup attempt ${attempt} failed ===`, error);
        if (attempt < MAX_RETRIES) {
          await wait(1000 * attempt);
        }
      }
    }

    if (!payment) {
      const errorMsg = `Payment not found after ${MAX_RETRIES} attempts`;
      console.error(`=== SEPAY WEBHOOK: ${errorMsg} ===`, { 
        orderId, 
        error: lastError 
      });
      
      // Log lỗi vào bảng error_logs nếu có
      try {
        await supabase
          .from('error_logs')
          .insert([{
            type: 'webhook_error',
            message: errorMsg,
            metadata: { 
              orderId,
              error: (lastError as any)?.message || 'Unknown error',
              webhookData: body
            },
            created_at: new Date().toISOString()
          }]);
      } catch (logError) {
        console.error('=== SEPAY WEBHOOK: Failed to log error ===', logError);
      }

      return NextResponse.json({ 
        success: false, 
        error: errorMsg 
      }, { status: 404 });
    }

    // Kiểm tra payment đã completed chưa
    if (payment.status === 'completed') {
      console.log('=== SEPAY WEBHOOK: Already processed ===', { orderId });
      return NextResponse.json({ 
        success: true, 
        message: 'Payment already processed',
        orderId
      });
    }

    // Xác định trạng thái thanh toán
    // Nếu là tiền vào (transferType = 'in') và có số tiền > 0 thì là thành công
    const paymentStatus = transferType === 'in' && paymentAmount > 0 ? 'completed' : 'failed';
    const now = new Date().toISOString();

    // Cập nhật payment status với retry
    let updateSuccess = false;
    let lastUpdateError = null;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: paymentStatus,
            metadata: { 
              ...(payment.metadata || {}),
              ...body, 
              provider: 'sepay',
              updated_at: now,
              webhook_received_at: now
            },
            updated_at: now
          })
          .eq('id', payment.id);

        if (!updateError) {
          updateSuccess = true;
          break;
        }
        
        lastUpdateError = updateError;
        if (attempt < MAX_RETRIES) {
          await wait(1000 * attempt);
        }
      } catch (error) {
        lastUpdateError = error;
        console.error(`=== SEPAY WEBHOOK: Update attempt ${attempt} failed ===`, error);
        if (attempt < MAX_RETRIES) {
          await wait(1000 * attempt);
        }
      }
    }

    if (!updateSuccess) {
      const errorMsg = `Failed to update payment after ${MAX_RETRIES} attempts`;
      console.error(`=== SEPAY WEBHOOK: ${errorMsg} ===`, { 
        orderId, 
        error: lastUpdateError 
      });
      return NextResponse.json({ 
        success: false, 
        error: 'Payment update failed',
        details: (lastUpdateError as any)?.message || 'Unknown error'
      }, { status: 500 });
    }

    // Nếu thanh toán thành công, nâng cấp tài khoản
    if (paymentStatus === 'completed') {
      let upgradeSuccess = false;
      let lastUpgradeError = null;
      
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const { error: subscriptionError } = await supabase
            .from('profiles')
            .update({
              subscription_tier: payment.subscription_tier,
              chat_count: 0,
              plan_count: 0,
              updated_at: now,
              subscription_updated_at: now
            })
            .eq('id', payment.user_id);

          if (!subscriptionError) {
            upgradeSuccess = true;
            break;
          }
          
          lastUpgradeError = subscriptionError;
          if (attempt < MAX_RETRIES) {
            await wait(1000 * attempt);
          }
        } catch (error) {
          lastUpgradeError = error;
          console.error(`=== SEPAY WEBHOOK: Upgrade attempt ${attempt} failed ===`, error);
          if (attempt < MAX_RETRIES) {
            await wait(1000 * attempt);
          }
        }
      }

      if (!upgradeSuccess) {
        console.error('=== SEPAY WEBHOOK: Subscription update failed after retries ===', {
          orderId,
          userId: payment.user_id,
          error: lastUpgradeError
        });
        
        // Gửi thông báo lỗi cho admin
        try {
          await supabase
            .from('admin_notifications')
            .insert([{
              type: 'subscription_upgrade_failed',
              user_id: payment.user_id,
              payment_id: payment.id,
              message: `Failed to upgrade subscription for user ${payment.user_id} after payment ${orderId}`,
              metadata: {
                error: (lastUpgradeError as any)?.message || 'Unknown error',
                payment_status: paymentStatus,
                subscription_tier: payment.subscription_tier
              },
              created_at: now
            }]);
        } catch (notifyError) {
          console.error('=== SEPAY WEBHOOK: Failed to send admin notification ===', notifyError);
        }
        
        // Vẫn trả về thành công cho SePay nhưng ghi log lỗi
        console.error('=== SEPAY WEBHOOK: Subscription update failed (non-blocking) ===', {
          orderId,
          userId: payment.user_id,
          error: lastUpgradeError
        });
      } else {
        console.log('=== SEPAY WEBHOOK: Successfully upgraded subscription ===', {
          orderId,
          userId: payment.user_id,
          tier: payment.subscription_tier,
          timestamp: now
        });
      }
    }

    // Gửi thông báo cho người dùng
    if (paymentStatus === 'completed' && payment.user_id) {
      try {
        await supabase
          .from('notifications')
          .insert([{
            user_id: payment.user_id,
            type: 'payment_success',
            title: 'Thanh toán thành công',
            message: `Bạn đã nâng cấp lên gói ${payment.subscription_tier} thành công`,
            metadata: {
              payment_id: payment.id,
              amount: paymentAmount,
              tier: payment.subscription_tier
            },
            created_at: now
          }]);
      } catch (notifyError) {
        console.error('=== SEPAY WEBHOOK: Failed to send user notification ===', notifyError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Payment ${paymentStatus}`,
      orderId,
      status: paymentStatus,
      timestamp: now
    });

  } catch (error) {
    const errorId = `err_${Date.now()}`;
    console.error(`=== SEPAY WEBHOOK: Unhandled error (${errorId}) ===`, error);
    
    // Log lỗi vào database
    try {
      await supabase
        .from('error_logs')
        .insert([{
          type: 'webhook_unhandled_error',
          error_id: errorId,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          metadata: {
            headers: Object.fromEntries(request.headers.entries()),
            body: body,
            url: request.url
          },
          created_at: new Date().toISOString()
        }]);
    } catch (logError) {
      console.error('=== SEPAY WEBHOOK: Failed to log unhandled error ===', logError);
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      error_id: errorId 
    }, { status: 500 });
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
