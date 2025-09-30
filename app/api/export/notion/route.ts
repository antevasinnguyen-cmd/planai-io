import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { exportToNotion } from '@/lib/export/notion';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    // Get plan ID and access token from request
    const { planId, accessToken } = await req.json();
    
    // Authenticate user
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .eq('user_id', userId)
      .single();
      
    if (planError || !plan) {
      console.error('Plan retrieval error:', planError);
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    
    // Parse plan content
    let content;
    try {
      content = typeof plan.content === 'string' ? JSON.parse(plan.content) : plan.content;
    } catch (e) {
      content = { summary: plan.content };
    }
    
    // Export to Notion
    const notionUrl = await exportToNotion(
      plan.title,
      content,
      accessToken
    );
    
    // Update plan metadata with export info
    await supabase
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
    
    return NextResponse.json({ 
      success: true,
      url: notionUrl
    });
  } catch (error) {
    console.error('Notion export error:', error);
    return NextResponse.json(
      { error: 'Export to Notion failed' },
      { status: 500 }
    );
  }
}
