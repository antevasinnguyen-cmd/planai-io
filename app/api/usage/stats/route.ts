import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase'
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

    // Compute start of month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    // Plans count
    const { count: planCount = 0, error: plansError } = await rh
      .from('plans')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString())

    // Chats count (user messages only)
    const { count: chatCount = 0, error: chatsError } = await rh
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('type', 'user')
      .gte('created_at', startOfMonth.toISOString())

    // Words sum
    const { data: wordsRows, error: wordsError } = await rh
      .from('plans')
      .select('word_count')
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString())

    const words = (wordsRows || []).reduce((sum: number, r: any) => sum + (r?.word_count || 0), 0)

    if (plansError || chatsError || wordsError) {
      logger.warn('API_USAGE_STATS_PARTIAL', {
        plansError: plansError?.message,
        chatsError: chatsError?.message,
        wordsError: wordsError?.message
      })
    }

    logger.info('API_USAGE_STATS_SUCCESS', {
      userId: user.id,
      plans: planCount,
      chats: chatCount,
      words
    })

    return NextResponse.json({
      success: true,
      usage: { plans: planCount, chats: chatCount, words }
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
