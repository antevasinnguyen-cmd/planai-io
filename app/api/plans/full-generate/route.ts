import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import crypto from 'crypto'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { getUserSubscription, getSubscriptionLimits } from '@/lib/supabase'
import { exportPlanToGoogleSheets } from '@/lib/googleSheets'
import { exportFinancialPlanToNotion, getOrCreateFinancialPlanDatabase } from '@/lib/notion'
import { z } from 'zod'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// Lightweight validator to avoid adding new deps
function isNonEmptyString(v: any): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const out: any = {}
  for (const k of keys) out[k] = (obj as any)?.[k]
  return out
}

export async function POST(req: NextRequest) {
  try {
    logger.info('ONECALL_START')
    const body = await req.json()
    const { planName, goals, collectedInfo = {} } = body || {}

    // Auth via route handler client (RLS-safe)
    const rh = createRouteHandlerClient({ cookies: () => cookies() })
    const { data: auth } = await rh.auth.getUser()
    if (!auth?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = auth.user.id

    // Tier & limits
    const { data: sub } = await getUserSubscription(userId)
    const tier = sub?.tier || 'free'
    const limits = getSubscriptionLimits(tier)

    // One-call JSON schema (prompt fragment)
    const constraints = {
      max_words: limits.words || 1500,
      max_mermaid: tier === 'free' ? 2 : tier === 'basic' ? 3 : tier === 'pro' ? 4 : 6,
      max_tables: tier === 'free' ? 2 : tier === 'basic' ? 4 : tier === 'pro' ? 5 : 6,
      min_resources: tier === 'free' ? 7 : tier === 'basic' ? 20 : tier === 'pro' ? 40 : 50,
      max_resources: tier === 'free' ? 10 : tier === 'basic' ? 25 : tier === 'pro' ? 50 : 60,
      resources_policy: 'gpt_only'
    }

    const systemPrompt = [
      'Bạn là PlanAI 5.0 - chuyên gia lập kế hoạch tài chính Việt Nam 2025. HÃY TRẢ VỀ MỘT JSON DUY NHẤT, TUÂN THỦ NGHIÊM NGẶT SCHEMA. KHÔNG THÊM VĂN BẢN THỪA.',
      'Schema keys: title, summary, tier, content_markdown, mermaid_blocks[], tables_md[], sheets_spec{enabled,title,sheets[{name,headers[],rows[][]}]}, notion_spec{enabled,title,cover_url,children[]}, resources[{type,title,url,locale,reason,min_views}], constraints{max_words,max_mermaid,max_tables,resources_policy}.',
      'Giọng văn: bạn thân 10 năm, thông thái, chuyên gia tài chính, thân thiện, dùng chính câu nói/cách xưng hô của user.',
      'Mọi hành động phải khả thi trong 24h tới (ưu tiên hành động nhỏ, rõ người thực hiện, có tiêu chí hoàn thành & link học).',
      'content_markdown phải là toàn bộ bản kế hoạch (Markdown GFM); KHÔNG nhúng Mermaid trong phần này (để riêng ở mermaid_blocks). Bảng Markdown phải có format chuẩn: | Header1 | Header2 | ... | \\n |---|---|...| \\n | data1 | data2 | ... |',
      'mermaid_blocks: chỉ code Mermaid hợp lệ (flowchart|sequence|gantt|mindmap|timeline); tối đa theo max_mermaid.',
      'tables_md: bảng Markdown thuần với format chuẩn (header row + separator row + data rows); tối đa theo max_tables.',
      'sheets_spec: nếu enabled, định nghĩa các sheet để tạo Google Sheets.',
      'resources: PHẢI CÓ TỐI THIỂU min_resources và TỐI ĐA max_resources link chất lượng cao, ưu tiên Việt Nam; YouTube > 50k views; link công khai mở được ngay. CHỈ DÙNG LINK TỪ DATABASE NÀY (hoặc link uy tín khác nếu không có): finance_personal, investing, business_startup, skills_soft, tech_digital, sales_marketing, accounting_tax, psychology_mindset, health_productivity. Mỗi link phải click vào được ngay, không 404. Mỗi resource phải có: type, title (cụ thể, cá nhân hóa), url (thực), locale (vi/en), reason (tại sao phù hợp với user này).',
      '',
      'CẤU TRÚC THEO TIER:',
      '- Nếu tier là gói TRẢ PHÍ (basic|pro|pro_max): content_markdown phải bao phủ các phần (không cần đánh số trong tiêu đề):',
      '  Tiêu đề (cá nhân hóa với tên + mục tiêu cụ thể); Tổng quan (mục tiêu + hồ sơ cá nhân & bối cảnh chi tiết);',
      '  SWOT cá nhân (Việt Nam - phân tích sâu dựa trên nghề nghiệp, thu nhập, vị trí địa lý, xu hướng thị trường 2025);',
      '  Mục tiêu SMART (cụ thể số liệu, deadline rõ ràng, KPI đo được);',
      '  Phân tích mục tiêu tài chính & chiến lược tổng quan (tính toán cụ thể: thu nhập hiện tại -> mục tiêu, gap analysis, ROI dự kiến);',
      '  Sơ đồ lộ trình/mindmap (đặt code vào mermaid_blocks - phải có milestone rõ ràng);',
      '  Đề xuất chiến lược cụ thể + đi sâu chi tiết (từng bước, từng tháng, từng hành động, budget cần thiết, rủi ro & cách xử lý);',
      '  Những việc cần làm để đạt mục tiêu (chia nhỏ theo tuần, ngày, giờ - mỗi việc có deadline + người thực hiện + tiêu chí hoàn thành);',
      '  Yếu tố khách quan/chủ quan (phân tích sâu: kinh tế VN 2025, ngành nghề, cạnh tranh, tâm lý, kỹ năng hiện có vs cần có);',
      '  Kỹ năng/kinh nghiệm cần có (liệt kê chi tiết, ưu tiên, thời gian học, nguồn học tốt nhất, cách thực hành);',
      '  Kế hoạch tích luỹ tài sản (số tiền cụ thể mỗi tháng, % thu nhập, công cụ tiết kiệm, lãi suất dự kiến);',
      '  Kế hoạch đầu tư & quản trị rủi ro (phân bổ tài sản, % mỗi kênh, stop-loss, diversification, insurance);',
      '  Mô hình kinh doanh phù hợp + các bước cụ thể (nếu có - phân tích chi tiết: market size, target customer, revenue model, cost structure, go-to-market);',
      '  Kế hoạch chi tiết theo thời gian mục tiêu (Năm/Quý/Tháng/Tuần/Ngày - mỗi giai đoạn có mục tiêu số, KPI, checkpoint);',
      '  Checklist hành động theo ngày/tuần/tháng (bảng Markdown, có cột Thời gian | Hành động cụ thể | KPI | Link học | Ghi chú);',
      '  Tài liệu học & kỹ năng (x giờ/tuần, liệt kê ĐẦY ĐỦ min_resources kỹ năng -> link tài liệu tốt nhất từ database, lý do chọn, cách áp dụng);',
      '  3 kịch bản (Tệ nhất/Trung bình/Tốt nhất - mỗi kịch bản có số liệu cụ thể, xác suất, impact) + chiến lược giảm rủi ro chi tiết;',
      '  Phân tích tử vi/chỉ số đường đời/thần số học theo ngày sinh (nhấn mạnh tài chính, sự nghiệp, năm 2025) + hướng đi phù hợp cụ thể;',
      '  Tóm tắt & kết luận hành động (3-5 việc quan trọng nhất phải làm ngay tuần này); Hướng dẫn sử dụng kế hoạch tốt nhất (cách tracking, review, adjust);',
      '  Kết luận & động lực hành động ngay (gọi tên user, nhắc lại mục tiêu, deadline, first action trong 24h).',
      '  Đồng thời, đề xuất sheets_spec với cấu trúc các tab sau: Dashboard, Roadmap, Checklist (checkbox), TietKiem, TangThuNhap, BusinessMetrics (MRR, Churn, CAC, LTV), KyNang_TaiLieu.',
      '- Nếu tier là FREE: giới hạn ~1500 từ, nội dung tổng quát hơn, giữ các mục cốt lõi: Tiêu đề; Tóm tắt thông tin người dùng;',
      '  SWOT; Phân tích mục tiêu tài chính; Các yếu tố khách quan/chủ quan; Tổng quan kỹ năng/kinh nghiệm;',
      '  Mindmap lộ trình tổng quan (mermaid_blocks); Lộ trình Ngày-Tuần-Tháng-Năm (văn bản, link mẫu sheet nếu có);',
      '  Đề xuất hành động; Checklist ngày/tuần/tháng (bảng Markdown); Kết luận.',
      '',
      'Lưu ý:',
      '- Tất cả link phải MỞ ĐƯỢC ngay (nếu không chắc, chọn nguồn uy tín khác hoặc skip).',
      '- Tránh lý thuyết suông; viết cụ thể, áp dụng vào hoàn cảnh của user Việt Nam.',
      '- Bảng Markdown phải format chuẩn, không bỏ separator row.',
      '- Trả về JSON HỢP LỆ duy nhất.'
    ].join('\n')

    const userPrompt = {
      planName: String(planName || 'Kế hoạch tài chính cá nhân hóa'),
      goals: String(goals || collectedInfo?.goal || 'Chưa cung cấp'),
      profile: pick(collectedInfo || {}, [
        'full_name','age','occupation','income','savings','location','timeline','risk_tolerance','readiness'
      ]),
      tier,
      constraints
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: Math.min(8000, Math.ceil((constraints.max_words || 1500) * 1.2)),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(userPrompt).slice(0, 12000) }
      ]
    })

    const raw = completion.choices?.[0]?.message?.content || '{}'
    logger.info('ONECALL_OPENAI_DONE', { size: raw.length })

    // Zod schema for strict validation
    const LLMResponseSchema = z.object({
      title: z.string().min(1).max(200),
      summary: z.string().optional(),
      tier: z.string().optional(),
      content_markdown: z.string().min(1),
      mermaid_blocks: z.array(z.string()).default([]),
      tables_md: z.array(z.string()).default([]),
      sheets_spec: z.object({
        enabled: z.boolean().optional(),
        title: z.string().optional(),
        sheets: z.array(z.object({
          name: z.string(),
          headers: z.array(z.string()).optional(),
          rows: z.array(z.array(z.any())).optional()
        })).optional()
      }).optional(),
      notion_spec: z.object({
        enabled: z.boolean().optional(),
        title: z.string().optional(),
        cover_url: z.string().url().optional(),
        children: z.array(z.any()).optional()
      }).optional(),
      resources: z.array(z.object({
        type: z.string().optional(),
        title: z.string().min(1),
        url: z.string().url(),
        locale: z.string().optional(),
        reason: z.string().optional(),
        min_views: z.number().optional(),
      })).default([]),
      constraints: z.any().optional()
    })

    let parsedRaw: any
    try { parsedRaw = JSON.parse(raw) } catch (e) {
      logger.warn('ONECALL_JSON_PARSE_FAIL', { error: String(e) })
      parsedRaw = {}
    }
    const safe = LLMResponseSchema.safeParse(parsedRaw)
    if (!safe.success) {
      logger.warn('ONECALL_SCHEMA_INVALID', { issues: safe.error.issues?.slice(0, 5) })
    }
    const parsed = safe.success ? safe.data : (parsedRaw || {})

    const content_md = String((parsed as any)?.content_markdown || '')
    const title = isNonEmptyString((parsed as any)?.title) ? (parsed as any).title : String(planName || 'Kế hoạch tài chính')
    const mermaid_blocks: string[] = Array.isArray((parsed as any)?.mermaid_blocks) ? (parsed as any).mermaid_blocks : []
    const tables_md: string[] = Array.isArray((parsed as any)?.tables_md) ? (parsed as any).tables_md : []
    let resources: Array<{ title: string; url: string; [k: string]: any }> = Array.isArray((parsed as any)?.resources) ? (parsed as any).resources : []

    // Optional resource link validation
    const doValidate = process.env.RESOURCES_VALIDATE_HEAD === 'true'
    const filterBroken = process.env.RESOURCES_FILTER_BROKEN === 'true'
    let resourcesValidation: any[] | undefined
    if (doValidate && resources.length) {
      const timeoutMs = Number(process.env.RESOURCES_HEAD_TIMEOUT_MS || 7000)
      const check = async (url: string) => {
        const controller = new AbortController()
        const id = setTimeout(() => controller.abort('timeout'), timeoutMs)
        try {
          const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal as any })
          if (!res.ok) {
            const res2 = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal as any })
            return { url, ok: res2.ok, status: res2.status, finalUrl: res2.url }
          }
          return { url, ok: true, status: res.status, finalUrl: res.url }
        } catch (e: any) {
          return { url, ok: false, status: 0, error: String(e?.message || e) }
        } finally {
          clearTimeout(id)
        }
      }
      const results = await Promise.all(resources.map(r => check(r.url)))
      resourcesValidation = results
      if (filterBroken) {
        const okSet = new Set(results.filter(r => r.ok).map(r => r.url))
        resources = resources.filter(r => okSet.has(r.url))
      }
      logger.info('ONECALL_RESOURCES_VALIDATED', { total: resources.length, results: results.slice(0, 5) })
    }

    // Compute idempotency hash
    const hash = crypto.createHash('sha256').update(
      JSON.stringify({ planName, goals, tier, constraints, profile: userPrompt.profile })
    ).digest('hex').slice(0, 32)

    // Insert plan
    const insertPayload: any = {
      title,
      content: content_md,
      user_id: userId,
      model_used: 'gpt-4o-mini',
      word_count: content_md.split(/\s+/).length,
      collected_info: collectedInfo || {},
      metadata: {
        ...(parsed || {}),
        onecall: {
          hash,
          constraints,
          generated_at: new Date().toISOString(),
        }
      }
    }

    const { data: inserted, error: insertError } = await rh
      .from('plans')
      .insert([insertPayload])
      .select('*')
      .single()

    if (insertError || !inserted) {
      return NextResponse.json({ error: 'Failed to save plan', details: insertError?.message }, { status: 500 })
    }
    logger.info('ONECALL_PLAN_INSERTED', { planId: inserted.id })

    // Auto-create external artifacts (paid tiers only)
    const updates: any = { metadata: { ...(inserted.metadata || {}) } }

    // Google Sheets
    if (limits.allowSheets) {
      try {
        const { spreadsheetUrl, spreadsheetId } = await exportPlanToGoogleSheets(inserted, userId)
        updates.metadata.exports = {
          ...(updates.metadata?.exports || {}),
          googleSheets: { url: spreadsheetUrl, id: spreadsheetId, exportedAt: new Date().toISOString() }
        }
        logger.info('ONECALL_EXPORT_SHEETS_OK', { planId: inserted.id })
      } catch (e) {
        logger.warn('ONECALL_EXPORT_SHEETS_FAIL', { error: String(e) })
      }
    }

    // Notion
    if (limits.allowNotion) {
      try {
        const dbId = await getOrCreateFinancialPlanDatabase(userId)
        const planData = { ...(inserted.collected_info || {}), content: inserted.content || '' }
        const notionUrl = await exportFinancialPlanToNotion(userId, inserted.title || 'Kế hoạch tài chính', planData, dbId)
        updates.metadata.exports = {
          ...(updates.metadata?.exports || {}),
          notion: { url: notionUrl, exportedAt: new Date().toISOString() }
        }
        logger.info('ONECALL_EXPORT_NOTION_OK', { planId: inserted.id })
      } catch (e) {
        logger.warn('ONECALL_EXPORT_NOTION_FAIL', { error: String(e) })
      }
    }

    // Persist metadata updates if any
    if (resourcesValidation) {
      updates.metadata = {
        ...updates.metadata,
        resources_validation: resourcesValidation,
      }
    }

    if (updates.metadata && JSON.stringify(updates.metadata) !== JSON.stringify(inserted.metadata)) {
      await rh.from('plans').update({ metadata: updates.metadata }).eq('id', inserted.id)
    }

    // Response payload
    return NextResponse.json({
      success: true,
      plan: {
        id: inserted.id,
        title: inserted.title,
        content_markdown: inserted.content,
        created_at: inserted.created_at,
      },
      artifacts: {
        mermaid_blocks,
        tables_md,
        resources,
        exports: updates.metadata?.exports || null
      },
      tier,
      constraints
    })
  } catch (error: any) {
    logger.error('ONECALL_UNHANDLED', { error: String(error?.message || error) })
    return NextResponse.json({ error: 'One-call generation failed', details: String(error?.message || error) }, { status: 500 })
  }
}
