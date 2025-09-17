import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const webhookData = await request.json()
    
    // Verify webhook signature (SePay specific)
    const signature = request.headers.get('x-sepay-signature')
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Process payment status update
    const { transaction_id, status, amount } = webhookData
    
    if (status === 'success') {
      // Update payment status
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .update({ 
          status: 'completed'
        })
        .eq('transaction_id', transaction_id)
        .select()
        .single()

      if (paymentError || !payment) {
        console.error('Payment update error:', paymentError)
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }

      // Update user subscription in profiles table
      const { error: subscriptionError } = await supabase
        .from('profiles')
        .update({
          subscription_tier: payment.subscription_tier,
          chat_count: 0, // Reset chat count for new subscription
          plan_count: 0, // Reset plan count for new subscription
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.user_id)

      if (subscriptionError) {
        console.error('Subscription update error:', subscriptionError)
        return NextResponse.json({ error: 'Subscription update failed' }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'Payment processed successfully' })
    } else if (status === 'failed') {
      // Update payment status to failed
      await supabase
        .from('payments')
        .update({ 
          status: 'failed'
        })
        .eq('transaction_id', transaction_id)

      return NextResponse.json({ success: true, message: 'Payment failed processed' })
    }

    return NextResponse.json({ success: true, message: 'Webhook received' })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' }, 
      { status: 500 }
    )
  }
}
