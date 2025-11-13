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
import { getPlanPromptV4, getUserContextV4 } from '@/lib/planPromptV4'
import { enhanceSheetsSpec } from '@/lib/enhanceSheetsSpec'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300

// Lightweight validator to avoid adding new deps
function isNonEmptyString(v: any): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const out: any = {}
  for (const k of keys) out[k] = (obj as any)?.[k]
  return out
}

// Sanitize common Mermaid and Markdown issues the model may produce
function sanitizeMermaid(code: string): string {
  const lines = String(code || '')
    .replace(/\r/g, '')
    .replace(/\t/g, '  ')
    .split(/\n/)
  if (!lines.length) return 'mindmap\n  root\n    Năm 1\n      Quý 1'
  const first = lines[0].trim().toLowerCase()
  if (first.startsWith('mindmap')) {
    const out: string[] = ['mindmap']
    for (let i = 1; i < lines.length; i++) {
      let t = lines[i]
      // remove bullets and list markers
      t = t.replace(/^\s*[\-\*•]+\s*/, '  ')
      // remove flowchart shapes which are invalid in mindmap
      t = t.replace(/[()\[\]{}]/g, '')
      // collapse multiple spaces
      t = t.replace(/\s+$/g, '')
      out.push(t)
    }
    if (out.length === 1) {
      out.push('  root')
      out.push('    Năm 1')
      out.push('      Quý 1')
    }
    return out.join('\n')
  }
  return lines.join('\n')
}

function sanitizeMarkdownTable(tableMd: string): string {
  const lines = String(tableMd || '').trim().split(/\n/)
  if (lines.length < 2) return tableMd
  const header = lines[0]
  const hasSep = /^\s*\|?\s*:?\-/.test(lines[1]) && lines[1].includes('|')
  if (!hasSep && header.includes('|')) {
    const colCount = header.split('|').filter(Boolean).length
    const sep = Array.from({ length: colCount }, () => '---').join(' | ')
    lines.splice(1, 0, `| ${sep} |`)
  }
  return lines.join('\n')
}

