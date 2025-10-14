import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Kiểm tra biến môi trường (không hiển thị giá trị đầy đủ vì lý do bảo mật)
    const configStatus = {
      sepay: {
        token: process.env.SEPAY_TOKEN ? `${process.env.SEPAY_TOKEN.substring(0, 4)}...` : null,
        account: process.env.SEPAY_ACCOUNT_NUMBER ? `${process.env.SEPAY_ACCOUNT_NUMBER.substring(0, 4)}...` : null,
        webhook: process.env.SEPAY_WEBHOOK_SECRET || null,
        configured: !!(process.env.SEPAY_TOKEN && process.env.SEPAY_ACCOUNT_NUMBER)
      },
      payos: {
        clientId: process.env.PAYOS_CLIENT_ID ? `${process.env.PAYOS_CLIENT_ID.substring(0, 4)}...` : null,
        apiKey: process.env.PAYOS_API_KEY ? `${process.env.PAYOS_API_KEY.substring(0, 4)}...` : null,
        checksumKey: process.env.PAYOS_CHECKSUM_KEY ? `${process.env.PAYOS_CHECKSUM_KEY.substring(0, 4)}...` : null,
        apiUrl: process.env.PAYOS_API_URL || null,
        webhook: process.env.PAYOS_WEBHOOK_SECRET || null,
        configured: !!(process.env.PAYOS_CLIENT_ID && process.env.PAYOS_API_KEY && process.env.PAYOS_CHECKSUM_KEY)
      },
      nodeEnv: process.env.NODE_ENV,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://planai.io.vn'
    }

    return NextResponse.json({
      success: true,
      configStatus
    })
  } catch (error) {
    console.error('Config check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
