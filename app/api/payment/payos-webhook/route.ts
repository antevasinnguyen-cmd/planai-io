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
    
    // Xác thực signature
    // Đảm bảo lấy đúng checksum key từ biến môi trường
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
    if (!checksumKey) {
      console.error('Missing PAYOS_CHECKSUM_KEY environment variable');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Tạo chuỗi dữ liệu để ký theo đúng định dạng PayOS yêu cầu
    const dataToSign = [
      paymentData.code || paymentData.orderCode,
      paymentData.amount,
      paymentData.status || '00',
      paymentData.transId || '',
      paymentData.message || ''
    ].join('|') + `|${checksumKey}`;
    
    console.log('Data to sign:', dataToSign);
    
    // Tạo signature từ dữ liệu
    const computedSignature = createHash('md5').update(dataToSign).digest('hex');
    
    console.log('Computed signature:', computedSignature);
    console.log('Received signature:', signature);
    
    // So sánh signature nhận được với signature tính toán
    if (signature !== computedSignature) {
      console.error('Invalid signature. Expected:', computedSignature);
      return NextResponse.json({ 
        error: 'Invalid signature',
        received: signature,
        expected: computedSignature,
        data: dataToSign
      }, { status: 401 });
    }
    
    // Xử lý thanh toán
    const transaction_id = paymentData.orderCode?.toString() || paymentData.code?.toString();
    const status = (paymentData.status === '00' || paymentData.status === 'PAID') ? 'completed' : 'failed';
    
    console.log(`Processing payment ${transaction_id} with status: ${status}`);
    
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
      console.error('Payment update error:', paymentError);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    
    // Nếu thanh toán thành công, cập nhật thông tin người dùng
    if (status === 'completed') {
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
