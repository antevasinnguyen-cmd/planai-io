import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()
    
    console.log('=== PAYMENT CANCEL: Received request ===', { orderId })

    if (!orderId) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing order ID' 
      }, { status: 400 })
    }

    // Tìm payment
    const { data: payment, error: findError } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_id', orderId)
      .single()

    if (findError || !payment) {
      console.error('=== PAYMENT CANCEL: Payment not found ===', orderId, findError)
      return NextResponse.json({ 
        success: false,
        error: 'Payment not found' 
      }, { status: 404 })
    }

    // Kiểm tra nếu đã completed thì không cho cancel
    if (payment.status === 'completed') {
      return NextResponse.json({ 
        success: false,
        error: 'Cannot cancel completed payment' 
      }, { status: 400 })
    }

    // Cập nhật status thành cancelled
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id)

    if (updateError) {
      console.error('=== PAYMENT CANCEL: Update failed ===', updateError)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to cancel payment' 
      }, { status: 500 })
    }

    console.log('=== PAYMENT CANCEL: Success ===', { orderId })

    return NextResponse.json({ 
      success: true,
      message: 'Payment cancelled successfully' 
    })

  } catch (error) {
    console.error('=== PAYMENT CANCEL: Error ===', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
