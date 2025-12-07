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

    // Check if subscription exists (any status, not just active)
    const { data: existingSub } = await admin
      .from('subscriptions')
      .select('id, tier, plan_limit, chat_limit, current_period_end')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Get subscription limits based on profile tier
    const { getSubscriptionLimits } = await import('@/lib/supabase')
    const limits = getSubscriptionLimits(tier)

    // Calculate period end - keep existing if still valid, otherwise extend 30 days
    const now = new Date()
    let periodEnd: Date
    if (existingSub?.current_period_end) {
      const existingEnd = new Date(existingSub.current_period_end)
      if (existingEnd > now) {
        periodEnd = existingEnd // Keep existing valid period
      } else {
        periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // Extend 30 days
      }
    } else {
      periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    }

    if (existingSub) {
      // Update existing - ALWAYS sync tier and limits from profile
      // IMPORTANT: Reset current_period_start to reset usage quota
      const { error: updateError } = await admin
        .from('subscriptions')
        .update({
          tier,
          status: 'active',
          plan_limit: limits.plans,
          chat_limit: limits.chats,
          current_period_start: now.toISOString(), // Reset period start to reset usage count
          current_period_end: periodEnd.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('id', existingSub.id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({
        message: 'Updated existing subscription with period reset',
        userId,
        tier,
        oldLimits: { plans: existingSub.plan_limit, chats: existingSub.chat_limit },
        newLimits: { plans: limits.plans, chats: limits.chats },
        periodStart: now.toISOString(),
        periodEnd: periodEnd.toISOString(),
        action: 'updated_with_reset'
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
          current_period_end: periodEnd.toISOString(),
          created_at: now.toISOString()
        })

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      return NextResponse.json({
        message: 'Created new subscription',
        userId,
        tier,
        limits: { plans: limits.plans, chats: limits.chats },
        periodEnd: periodEnd.toISOString(),
        action: 'created'
      }, { status: 200 })
    }
  } catch (e) {
    console.error('[debug/sync-subscription] Error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// GET endpoint to sync subscription for current user (auto-fix on page load)
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // Call POST with the userId
    const response = await POST(new NextRequest(req.url, {
      method: 'POST',
      body: JSON.stringify({ userId }),
      headers: { 'Content-Type': 'application/json' }
    }))
    
    return response
  } catch (e) {
    console.error('[debug/sync-subscription GET] Error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
