import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getSubscriptionLimits } from '@/lib/supabase'
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
    
    // Create Excel workbook
    const workbook = XLSX.utils.book_new()
    
    // Add summary sheet
    const summaryData = createSummarySheet(plan.content, plan.title)
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tổng quan')
    
    // Parse and add tables from plan content
    const tables = parseMarkdownTables(plan.content)
    const usedNames = new Set(['Tổng quan'])
    
    for (const table of tables) {
      // Ensure unique sheet name
      let sheetName = table.name
      let counter = 1
      while (usedNames.has(sheetName)) {
        sheetName = `${table.name.slice(0, 28)}_${counter}`
        counter++
      }
      usedNames.add(sheetName)
      
      const sheet = XLSX.utils.aoa_to_sheet(table.data)
      
      // Set column widths
      const colWidths = table.data[0].map((_, colIndex) => {
        const maxLen = Math.max(...table.data.map(row => (row[colIndex] || '').length))
        return { wch: Math.min(50, Math.max(10, maxLen + 2)) }
      })
      sheet['!cols'] = colWidths
      
      XLSX.utils.book_append_sheet(workbook, sheet, sheetName)
    }
    
    // If no tables found, create a basic checklist sheet
    if (tables.length === 0) {
      const checklistData = [
        ['Hành động', 'Thời gian', 'Kết quả mong đợi', 'Hoàn thành'],
        ['Xem lại mục tiêu tài chính', 'Hàng tuần', 'Hiểu rõ tiến độ', ''],
        ['Cập nhật thu chi', 'Hàng ngày', 'Kiểm soát tài chính', ''],
        ['Review kế hoạch', 'Hàng tháng', 'Điều chỉnh chiến lược', ''],
      ]
      const checklistSheet = XLSX.utils.aoa_to_sheet(checklistData)
      XLSX.utils.book_append_sheet(workbook, checklistSheet, 'Checklist')
    }
    
    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    
    // Update plan metadata with export info
    await rh
      .from('plans')
      .update({
        metadata: {
          ...plan.metadata,
          exports: {
            ...(plan.metadata?.exports || {}),
            excel: {
              exportedAt: new Date().toISOString()
            }
          }
        }
      })
      .eq('id', planId);
    
    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="ke-hoach-tai-chinh-${planId.slice(0, 8)}.xlsx"`,
      }
    })
  } catch (error) {
    console.error('Google Sheets export error:', error);
    return NextResponse.json(
      { error: 'Export to Excel failed' },
      { status: 500 }
    );
  }
}
