import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    
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
      .select('subscription_tier')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const tier = profile.subscription_tier || 'free'
    
    if (tier === 'free') {
      return NextResponse.json({ message: 'User has free tier, no subscription needed' }, { status: 200 })
    }

    // Check if subscription exists
    const { data: existingSub } = await admin
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    const now = new Date()
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Get subscription limits
    const { getSubscriptionLimits } = await import('@/lib/supabase')
    const limits = getSubscriptionLimits(tier)

    if (existingSub) {
      // Update existing
      const { error: updateError } = await admin
        .from('subscriptions')
        .update({
          tier,
          plan_limit: limits.plans,
          chat_limit: limits.chats,
          current_period_end: endDate.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('id', existingSub.id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({
        message: 'Updated existing subscription',
        userId,
        tier,
        action: 'updated'
      }, { status: 200 })
    } else {
      // Create new
      const { error: insertError } = await admin
        .from('subscriptions')
        .insert({
          user_id: userId,
          tier,
          status: 'active',
          plan_limit: limits.plans,
          chat_limit: limits.chats,
          current_period_start: now.toISOString(),
          current_period_end: endDate.toISOString(),
          created_at: now.toISOString()
        })

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      return NextResponse.json({
        message: 'Created new subscription',
        userId,
        tier,
        action: 'created'
      }, { status: 200 })
    }
  } catch (e) {
    console.error('[debug/sync-subscription] Error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
