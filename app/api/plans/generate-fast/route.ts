/**
 * FAST GENERATION ROUTE - Direct synchronous generation for Free tier
 * Tries GPT-4o mini first, falls back to Claude-3.5-haiku on failure
 * Uses chunking and streaming for reliable generation
 * Returns immediately with plan or error
 */

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for free tier

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getUserSubscription, getSubscriptionLimits, getAdminClient } from '@/lib/supabase'
import { generateLongPlanMultiStep } from '@/lib/planGeneration'
import { logger } from '@/lib/logger'

// --- Simple helpers to extract structured info from chat text (top-level) ---
function extractLineAfter(label: RegExp, text: string): string | null {
  const m = text.match(new RegExp(label.source + '[\\s:：-]*([^\\n]+)', label.flags))
  return m ? m[1].trim() : null
}

function extractSkills(text: string): string[] | null {
  const line = extractLineAfter(/kỹ năng|kinh nghiệm/i, text)
  let list: string[] = []
  if (line) {
    list = line.split(/[;,|\/]|\s+và\s+/i).map(s => s.trim()).filter(Boolean)
  }
  if (!list.length) {
    const dict: Array<{ re: RegExp; val: string }> = [
      { re: /digital\s*marketing/i, val: 'digital marketing' },
      { re: /\bmarketing\b/i, val: 'marketing' },
      { re: /chạy\s*ads|quảng\s*cáo|\bads\b/i, val: 'chạy ads' },
      { re: /facebook\s*ads/i, val: 'facebook ads' },
      { re: /google\s*ads/i, val: 'google ads' },
      { re: /tiktok/i, val: 'tiktok' },
      { re: /youtube/i, val: 'youtube' },
      { re: /sáng\s*tạo\s*nội\s*dung|\bcontent\b/i, val: 'sáng tạo nội dung' },
      { re: /làm\s*sản\s*phẩm|\bproduct\b/i, val: 'làm sản phẩm' },
      { re: /\bseo\b/i, val: 'SEO' },
      { re: /email\s*marketing/i, val: 'email marketing' },
      { re: /kinh\s*doanh\s*online/i, val: 'kinh doanh online' },
      { re: /growth/i, val: 'growth' },
    ]
    const set = new Set<string>()
    for (const d of dict) if (d.re.test(text)) set.add(d.val)
    if (set.size) return Array.from(set).slice(0, 10)
    return null
  }
  return Array.from(new Set(list)).slice(0, 10)
}

function extractSavingsVnd(text: string): number | null {
  const current = text.match(/(?:hiện\s*tại|đang\s*có|hiện\s*có|số\s*dư|tài\s*khoản\s*tiết\s*kiệm|\btk\b)[^\d]{0,30}(\d+(?:[.,]\d+)?)\s*(tỷ|ty|triệu|tr|bn|billion|t)/i)
  if (current) {
    const num = parseFloat(current[1].replace(/[.,]/g, ''))
    const unit = (current[2] || '').toLowerCase()
    if (unit.includes('tỷ') || unit.includes('ty') || unit.includes('bn') || unit.includes('billion')) return num * 1_000_000_000
    return num * 1_000_000
  }
  const targetCtx = /mục\s*tiêu[^\n]{0,80}(tiết\s*kiệm|tài\s*khoản\s*tiết\s*kiệm)/i.test(text)
  if (!targetCtx) {
    const generic = text.match(/(?:tiết\s*kiệm|tài\s*khoản\s*tiết\s*kiệm|\btk\b)[^\d]{0,20}(\d+(?:[.,]\d+)?)\s*(tỷ|ty|triệu|tr|bn|billion|t)/i)
    if (generic) {
      const num2 = parseFloat(generic[1].replace(/[.,]/g, ''))
      const unit2 = (generic[2] || '').toLowerCase()
      if (unit2.includes('tỷ') || unit2.includes('ty') || unit2.includes('bn') || unit2.includes('billion')) return num2 * 1_000_000_000
      return num2 * 1_000_000
    }
  }
  return null
}

