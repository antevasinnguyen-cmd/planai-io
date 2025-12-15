import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getAdminClient, getSubscriptionLimits } from '@/lib/supabase'
import { exportPlanToGoogleSheets, isGoogleSheetsConfigured } from '@/lib/googleSheets';
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // Get plan ID from request
    const { planId } = await req.json();
    
    // Authenticate user via route handler client (RLS cookies)
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const admin = getAdminClient()
    
    // Try cookie auth first
    let userId: string | null = null
    const { data: auth } = await supabase.auth.getUser()
    if (auth?.user) {
      userId = auth.user.id
    }
    
    // Also try Authorization header if cookies fail
    if (!userId) {
      const authHeader = req.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const { data: tokenData } = await supabase.auth.getUser(token)
        if (tokenData?.user) {
          userId = tokenData.user.id
        }
      }
    }
    
    if (!userId) {
      logger.error('SHEETS_AUTH_FAILED', { planId })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Gate by tier: only pro_max can export to Google Sheets
    const { data: subs } = admin 
      ? await admin
          .from('subscriptions')
          .select('tier,status,created_at')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
      : await supabase
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
      logger.info('SHEETS_TIER_BLOCKED', { userId, tier })
      return NextResponse.json({ error: 'Tính năng Google Sheets chỉ khả dụng cho gói Pro Max' }, { status: 403 })
    }
    
    // Check if Google Sheets Service Account is configured
    if (!isGoogleSheetsConfigured()) {
      logger.error('SHEETS_NOT_CONFIGURED', { userId })
      return NextResponse.json({ 
        error: 'Google Sheets API chưa được cấu hình', 
        message: 'Vui lòng liên hệ quản trị viên để cấu hình Google Sheets Service Account.'
      }, { status: 503 })
    }
    
    // Get plan details - try RLS first, then admin fallback
    let plan: any = null
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .eq('user_id', userId)
      .maybeSingle();
      
    if (planError || !planData) {
      logger.info('SHEETS_PLAN_RLS_FAIL', { planId, userId, error: planError?.message })
      // Fallback to admin client
      if (admin) {
        const { data: adminPlan, error: adminError } = await admin
          .from('plans')
          .select('*')
          .eq('id', planId)
          .eq('user_id', userId)
          .maybeSingle()
        
        if (!adminError && adminPlan) {
          plan = adminPlan
          logger.info('SHEETS_PLAN_ADMIN_OK', { planId, userId })
        } else {
          logger.error('SHEETS_PLAN_NOT_FOUND', { planId, userId })
          return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
        }
      } else {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
      }
    } else {
      plan = planData
    }

    // Export to Google Sheets using Service Account (NO user OAuth needed!)
    // Sheet will be created publicly - anyone with link can view/edit
    try {
      logger.info('SHEETS_EXPORT_START', { planId, userId, title: plan.title })
      
      const { spreadsheetId, spreadsheetUrl } = await exportPlanToGoogleSheets(plan, userId)

      // Update plan metadata with export info using admin client for reliability
      const updateClient = admin || supabase
      await updateClient
        .from('plans')
        .update({
          exported_to_sheets: true,
          sheets_url: spreadsheetUrl,
          sheets_id: spreadsheetId,
          last_exported_at: new Date().toISOString()
        })
        .eq('id', planId)

      logger.info('SHEETS_EXPORT_SUCCESS', { planId, userId, spreadsheetUrl })
      return NextResponse.json({ 
        success: true, 
        url: spreadsheetUrl,
        message: 'Đã tạo Google Sheets thành công! Bất kỳ ai có link đều có thể xem và chỉnh sửa.'
      })
    } catch (exportError) {
      logger.error('SHEETS_EXPORT_ERROR', { 
        planId, 
        userId, 
        error: exportError instanceof Error ? exportError.message : String(exportError)
      })
      return NextResponse.json({
        error: 'Không thể tạo Google Sheets',
        message: 'Có lỗi khi xuất sang Google Sheets. Vui lòng thử lại sau.'
      }, { status: 500 })
    }
  } catch (error) {
    logger.error('SHEETS_UNHANDLED', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Có lỗi xảy ra', message: 'Vui lòng thử lại sau.' },
      { status: 500 }
    )
  }
}
