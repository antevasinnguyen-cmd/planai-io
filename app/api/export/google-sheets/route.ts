import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { exportToGoogleSheets } from '@/lib/export/googleSheets';

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
