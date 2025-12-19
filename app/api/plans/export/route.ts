import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getAdminClient, getUserSubscription, getTierName } from '@/lib/supabase'
import { exportPlanToGoogleSheets, isGoogleSheetsConfigured } from '@/lib/googleSheets'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import { exportFinancialPlanToNotion, getOrCreateFinancialPlanDatabase } from '@/lib/notion'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // FIXED: Use route handler client for proper authentication
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Also try Authorization header if cookies fail
    if (!user) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const { data: tokenData } = await supabase.auth.getUser(token)
        if (tokenData?.user) {
          // User authenticated via token, proceed
          const userId = tokenData.user.id
          logger.info('EXPORT_AUTH_TOKEN', { userId })
          return await handleExport(request, userId, tokenData.user)
        }
      }
      logger.error('EXPORT_AUTH_FAILED', { error: authError?.message || 'No user found' })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return await handleExport(request, user.id, user)
  } catch (error) {
    logger.error('EXPORT_UNHANDLED', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Failed to export', message: error instanceof Error ? error.message : 'Có lỗi khi xuất file' },
      { status: 500 }
    )
  }
}

async function handleExport(request: NextRequest, userId: string, user: any) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  const admin = getAdminClient()
  
  const { planId, format } = await request.json()
  
  if (!planId) {
    return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
  }

  // Get plan data from database - try RLS client first, then admin fallback
  let plan: any = null
  const { data: planData, error: planError } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .eq('user_id', userId)
    .maybeSingle()

  if (planError || !planData) {
    logger.info('EXPORT_PLAN_RLS_FAIL', { planId, userId, error: planError?.message })
    // Fallback to admin client to bypass RLS
    if (admin) {
      const { data: adminPlan, error: adminError } = await admin
        .from('plans')
        .select('*')
        .eq('id', planId)
        .eq('user_id', userId)
        .maybeSingle()
      
      if (!adminError && adminPlan) {
        plan = adminPlan
        logger.info('EXPORT_PLAN_ADMIN_OK', { planId, userId })
      } else {
        logger.error('EXPORT_PLAN_NOT_FOUND', { planId, userId, error: adminError?.message })
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
      }
    } else {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }
  } else {
    plan = planData
  }

  const normalizedFormat = ((): string => {
    if (!format) return 'txt'
    const f = String(format).toLowerCase()
    if (f === 'sheets') return 'google_sheets'
    if (f === 'gdocs') return 'google_docs'
    return f
  })()

  // Tier-based feature gating
  const { data: subData } = await getUserSubscription(userId)
  const tier = subData?.tier || 'free'
  const tierName = getTierName(tier)

  // Allow PDF and DOCX for all paid tiers (basic, pro, pro_max)
  // Google Sheets available for basic and above (with aggressive cleanup)
  const allowedFormatsByTier: Record<string, string[]> = {
    free: ['txt'],
    basic: ['txt', 'pdf', 'docx', 'google_sheets'],
    pro: ['txt', 'pdf', 'docx', 'notion', 'google_sheets'],
    pro_max: ['txt', 'pdf', 'docx', 'notion', 'google_sheets']
  }

  const allowed = allowedFormatsByTier[tier] || allowedFormatsByTier.free
  if (!allowed.includes(normalizedFormat)) {
    logger.info('EXPORT_TIER_BLOCKED', { format: normalizedFormat, tier, allowed })
    return NextResponse.json(
      {
        error: 'Tính năng chưa được mở khóa',
        message: `Định dạng xuất "${normalizedFormat}" không có trong gói ${tierName}. Vui lòng nâng cấp để sử dụng định dạng này.`,
        upgradeRequired: true
      },
      { status: 403 }
    )
  }

  logger.info('EXPORT_START', { planId, format: normalizedFormat, tier, userId })

  // Handle different export formats
  switch (normalizedFormat) {
    case 'google_sheets':
      // Check if Google Sheets API is configured
      if (!isGoogleSheetsConfigured()) {
        return NextResponse.json({ 
          error: 'Google Sheets API is not configured', 
          message: 'Tính năng xuất sang Google Sheets chưa được cấu hình. Vui lòng liên hệ quản trị viên.'
        }, { status: 503 })
      }
      
      try {
        // Export to Google Sheets using Service Account (no user OAuth needed)
        logger.info('EXPORT_SHEETS_STARTING', { planId, userId })
        const { spreadsheetId, spreadsheetUrl } = await exportPlanToGoogleSheets(plan, userId)
        logger.info('EXPORT_SHEETS_CREATED', { planId, spreadsheetId, userId })
        
        // Update plan with export info using admin client for reliability
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
        
        logger.info('EXPORT_SHEETS_SUCCESS', { planId, spreadsheetUrl, userId })
        return NextResponse.json({
          success: true,
          message: 'Xuất sang Google Sheets thành công',
          url: spreadsheetUrl
        })
      } catch (sheetsError) {
        const errorMessage = sheetsError instanceof Error ? sheetsError.message : String(sheetsError)
        logger.error('EXPORT_SHEETS_ERROR', { error: errorMessage, planId, userId })
        
        // Check if it's a quota error
        if (errorMessage.includes('quota') || errorMessage.includes('storageQuotaExceeded')) {
          logger.warn('EXPORT_SHEETS_QUOTA_ERROR', { planId, userId })
          return NextResponse.json({ 
            error: 'Google Drive storage quota exceeded', 
            message: 'Dung lượng Google Drive đã hết. Vui lòng thử lại sau vài phút.'
          }, { status: 503 })
        }
        
        // Check if it's a permission error
        if (errorMessage.includes('permission') || errorMessage.includes('403')) {
          return NextResponse.json({ 
            error: 'Google Sheets API permission error', 
            message: 'Service Account không có quyền tạo Google Sheets. Vui lòng liên hệ quản trị viên để kiểm tra cấu hình Google Cloud.'
          }, { status: 503 })
        }
        
        return NextResponse.json({ 
          error: 'Failed to export to Google Sheets', 
          message: 'Có lỗi khi xuất sang Google Sheets. Vui lòng thử lại sau.'
        }, { status: 500 })
      }
    case 'pdf': {
      try {
        // Use jsPDF with a Unicode font (Noto Sans) loaded at runtime to render Vietnamese correctly
        const { jsPDF } = await import('jspdf')
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

        // Load Noto Sans font from a public source and register it with jsPDF's virtual file system
        try {
          const fontUrl = 'https://github.com/google/fonts/raw/main/ofl/notosans/NotoSans-Regular.ttf'
          const res = await fetch(fontUrl)
          if (!res.ok) {
            logger.error('EXPORT_PDF_FONT_DOWNLOAD_ERROR', { status: res.status })
          } else {
            const arrayBuffer = await res.arrayBuffer()
            const fontBase64 = Buffer.from(arrayBuffer).toString('base64')
            ;(doc as any).addFileToVFS('NotoSans-Regular.ttf', fontBase64)
            ;(doc as any).addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal')
          }
        } catch (fontError) {
          logger.error('EXPORT_PDF_FONT_ERROR', { error: String(fontError) })
        }

        const title = String(plan.title || 'Kế hoạch tài chính')
        const content = String(plan.content || '')
        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        const margin = 20
        const maxWidth = pageWidth - margin * 2
        let yPos = margin

        // Helper function to add new page if needed
        const checkNewPage = (height: number = 10) => {
          if (yPos + height > pageHeight - margin) {
            doc.addPage()
            yPos = margin
            doc.setFont('NotoSans', 'normal')
          }
        }

        // Helper to clean markdown formatting for display
        const cleanText = (text: string) => {
          return text
            .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove bold markers
            .replace(/\*([^*]+)\*/g, '$1')      // Remove italic markers
            .replace(/`([^`]+)`/g, '$1')        // Remove code markers
            .trim()
        }

        // Make sure our Unicode font is the active font
        doc.setFont('NotoSans', 'normal')

        // Title
        doc.setFontSize(20)
        const titleLines = doc.splitTextToSize(title, maxWidth)
        doc.text(titleLines, pageWidth / 2, yPos, { align: 'center' })
        yPos += titleLines.length * 8 + 5

        // Date
        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.text(`Ngày tạo: ${new Date(plan.created_at).toLocaleDateString('vi-VN')}`, pageWidth / 2, yPos, { align: 'center' })
        yPos += 10
        doc.setTextColor(0, 0, 0)

        // Parse and render markdown content
        const lines = content.split('\n')
        for (const line of lines) {
          const trimmed = line.trim()
          
          // Skip empty lines
          if (!trimmed) {
            yPos += 3
            continue
          }

          // H1: # Title
          if (trimmed.startsWith('# ')) {
            checkNewPage(15)
            yPos += 5
            doc.setFontSize(16)
            const h1Lines = doc.splitTextToSize(cleanText(trimmed.slice(2)), maxWidth)
            doc.text(h1Lines, margin, yPos)
            yPos += h1Lines.length * 7 + 3
            continue
          }

          // H2: ## Section
          if (trimmed.startsWith('## ')) {
            checkNewPage(12)
            yPos += 4
            doc.setFontSize(14)
            const h2Lines = doc.splitTextToSize(cleanText(trimmed.slice(3)), maxWidth)
            doc.text(h2Lines, margin, yPos)
            yPos += h2Lines.length * 6 + 2
            continue
          }

          // H3: ### Subsection
          if (trimmed.startsWith('### ')) {
            checkNewPage(10)
            yPos += 3
            doc.setFontSize(12)
            const h3Lines = doc.splitTextToSize(cleanText(trimmed.slice(4)), maxWidth)
            doc.text(h3Lines, margin, yPos)
            yPos += h3Lines.length * 5 + 2
            continue
          }

          // H4: #### Sub-subsection
          if (trimmed.startsWith('#### ')) {
            checkNewPage(8)
            doc.setFontSize(11)
            const h4Lines = doc.splitTextToSize(cleanText(trimmed.slice(5)), maxWidth)
            doc.text(h4Lines, margin, yPos)
            yPos += h4Lines.length * 5 + 1
            continue
          }

          // Bullet points: - or • or *
          if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
            checkNewPage(8)
            doc.setFontSize(10)
            const bulletText = cleanText(trimmed.slice(2))
            const bulletLines = doc.splitTextToSize('  • ' + bulletText, maxWidth - 5)
            doc.text(bulletLines, margin + 3, yPos)
            yPos += bulletLines.length * 4 + 1
            continue
          }

          // Regular paragraph
          checkNewPage(8)
          doc.setFontSize(10)
          const paraLines = doc.splitTextToSize(cleanText(trimmed), maxWidth)
          doc.text(paraLines, margin, yPos)
          yPos += paraLines.length * 4 + 1
        }

        // Footer
        checkNewPage(15)
        yPos += 10
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text('Được tạo bởi PlanAI.io.vn - Trợ lý tài chính AI thông minh', pageWidth / 2, yPos, { align: 'center' })

        // Get PDF as buffer
        const pdfOutput = doc.output('arraybuffer')
        const buffer = Buffer.from(pdfOutput)
        
        logger.info('EXPORT_PDF_SUCCESS', { planId, userId, size: buffer.length })
        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=plan-${plan.id}.pdf`
          }
        })
      } catch (pdfError) {
        logger.error('EXPORT_PDF_ERROR', { error: String(pdfError), planId, userId })
        return NextResponse.json({ error: 'Failed to generate PDF', message: 'Có lỗi khi tạo file PDF. Vui lòng thử lại sau.' }, { status: 500 })
      }
    }
    
    case 'docx': {
      try {
        const title = String(plan.title || 'Ke hoach tai chinh')
        const content = String(plan.content || '')
        
        // Helper to clean markdown and create text runs
        const createTextRuns = (text: string): TextRun[] => {
          const runs: TextRun[] = []
          // Split by bold markers
          const parts = text.split(/\*\*([^*]+)\*\*/g)
          for (let i = 0; i < parts.length; i++) {
            if (parts[i]) {
              runs.push(new TextRun({ 
                text: parts[i], 
                bold: i % 2 === 1,
                size: 22 
              }))
            }
          }
          return runs.length > 0 ? runs : [new TextRun({ text: text, size: 22 })]
        }

        // Parse content into paragraphs
        const paragraphs: Paragraph[] = [
          // Title
          new Paragraph({ 
            children: [new TextRun({ text: title, bold: true, size: 48 })],
            spacing: { after: 200 }
          }),
          // Date
          new Paragraph({ 
            children: [new TextRun({ text: `Ngay tao: ${new Date(plan.created_at).toLocaleDateString('vi-VN')}`, size: 20, color: '666666' })],
            spacing: { after: 400 }
          })
        ]

        // Parse markdown content
        const lines = content.split('\n')
        for (const line of lines) {
          const trimmed = line.trim()
          
          // Skip empty lines - add spacing
          if (!trimmed) {
            paragraphs.push(new Paragraph({ children: [], spacing: { after: 100 } }))
            continue
          }

          // H1
          if (trimmed.startsWith('# ')) {
            paragraphs.push(new Paragraph({
              children: [new TextRun({ text: trimmed.slice(2), bold: true, size: 36 })],
              spacing: { before: 300, after: 150 }
            }))
            continue
          }

          // H2
          if (trimmed.startsWith('## ')) {
            paragraphs.push(new Paragraph({
              children: [new TextRun({ text: trimmed.slice(3), bold: true, size: 32 })],
              spacing: { before: 250, after: 120 }
            }))
            continue
          }

          // H3
          if (trimmed.startsWith('### ')) {
            paragraphs.push(new Paragraph({
              children: [new TextRun({ text: trimmed.slice(4), bold: true, size: 28 })],
              spacing: { before: 200, after: 100 }
            }))
            continue
          }

          // H4
          if (trimmed.startsWith('#### ')) {
            paragraphs.push(new Paragraph({
              children: [new TextRun({ text: trimmed.slice(5), bold: true, size: 24 })],
              spacing: { before: 150, after: 80 }
            }))
            continue
          }

          // Bullet points
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            paragraphs.push(new Paragraph({
              children: createTextRuns(trimmed.slice(2)),
              bullet: { level: 0 },
              spacing: { after: 50 }
            }))
            continue
          }

          // Regular paragraph
          paragraphs.push(new Paragraph({
            children: createTextRuns(trimmed),
            spacing: { after: 80 }
          }))
        }

        // Footer
        paragraphs.push(new Paragraph({ children: [], spacing: { after: 400 } }))
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: 'Duoc tao boi PlanAI.io.vn - Tro ly tai chinh AI thong minh', size: 18, color: '888888', italics: true })],
          alignment: 'center' as any
        }))

        const doc = new Document({
          sections: [{
            properties: {},
            children: paragraphs
          }]
        })
        
        const buffer = await Packer.toBuffer(doc)
        logger.info('EXPORT_DOCX_SUCCESS', { planId, userId, size: buffer.length })
        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename=plan-${plan.id}.docx`
          }
        })
      } catch (docxError) {
        logger.error('EXPORT_DOCX_ERROR', { error: String(docxError), planId, userId })
        return NextResponse.json({ error: 'Failed to generate DOCX', message: 'Co loi khi tao file Word. Vui long thu lai sau.' }, { status: 500 })
      }
    }
    
    case 'txt': {
      const title = plan.title || 'Kế hoạch tài chính'
      const fullContent = `${title}\n${'='.repeat(title.length)}\n\n${plan.content || ''}`
      logger.info('EXPORT_TXT_SUCCESS', { planId, userId })
      return new NextResponse(fullContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename=plan-${plan.id}.txt`
        }
      })
    }
      
    case 'notion':
      try {
        const dbId = await getOrCreateFinancialPlanDatabase(userId)
        const planData = { ...(plan.collected_info || {}), content: plan.content || '' }
        const url = await exportFinancialPlanToNotion(userId, plan.title || 'Kế hoạch tài chính', planData, dbId)
        const updateClient = admin || supabase
        await updateClient
          .from('plans')
          .update({ last_exported_at: new Date().toISOString() })
          .eq('id', planId)
        logger.info('EXPORT_NOTION_SUCCESS', { planId, userId, url })
        return NextResponse.json({ success: true, url })
      } catch (e) {
        logger.error('EXPORT_NOTION_ERROR', { error: String(e), planId, userId })
        return NextResponse.json({ error: 'Failed to export to Notion', message: 'Có lỗi khi xuất sang Notion' }, { status: 500 })
      }
      
    default:
      return NextResponse.json({ error: 'Unsupported export format', message: 'Định dạng không được hỗ trợ' }, { status: 400 })
  }
}
