import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('PayOS Webhook Test - Body:', JSON.stringify(body, null, 2));
    console.log('PayOS Webhook Test - Headers:', Object.fromEntries(request.headers.entries()));

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'PayOS webhook test received',
      timestamp: new Date().toISOString(),
      body: body,
      headers: Object.fromEntries(request.headers.entries())
    });
  } catch (error) {
    console.error('PayOS Webhook Test Error:', error);
    return NextResponse.json(
      { error: 'Test webhook failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'PayOS Webhook Test Endpoint',
    status: 'active',
    timestamp: new Date().toISOString()
  });
}
