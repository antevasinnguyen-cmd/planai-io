import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
    const privateKey = process.env.GOOGLE_PRIVATE_KEY
    const templateId = process.env.GOOGLE_SHEETS_TEMPLATE_ID

    // Check if credentials are set
    const hasClientEmail = !!clientEmail
    const hasPrivateKey = !!privateKey
    const hasTemplateId = !!templateId

    // Check private key format
    let privateKeyValid = false
    let privateKeyLength = 0
    if (privateKey) {
      privateKeyLength = privateKey.length
      privateKeyValid = privateKey.includes('BEGIN PRIVATE KEY')
    }

    return NextResponse.json({
      configured: hasClientEmail && hasPrivateKey,
      clientEmail: clientEmail ? `${clientEmail.substring(0, 10)}...` : 'NOT SET',
      privateKeySet: hasPrivateKey,
      privateKeyLength,
      privateKeyValid,
      templateIdSet: hasTemplateId,
      templateId: templateId ? `${templateId.substring(0, 10)}...` : 'NOT SET',
      message: hasClientEmail && hasPrivateKey ? 'Google Sheets API is configured' : 'Google Sheets API is NOT configured'
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
