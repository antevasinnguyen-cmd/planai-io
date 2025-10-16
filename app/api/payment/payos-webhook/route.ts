import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { supabase } from '@/lib/supabase';

// Hàm xử lý POST request từ PayOS
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('PayOS Webhook received:', JSON.stringify(body, null, 2));
    
    // Lấy dữ liệu từ body
    const paymentData = body.data || body;
    const signature = body.signature || request.headers.get('x-signature');
    
    console.log('Payment data:', JSON.stringify(paymentData, null, 2));
    console.log('Signature:', signature);
    
    // Nếu là request kiểm tra từ PayOS (không có dữ liệu thanh toán)
    if (!paymentData || !signature) {
      console.log('PayOS health check request received');
      return NextResponse.json({ 
        success: true, 
        message: 'PayOS webhook is running',
        timestamp: new Date().toISOString()
      });
    }
    
    // Lấy checksum key từ biến môi trường
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
    if (!checksumKey) {
      console.error('Missing PAYOS_CHECKSUM_KEY environment variable');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Log toàn bộ dữ liệu nhận được để debug
    console.log('Raw webhook data:', JSON.stringify({
      body,
      paymentData,
      headers: Object.fromEntries(request.headers.entries())
    }, null, 2));

    // Tạo chuỗi dữ liệu để ký theo đúng định dạng PayOS
    // Lưu ý: Thứ tự các trường phải chính xác theo tài liệu PayOS
    const dataToSign = [
      paymentData.amount || '0',
      paymentData.cancelUrl || '',
      paymentData.description || '',
      paymentData.orderCode || paymentData.code || '',
      paymentData.returnUrl || '',
      paymentData.status || '00',
      checksumKey
    ].join(''); // Nối chuỗi không có dấu phân cách
    
    console.log('Data to sign (raw):', dataToSign);
    
    // Tạo signature từ dữ liệu (chuyển về chữ thường và bỏ các ký tự đặc biệt)
    const normalizedData = dataToSign.toLowerCase().replace(/[^a-z0-9]/g, '');
    const computedSignature = createHash('md5').update(normalizedData).digest('hex');
    
    console.log('Computed signature:', computedSignature);
    console.log('Received signature:', signature);
    
    // So sánh signature (không phân biệt hoa thường)
    if (signature.toLowerCase() !== computedSignature) {
      console.error('Invalid signature. Expected:', computedSignature);
      return NextResponse.json({ 
        success: false,
        error: 'Invalid signature',
        received: signature,
        expected: computedSignature,
        signedData: normalizedData,
        note: 'Make sure PAYOS_CHECKSUM_KEY matches the one in PayOS dashboard'
      }, { status: 200 }); // Trả về 200 để PayOS không gửi lại request
    }
    
    // Xử lý thanh toán
    const transaction_id = paymentData.orderCode?.toString() || paymentData.code?.toString();
    const status = (paymentData.status === '00' || paymentData.status === 'PAID') ? 'completed' : 'failed';
    
    console.log(`=== WEBHOOK: Processing payment ${transaction_id} with status: ${status}`);
    
    // Cập nhật trạng thái thanh toán trong database
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
      console.error('=== WEBHOOK: Payment update error ===', { transaction_id, paymentError });
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    
    console.log('=== WEBHOOK: Payment updated ===', { paymentId: payment.id, userId: payment.user_id, status });
    
    // Nếu thanh toán thành công, cập nhật thông tin người dùng
    if (status === 'completed') {
      console.log('=== WEBHOOK: Updating subscription ===', {
        userId: payment.user_id,
        tier: payment.subscription_tier,
        amount: payment.amount
      });
      
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
        console.error('=== WEBHOOK: Subscription update error ===', { userId: payment.user_id, subscriptionError });
        // Vẫn trả về success vì webhook đã xử lý payment
      } else {
        console.log('=== WEBHOOK: Subscription updated successfully ===', { userId: payment.user_id });
      }
    }
    
    return NextResponse.json({ success: true, message: `Payment ${status}` });
    
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
