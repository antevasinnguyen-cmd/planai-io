import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
    
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 })
    }

    const admin = createClient(supabaseUrl, serviceKey)

    // Get profile
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // Get subscriptions
    const { data: subscriptions, error: subError } = await admin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)

    // Get payments
    const { data: payments, error: payError } = await admin
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      userId,
      profile: {
        data: profile,
        error: profileError?.message
      },
      subscriptions: {
        data: subscriptions,
        error: subError?.message
      },
      payments: {
        data: payments,
        error: payError?.message
      }
    }, { status: 200 })
  } catch (e) {
    console.error('[debug/user-status] Error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
