export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'
export const fetchCache = 'force-no-store'
export const maxDuration = 60
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getAdminClient } from '@/lib/supabase'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    // Get all plans for summary - with cache busting
    const timestamp = Date.now()
    try {
      let { data: plans, error } = await supabase
        .from('plans')
        .select('id, title, goal, status, created_at, word_count, updated_at, completed_at, started_at')
        .eq('user_id', user.id)
        .limit(100)
        .order('created_at', { ascending: false })
      
      // If RLS blocks, try admin client
      if (error) {
        console.log('[analytics/summary] RLS failed, trying admin client:', error.message)
        const admin = getAdminClient()
        if (admin) {
          const adminRes = await admin
            .from('plans')
            .select('id, title, goal, status, created_at, word_count, updated_at, completed_at, started_at')
            .eq('user_id', user.id)
            .limit(100)
            .order('created_at', { ascending: false })
          
          if (!adminRes.error) {
            plans = adminRes.data
            error = null
          } else {
            console.error('[analytics/summary] Admin client also failed:', adminRes.error)
          }
        }
      }
      
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      if (!plans || plans.length === 0) {
        // Return empty analytics instead of 404
        return NextResponse.json({
          total: 0,
          completed: 0,
          active: 0,
          failed: 0,
          totalWords: 0,
          plans: [],
          heatmap: {},
          averageDuration: null,
          timestamp: Date.now()
        }, {
          headers: {
            'Cache-Control': 'no-store, max-age=0, must-revalidate',
            'Surrogate-Control': 'no-store',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
      }
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
        averageDuration,
        timestamp: Date.now() // Add timestamp for debugging cache issues
      }, {
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
          'Surrogate-Control': 'no-store',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    } catch (dbError) {
      console.error('Database error in analytics summary:', dbError)
      return NextResponse.json({ error: String(dbError) }, { status: 500 })
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
