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
    const { data: inserted, error: insErr } = await admin
      .from('subscriptions')
      .insert({
        user_id: user.id,
        tier: 'free',
        status: 'active',
        plan_limit: 1,
        chat_limit: 5,
        word_limit: 1000,
        created_at: now,
      })
      .select()
      .limit(1)

    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 })
    }

    const row = Array.isArray(inserted) ? inserted[0] : inserted
    return NextResponse.json({ alreadyUsed: false, data: row })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
