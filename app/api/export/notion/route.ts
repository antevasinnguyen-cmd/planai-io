import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { exportToNotion } from '@/lib/export/notion';

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // Get plan ID and access token from request
    const { planId, accessToken } = await req.json();
    
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
    
    const notionUrl = await exportToNotion(
      plan.title,
      plan.content,
      accessToken
    )
    
    // Update plan metadata with export info
    await rh
      .from('plans')
      .update({
        metadata: {
          ...plan.metadata,
          exports: {
            ...(plan.metadata?.exports || {}),
            notion: {
              url: notionUrl,
              exportedAt: new Date().toISOString()
            }
          }
        }
      })
      .eq('id', planId);
    
    return NextResponse.json({ success: true, url: notionUrl })
  } catch (error) {
    console.error('Notion export error:', error);
    return NextResponse.json(
      { error: 'Export to Notion failed' },
      { status: 500 }
    );
  }
}
