import { NextRequest, NextResponse } from 'next/server';

/**
 * Test endpoint để trigger webhook SePay thủ công
 * Chỉ dùng cho development/testing
 * 
 * POST /api/webhook/sepay/test
 * Body: {
 *   "orderId": "ORDER_ID",
 *   "amount": 169000,
 *   "code": "ORDER_ID"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId, amount, code } = await request.json();

    if (!orderId || !amount) {
      return NextResponse.json(
        { error: 'Missing orderId or amount' },
        { status: 400 }
      );
    }

    const sepayToken = process.env.SEPAY_API_KEY || process.env.SEPAY_TOKEN || '';

    if (!sepayToken) {
      return NextResponse.json(
        { error: 'SEPAY_API_KEY not configured' },
        { status: 500 }
      );
    }

    console.log('=== TEST WEBHOOK: Triggering SePay webhook ===', {
      orderId,
      amount,
      timestamp: new Date().toISOString()
    });

    // Gọi webhook endpoint với dữ liệu test
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://planai.io.vn'}/api/webhook/sepay`;
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Apikey ${sepayToken}`
      },
      body: JSON.stringify({
        id: `test_${Date.now()}`,
        gateway: 'MBBank',
        transactionDate: new Date().toISOString(),
        accountNumber: 'FLIOAI000',
        code: code || orderId,
        content: orderId,
        transferType: 'in',
        transferAmount: amount,
        accumulated: amount,
        subAccount: null,
        referenceCode: `test_${Date.now()}`,
        description: 'Test webhook'
      })
    });

    const result = await response.json();

    console.log('=== TEST WEBHOOK: Response ===', {
      status: response.status,
      result
    });

    return NextResponse.json({
      success: true,
      message: 'Test webhook triggered',
      webhookResponse: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('=== TEST WEBHOOK: Error ===', error);
    return NextResponse.json(
      {
        error: 'Failed to trigger test webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test webhook endpoint',
    usage: 'POST /api/webhook/sepay/test with { orderId, amount, code }',
    timestamp: new Date().toISOString()
  });
}
