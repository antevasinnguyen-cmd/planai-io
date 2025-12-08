import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, supabase, getUserSubscription, getTierName } from '@/lib/supabase'
import { exportPlanToGoogleSheets, isGoogleSheetsConfigured } from '@/lib/googleSheets'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import { exportFinancialPlanToNotion, getOrCreateFinancialPlanDatabase } from '@/lib/notion'
import { logger } from '@/lib/logger'

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

    const normalizedFormat = ((): string => {
      if (!format) return 'txt'
      const f = String(format).toLowerCase()
      if (f === 'sheets' || f === 'gdocs') return 'google_sheets'
      return f
    })()

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
    if (!allowed.includes(normalizedFormat)) {
      return NextResponse.json(
        {
          error: 'Tính năng chưa được mở khóa',
          message: `Định dạng xuất "${normalizedFormat}" không có trong gói ${tierName}. Vui lòng nâng cấp để sử dụng định dạng này.`,
          upgradeRequired: true
        },
        { status: 403 }
      )
    }

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
          logger.error('EXPORT_SHEETS_ERROR', { error: String(sheetsError), planId, userId: user.id })
          return NextResponse.json({ 
            error: 'Failed to export to Google Sheets', 
            message: 'Có lỗi khi xuất sang Google Sheets. Vui lòng thử lại sau.'
          }, { status: 500 })
        }
      case 'pdf': {
        const PDFModule: any = await import('pdfkit')
        const PDFDocument = PDFModule.default || PDFModule
        const doc = new PDFDocument({ size: 'A4', margin: 50 })

        const chunks: Buffer[] = []
        await new Promise<void>((resolve) => {
          doc.on('data', (chunk: any) => chunks.push(chunk as Buffer))
          doc.on('end', () => resolve())

          const title = String(plan.title || 'Kế hoạch tài chính')
          const content = String(plan.content || '')

          // Title
          doc.fontSize(24).font('Helvetica-Bold').text(title, { align: 'center' })
          doc.moveDown(0.5)
          doc.fontSize(10).font('Helvetica').fillColor('#666666').text(`Ngày tạo: ${new Date(plan.created_at).toLocaleDateString('vi-VN')}`, { align: 'center' })
          doc.moveDown(1.5)
          doc.fillColor('#000000')

          // Parse and render markdown content
          const lines = content.split('\n')
          for (const line of lines) {
            const trimmed = line.trim()
            
            // Skip empty lines
            if (!trimmed) {
              doc.moveDown(0.3)
              continue
            }

            // H1: # Title
            if (trimmed.startsWith('# ')) {
              doc.moveDown(0.5)
              doc.fontSize(20).font('Helvetica-Bold').fillColor('#1a1a1a').text(trimmed.slice(2))
              doc.moveDown(0.3)
              continue
            }

            // H2: ## Section
            if (trimmed.startsWith('## ')) {
              doc.moveDown(0.5)
              doc.fontSize(16).font('Helvetica-Bold').fillColor('#4a4a4a').text(trimmed.slice(3))
              doc.moveDown(0.3)
              continue
            }

            // H3: ### Subsection
            if (trimmed.startsWith('### ')) {
              doc.moveDown(0.3)
              doc.fontSize(14).font('Helvetica-Bold').fillColor('#5a5a5a').text(trimmed.slice(4))
              doc.moveDown(0.2)
              continue
            }

            // H4: #### Sub-subsection
            if (trimmed.startsWith('#### ')) {
              doc.fontSize(12).font('Helvetica-Bold').text(trimmed.slice(5))
              doc.moveDown(0.2)
              continue
            }

            // Bullet points: - or • or *
            if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
              const bulletText = trimmed.slice(2)
              // Handle bold text within bullet
              const parts = bulletText.split(/\*\*([^*]+)\*\*/g)
              doc.fontSize(11).font('Helvetica').fillColor('#000000')
              doc.text('  • ', { continued: true })
              for (let i = 0; i < parts.length; i++) {
                if (i % 2 === 1) {
                  doc.font('Helvetica-Bold').text(parts[i], { continued: i < parts.length - 1 })
                } else if (parts[i]) {
                  doc.font('Helvetica').text(parts[i], { continued: i < parts.length - 1 })
                }
              }
              doc.text('') // End line
              continue
            }

            // Regular paragraph - handle bold text
            const parts = trimmed.split(/\*\*([^*]+)\*\*/g)
            doc.fontSize(11).font('Helvetica').fillColor('#000000')
            for (let i = 0; i < parts.length; i++) {
              if (i % 2 === 1) {
                doc.font('Helvetica-Bold').text(parts[i], { continued: i < parts.length - 1 })
              } else if (parts[i]) {
                doc.font('Helvetica').text(parts[i], { continued: i < parts.length - 1 })
              }
            }
            doc.text('') // End line
          }

          // Footer
          doc.moveDown(2)
          doc.fontSize(9).font('Helvetica').fillColor('#888888')
          doc.text('Được tạo bởi PlanAI.io.vn - Trợ lý tài chính AI thông minh', { align: 'center' })

          doc.end()
        })

        const buffer = Buffer.concat(chunks)
        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=plan-${plan.id}.pdf`
          }
        })
      }
      
      case 'docx': {
        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              new Paragraph({ children: [new TextRun({ text: plan.title || 'Kế hoạch tài chính', bold: true, size: 32 })] }),
              ...String(plan.content || '')
                .split('\n')
                .map((line: string) => new Paragraph({ children: [new TextRun({ text: line })] }))
            ]
          }]
        })
        const buffer = await Packer.toBuffer(doc)
        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename=plan-${plan.id}.docx`
          }
        })
      }
      
      case 'txt': {
        const title = plan.title || 'Kế hoạch tài chính'
        const fullContent = `${title}\n${'='.repeat(title.length)}\n\n${plan.content || ''}`
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
          const dbId = await getOrCreateFinancialPlanDatabase(user.id)
          const planData = { ...(plan.collected_info || {}), content: plan.content || '' }
          const url = await exportFinancialPlanToNotion(user.id, plan.title || 'Kế hoạch tài chính', planData, dbId)
          await supabase
            .from('plans')
            .update({ last_exported_at: new Date().toISOString() })
            .eq('id', planId)
          return NextResponse.json({ success: true, url })
        } catch (e) {
          return NextResponse.json({ error: 'Failed to export to Notion' }, { status: 500 })
        }
        
      default:
        return NextResponse.json({ error: 'Unsupported export format' }, { status: 400 })
    }

  } catch (error) {
    logger.error('EXPORT_UNHANDLED', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Failed to export', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
