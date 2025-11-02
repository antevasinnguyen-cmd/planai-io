import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getUserUsageStats } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.info('API_USAGE_STATS_REQUEST', { userId: user.id })

    // Get usage stats from database
    const usage = await getUserUsageStats(user.id)

    logger.info('API_USAGE_STATS_SUCCESS', {
      userId: user.id,
      plans: usage.plans,
      chats: usage.chats,
      words: usage.words
    })

    return NextResponse.json({
      success: true,
      usage: {
        plans: usage.plans,
        chats: usage.chats,
        words: usage.words
      }
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
