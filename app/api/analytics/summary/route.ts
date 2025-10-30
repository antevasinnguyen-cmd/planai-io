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
      .select('id, title, goal, status, created_at, word_count')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    // Count completed, active, failed
    const completed = plans.filter((p: any) => p.status === 'completed').length
    const active = plans.filter((p: any) => p.status === 'active').length
    const failed = plans.filter((p: any) => p.status === 'failed').length
    const totalWords = plans.reduce((sum: number, p: any) => sum + (p.word_count || 0), 0)
    return NextResponse.json({
      total: plans.length,
      completed,
      active,
      failed,
      totalWords,
      plans
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
