import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { getCurrentUser } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    console.log('=== PLAN_GET_API: Starting plan retrieval', { planId: id })
    
    if (!id) {
      console.error('=== PLAN_GET_API: Missing plan ID')
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Try multiple auth methods
    let user = null
    
    // Method 1: Try auth-helpers getUser
    try {
      const { data: auth } = await supabase.auth.getUser()
      user = auth?.user
      if (user) {
        console.log('=== PLAN_GET_API: User authenticated via auth-helpers', { userId: user.id })
      }
    } catch (e) {
      console.log('=== PLAN_GET_API: auth-helpers failed, trying fallback', { error: String(e) })
    }
    
    // Method 2: Try getCurrentUser with request
    if (!user) {
      try {
        user = await getCurrentUser(request)
        if (user) {
          console.log('=== PLAN_GET_API: User authenticated via getCurrentUser', { userId: user.id })
        }
      } catch (e) {
        console.log('=== PLAN_GET_API: getCurrentUser failed', { error: String(e) })
      }
    }
    
    if (!user) {
      console.error('=== PLAN_GET_API: No authenticated user found')
      return NextResponse.json({ error: 'Unauthorized - No valid session' }, { status: 401 })
    }

    console.log('=== PLAN_GET_API: Querying plan from database', { planId: id, userId: user.id })
    
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('=== PLAN_GET_API: Database query error', { error: error.message, code: error.code })
      return NextResponse.json({ 
        error: `Database error: ${error.message}`,
        code: error.code,
        details: error.details
      }, { status: 500 })
    }

    if (!data) {
      console.error('=== PLAN_GET_API: Plan not found', { planId: id, userId: user.id })
      return NextResponse.json({ 
        error: 'Plan not found or you do not have access to this plan',
        planId: id,
        userId: user.id
      }, { status: 404 })
    }

    console.log('=== PLAN_GET_API: Plan retrieved successfully', { planId: id, userId: user.id })
    return NextResponse.json({ plan: data })
  } catch (e) {
    console.error('=== PLAN_GET_API: Unhandled error', { error: String(e) })
    return NextResponse.json({ 
      error: `Unhandled error: ${String(e)}`,
      details: e instanceof Error ? e.message : 'Unknown error'
    }, { status: 500 })
  }
}
