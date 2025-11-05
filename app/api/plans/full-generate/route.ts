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
      resources_policy: 'gpt_only'
    }

    const systemPrompt = [
      'You are a world-class financial strategist. Output a SINGLE JSON object ONLY, strictly matching the schema. No extra text.',
      'Schema keys: title, summary, tier, content_markdown, mermaid_blocks[], tables_md[], sheets_spec{enabled,title,sheets[{name,headers[],rows[][]}]}, notion_spec{enabled,title,cover_url,children[]}, resources[{type,title,url,locale,reason,min_views}], constraints{max_words,max_mermaid,max_tables,resources_policy}.',
      'Rules:',
      '- Language: Vietnamese for all text fields.',
      '- content_markdown: full plan content in Markdown (GFM). Do NOT include Mermaid here.',
      '- mermaid_blocks: valid Mermaid code only; types: flowchart|sequence|gantt|mindmap|timeline; respect max_mermaid.',
      '- tables_md: plain Markdown tables; respect max_tables.',
      '- sheets_spec: normalized tabular data if helpful. Title concise.',
      '- notion_spec: ebook-like structure with children blocks (heading_2|paragraph|bulleted_list_item|image|code).',
      '- resources: 6-10 high quality links, prefer Vietnamese; for YouTube use >50k views; public links only.',
      '- Respect constraints strictly. Return JSON ONLY.'
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