function extractIncomeRange(text: string): string | null {
  // Pattern 1: "tầm 7 - 10 triệu" hoặc "7-10 triệu/tháng"
  const m1 = text.match(/(?:tầm|khoảng|từ)?\s*(\d+[\s\.,]*\d*)\s*[-–~]\s*(\d+[\s\.,]*\d*)\s*(triệu|tr|million)/i)
  if (m1) return `${m1[1].replace(/[\s\.,]/g,'')}–${m1[2].replace(/[\s\.,]/g,'')} triệu/tháng`
  
  // Pattern 2: "thu nhập: 7-10 triệu" (có context)
  const m2 = text.match(/thu\s*nhập[^\d]*(\d+[\s\.,]*\d*)\s*[-–~]\s*(\d+[\s\.,]*\d*)\s*(triệu|tr)/i)
  if (m2) return `${m2[1].replace(/[\s\.,]/g,'')}–${m2[2].replace(/[\s\.,]/g,'')} triệu/tháng`
  
  // Pattern 3: "lợi nhuận không cố định, tầm 7 - 10 triệu"
  const m3 = text.match(/(?:lợi\s*nhuận|thu\s*nhập)[^\d]{0,30}(\d+[\s\.,]*\d*)\s*[-–~]\s*(\d+[\s\.,]*\d*)\s*(triệu|tr)/i)
  if (m3) return `${m3[1].replace(/[\s\.,]/g,'')}–${m3[2].replace(/[\s\.,]/g,'')} triệu/tháng`
  
  return null
}

function extractTimelineRange(text: string): string | null {
  const m = text.match(/(\d+)\s*[-–]\s*(\d+)\s*(năm|years)/i)
  if (m) return `${m[1]}–${m[2]} năm`
  return null
}

function extractTimelineSingle(text: string): string | null {
  const mYear = text.match(/(\d+)\s*(năm|year)s?/i)
  if (mYear) return `${mYear[1]} năm`
  const mMonth = text.match(/(\d+)\s*(tháng|month)s?/i)
  if (mMonth) return `${mMonth[1]} tháng`
  return null
}

function extractTargetIncome(text: string): string | null {
  // Pattern 1: "thu nhập mục tiêu là 1 tỷ/tháng"
  const m1 = text.match(/thu\s*nhập\s*mục\s*tiêu[^\d]*(\d+[\d\.,]*)\s*(tỷ|ty|triệu|tr)(?:\/tháng)?/i)
  if (m1) {
    const unit = m1[2].toLowerCase()
    const num = m1[1].replace(/[\.,]/g,'')
    return unit.includes('tỷ') || unit.includes('ty') ? `${num} tỷ/tháng` : `${num} triệu/tháng`
  }
  
  // Pattern 2: "mục tiêu: 1 tỷ/tháng"
  const m2 = text.match(/mục\s*tiêu[^\d]*(\d+[\d\.,]*)\s*(tỷ|ty|triệu|tr)(?:\/tháng)?/i)
  if (m2) {
    const unit = m2[2].toLowerCase()
    const num = m2[1].replace(/[\.,]/g,'')
    return unit.includes('tỷ') || unit.includes('ty') ? `${num} tỷ/tháng` : `${num} triệu/tháng`
  }
  
  return null
}

function extractProject(text: string): string | null {
  const m = text.match(/dự\s*án[^:]*[:\-]?\s*([^\n]+)/i)
  if (m) return m[1].trim()
  if (/saas/i.test(text)) return 'webapp SaaS AI'
  return null
}

function extractLocation(text: string): string | null {
  const m = text.match(/(?:hiện\s*đang\s*ở|đang\s*ở|ở|tại)\s+([^\n,\.]+)/i)
  return m ? m[1].trim() : null
}

