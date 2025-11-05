import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { exportToGoogleSheets } from '@/lib/export/googleSheets';
import { getSubscriptionLimits } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // Get plan ID and refresh token from request
    const { planId, refreshToken } = await req.json();
    
    // Authenticate user via route handler client (RLS cookies)
    const cookieStore = cookies()
    const rh = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: auth } = await rh.auth.getUser()
    if (!auth?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = auth.user.id
    
    // Gate by tier: only paid tiers can export to Google Sheets
    const { data: subs } = await rh
      .from('subscriptions')
      .select('tier,status,created_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
    const subscription: any = Array.isArray(subs) ? subs[0] : subs
    const tier = subscription?.tier || 'free'
    const limits = getSubscriptionLimits(tier)
    if (!limits.allowSheets) {
      return NextResponse.json({ error: 'Tính năng Google Sheets chỉ khả dụng cho gói trả phí' }, { status: 403 })
    }
    
    // Get plan details
    const { data: plan, error: planError } = await rh
      .from('plans')
      .select('*')
      .eq('id', planId)
      .eq('user_id', userId)
      .single();
      
    if (planError || !plan) {
      console.error('Plan retrieval error:', planError);
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    
    // Export to Google Sheets with raw content; helper handles markdown/tables
    const sheetUrl = await exportToGoogleSheets(
      plan.title,
      plan.content,
      refreshToken
    )
    
    // Update plan metadata with export info
    await rh
      .from('plans')
      .update({
        metadata: {
          ...plan.metadata,
          exports: {
            ...(plan.metadata?.exports || {}),
            googleSheets: {
              url: sheetUrl,
              exportedAt: new Date().toISOString()
            }
          }
        }
      })
      .eq('id', planId);
    
    return NextResponse.json({ success: true, url: sheetUrl })
  } catch (error) {
    console.error('Google Sheets export error:', error);
    return NextResponse.json(
      { error: 'Export to Google Sheets failed' },
      { status: 500 }
    );
  }
}
