import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
  try {
    let user = null
    
    // Try Authorization header first (Bearer token)
    const authHeader = req.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } }
      })
      const { data: { user: authUser } } = await supabase.auth.getUser()
      user = authUser
      console.log('[user/tier] Auth via header:', { userId: user?.id })
    }
    
    // Fallback to session cookies
    if (!user) {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      const { data: { user: cookieUser } } = await supabase.auth.getUser()
      user = cookieUser
      console.log('[user/tier] Auth via cookies:', { userId: user?.id })
    }

    if (!user) {
      console.log('[user/tier] No user found')
      return NextResponse.json({ tier: 'free' }, { status: 200 })
    }

    // Create supabase client for profile query
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      console.log('[user/tier] Profile query error:', error)
      // Return free tier as fallback
      return NextResponse.json({ tier: 'free' }, { status: 200 })
    }

    const tier = profile?.subscription_tier || 'free'
    console.log('[user/tier] Tier retrieved:', { userId: user.id, tier })
    
    return NextResponse.json({ tier }, { status: 200 })
  } catch (e) {
    console.error('[user/tier] Error:', e)
    return NextResponse.json({ tier: 'free' }, { status: 200 })
  }
}
