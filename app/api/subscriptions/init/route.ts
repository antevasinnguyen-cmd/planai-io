import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export async function POST(_req: NextRequest) {
  try {
    const cookieStore = cookies()
    const rhSupabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: auth } = await rhSupabase.auth.getUser()
    const user = auth?.user
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('=== SUBSCRIPTION_INIT: User authenticated ===', { userId: user.id })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined
    // If service key is not configured, gracefully fallback to user client for reads
    if (!serviceKey) {
      // Try to read existing active subscription via RLS (view policy)
      const { data: rows, error: rlsErr } = await rhSupabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)

      if (!rlsErr && rows && rows.length > 0) {
        return NextResponse.json({ alreadyUsed: true, data: rows[0], warning: 'Service key missing, returned existing subscription.' })
      }

      // If cannot read or not exists, assume free in memory (non-blocking)
      return NextResponse.json({
        alreadyUsed: true,
        data: { user_id: user.id, tier: 'free', status: 'active' },
        warning: 'Service key missing; skipping creation. Assuming free tier.'
      })
    }
    const admin = createClient(supabaseUrl, serviceKey)

    // CRITICAL: Ensure profile exists before creating subscription
    try {
      const { data: existingProfile } = await admin
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()
      
      if (!existingProfile) {
        // Profile doesn't exist, create it
        await admin
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
      }
    } catch (profileErr) {
      console.warn('Error ensuring profile exists:', profileErr)
      // Continue anyway - subscription creation might still work
    }

    // Get latest active subscription
    const { data: rows, error: selErr } = await admin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)

    if (selErr) {
      return NextResponse.json({ error: selErr.message }, { status: 500 })
    }

    const existing = Array.isArray(rows) ? rows[0] : rows
    if (existing) {
      return NextResponse.json({ alreadyUsed: true, data: existing })
    }

    const now = new Date().toISOString()
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    
    const { data: inserted, error: insErr } = await admin
      .from('subscriptions')
      .insert({
        user_id: user.id,
        tier: 'free',
        status: 'active',
        current_period_start: now,
        current_period_end: endDate,
        created_at: now,
      })
      .select()
      .limit(1)

    if (insErr) {
      console.error('=== SUBSCRIPTION_INIT: Insert error ===', {
        error: insErr.message,
        code: insErr.code,
        details: insErr.details
      })
      return NextResponse.json({ error: insErr.message }, { status: 500 })
    }

    const row = Array.isArray(inserted) ? inserted[0] : inserted
    console.log('=== SUBSCRIPTION_INIT: Subscription created ===', {
      userId: user.id,
      tier: row?.tier,
      status: row?.status
    })
    return NextResponse.json({ alreadyUsed: false, data: row })
  } catch (e: any) {
    console.error('=== SUBSCRIPTION_INIT: Error ===', { 
      error: e?.message || String(e),
      stack: e?.stack?.slice(0, 500)
    })
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