// Helper: Create partial plan and return ID
async function createPartialPlan(admin: any, userId: string, title: string, goals: string, collectedInfo: any) {
  try {
    logger.info('FAST_GENERATE_CREATE_PARTIAL', { userId })
    
    // Đảm bảo title và goal không null/undefined
    const safeTitle = title || 'Kế hoạch tài chính (đang tạo...)'
    const safeGoal = goals || 'Kế hoạch tài chính'
    
    // Đảm bảo collected_info là object hợp lệ
    const safeCollectedInfo = typeof collectedInfo === 'object' && collectedInfo !== null ? 
      collectedInfo : {}
    
    const partialPlanPayload = {
      user_id: userId,
      title: safeTitle,
      goal: safeGoal,
      content: '**Đang tạo kế hoạch...**\n\nHệ thống đang xử lý yêu cầu của bạn. Vui lòng đợi trong giây lát.',
      status: 'draft', // Use 'draft' instead of 'generating' to avoid CHECK constraint
      word_count: 0,
      collected_info: safeCollectedInfo,
      metadata: JSON.stringify({
        generation_started: new Date().toISOString(),
        progress: 0,
        status: 'generating' // Track actual status in metadata
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data: partialPlan, error: createError } = await admin
      .from('plans')
      .insert([partialPlanPayload])
      .select()
      .single()
      
    if (createError) {
      logger.error('FAST_GENERATE_CREATE_PARTIAL_ERROR', { 
        error: String(createError), 
        code: createError?.code,
        message: createError?.message,
        details: createError?.details,
        userId,
        payload: partialPlanPayload
      })
      throw createError
    }
    
    logger.info('FAST_GENERATE_PARTIAL_CREATED', { planId: partialPlan.id })
    return partialPlan.id
  } catch (e) {
    logger.error('FAST_GENERATE_CREATE_PARTIAL_EXCEPTION', { error: String(e) })
    throw e
  }
}

// Helper: Update partial plan with progress
async function updatePartialPlan(admin: any, planId: string, progress: number, content?: string) {
  try {
    const updatePayload: any = {
      updated_at: new Date().toISOString(),
      metadata: JSON.stringify({
        progress,
        last_updated: new Date().toISOString()
      })
    }
    
    if (content) {
      updatePayload.content = content
      updatePayload.word_count = content.split(/\s+/).length
    }
    
    const { error: updateError } = await admin
      .from('plans')
      .update(updatePayload)
      .eq('id', planId)
    
    if (updateError) {
      logger.error('FAST_GENERATE_UPDATE_PARTIAL_ERROR', { 
        error: String(updateError),
        planId
      })
    } else {
      logger.info('FAST_GENERATE_UPDATE_PARTIAL', { progress, planId })
    }
  } catch (e) {
    logger.error('FAST_GENERATE_UPDATE_PARTIAL_EXCEPTION', { error: String(e), planId })
  }
}

export async function POST(request: NextRequest) {
  try {
    logger.info('FAST_GENERATE_START', {})
    
    // Parse request body
    let body, planName, goals, collectedInfo
    try {
      body = await request.json()
      planName = body?.planName
      goals = body?.goals
      collectedInfo = body?.collectedInfo || {}
      logger.info('FAST_GENERATE_BODY_PARSED', { planName, goals, hasCollectedInfo: !!collectedInfo })
    } catch (parseError) {
      logger.error('FAST_GENERATE_BODY_PARSE_ERROR', { error: String(parseError) })
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Auth
    let auth
    try {
      const rh = createRouteHandlerClient({ cookies: () => cookies() })
      const authResult = await rh.auth.getUser()
      auth = authResult.data
      logger.info('FAST_GENERATE_AUTH_SUCCESS', { userId: auth?.user?.id })
    } catch (authError) {
      logger.error('FAST_GENERATE_AUTH_ERROR', { error: String(authError) })
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }
    
    if (!auth?.user) {
      logger.error('FAST_GENERATE_NO_USER', {})
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Tier & limits
    let sub, tier, limits
    try {
      const subResult = await getUserSubscription(auth.user.id)
      sub = subResult.data
      tier = sub?.tier || 'free'
      limits = getSubscriptionLimits(tier)
      logger.info('FAST_GENERATE_SUBSCRIPTION_CHECK', { tier, limits })
    } catch (subError) {
      logger.error('FAST_GENERATE_SUBSCRIPTION_ERROR', { error: String(subError) })
      // Continue with free tier as fallback
      tier = 'free'
      limits = getSubscriptionLimits('free')
    }

    // Only for Free tier
    if (tier !== 'free') {
      logger.error('FAST_GENERATE_WRONG_TIER', { tier })
      return NextResponse.json(
        { error: 'Fast route only for Free tier' },
        { status: 400 }
      )
    }

    // Build context (enrich with chat summary + lightweight extraction)
    const messages = Array.isArray(body?.messages) ? body.messages : []
    const fullChatSummary = messages
      .filter((m: any) => m && m.role === 'user')
      .map((m: any) => m.content || m.message)
      .join('\n')
      .slice(0, 4000)

    const extracted = {
      skills: extractSkills(fullChatSummary) || collectedInfo?.skills,
      income: collectedInfo?.income || extractIncomeRange(fullChatSummary) || collectedInfo?.income_range,
      target_income: collectedInfo?.target_income || extractTargetIncome(fullChatSummary),
      timeline: collectedInfo?.timeline || extractTimelineRange(fullChatSummary) || extractTimelineSingle(fullChatSummary),
      project: collectedInfo?.project || collectedInfo?.current_project || extractProject(fullChatSummary) || undefined,
      location: collectedInfo?.location || extractLocation(fullChatSummary) || undefined,
      current_savings: collectedInfo?.current_savings || extractSavingsVnd(fullChatSummary) || undefined
    }

    const enrichedCollectedInfo = { ...collectedInfo, chat_summary: fullChatSummary, ...extracted }

    // Log extracted data for debugging
    logger.info('FAST_GENERATE_EXTRACTED_DATA', {
      income: extracted.income,
      target_income: extracted.target_income,
      timeline: extracted.timeline,
      skills: extracted.skills?.length || 0
    })

    // Legacy prompts removed. Use unified generator below.

    // Create partial plan first to avoid timeout issues
    let admin
    try {
      admin = getAdminClient()
      if (!admin) {
        logger.error('FAST_GENERATE_NO_ADMIN_CLIENT', { userId: auth.user.id })
        return NextResponse.json(
          { error: 'Failed to save plan', message: 'Lỗi cấu hình máy chủ. Vui lòng thử lại sau.' },
          { status: 500 }
        )
      }
      logger.info('FAST_GENERATE_ADMIN_CLIENT_OK', { userId: auth.user.id })
    } catch (adminError) {
      logger.error('FAST_GENERATE_ADMIN_CLIENT_ERROR', { error: String(adminError) })
      return NextResponse.json(
        { error: 'Failed to initialize admin client', message: 'Lỗi cấu hình máy chủ. Vui lòng thử lại sau.' },
        { status: 500 }
      )
    }
    
    // Use userId directly for plan creation (simpler approach)
    const userId = auth.user.id
    const profileIdForPlan = userId
    let planId: string
    try {
      logger.info('FAST_GENERATE_CREATE_PARTIAL_START', { userId, planName, goals })
      planId = await createPartialPlan(admin, profileIdForPlan, planName, goals, collectedInfo)
      logger.info('FAST_GENERATE_CREATE_PARTIAL_SUCCESS', { planId })
    } catch (createError) {
      logger.error('FAST_GENERATE_CREATE_PARTIAL_FAILED', { error: String(createError), userId })
      return NextResponse.json(
        { error: 'Failed to initialize plan', message: 'Không thể khởi tạo kế hoạch. Vui lòng thử lại sau.' },
        { status: 500 }
      )
    }
    
    // Update progress to 5%
    await updatePartialPlan(admin, planId, 5)
    
    // Generate using unified clean generator
    await updatePartialPlan(admin, planId, 10)
    const safeTitle = planName || `Kế hoạch tài chính - ${new Date().toLocaleDateString('vi-VN')}`
    const safeGoals = goals || 'Kế hoạch tài chính'
    let content_md = await generateLongPlanMultiStep(safeTitle, safeGoals, enrichedCollectedInfo)
    await updatePartialPlan(admin, planId, 90)
    const title = safeTitle

    // Do not inject CTA or legacy text

    // No QA rewriter pass in fast route

    // Update progress to 95%
    await updatePartialPlan(admin, planId, 95)
    
    // Save plan directly - update existing plan instead of creating new one
    try {
      const userId = auth.user.id
      const planPayload: Record<string, any> = {
        title,
        goal: goals || 'Kế hoạch tài chính',
        content: content_md,
        status: 'completed',
        word_count: content_md.split(/\s+/).length,
        collected_info: collectedInfo || {},
        metadata: JSON.stringify({
          model_used: 'generator_v4',
          generated_at: new Date().toISOString(),
          progress: 100,
          status: 'completed'
        }),
        updated_at: new Date().toISOString()
      }

      logger.info('FAST_GENERATE_SAVE_START', { title, contentLength: content_md.length, userId, planId })
      
      // Update existing plan
      const { data: inserted, error: insertError } = await ((admin as any)
        .from('plans')
        .update(planPayload)
        .eq('id', planId)
        .select()
        .single() as Promise<{ data: any; error: any }>)

      if (insertError) {
        logger.error('FAST_GENERATE_SAVE_ERROR', { 
          error: String(insertError?.message || insertError),
          code: insertError?.code,
          details: insertError?.details,
          userId
        })
        return NextResponse.json(
          { error: 'Failed to save plan', message: 'Không thể lưu kế hoạch. Vui lòng thử lại sau.' },
          { status: 500 }
        )
      }

      if (!inserted) {
        logger.error('FAST_GENERATE_SAVE_NO_DATA', { error: 'No data returned from insert' })
        return NextResponse.json(
          { error: 'Failed to save plan', message: 'Không thể lưu kế hoạch. Vui lòng thử lại sau.' },
          { status: 500 }
        )
      }

      logger.info('FAST_GENERATE_COMPLETE', { planId: inserted.id, model: 'generator_v4' })
      return NextResponse.json({
        success: true,
        plan: {
          id: inserted.id,
          title: inserted.title,
          content: inserted.content,
          created_at: inserted.created_at
        }
      })
    } catch (saveError: any) {
      logger.error('FAST_GENERATE_SAVE_EXCEPTION', { 
        error: String(saveError?.message || saveError),
        stack: saveError?.stack?.slice(0, 500)
      })
      return NextResponse.json(
        { error: 'Failed to save plan', message: 'Không thể lưu kế hoạch. Vui lòng thử lại sau.' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    logger.error('FAST_GENERATE_ERROR', { 
      error: String(error?.message || error),
      stack: error?.stack?.slice(0, 500),
      name: error?.name,
      code: error?.code
    })
    return NextResponse.json(
      { 
        error: 'Generation failed', 
        message: 'Không thể tạo kế hoạch. Vui lòng thử lại sau.',
        details: error?.message || 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
