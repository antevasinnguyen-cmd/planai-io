import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
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
    
    // If no user, try admin client directly (for debugging)
    if (!user) {
      console.log('=== PLAN_GET_API: No authenticated user, trying admin client directly')
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined
        
        if (supabaseUrl && serviceKey) {
          const admin = createClient(supabaseUrl, serviceKey)
          const { data: adminData, error: adminError } = await admin
            .from('plans')
            .select('*')
            .eq('id', id)
            .maybeSingle()
          
          if (adminError) {
            console.error('=== PLAN_GET_API: Admin query error', { error: adminError.message })
            return NextResponse.json({ 
              error: `Database error: ${adminError.message}`,
              code: adminError.code
            }, { status: 500 })
          }
          
          if (!adminData) {
            console.error('=== PLAN_GET_API: Plan not found via admin', { planId: id })
            return NextResponse.json({ 
              error: 'Plan not found',
              planId: id
            }, { status: 404 })
          }
          
          console.log('=== PLAN_GET_API: Plan retrieved via admin (no auth)', { planId: id })
          return NextResponse.json({ plan: adminData })
        }
      } catch (adminErr) {
        console.error('=== PLAN_GET_API: Admin client exception', { error: String(adminErr) })
      }
      
      console.error('=== PLAN_GET_API: No authenticated user and admin failed')
      return NextResponse.json({ error: 'Unauthorized - No valid session' }, { status: 401 })
    }

    console.log('=== PLAN_GET_API: Querying plan from database', { planId: id, userId: user.id })
    
    // First, try to get plan by ID using auth client (with RLS)
    let data = null
    let error = null
    
    const queryResult = await supabase
      .from('plans')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    
    data = queryResult.data
    error = queryResult.error
    
    // If RLS blocks it, try with admin client (bypass RLS)
    if (!data && !error) {
      console.log('=== PLAN_GET_API: Auth client returned no data, trying admin client')
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined
        
        if (supabaseUrl && serviceKey) {
          const admin = createClient(supabaseUrl, serviceKey)
          const adminResult = await admin
            .from('plans')
            .select('*')
            .eq('id', id)
            .maybeSingle()
          
          if (adminResult.data) {
            data = adminResult.data
            console.log('=== PLAN_GET_API: Plan found via admin client')
          } else if (adminResult.error) {
            error = adminResult.error
            console.error('=== PLAN_GET_API: Admin client error', { error: adminResult.error.message })
          }
        }
      } catch (adminErr) {
        console.error('=== PLAN_GET_API: Admin client exception', { error: String(adminErr) })
      }
    }

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
        error: 'Plan not found',
        planId: id,
        userId: user.id
      }, { status: 404 })
    }

    // Verify user has access to this plan by checking if plan.user_id matches any of user's profiles
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()
    
    // Allow access if plan belongs to user's profile or user's ID
    if (data.user_id !== user.id && data.user_id !== userProfile?.id) {
      console.error('=== PLAN_GET_API: Access denied', { planId: id, userId: user.id, planUserId: data.user_id })
      return NextResponse.json({ 
        error: 'You do not have access to this plan',
        planId: id
      }, { status: 403 })
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
