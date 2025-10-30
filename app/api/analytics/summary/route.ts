export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'
export const fetchCache = 'force-no-store'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    // Get all plans for summary
    const { data: plans, error } = await supabase
      .from('plans')
      .select('id, title, goal, status, created_at, word_count, updated_at, completed_at, started_at')
      .eq('user_id', user.id)
      .limit(100)
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    // Count completed, active, failed
    const completed = plans.filter((p: any) => p.status === 'completed').length
    const active = plans.filter((p: any) => p.status === 'active').length
    const failed = plans.filter((p: any) => p.status === 'failed').length
    const totalWords = plans.reduce((sum: number, p: any) => sum + (p.word_count || 0), 0)

    const heatmap = plans.reduce((acc: Record<string, number>, plan: any) => {
      const key = new Date(plan.created_at).toISOString().slice(0, 10)
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    const durations = plans
      .filter((plan: any) => plan.started_at && plan.completed_at)
      .map((plan: any) => {
        const start = new Date(plan.started_at)
        const end = new Date(plan.completed_at)
        return Math.max(Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)), 0)
      })

    const averageDuration = durations.length
      ? Math.round(durations.reduce((sum: number, days: number) => sum + days, 0) / durations.length)
      : null

    return NextResponse.json({
      total: plans.length,
      completed,
      active,
      failed,
      totalWords,
      plans,
      heatmap,
      averageDuration
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
