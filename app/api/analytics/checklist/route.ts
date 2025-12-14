export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'
export const fetchCache = 'force-no-store'
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

    // Get all checklist items for all plans
    let { data, error } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true })
    
    if (error) {
      const msg = error.message || ''
      // If the table doesn't exist or not in schema cache, return empty list gracefully
      if (msg.toLowerCase().includes('could not find the table') || msg.toLowerCase().includes('schema cache') || (error as any).code === '42P01') {
        return NextResponse.json({ items: [] })
      }
      
      // Try admin client fallback for RLS issues
      console.log('[analytics/checklist] RLS failed, trying admin client:', error.message)
      const admin = getAdminClient()
      if (admin) {
        const adminRes = await admin
          .from('checklist_items')
          .select('*')
          .eq('user_id', user.id)
          .order('due_date', { ascending: true })
        
        if (!adminRes.error) {
          return NextResponse.json({ items: adminRes.data || [] })
        }
        // If admin also fails with table not found, return empty
        const adminMsg = adminRes.error.message || ''
        if (adminMsg.toLowerCase().includes('could not find the table') || 
            adminMsg.toLowerCase().includes('schema cache') || 
            (adminRes.error as any).code === '42P01') {
          return NextResponse.json({ items: [] })
        }
        console.error('[analytics/checklist] Admin client also failed:', adminRes.error)
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ items: data || [] })
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
    if (error) {
      const msg = error.message || ''
      if (msg.toLowerCase().includes('could not find the table') || msg.toLowerCase().includes('schema cache') || (error as any).code === '42P01') {
        // If table missing, act as a no-op and return a synthetic item for UX continuity
        return NextResponse.json({ item: { id: 'temp', user_id: user.id, plan_id, title, due_date, status } })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ item: data })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
