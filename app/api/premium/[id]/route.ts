import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
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
      console.log('[premium] Auth via header:', { userId: user?.id })
    }
    
    // Fallback to session cookies
    if (!user) {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      const { data: { user: cookieUser } } = await supabase.auth.getUser()
      user = cookieUser
      console.log('[premium] Auth via cookies:', { userId: user?.id })
    }

    if (!user) {
      console.log('[premium] No user found')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Create supabase client for profile query
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    if (error) {
      console.log('[premium] Profile error:', error)
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const tier = (profile?.subscription_tier || 'free') as string
    console.log('[premium] Tier check:', { userId: user.id, tier })
    const allowed = ['basic', 'pro'].includes(tier)
    if (!allowed) {
      console.log('[premium] Tier not allowed:', { tier })
      return new NextResponse('Payment Required', { status: 402 })
    }

    const mdPath = path.join(process.cwd(), 'content', 'premium', `${params.id}.md`)
    if (!fs.existsSync(mdPath)) {
      return new NextResponse('Not Found', { status: 404 })
    }

    const text = fs.readFileSync(mdPath, 'utf8')
    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'private, max-age=60',
      },
    })
  } catch (e) {
    return new NextResponse('Server Error', { status: 500 })
  }
}
