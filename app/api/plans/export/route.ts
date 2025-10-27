import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, supabase, getUserSubscription, getTierName } from '@/lib/supabase'
import { exportPlanToGoogleSheets, isGoogleSheetsConfigured } from '@/lib/googleSheets'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId, format } = await request.json()
    
    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    // Get plan data from database
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .eq('user_id', user.id) // Ensure the plan belongs to the user
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Tier-based feature gating
    const { data: subData } = await getUserSubscription(user.id)
    const tier = subData?.tier || 'free'
    const tierName = getTierName(tier)

    const allowedFormatsByTier: Record<string, string[]> = {
      free: ['txt'],
      basic: ['txt', 'pdf', 'docx'],
      pro: ['txt', 'pdf', 'docx', 'notion'],
      pro_max: ['txt', 'pdf', 'docx', 'notion', 'google_sheets']
    }

    const allowed = allowedFormatsByTier[tier] || allowedFormatsByTier.free
    if (!allowed.includes(format)) {
      return NextResponse.json(
        {
          error: 'Tính năng chưa được mở khóa',
          message: `Định dạng xuất "${format}" không có trong gói ${tierName}. Vui lòng nâng cấp để sử dụng định dạng này.`,
          upgradeRequired: true
        },
        { status: 403 }
      )
    }

    // Handle different export formats
    switch (format) {
      case 'google_sheets':
        // Check if Google Sheets API is configured
        if (!isGoogleSheetsConfigured()) {
          return NextResponse.json({ 
            error: 'Google Sheets API is not configured', 
            message: 'Tính năng xuất sang Google Sheets chưa được cấu hình. Vui lòng liên hệ quản trị viên.'
          }, { status: 503 })
        }
        
        try {
          // Export to Google Sheets
          const { spreadsheetId, spreadsheetUrl } = await exportPlanToGoogleSheets(plan, user.id)
          
          // Update plan with export info
          await supabase
            .from('plans')
            .update({
              exported_to_sheets: true,
              sheets_url: spreadsheetUrl,
              sheets_id: spreadsheetId,
              last_exported_at: new Date().toISOString()
            })
            .eq('id', planId)
          
          return NextResponse.json({
            success: true,
            message: 'Xuất sang Google Sheets thành công',
            url: spreadsheetUrl
          })
        } catch (sheetsError) {
          console.error('Google Sheets export error:', sheetsError)
          return NextResponse.json({ 
            error: 'Failed to export to Google Sheets', 
            message: 'Có lỗi khi xuất sang Google Sheets. Vui lòng thử lại sau.'
          }, { status: 500 })
        }
        
      case 'pdf':
        // Placeholder for PDF export
        return NextResponse.json({
          success: true,
          message: 'Tính năng xuất PDF sẽ được triển khai trong thời gian tới'
        })
        
      case 'notion':
        // Placeholder for Notion export
        return NextResponse.json({
          success: true,
          message: 'Tính năng đồng bộ với Notion sẽ được triển khai trong thời gian tới'
        })
        
      default:
        return NextResponse.json({ error: 'Unsupported export format' }, { status: 400 })
    }

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