function sanitizeInlineTablesInContent(md: string): string {
  const lines = String(md || '').split(/\n/)
  for (let i = 0; i < lines.length - 1; i++) {
    const header = lines[i]
    const next = lines[i + 1]
    if (/^\s*\|.*\|\s*$/.test(header) && !/^\s*\|?\s*:?-{3,}/.test(next)) {
      const colCount = header.split('|').filter(Boolean).length
      const sep = Array.from({ length: colCount }, () => '---').join(' | ')
      lines.splice(i + 1, 0, `| ${sep} |`)
      i++
    }
  }
  return lines.join('\n')
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
      max_tables: tier === 'free' ? 8 : tier === 'basic' ? 10 : tier === 'pro' ? 12 : 15,
      min_resources: tier === 'free' ? 5 : tier === 'basic' ? 25 : tier === 'pro' ? 45 : 60,
      max_resources: tier === 'free' ? 15 : tier === 'basic' ? 35 : tier === 'pro' ? 60 : 80,
      resources_policy: 'gpt_only'
    }

    // FORCE V4 PROMPT - simplified and focused on working correctly
    const systemPrompt = getPlanPromptV4(tier, constraints, collectedInfo)
    const userContext = getUserContextV4(collectedInfo)
    
    // FORCE ADDITIONAL INSTRUCTIONS TO PREVENT TABLES AND MERMAID
    const forceTextOnly = `

⚠️⚠️⚠️ CHÚ Ý QUAN TRỌNG NHẤT ⚠️⚠️⚠️
1. TUYỆT ĐỐI KHÔNG sử dụng bảng Markdown - chuyển sang dạng danh sách văn bản
2. TUYỆT ĐỐI KHÔNG sử dụng Mermaid hoặc biểu đồ - mô tả bằng văn bản thay thế
3. TUYỆT ĐỐI KHÔNG sử dụng ngày/tháng cụ thể - dùng "tháng thứ nhất", "quý thứ nhất", v.v.
4. TUYỆT ĐỐI KHÔNG sử dụng cú pháp đặc biệt gây lỗi hiển thị
5. TUYỆT ĐỐI KHÔNG có phần "Xuất Dữ Liệu Bảng"
6. MỌI nội dung phải ở dạng văn bản thuần với Markdown cơ bản
7. Nếu là gói FREE, phải có đúng 9 phần và CTA nâng cấp ở cuối
8. Nếu là gói PREMIUM, phải có đúng 24 phần
`

    // Extract timeline for personalized planning
    const userTimeline = collectedInfo?.timeline || '12 tháng'

    const userPrompt = `
${userContext}

🎯 YÊU CẦU CỤ THỂ:
${goals || collectedInfo?.goal || 'Lập kế hoạch tài chính tổng thể'}

⏰ TIMELINE: ${userTimeline}

📊 TIER: ${tier.toUpperCase()}
${forceTextOnly}
`

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    // All tiers use GPT-4 Turbo (unified model strategy)
    const model = 'gpt-4-turbo'
    const temperature = tier === 'free' ? 0.5 : 0.3
    const generationTimeoutMs = tier === 'free' ? 60000 : 300000

    // systemPrompt is now a string from V2
    const systemPromptStr = String(systemPrompt)
    
    let raw: string = '{}'
    
    // Try GPT-4 Turbo first with timeout
    try {
      logger.info('ONECALL_TRY_GPT4_TURBO', {})
      
      // Dynamic timeout by tier (free: 60s, paid: 300s)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
        logger.warn('ONECALL_GPT4_TIMEOUT', { timeout: `${generationTimeoutMs/1000}s` })
      }, generationTimeoutMs)
      
      const completion = await openai.chat.completions.create(
        {
          model,
          response_format: { type: 'json_object' },
          temperature,
          // Reduce max_tokens to prevent timeout (was 4096, causing 60+ min hangs)
          max_tokens: Math.min(3000, Math.ceil((constraints.max_words || 1500) * 1.5)),
          messages: [
            { role: 'system', content: systemPromptStr },
            { role: 'user', content: userPrompt.slice(0, 8000) } // Reduced from 12000
          ]
        },
        {
          signal: controller.signal
        }
      )
      
      clearTimeout(timeoutId)
      raw = completion.choices?.[0]?.message?.content || '{}'
      logger.info('ONECALL_OPENAI_DONE', { size: raw.length })
    } catch (gptError) {
      logger.error('ONECALL_GPT4_FAILED', { error: String(gptError) })
      
      // Fallback to Claude 3 Opus
      try {
        logger.info('ONECALL_FALLBACK_TO_CLAUDE', {})
        const Anthropic = require('@anthropic-ai/sdk').default
        const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
        
        const claudeCompletion = await claude.messages.create({
          model: 'claude-3-opus-20240229',
          max_tokens: Math.min(4096, Math.ceil((constraints.max_words || 1500) * 2.0)),
          messages: [
            {
              role: 'user',
              content: `${systemPromptStr}\n\n${JSON.stringify(userPrompt).slice(0, 12000)}`
            }
          ]
        })
        
        raw = claudeCompletion.content?.[0]?.type === 'text' ? claudeCompletion.content[0].text : '{}'
        logger.info('ONECALL_CLAUDE_DONE', { size: raw.length })
      } catch (claudeError) {
        logger.error('ONECALL_CLAUDE_FAILED', { error: String(claudeError) })
        return NextResponse.json({ 
          error: 'Plan generation failed',
          message: 'Cả GPT-4 Turbo và Claude 3 Opus đều không thể tạo kế hoạch. Vui lòng thử lại sau.'
        }, { status: 500 })
      }
    }

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

    let content_md = String((parsed as any)?.content_markdown || '')
    const title = isNonEmptyString((parsed as any)?.title) ? (parsed as any).title : String(planName || 'Kế hoạch tài chính')
    let mermaid_blocks: string[] = Array.isArray((parsed as any)?.mermaid_blocks) ? (parsed as any).mermaid_blocks : []
    let tables_md: string[] = Array.isArray((parsed as any)?.tables_md) ? (parsed as any).tables_md : []

    // Extract any fenced mermaid code blocks accidentally placed inside content_markdown
    try {
      const mermaidFence = /```mermaid\n([\s\S]*?)\n```/g
      const extracted: string[] = []
      content_md = content_md.replace(mermaidFence, (_m, code) => {
        extracted.push(String(code || ''))
        return ''
      })
      if (extracted.length) {
        mermaid_blocks = mermaid_blocks.concat(extracted)
      }
    } catch {}

    // FORCE CLEAN ALL CONTENT - EXTREME MEASURES
    content_md = content_md
      // Remove all tables completely
      .replace(/\|[^\n]*\|[^\n]*\|[\s\S]*?(?=\n\s*\n|$)/g, '')
      // Remove all mermaid blocks
      .replace(/```mermaid[\s\S]*?```/g, '')
      // Remove "Xuất Dữ Liệu Bảng" section
      .replace(/#+\s*Xuất Dữ Liệu Bảng[\s\S]*?(#+|$)/i, '$1')
      // Fix any broken headers
      .replace(/#+\s*$/gm, '')
      // Fix multiple consecutive newlines
      .replace(/\n{3,}/g, '\n\n')
    
    // FORCE ADD CTA FOR FREE TIER - V4 REQUIREMENT
    if (tier === 'free' && !content_md.includes('NÂNG CẤP GÓI TRẢ PHÍ NGAY')) {
      content_md += `

**🏁 NÂNG CẤP GÓI TRẢ PHÍ NGAY!**
Bản kế hoạch FREE này chỉ là khởi đầu. Với gói Premium, bạn sẽ nhận được:
✅ 24 phần phân tích chuyên sâu (gấp 3 lần)
✅ Google Sheets tự động với 7 tabs tracking
✅ Phân tích tử vi tài chính & thần số học
✅ 3-5 mô hình kinh doanh cá nhân hóa
✅ 50+ tài liệu học tập premium
✅ Kế hoạch Ngày/Tuần/Tháng/Quý/Năm chi tiết
✅ Dự báo 3 kịch bản & chiến lược rủi ro
👉 Nâng cấp tại: https://planai.io.vn/pricing
`
    }

    // Optional QA validator pass (improve coherence and fill gaps). Enabled for paid tiers by default.
    try {
      const enableQa = process.env.ENABLE_QA_VALIDATOR !== 'false' && tier !== 'free'
      if (enableQa) {
        const qaController = new AbortController()
        const qaTimeoutMs = Math.min(180000, Math.max(60000, generationTimeoutMs - 10000))
        const qaTimeout = setTimeout(() => qaController.abort(), qaTimeoutMs)
        const qaPrompt = [
          'Bạn là Trưởng biên tập biên soạn ebook tài chính. Hãy rà soát và CHỈ TRẢ VỀ duy nhất nội dung Markdown đã được cải thiện.',
          'YÊU CẦU CHẤT LƯỢNG:',
          '- Giữ nguyên cấu trúc bắt buộc (FREE=9 phần, PREMIUM=24 phần).',
          '- Loại mọi bảng/Mermaid. Chỉ dùng tiêu đề, danh sách, đoạn văn.',
          '- Check chéo số liệu và logic, loại placeholder, bổ sung thiếu sót.',
          '- Dùng mốc thời gian chung chung: "tháng thứ nhất", "quý thứ nhất", ...',
          '',
          'THÔNG TIN NGƯỜI DÙNG (rút gọn):',
          userContext.slice(0, 1500),
          '',
          'NỘI DUNG GỐC CẦN SỬA:',
          content_md.slice(0, 24000)
        ].join('\n')
        const qa = await openai.chat.completions.create({
          model: 'gpt-4-turbo',
          temperature: 0.2,
          max_tokens: Math.min(3200, Math.ceil((constraints.max_words || 1500) * 1.6)),
          messages: [
            { role: 'system', content: 'Bạn là biên tập viên nghiêm khắc, trả về duy nhất nội dung Markdown hợp lệ, không thêm text ngoài lề.' },
            { role: 'user', content: qaPrompt }
          ]
        }, { signal: qaController.signal })
        clearTimeout(qaTimeout)
        const improved = qa.choices?.[0]?.message?.content || ''
        if (improved && improved.length > 100) {
          content_md = String(improved)
            .replace(/\|[^\n]*\|[^\n]*\|[\s\S]*?(?=\n\s*\n|$)/g, '')
            .replace(/```mermaid[\s\S]*?```/g, '')
            .replace(/#+\s*Xuất Dữ Liệu Bảng[\s\S]*?(#+|$)/i, '$1')
            .replace(/#+\s*$/gm, '')
            .replace(/\n{3,}/g, '\n\n')
        }
      }
    } catch (qaErr) {
      logger.warn('ONECALL_QA_PASS_SKIPPED', { error: String(qaErr) })
    }
    // FORCE REMOVE ALL MERMAID AND TABLES - V4 REQUIREMENT
    mermaid_blocks = []
    tables_md = []
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
      JSON.stringify({ planName, goals, tier, constraints, profile: collectedInfo })
    ).digest('hex').slice(0, 32)

    // Enhance sheets_spec for premium tiers
    const enhancedSheetsSpec = enhanceSheetsSpec(tier, collectedInfo, {
      totalGoals: parsed?.metadata?.totalGoals || 0,
      monthlySavings: parsed?.metadata?.monthlySavings || 0,
      targetIncome: parsed?.metadata?.targetIncome || collectedInfo?.income || 0,
      targetNetWorth: parsed?.metadata?.targetNetWorth || 0
    })

    // Insert plan
    const insertPayload: any = {
      title,
      content: content_md,
      user_id: userId,
      model_used: model,
      word_count: content_md.split(/\s+/).length,
      collected_info: collectedInfo || {},
      metadata: {
        ...(parsed || {}),
        sheets_spec: enhancedSheetsSpec, // Use enhanced spec
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
