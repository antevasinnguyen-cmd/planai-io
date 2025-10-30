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

    // Get all checklist items for all plans
    const { data, error } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ items: data })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { plan_id, title, due_date, status } = body
    if (!plan_id || !title) return NextResponse.json({ error: 'Thiếu thông tin checklist' }, { status: 400 })

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data, error } = await supabase
      .from('checklist_items')
      .insert({ user_id: user.id, plan_id, title, due_date, status })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ item: data })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
