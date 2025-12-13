import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getSubscriptionLimits } from '@/lib/supabase'
import { exportToGoogleSheets } from '@/lib/export/googleSheets';
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

// Parse markdown tables from plan content
function parseMarkdownTables(content: string): { name: string; data: string[][] }[] {
  const sheets: { name: string; data: string[][] }[] = []
  
  // Split content by sections
  const sections = content.split(/(?=^##?\s+)/m)
  
  for (const section of sections) {
    // Find section title
    const titleMatch = section.match(/^##?\s+(?:Phần\s+\d+\.?\s*)?(.+?)(?:\n|$)/i)
    const sectionTitle = titleMatch ? titleMatch[1].trim().slice(0, 31) : 'Sheet'
    
    // Find markdown tables in this section
    const tableRegex = /\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g
    let match
    
    while ((match = tableRegex.exec(section)) !== null) {
      const headerRow = match[1].split('|').map(cell => cell.trim()).filter(Boolean)
      const bodyRows = match[2].trim().split('\n').map(row => 
        row.split('|').map(cell => cell.trim()).filter(Boolean)
      )
      
      // Skip rows with only "---" placeholders
      const cleanRows = bodyRows.filter(row => 
        !row.every(cell => /^-{2,}$/.test(cell) || cell === '')
      )
      
      if (headerRow.length > 0 && cleanRows.length > 0) {
        sheets.push({
          name: sectionTitle.replace(/[\\\/\?\*\[\]]/g, '').slice(0, 31),
          data: [headerRow, ...cleanRows]
        })
      }
    }
  }
  
  return sheets
}

// Create summary sheet from plan content
function createSummarySheet(content: string, title: string): string[][] {
  const data: string[][] = [
    ['KẾ HOẠCH TÀI CHÍNH CÁ NHÂN'],
    [''],
    ['Tiêu đề:', title],
    ['Ngày tạo:', new Date().toLocaleDateString('vi-VN')],
    [''],
    ['HƯỚNG DẪN SỬ DỤNG:'],
    ['1. Mở file này trong Google Sheets hoặc Excel'],
    ['2. Xem các sheet khác nhau để theo dõi từng phần'],
    ['3. Cập nhật tiến độ hàng tuần/tháng'],
    ['4. Đánh dấu các mục đã hoàn thành'],
    [''],
    ['CÁC SHEET TRONG FILE:'],
  ]
  
  return data
}

export async function POST(req: NextRequest) {
  try {
    // Get plan ID from request
    const { planId } = await req.json();
    
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
    
    // Check if user has Google Sheets token
    const { data: tokenData, error: tokenError } = await rh
      .from('user_google_tokens')
      .select('refresh_token, access_token, expires_at')
      .eq('user_id', userId)
      .single();

    if (tokenError || !tokenData?.refresh_token) {
      console.log('No Google token found, returning auth URL');
      return NextResponse.json({
        error: 'Google Sheets authorization required',
        requiresAuth: true,
        authUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google`,
        message: 'Vui lòng cấp quyền truy cập Google Sheets để xuất kế hoạch'
      }, { status: 401 });
    }

    // Check if token is expired
    const expiresAt = new Date(tokenData.expires_at);
    const isExpired = expiresAt < new Date();

    let accessToken = tokenData.access_token;

    // Refresh token if expired
    if (isExpired && tokenData.refresh_token) {
      console.log('Token expired, refreshing...');
      try {
        const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            refresh_token: tokenData.refresh_token,
            grant_type: 'refresh_token',
          }),
        });

        if (refreshRes.ok) {
          const newTokens = await refreshRes.json();
          accessToken = newTokens.access_token;

          // Update token in database
          await rh.from('user_google_tokens').update({
            access_token: newTokens.access_token,
            expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
          }).eq('user_id', userId);
        } else {
          console.error('Token refresh failed');
          return NextResponse.json({
            error: 'Token refresh failed',
            requiresAuth: true,
            authUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google`,
          }, { status: 401 });
        }
      } catch (err) {
        console.error('Token refresh error:', err);
        return NextResponse.json({
          error: 'Token refresh error',
          requiresAuth: true,
          authUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google`,
        }, { status: 401 });
      }
    }

    // Export to Google Sheets
    try {
      const sheetUrl = await exportToGoogleSheets(
        plan.title,
        plan.content,
        tokenData.refresh_token
      );

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

      return NextResponse.json({ success: true, url: sheetUrl });
    } catch (exportError) {
      console.error('Google Sheets export error:', exportError);
      return NextResponse.json({
        error: 'Failed to create Google Sheets',
        message: exportError instanceof Error ? exportError.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Google Sheets export error:', error);
    return NextResponse.json(
      { error: 'Export to Excel failed' },
      { status: 500 }
    );
  }
}
