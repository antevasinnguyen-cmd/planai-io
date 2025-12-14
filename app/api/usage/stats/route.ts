import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getAdminClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.info('API_USAGE_STATS_REQUEST', { userId: user.id })

    // Use route handler client (RLS via cookies) to count accurately
    const cookieStore = cookies()
    const rh = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get user's profile to check counters and subscription tier
    const { data: profile } = await rh
      .from('profiles')
      .select('chat_count, plan_count, subscription_tier')
      .eq('id', user.id)
      .single()

    // Get user's subscription to determine usage period
    const { data: subscriptions } = await rh
      .from('subscriptions')
      .select('current_period_start, created_at, tier')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)

    const subscription = Array.isArray(subscriptions) ? subscriptions[0] : subscriptions
    const currentTier = subscription?.tier || profile?.subscription_tier || 'free'

    // Determine usage start date:
    // - If user has active subscription (paid tier), count from current_period_start (or created_at as fallback)
    // - Otherwise, count from start of month (free tier)
    let usageStartDate: Date
    if (currentTier && currentTier !== 'free') {
      // Paid tier: count from when current period started (when they upgraded or renewed)
      // CRITICAL: Use current_period_start if available, as it marks the exact moment of upgrade
      const periodStart = subscription?.current_period_start || subscription?.created_at
      usageStartDate = new Date(periodStart || new Date())
      
      // Ensure we're using a valid date - if periodStart is in the future or invalid, use now
      if (usageStartDate > new Date()) {
        usageStartDate = new Date()
      }
      
      logger.info('API_USAGE_STATS: Using subscription period start date for paid tier', {
        userId: user.id,
        tier: currentTier,
        startDate: usageStartDate.toISOString(),
        currentPeriodStart: subscription?.current_period_start,
        createdAt: subscription?.created_at,
        now: new Date().toISOString()
      })
    } else {
      // Free tier: count from start of month
      usageStartDate = new Date()
      usageStartDate.setDate(1)
      usageStartDate.setHours(0, 0, 0, 0)
      logger.info('API_USAGE_STATS: Using start of month for free tier', {
        userId: user.id,
        startDate: usageStartDate.toISOString()
      })
    }

    // Plans count
    const { count: planCount = 0, error: plansError } = await rh
      .from('plans')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', usageStartDate.toISOString())

    // Chats count (user messages only)
    const { count: chatCount = 0, error: chatsError } = await rh
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('type', 'user')
      .gte('created_at', usageStartDate.toISOString())

    // Words sum
    const { data: wordsRows, error: wordsError } = await rh
      .from('plans')
      .select('word_count')
      .eq('user_id', user.id)
      .gte('created_at', usageStartDate.toISOString())

    const words = (wordsRows || []).reduce((sum: number, r: any) => sum + (r?.word_count || 0), 0)
    
    // Ensure counts are integers
    const finalPlanCount = Math.max(0, Math.floor(planCount || 0))
    const finalChatCount = Math.max(0, Math.floor(chatCount || 0))
    const finalWords = Math.max(0, Math.floor(words || 0))

    // If any RLS errors, try admin client fallback
    if (plansError || chatsError || wordsError) {
      logger.warn('API_USAGE_STATS_RLS_ISSUES', {
        plansError: plansError?.message,
        chatsError: chatsError?.message,
        wordsError: wordsError?.message
      })
      
      // Try admin client fallback
      const admin = getAdminClient()
      if (admin) {
        try {
          const adminPlanRes = await admin
            .from('plans')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', usageStartDate.toISOString())
          
          const adminChatRes = await admin
            .from('chat_messages')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('type', 'user')
            .gte('created_at', usageStartDate.toISOString())
          
          const adminWordsRes = await admin
            .from('plans')
            .select('word_count')
            .eq('user_id', user.id)
            .gte('created_at', usageStartDate.toISOString())
          
          if (!adminPlanRes.error && !adminChatRes.error && !adminWordsRes.error) {
            const adminPlanCount = Math.max(0, Math.floor(adminPlanRes.count || 0))
            const adminChatCount = Math.max(0, Math.floor(adminChatRes.count || 0))
            const adminWords = (adminWordsRes.data || []).reduce((sum: number, r: any) => sum + (r?.word_count || 0), 0)
            
            logger.info('API_USAGE_STATS_ADMIN_FALLBACK_SUCCESS', {
              userId: user.id,
              plans: adminPlanCount,
              chats: adminChatCount,
              words: adminWords
            })
            
            return NextResponse.json({
              success: true,
              usage: { plans: adminPlanCount, chats: adminChatCount, words: adminWords }
            })
          }
        } catch (adminErr) {
          logger.error('API_USAGE_STATS_ADMIN_FALLBACK_ERROR', {
            error: adminErr instanceof Error ? adminErr.message : String(adminErr)
          })
        }
      }
    }

    logger.info('API_USAGE_STATS_SUCCESS', {
      userId: user.id,
      tier: currentTier,
      plans: finalPlanCount,
      chats: finalChatCount,
      words: finalWords,
      usageStartDate: usageStartDate.toISOString(),
      profileTier: profile?.subscription_tier,
      subscriptionTier: subscription?.tier
    })

    return NextResponse.json({
      success: true,
      usage: { plans: finalPlanCount, chats: finalChatCount, words: finalWords }
    })
  } catch (error) {
    logger.error('API_USAGE_STATS_ERROR', {
      error: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
