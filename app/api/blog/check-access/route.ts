import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const blogSlug = url.searchParams.get('slug')

    if (!blogSlug) {
      return NextResponse.json({ error: 'Missing blog slug' }, { status: 400 })
    }

    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({
        hasAccess: false,
        reason: 'not_authenticated',
        message: 'Please log in to access this content'
      })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', currentUser.id)
      .single()

    const paidTiers = ['basic', 'pro', 'pro_max']
    const hasAccess = profile && paidTiers.includes(profile.subscription_tier)

    return NextResponse.json({
      hasAccess,
      tier: profile?.subscription_tier || 'free',
      reason: hasAccess ? 'has_subscription' : 'no_subscription',
      message: hasAccess ? 'Access granted' : 'You need a paid subscription to access this content'
    })
  } catch (error) {
    console.error('Blog access check error:', error)
    return NextResponse.json({
      hasAccess: false,
      reason: 'error',
      message: 'Error checking access'
    }, { status: 500 })
  }
}
