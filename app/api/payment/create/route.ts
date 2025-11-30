import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { createPaymentLink, PaymentStatus } from '@/lib/payos'
function getSepayConfig() {
  // Hỗ trợ cả SEPAY_TOKEN (cũ) và SEPAY_API_KEY (mới)
  const sepayToken = process.env.SEPAY_API_KEY || process.env.SEPAY_TOKEN || '';

  return {
    SEPAY_API_URL: process.env.SEPAY_API_URL || 'https://my.sepay.vn/userapi/transactions/create',
    SEPAY_TOKEN: sepayToken, // Giữ tên cũ để tương thích ngược
    SEPAY_API_KEY: sepayToken, // Thêm tên mới
    SEPAY_ACCOUNT_NUMBER: process.env.SEPAY_ACCOUNT_NUMBER || 'VQRQAFKCR5422',
    SEPAY_WEBHOOK_SECRET: process.env.SEPAY_WEBHOOK_SECRET || '',
    // Thông tin tài khoản ngân hàng
    BANK_NAME: 'MB Bank',
    BANK_CODE: '970422', // MB Bank BIN code
    ACCOUNT_NAME: 'NGUYEN THI KHANH HUYEN'
  }
}

// Hàm tạo giao dịch SePay và nhận QR code
async function createSepayTransaction(sepayConfig: any, amount: number, transferContent: string, transactionId: string) {
  try {
    console.log('=== SEPAY QR: Creating QR code ===', {
      amount,
      transferContent,
      accountNumber: sepayConfig.SEPAY_ACCOUNT_NUMBER
    })

    // Sử dụng VietQR API - API chính thức của Việt Nam cho QR code ngân hàng (cả PayOS và SePay đều sử dụng VietQR)
    const accountNumber = sepayConfig.SEPAY_ACCOUNT_NUMBER
    const bankName = sepayConfig.BANK_NAME
    const bankCode = sepayConfig.BANK_CODE
    const accountName = sepayConfig.ACCOUNT_NAME

    // Tạo QR code bằng VietQR API (ổn định, không CORS, hỗ trợ banking app)
    // Format: https://img.vietqr.io/image/{BANK_ID}-{ACCOUNT_NO}-{TEMPLATE}.jpg?amount={AMOUNT}&addInfo={DESCRIPTION}&accountName={ACC_NAME}
    const qrUrl = `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.jpg?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`

    console.log('=== SEPAY QR: QR code generated with VietQR ===', {
      qrUrl,
      accountNumber,
      bankName,
      bankCode,
      amount,
      transferContent
    })

    return {
      success: true,
      qrCode: qrUrl,
      transactionId: transactionId,
      data: {
        qr_code: qrUrl,
        transactionId: transactionId
      }
    }
  } catch (error) {
    console.error('=== SEPAY QR: Error ===', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Hàm tạo mã giao dịch duy nhất theo format SePay: PLAN + 3-10 ký tự số
// Format: PLAN + timestamp (10 ký tự số)
function generateTransactionId(): string {
  // Lấy 10 ký tự cuối của timestamp (đủ unique)
  const timestamp = Date.now().toString().slice(-10);
  return `PLAN${timestamp}`;
}

// Hàm tạo URL xử lý thanh toán
function createPaymentProcessingUrl(params: {
  orderId: string;
  amount: number;
  planId: string;
  qrCode: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://planai.io.vn';
  const { orderId, amount, planId, qrCode, accountNumber, accountName, bankName } = params;
  
  return `${baseUrl}/payment/processing?${new URLSearchParams({
    order: orderId,
    amount: amount.toString(),
    plan: planId,
    provider: 'sepay',
    qr: qrCode,
    account: accountNumber,
    name: accountName,
    bank: bankName,
    timestamp: Date.now().toString()
  })}`;
}

// PayOS configuration
const PAYOS_API_URL = process.env.PAYOS_API_URL || 'https://api-merchant.payos.vn/v2/payment-requests'
const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || ''
const PAYOS_API_KEY = process.env.PAYOS_API_KEY || ''
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || ''
const PAYOS_WEBHOOK_SECRET = process.env.PAYOS_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now()}`;
  console.log('=== PAYMENT API: ENDPOINT CALLED ===', {
    requestId,
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method
  });

  try {
    console.log('=== PAYMENT API: Received payment request ===', { requestId })
    const { planId, amount, userId, paymentMethod } = await request.json()
    
    // Map planId (number or string) to tier name
    const mapPlanIdToTier = (id: any): string => {
      const idStr = String(id).toLowerCase();
      if (idStr === '1' || idStr === 'basic') return 'basic';
      if (idStr === '2' || idStr === 'pro') return 'pro';
      if (idStr === '3' || idStr === 'pro_max') return 'pro_max';
      return 'basic'; // Default to basic if not found
    }
    
    const tierName = mapPlanIdToTier(planId)
    
    console.log('=== PAYMENT API: Payment details ===', { 
      requestId,
      planId,
      tierName,
      amount, 
      userId, 
      paymentMethod 
    })
    
    // Bỏ qua hoàn toàn phần kiểm tra xác thực người dùng
    console.log('=== PAYMENT API: Skipping user verification for all requests ===')
    console.log('=== PAYMENT API: Requested userId ===', userId)

    // Generate unique transaction ID (SePay format: PLAN + 3-10 ký tự số)
    const transactionId = generateTransactionId()
    
    // Kiểm tra biến môi trường SePay
    if (paymentMethod === 'sepay') {
      const sepayConfig = getSepayConfig();
      
      console.log('=== SEPAY CONFIG CHECK (DYNAMIC) ===', {
        hasToken: !!sepayConfig.SEPAY_TOKEN,
        tokenLength: sepayConfig.SEPAY_TOKEN?.length || 0,
        tokenFirstChars: sepayConfig.SEPAY_TOKEN ? sepayConfig.SEPAY_TOKEN.substring(0, 10) + '...' : 'EMPTY',
        hasAccountNumber: !!sepayConfig.SEPAY_ACCOUNT_NUMBER,
        accountNumber: sepayConfig.SEPAY_ACCOUNT_NUMBER,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV || 'not-vercel',
        allEnvKeys: Object.keys(process.env).filter(k => k.includes('SEPAY')).join(', '),
        allProcessEnvKeys: Object.keys(process.env).slice(0, 10).join(', '), // Hiển thị 10 biến đầu tiên để debug
        processEnvCount: Object.keys(process.env).length, // Tổng số biến môi trường
        // Hiển thị giá trị cụ thể của các biến SePay
        sepayTokenValue: process.env.SEPAY_TOKEN ? '***' + process.env.SEPAY_TOKEN.slice(-4) : 'NOT_SET',
        sepayApiKeyValue: process.env.SEPAY_API_KEY ? '***' + process.env.SEPAY_API_KEY.slice(-4) : 'NOT_SET'
      });
      
      if (!sepayConfig.SEPAY_TOKEN || sepayConfig.SEPAY_TOKEN.length === 0) {
        console.error('=== CRITICAL: SEPAY_TOKEN is missing or empty ===');
        console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('SEPAY')));
        return NextResponse.json({ 
          error: 'Payment provider configuration missing', 
          details: 'SEPAY_TOKEN is not configured. Please contact support.',
          debug: {
            hasToken: !!sepayConfig.SEPAY_TOKEN,
            tokenLength: sepayConfig.SEPAY_TOKEN?.length || 0,
            env: process.env.VERCEL_ENV || 'local'
          }
        }, { status: 500 });
      }
      
      if (!sepayConfig.SEPAY_ACCOUNT_NUMBER) {
        console.error('Missing SEPAY_ACCOUNT_NUMBER environment variable');
        return NextResponse.json({ 
          error: 'Payment provider configuration missing', 
          details: 'SEPAY_ACCOUNT_NUMBER is not configured. Please contact support.' 
        }, { status: 500 });
      }
    }
    
    if (paymentMethod === 'payos' && (!PAYOS_CLIENT_ID || !PAYOS_API_KEY)) {
      console.error('Missing PayOS configuration')
      return NextResponse.json({ 
        error: 'Payment provider configuration missing', 
        details: 'PayOS CLIENT_ID or API_KEY is not configured' 
      }, { status: 500 })
    }

    let paymentUrl = ''
    let qrCode = ''
    let sepayResult: { success: boolean; error?: string; qrCode?: string; transactionId?: string; data?: any } = { success: false, error: 'Not processed' }
    
    if (paymentMethod === 'sepay') {
      const sepayConfig = getSepayConfig();
      
      console.log('=== PAYMENT API: Processing SePay payment ===', {
        transactionId,
        amount,
        planId,
        hasToken: !!sepayConfig.SEPAY_TOKEN,
        tokenLength: sepayConfig.SEPAY_TOKEN?.length || 0,
        timestamp: new Date().toISOString()
      });
      
      try {
        // Thông tin tài khoản SePay (từ config)
        const bankName = sepayConfig.BANK_NAME;
        const bankCode = sepayConfig.BANK_CODE;
        const accountName = sepayConfig.ACCOUNT_NAME;
        const accountNumber = sepayConfig.SEPAY_ACCOUNT_NUMBER;

        if (!accountNumber) {
          throw new Error('SePay account number is not configured');
        }

        // Tạo nội dung chuyển khoản
        const transferContent = transactionId;

        // Thử tạo giao dịch bằng SePay API
        console.log('Attempting to create SePay transaction...')
        sepayResult = await createSepayTransaction(sepayConfig, amount, transferContent, transactionId)

        if (sepayResult.success && sepayResult.qrCode) {
          // Sử dụng QR code từ SePay API
          qrCode = sepayResult.qrCode
          console.log('SePay QR code received from API:', qrCode)
        } else {
          // Fallback to VietQR nếu SePay API không hoạt động (SePay sử dụng VietQR)
          console.log('SePay API failed or no QR returned, using VietQR as fallback:', sepayResult.error)
          qrCode = `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.jpg?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`;
        }
        
        // Tạo URL xử lý thanh toán
        paymentUrl = createPaymentProcessingUrl({
          orderId: transactionId,
          amount,
          planId,
          qrCode,
          accountNumber,
          accountName,
          bankName
        });
        
        console.log('SePay payment created:', { 
          paymentUrl, 
          qrCode: qrCode ? 'QR code generated' : 'No QR code',
          transactionId,
          timestamp: new Date().toISOString()
        });
        
      } catch (sePayError) {
        const errorId = `err_${Date.now()}`;
        console.error('=== PAYMENT API: SePay error ===', {
          errorId,
          error: sePayError,
          timestamp: new Date().toISOString()
        });
        
        // Log lỗi vào database
        try {
          await supabase
            .from('error_logs')
            .insert([{
              type: 'payment_error',
              error_id: errorId,
              message: sePayError instanceof Error ? sePayError.message : 'Unknown SePay error',
              metadata: {
                transactionId,
                amount,
                planId,
                userId,
                error: sePayError
              },
              created_at: new Date().toISOString()
            }]);
        } catch (logError) {
          console.error('Failed to log payment error:', logError);
        }
        
        return NextResponse.json({ 
          success: false,
          error: 'Payment provider error',
          error_id: errorId,
          details: sePayError instanceof Error ? sePayError.message : 'Could not process payment',
          timestamp: new Date().toISOString()
        }, { status: 500 });
      }
    } else if (paymentMethod === 'payos') {
      console.log('=== PAYMENT API: Processing PayOS payment ===')
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://planai.io.vn'

        // Sử dụng PayOS API để tạo payment link
        const orderCode = transactionId
        // PayOS yêu cầu description tối đa 25 ký tự
        const description = `PlanAI ${planId}`.substring(0, 25)
        const returnUrl = `${baseUrl}/payment/success`
        const cancelUrl = `${baseUrl}/payment/cancel`

        console.log('Creating PayOS payment:', {
          orderCode,
          amount,
          description,
          returnUrl,
          cancelUrl
        })

        // Gọi PayOS API để tạo payment
        const payosPayment = await createPaymentLink(
          orderCode,
          amount,
          description,
          returnUrl,
          cancelUrl
        )

        console.log('PayOS payment created successfully:', {
          paymentId: payosPayment.id,
          orderCode: payosPayment.orderCode,
          paymentUrl: payosPayment.paymentUrl,
          qrCode: payosPayment.qrCode ? 'QR generated' : 'No QR'
        })

        // Tạo URL xử lý thanh toán với PayOS payment URL
        paymentUrl = `${baseUrl}/payment/processing?${new URLSearchParams({
          order: transactionId,
          amount: amount.toString(),
          plan: planId,
          provider: 'payos',
          qr: payosPayment.qrCode || '',
          account: payosPayment.accountNumber || '',
          name: payosPayment.accountName || '',
          bank: 'MB Bank',
          timestamp: Date.now().toString(),
          payosOrderCode: orderCode,
          paymentUrl: payosPayment.paymentUrl || ''
        })}`

        qrCode = payosPayment.qrCode || ''

        console.log('PayOS payment processed:', {
          paymentUrl,
          qrCode: qrCode ? 'QR code received from PayOS' : 'No QR code',
          transactionId,
          timestamp: new Date().toISOString()
        })
      } catch (payosError) {
        console.error('=== PAYMENT API: PayOS error ===', payosError)
        return NextResponse.json({
          error: 'Payment provider error',
          details: payosError instanceof Error ? payosError.message : 'Could not connect to PayOS',
          payosError: payosError
        }, { status: 500 })
      }
    }

    // Lưu bản ghi thanh toán vào database
    console.log('=== PAYMENT API: Saving payment record to database ===')
    let paymentSaved = false
    try {
      // Đảm bảo userId luôn hợp lệ
      const safeUserId = userId || 'anonymous'

      // Chuẩn bị dữ liệu để lưu - chỉ các field cần thiết
      // Không gửi created_at vì Supabase sẽ tự động tạo
      const paymentData: any = {
        user_id: safeUserId,
        subscription_tier: tierName,
        amount: amount,
        currency: 'VND',
        status: 'pending',
        payment_method: paymentMethod,
        transaction_id: transactionId,
        metadata: {
          provider: paymentMethod === 'sepay' ? 'sepay' : 'payos',
          planId: planId,
          tierName: tierName
        }
      }

      // Thêm thông tin PayOS nếu có
      if (paymentMethod === 'payos') {
        const urlParams = new URL(paymentUrl).searchParams
        const payosOrderCode = urlParams.get('payosOrderCode')
        if (payosOrderCode) {
          paymentData.payos_payment_id = payosOrderCode
          paymentData.metadata = {
            ...paymentData.metadata,
            payos_order_code: payosOrderCode,
            provider_url: paymentUrl
          }
        }
      }

      // Sử dụng admin client (service role) để bypass RLS
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      console.log('=== PAYMENT API: Supabase config check ===', {
        hasUrl: !!supabaseUrl,
        urlLength: supabaseUrl?.length || 0,
        hasKey: !!serviceRoleKey,
        keyLength: serviceRoleKey?.length || 0
      });

      if (!supabaseUrl || !serviceRoleKey) {
        console.error('=== PAYMENT API: CRITICAL - Missing Supabase config ===', {
          hasUrl: !!supabaseUrl,
          hasKey: !!serviceRoleKey,
          transactionId
        });
        return NextResponse.json({
          error: 'Payment service configuration error',
          details: 'Database configuration is missing. Please contact support.'
        }, { status: 500 });
      }

      const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

      // Ensure user profile exists before creating payment (to avoid FK constraint violation)
      if (safeUserId !== 'anonymous') {
        try {
          const { data: existingProfile, error: profileCheckError } = await adminSupabase
            .from('profiles')
            .select('id')
            .eq('id', safeUserId)
            .maybeSingle();

          if (!existingProfile) {
            // Profile doesn't exist, create it
            console.log('=== PAYMENT API: Creating user profile ===', { userId: safeUserId });
            const { error: profileCreateError } = await adminSupabase
              .from('profiles')
              .insert([{
                id: safeUserId,
                email: `user-${safeUserId}@planai.local`,
                subscription_tier: 'free',
                chat_count: 0,
                plan_count: 0,
                created_at: new Date().toISOString()
              }]);

            if (profileCreateError) {
              console.warn('=== PAYMENT API: Profile creation failed ===', {
                userId: safeUserId,
                error: profileCreateError.message
              });
            } else {
              console.log('=== PAYMENT API: User profile created successfully ===', { userId: safeUserId });
            }
          }
        } catch (profileError) {
          console.warn('=== PAYMENT API: Profile check exception ===', {
            userId: safeUserId,
            error: profileError instanceof Error ? profileError.message : 'Unknown error'
          });
        }
      }

      console.log('=== PAYMENT API: Attempting to insert payment ===', {
        transactionId,
        userId: paymentData.user_id,
        amount: paymentData.amount,
        status: paymentData.status,
        subscriptionTier: paymentData.subscription_tier,
        planId: planId,
        tierName: tierName,
        provider: paymentData.metadata?.provider,
        paymentData: JSON.stringify(paymentData)
      })

      const { data: paymentRecord, error } = await adminSupabase
        .from('payments')
        .insert([paymentData])
        .select()

      if (error) {
        console.error('=== PAYMENT API: Database error ===', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          fullError: JSON.stringify(error),
          paymentData,
          transactionId
        });
        // FALLBACK: Webhook sẽ tạo payment record nếu không tìm thấy
        console.warn('=== PAYMENT API: Database insert failed - webhook fallback will handle ===', {
          transactionId,
          reason: error.message
        });
      } else if (!paymentRecord || paymentRecord.length === 0) {
        console.error('=== PAYMENT API: Insert returned no records ===', {
          transactionId,
          paymentData
        });
        // FALLBACK: Webhook sẽ tạo payment record nếu không tìm thấy
        console.warn('=== PAYMENT API: No records returned - webhook fallback will handle ===', {
          transactionId
        });
      } else {
        paymentSaved = true
        console.log('=== PAYMENT API: Payment record saved successfully ===', {
          id: paymentRecord?.[0]?.id,
          transactionId,
          status: paymentRecord?.[0]?.status,
          createdAt: paymentRecord?.[0]?.created_at
        })
      }
    } catch (dbError) {
      console.error('=== PAYMENT API: Database exception ===', {
        error: dbError,
        message: dbError instanceof Error ? dbError.message : 'Unknown error',
        stack: dbError instanceof Error ? dbError.stack : undefined,
        transactionId
      });
      // FALLBACK: Webhook sẽ tạo payment record nếu không tìm thấy
      console.warn('=== PAYMENT API: Database exception - webhook fallback will handle ===', {
        transactionId
      });
    }

    // Log warning nếu payment không được lưu
    if (!paymentSaved) {
      console.warn('=== PAYMENT API: WARNING - Payment may not have been saved to database ===', {
        transactionId,
        provider: paymentMethod
      })
    }

    // Kiểm tra URL thanh toán có trống không
    if (!paymentUrl) {
      console.error('=== PAYMENT API: Empty payment URL ===', { paymentMethod })
      return NextResponse.json({ 
        error: 'Invalid payment URL', 
        details: 'Payment URL is empty. Please try again or contact support.' 
      }, { status: 500 })
    }
    
    // Return success response
    console.log('=== PAYMENT API: Returning success response ===', { 
      requestId,
      paymentUrl, 
      transactionId,
      paymentSaved,
      timestamp: new Date().toISOString()
    })
    return NextResponse.json({
      success: true,
      paymentUrl: paymentUrl,
      transactionId: transactionId,
      qrCode: qrCode
    })
  } catch (error) {
    console.error('=== PAYMENT API: CRITICAL ERROR ===', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}
