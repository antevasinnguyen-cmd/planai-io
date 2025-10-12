import { NextRequest, NextResponse } from 'next/server';

// Hỗ trợ OPTIONS request cho CORS
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-signature, x-payment-provider',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Thêm CORS headers cho response
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-signature, x-payment-provider',
    };

    // Lấy và log toàn bộ thông tin từ request
    const body = await request.json();
    const headers = Object.fromEntries(request.headers.entries());
    
    console.log('DEBUG WEBHOOK - Headers:', JSON.stringify(headers, null, 2));
    console.log('DEBUG WEBHOOK - Body:', JSON.stringify(body, null, 2));
    
    // Lưu log vào file (nếu chạy local)
    try {
      const fs = require('fs');
      fs.appendFileSync('/tmp/payos-debug.log', `
=== ${new Date().toISOString()} ===
Headers: ${JSON.stringify(headers, null, 2)}
Body: ${JSON.stringify(body, null, 2)}
===================
      `);
    } catch (e) {
      console.log('Cannot write to log file:', e);
    }

    // Luôn trả về thành công để PayOS không coi đây là lỗi
    return NextResponse.json({ 
      success: true, 
      message: 'Debug webhook received',
      receivedData: {
        headers,
        body
      }
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Debug webhook error:', error);
    return NextResponse.json(
      { error: 'Debug webhook error', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 200 } // Vẫn trả về 200 để không làm PayOS nghĩ rằng webhook failed
    );
  }
}
