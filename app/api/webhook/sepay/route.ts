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
  console.log('=== SEPAY WEBHOOK: POST request received ===', {
    timestamp: new Date().toISOString(),
    url: request.url
  });
  
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
  // SePay gửi API Key trong Authorization header (format: "Apikey YOUR_API_KEY")
  const authHeader = headers['authorization'] || headers['x-api-key'] || '';
  
  console.log('=== SEPAY WEBHOOK: Auth check ===', {
    hasAuth: !!authHeader,
    authHeaderLength: authHeader.length,
    authHeaderStart: authHeader.substring(0, 20),
    expectedTokenLength: sepayToken.length,
    expectedTokenStart: sepayToken.substring(0, 20)
  });
  
  // Kiểm tra API Key - hỗ trợ nhiều format
  let isValidAuth = false;
  
  if (authHeader) {
    // Format 1: "Apikey YOUR_API_KEY"
    if (authHeader.toLowerCase().startsWith('apikey ')) {
      const providedKey = authHeader.substring(7).trim();
      isValidAuth = providedKey === sepayToken;
    }
    // Format 2: "Bearer YOUR_API_KEY"
    else if (authHeader.toLowerCase().startsWith('bearer ')) {
      const providedKey = authHeader.substring(7).trim();
      isValidAuth = providedKey === sepayToken;
    }
    // Format 3: Chỉ API Key
    else {
      isValidAuth = authHeader === sepayToken;
    }
  }
  
  if (!isValidAuth) {
    console.error('=== SEPAY WEBHOOK: Invalid API Key ===', {
      received: authHeader ? `${authHeader.substring(0, 30)}...` : 'No API Key',
      expected: `Apikey ${sepayToken.substring(0, 30)}...`
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
    
    console.log('=== SEPAY WEBHOOK: Looking for payment ===', {
      orderId,
      searchingFor: 'transaction_id = ' + orderId
    });
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .eq('transaction_id', orderId)
          .single();

        if (!error && data) {
          payment = data;
          console.log('=== SEPAY WEBHOOK: Payment found ===', {
            paymentId: data.id,
            userId: data.user_id,
            status: data.status,
            subscriptionTier: data.subscription_tier,
            amount: data.amount,
            transactionId: data.transaction_id,
            matchesOrderId: data.transaction_id === orderId
          });
          break;
        }
        
        if (error) {
          console.log(`=== SEPAY WEBHOOK: Payment lookup attempt ${attempt} - no match ===`, {
            orderId,
            error: error.message,
            code: error.code
          });
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
      console.error(`=== SEPAY WEBHOOK: CRITICAL - Payment not found in database ===`, { 
        orderId,
        reason: 'Transaction ID does not match any payment in database',
        hint: 'User may have entered wrong transfer content or payment was not created via /api/payment/create',
        timestamp: new Date().toISOString()
      });
      
      // Return success to acknowledge webhook, but don't create payment
      // The payment must be created via /api/payment/create endpoint first
      return NextResponse.json({ 
        success: true,
        message: 'Webhook received but payment not found in database',
        orderId,
        note: 'Payment must be created via /api/payment/create before webhook processing',
        timestamp: new Date().toISOString()
      }, { status: 200 });
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
          // 1. Get current profile to check existing tier
          const { data: currentProfile } = await supabase
            .from('profiles')
            .select('subscription_tier, chat_count, plan_count')
            .eq('id', payment.user_id)
            .single();

          const currentTier = currentProfile?.subscription_tier || 'free';
          const newTier = payment.subscription_tier;
          
          // Determine if this is Free->Paid (reset) or Paid->Paid (accumulate)
          const isFreeToPaid = currentTier === 'free' && newTier !== 'free';
          const isPaidToPaid = currentTier !== 'free' && newTier !== 'free';
          
          let updateData: any = {
            subscription_tier: newTier,
            updated_at: now
          };
          
          if (isFreeToPaid) {
            // Free -> Paid: Reset usage to 0
            updateData.chat_count = 0;
            updateData.plan_count = 0;
            console.log('=== SEPAY WEBHOOK: Free->Paid upgrade, resetting usage ===', {
              userId: payment.user_id,
              from: currentTier,
              to: newTier
            });
          } else if (isPaidToPaid) {
            // Paid -> Paid: Keep current usage, limits will be accumulated
            console.log('=== SEPAY WEBHOOK: Paid->Paid upgrade, keeping usage ===', {
              userId: payment.user_id,
              from: currentTier,
              to: newTier,
              currentUsage: { chats: currentProfile?.chat_count, plans: currentProfile?.plan_count }
            });
          } else {
            // Other cases (e.g., same tier): reset to be safe
            updateData.chat_count = 0;
            updateData.plan_count = 0;
          }
          
          console.log('=== SEPAY WEBHOOK: Updating profiles table ===', {
            userId: payment.user_id,
            updateData,
            attempt
          });

          const { error: profileError } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', payment.user_id);

          if (profileError) {
            console.error('=== SEPAY WEBHOOK: Error updating profiles ===', {
              userId: payment.user_id,
              error: profileError,
              attempt
            });
            lastUpgradeError = profileError;
            if (attempt < MAX_RETRIES) {
              await wait(1000 * attempt);
            }
            continue;
          }
          
          console.log('=== SEPAY WEBHOOK: Successfully updated profiles ===', {
            userId: payment.user_id,
            tier: updateData.subscription_tier,
            chatCount: updateData.chat_count,
            planCount: updateData.plan_count
          });

          // 2. Tạo hoặc cập nhật subscription với logic cộng dồn limits
          const { data: existingSub } = await supabase
            .from('subscriptions')
            .select('id, tier, plan_limit, chat_limit')
            .eq('user_id', payment.user_id)
            .eq('status', 'active')
            .single();

          // Get limits for new tier
          const { getSubscriptionLimits } = await import('@/lib/supabase');
          const newTierLimits = getSubscriptionLimits(payment.subscription_tier);
          
          let finalLimits = {
            plan_limit: newTierLimits.plans,
            chat_limit: newTierLimits.chats
          };
          
          if (existingSub && isPaidToPaid) {
            // Paid -> Paid: Accumulate limits
            const currentLimits = {
              plans: existingSub.plan_limit || getSubscriptionLimits(existingSub.tier || 'free').plans,
              chats: existingSub.chat_limit || getSubscriptionLimits(existingSub.tier || 'free').chats
            };
            
            finalLimits = {
              plan_limit: currentLimits.plans + newTierLimits.plans,
              chat_limit: currentLimits.chats + newTierLimits.chats
            };
            
            console.log('=== SEPAY WEBHOOK: Accumulating limits ===', {
              userId: payment.user_id,
              currentLimits,
              newTierLimits,
              finalLimits
            });
          }

          // Calculate period end (30 days from now)
          const endDate = new Date(now);
          endDate.setDate(endDate.getDate() + 30);
          
          if (existingSub) {
            // Prepare update data
            const subUpdateData: any = {
              tier: payment.subscription_tier,
              plan_limit: finalLimits.plan_limit,
              chat_limit: finalLimits.chat_limit,
              current_period_end: endDate.toISOString(),
              updated_at: now
            };
            
            // If Free->Paid upgrade, reset current_period_start to now
            if (isFreeToPaid) {
              subUpdateData.current_period_start = now;
              console.log('=== SEPAY WEBHOOK: Resetting current_period_start for Free->Paid ===', {
                userId: payment.user_id,
                newPeriodStart: now
              });
            }
            
            const { error: subUpdateError } = await supabase
              .from('subscriptions')
              .update(subUpdateData)
              .eq('id', existingSub.id);
            
            if (subUpdateError) {
              console.error('=== SEPAY WEBHOOK: Error updating subscription ===', subUpdateError);
              lastUpgradeError = subUpdateError;
              if (attempt < MAX_RETRIES) {
                await wait(1000 * attempt);
              }
              continue;
            }
            console.log('=== SEPAY WEBHOOK: Successfully updated subscription ===', {
              userId: payment.user_id,
              tier: payment.subscription_tier,
              planLimit: finalLimits.plan_limit,
              chatLimit: finalLimits.chat_limit
            });
          } else {
            const { error: subInsertError, data: insertedSub } = await supabase
              .from('subscriptions')
              .insert({
                user_id: payment.user_id,
                tier: payment.subscription_tier,
                status: 'active',
                plan_limit: finalLimits.plan_limit,
                chat_limit: finalLimits.chat_limit,
                current_period_start: now,
                current_period_end: endDate.toISOString(),
                created_at: now
              })
              .select();
            
            if (subInsertError) {
              console.error('=== SEPAY WEBHOOK: Error creating subscription ===', subInsertError);
              lastUpgradeError = subInsertError;
              if (attempt < MAX_RETRIES) {
                await wait(1000 * attempt);
              }
              continue;
            }
            console.log('=== SEPAY WEBHOOK: Successfully created subscription ===', {
              userId: payment.user_id,
              tier: payment.subscription_tier,
              planLimit: finalLimits.plan_limit,
              chatLimit: finalLimits.chat_limit,
              insertedData: insertedSub
            });
          }

          upgradeSuccess = true;
          break;
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
    }, { status: 200 }); // SePay requires 200 or 201 for success

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
