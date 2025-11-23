import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { getUserSubscription, getSubscriptionLimits } from '@/lib/supabase'
import { exportPlanToGoogleSheets } from '@/lib/googleSheets'
import { exportFinancialPlanToNotion, getOrCreateFinancialPlanDatabase } from '@/lib/notion'
import { logger } from '@/lib/logger'
import { generateLongPlanMultiStep } from '@/lib/planGeneration'
import { enhanceSheetsSpec } from '@/lib/enhanceSheetsSpec'
import { generateCacheKey, checkCache, saveToCache } from '@/lib/modelSelection'

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

    // 🔥 CACHE CHECK - Kiểm tra xem đã tạo kế hoạch tương tự chưa
    const cacheKey = generateCacheKey([
      { role: 'system', content: 'plan_generation_clean_v1' },
      { role: 'user', content: JSON.stringify({ planName, goals, tier, collectedInfo }) }
    ])
    
    logger.info('ONECALL_CHECK_CACHE', { cacheKey: cacheKey.substring(0, 20) })
    const cachedPlan = await checkCache(cacheKey)
    if (cachedPlan) {
      logger.info('ONECALL_CACHE_HIT', { saved_cost: 'yes' })
      try {
        const parsed = JSON.parse(cachedPlan)
        // Trả về kế hoạch từ cache (tiết kiệm chi phí AI)
        return NextResponse.json({
          success: true,
          cached: true,
          plan: parsed.plan || {},
          artifacts: parsed.artifacts || {},
          tier,
          constraints: parsed.constraints || {}
        })
      } catch (e) {
        logger.warn('ONECALL_CACHE_PARSE_FAIL', { error: String(e) })
        // Tiếp tục generate nếu cache bị lỗi
      }
    }

    // Generate using unified clean generator (no legacy prompts/validation)
    const constraints = { max_words: limits.words || 4000 }
    const safeTitle = planName || 'Kế hoạch tài chính'
    const safeGoals = goals || collectedInfo?.goal || 'Kế hoạch tài chính'
    let content_md = await generateLongPlanMultiStep(safeTitle, safeGoals, { ...collectedInfo, maxWords: limits.words, tier })
    const title = safeTitle
    let mermaid_blocks: string[] = []
    let tables_md: string[] = []

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
    
    // Do not inject CTA or legacy text

    // No QA rewriter pass
    // FORCE REMOVE ALL MERMAID AND TABLES - V4 REQUIREMENT
    mermaid_blocks = []
    tables_md = []
    let resources: Array<{ title: string; url: string; [k: string]: any }> = []

    // Compute idempotency hash
    const hash = crypto.createHash('sha256').update(
      JSON.stringify({ planName, goals, tier, constraints, profile: collectedInfo })
    ).digest('hex').slice(0, 32)

    // Enhance sheets_spec for premium tiers
    const enhancedSheetsSpec = enhanceSheetsSpec(tier, collectedInfo, {
      totalGoals: 0,
      monthlySavings: 0,
      targetIncome: collectedInfo?.income || 0,
      targetNetWorth: 0
    })

    // Insert plan
    const insertPayload: any = {
      title,
      content: content_md,
      user_id: userId,
      model_used: 'generator_v4',
      word_count: content_md.split(/\s+/).length,
      collected_info: { ...(collectedInfo || {}), tier },
      metadata: {
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
    // No resource validation metadata

    if (updates.metadata && JSON.stringify(updates.metadata) !== JSON.stringify(inserted.metadata)) {
      await rh.from('plans').update({ metadata: updates.metadata }).eq('id', inserted.id)
    }

    // 💾 SAVE TO CACHE - Lưu kết quả để tiết kiệm chi phí cho lần sau
    const responsePayload = {
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
    }
    
    try {
      await saveToCache(cacheKey, JSON.stringify(responsePayload))
      logger.info('ONECALL_CACHE_SAVED', { cacheKey: cacheKey.substring(0, 20) })
    } catch (cacheErr) {
      logger.warn('ONECALL_CACHE_SAVE_FAIL', { error: String(cacheErr) })
    }

    // Response payload
    return NextResponse.json(responsePayload)
  } catch (error: any) {
    logger.error('ONECALL_UNHANDLED', { error: String(error?.message || error) })
    return NextResponse.json({ error: 'One-call generation failed', details: String(error?.message || error) }, { status: 500 })
  }
}
