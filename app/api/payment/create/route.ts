import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, supabase } from '@/lib/supabase'

// SePay configuration
const SEPAY_API_URL = 'https://my.sepay.vn/userapi/transactions/create'
const SEPAY_TOKEN = process.env.SEPAY_TOKEN || ''
const SEPAY_ACCOUNT_NUMBER = process.env.SEPAY_ACCOUNT_NUMBER || ''

export async function POST(request: NextRequest) {
  try {
    const { planId, amount, userId, paymentMethod } = await request.json()
    
    // Verify user
    const user = await getCurrentUser()
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate unique transaction ID
    const transactionId = `PLANAI_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create payment with SePay
    const sePayData = {
      account_number: SEPAY_ACCOUNT_NUMBER,
      amount: amount,
      content: `Thanh toan goi ${planId} - ${transactionId}`,
      transaction_id: transactionId
    }

    const response = await fetch(SEPAY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SEPAY_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sePayData)
    })

    const sePayResult = await response.json()

    if (sePayResult.status === 200) {
      // Save payment record to database
      const { data: paymentRecord, error } = await supabase
        .from('payments')
        .insert([{
          user_id: userId,
          subscription_tier: planId,
          amount: amount,
          currency: 'VND',
          status: 'pending',
          payment_method: paymentMethod,
          transaction_id: transactionId
        }])
        .select()

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        paymentUrl: sePayResult.data.qr_code || sePayResult.data.payment_url,
        transactionId: transactionId,
        qrCode: sePayResult.data.qr_code
      })
    } else {
      return NextResponse.json({ 
        error: 'Payment creation failed',
        details: sePayResult.message 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Payment API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
