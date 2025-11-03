import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { getCurrentUser } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data, error } = await supabase
      .from('plans')
      .select('id, title, goal, status, created_at, word_count')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('PLANS_LIST_API_ERROR', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ plans: data ?? [] })
  } catch (error) {
    console.error('PLANS_LIST_API_UNHANDLED', error)
    return NextResponse.json({ error: 'Failed to load plans' }, { status: 500 })
  }
}
