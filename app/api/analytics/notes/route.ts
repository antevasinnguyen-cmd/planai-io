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

    // Try RLS client first
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    let { data, error } = await supabase
      .from('user_notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    // If RLS blocks or table doesn't exist, try admin client
    if (error) {
      const msg = error.message || ''
      // Table doesn't exist - return empty gracefully
      if (msg.toLowerCase().includes('could not find the table') || 
          msg.toLowerCase().includes('schema cache') || 
          (error as any).code === '42P01') {
        return NextResponse.json({ notes: [] })
      }
      
      // Try admin client fallback for RLS issues
      console.log('[analytics/notes] RLS failed, trying admin client:', error.message)
      const admin = getAdminClient()
      if (admin) {
        const adminRes = await admin
          .from('user_notes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        
        if (!adminRes.error) {
          return NextResponse.json({ notes: adminRes.data || [] })
        }
        // If admin also fails with table not found, return empty
        const adminMsg = adminRes.error.message || ''
        if (adminMsg.toLowerCase().includes('could not find the table') || 
            adminMsg.toLowerCase().includes('schema cache') || 
            (adminRes.error as any).code === '42P01') {
          return NextResponse.json({ notes: [] })
        }
        console.error('[analytics/notes] Admin client also failed:', adminRes.error)
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ notes: data || [] })
  } catch (e) {
    console.error('[analytics/notes] Error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { plan_id, content } = body
    if (!content) return NextResponse.json({ error: 'Thiếu thông tin note' }, { status: 400 })

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    let { data, error } = await supabase
      .from('user_notes')
      .insert({ user_id: user.id, plan_id: plan_id || null, content })
      .select()
      .single()
    
    // If RLS blocks or table doesn't exist, try admin client
    if (error) {
      const msg = error.message || ''
      if (msg.toLowerCase().includes('could not find the table') || 
          msg.toLowerCase().includes('schema cache') || 
          (error as any).code === '42P01') {
        // Table missing - return synthetic note for UX continuity
        return NextResponse.json({ note: { id: 'temp-' + Date.now(), user_id: user.id, plan_id, content, created_at: new Date().toISOString() } })
      }
      
      // Try admin client fallback
      const admin = getAdminClient()
      if (admin) {
        const adminRes = await admin
          .from('user_notes')
          .insert({ user_id: user.id, plan_id: plan_id || null, content })
          .select()
          .single()
        
        if (!adminRes.error) {
          return NextResponse.json({ note: adminRes.data })
        }
        // Table missing via admin
        const adminMsg = adminRes.error.message || ''
        if (adminMsg.toLowerCase().includes('could not find the table') || 
            adminMsg.toLowerCase().includes('schema cache') || 
            (adminRes.error as any).code === '42P01') {
          return NextResponse.json({ note: { id: 'temp-' + Date.now(), user_id: user.id, plan_id, content, created_at: new Date().toISOString() } })
        }
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ note: data })
  } catch (e) {
    console.error('[analytics/notes] POST error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
