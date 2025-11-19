/**
 * FAST GENERATION ROUTE - Direct synchronous generation for Free tier
 * Tries GPT-4o mini first, falls back to Claude-3.5-haiku on failure
 * Uses chunking and streaming for reliable generation
 * Returns immediately with plan or error
 */

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for free tier

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getUserSubscription, getSubscriptionLimits, getAdminClient } from '@/lib/supabase'
import { getPlanPromptV4, getUserContextV4 } from '@/lib/planPromptV4'
import { logger } from '@/lib/logger'

// --- Simple helpers to extract structured info from chat text (top-level) ---
function extractLineAfter(label: RegExp, text: string): string | null {
  const m = text.match(new RegExp(label.source + '[\\s:：-]*([^\\n]+)', label.flags))
  return m ? m[1].trim() : null
}

function extractSkills(text: string): string[] | null {
  const line = extractLineAfter(/kỹ năng/i, text)
  if (!line) return null
  return line.split(/[,;|]/).map(s => s.trim()).filter(Boolean).slice(0, 10)
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

// Helper: Call Claude-3.5-haiku as fallback
async function callClaudeHaiku(systemPrompt: string, userPrompt: string, maxTokens: number) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Claude API key not configured')
    }

    const Anthropic = require('@anthropic-ai/sdk').default
    const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    logger.info('FAST_FALLBACK_CLAUDE_HAIKU_START', {})
    const response = await claude.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: maxTokens,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: `${systemPrompt}\n\n${userPrompt}`
        }
      ]
    })
    
    const content = response.content?.[0]?.type === 'text' ? response.content[0].text : '{}'
    logger.info('FAST_FALLBACK_CLAUDE_HAIKU_DONE', { size: content.length })
    return content
  } catch (e: any) {
    logger.error('FAST_FALLBACK_CLAUDE_HAIKU_ERROR', { error: String(e?.message || e) })
    throw e
  }
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

    const constraints = {
      max_words: limits.words || 1500,
      max_mermaid: 0,
      max_tables: 0,
      min_resources: 5,
      max_resources: 15,
      resources_policy: 'gpt_only'
    }

    // Build prompts (enrich with chat summary + lightweight extraction)
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
      location: collectedInfo?.location || extractLocation(fullChatSummary) || undefined
    }

    const enrichedCollectedInfo = { ...collectedInfo, chat_summary: fullChatSummary, ...extracted }

    // Log extracted data for debugging
    logger.info('FAST_GENERATE_EXTRACTED_DATA', {
      income: extracted.income,
      target_income: extracted.target_income,
      timeline: extracted.timeline,
      skills: extracted.skills?.length || 0
    })

    const systemPrompt = getPlanPromptV4(tier, constraints, enrichedCollectedInfo)
    const userContext = getUserContextV4(enrichedCollectedInfo)
    const userTimeline = enrichedCollectedInfo?.timeline || '12 tháng'
    const forceTextOnly = `\n\n⚠️⚠️⚠️ CHÚ Ý QUAN TRỌNG NHẤT ⚠️⚠️⚠️\n1. TUYỆT ĐỐI KHÔNG dùng bảng Markdown\n2. TUYỆT ĐỐI KHÔNG dùng Mermaid/sơ đồ\n3. Dùng thời gian chung chung: "tháng thứ nhất", "quý thứ nhất", v.v.\n4. Nội dung là văn bản thuần với Markdown cơ bản\n5. KHÔNG có phần "Xuất Dữ Liệu Bảng"\n6. FREE = đúng 9 phần + CTA nâng cấp ở cuối\n`
    const userPrompt = `${userContext}\n\n🎯 YÊU CẦU CỤ THỂ:\n${goals}\n\n⏰ TIMELINE: ${userTimeline}\n\n📊 TIER: ${tier.toUpperCase()}\n${forceTextOnly}`

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

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
    
    // 120s timeout for GPT (we have 5 minutes total now)
    const timeoutMs = 120000 // 2 minutes for GPT
    const maxTokens = 8000 // Enough for 5,000 words as required (1 token ≈ 0.75 words in Vietnamese)

    let raw = '{}'
    let usedModel = 'gpt-4o-mini'

    // Try GPT-4o mini first with streaming
    try {
      logger.info('FAST_GENERATE_CALL_OPENAI', {})
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
      
      // Update progress to 10%
      await updatePartialPlan(admin, planId, 10)
      
      // Use streaming to get partial results
      const stream = await openai.chat.completions.create(
        {
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: maxTokens,
          messages: [
            { role: 'system', content: String(systemPrompt) },
            { role: 'user', content: userPrompt.slice(0, 7000) }
          ],
          stream: true
        },
        { signal: controller.signal }
      )
      
      // Process stream
      let streamedContent = ''
      let lastProgressUpdate = Date.now()
      let progressCounter = 15 // Start at 15%
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ''
        streamedContent += content
        
        // Update progress every 3 seconds
        const now = Date.now()
        if (now - lastProgressUpdate > 3000 && progressCounter < 80) {
          lastProgressUpdate = now
          progressCounter += 5
          await updatePartialPlan(admin, planId, progressCounter)
        }
      }
      
      clearTimeout(timeoutId)
      raw = streamedContent || '{}'
      logger.info('FAST_GENERATE_OPENAI_DONE', { size: raw.length, model: 'gpt-4o-mini' })
      
      // Update progress to 85%
      await updatePartialPlan(admin, planId, 85)
    } catch (gptError: any) {
      const gptErrorMsg = String(gptError?.message || gptError)
      logger.error('FAST_GENERATE_OPENAI_FAILED', { error: gptErrorMsg })
      
      // Fallback to Claude-3.5-haiku
      if (process.env.ANTHROPIC_API_KEY) {
        try {
          // Update progress for fallback
          await updatePartialPlan(admin, planId, 40, 'Đang tạo kế hoạch với Claude AI...')
          
          logger.info('FAST_GENERATE_FALLBACK_CLAUDE_HAIKU', {})
          raw = await callClaudeHaiku(String(systemPrompt), userPrompt.slice(0, 7000), maxTokens)
          usedModel = 'claude-3-5-haiku'
          logger.info('FAST_GENERATE_CLAUDE_HAIKU_DONE', { size: raw.length, model: usedModel })
          
          // Update progress after Claude success
          await updatePartialPlan(admin, planId, 85)
        } catch (fallbackError: any) {
          const fallbackErrorMsg = String(fallbackError?.message || fallbackError)
          logger.error('FAST_GENERATE_CLAUDE_HAIKU_FAILED', { error: fallbackErrorMsg })
          return NextResponse.json(
            { error: 'AI generation failed', message: 'Hệ thống AI đang xử lý quá tải. Vui lòng thử lại sau.' },
            { status: 503 }
          )
        }
      } else {
        logger.error('FAST_GENERATE_NO_CLAUDE_KEY', {})
        return NextResponse.json(
          { error: 'AI generation failed', message: 'Hệ thống AI đang xử lý quá tải. Vui lòng thử lại sau.' },
          { status: 503 }
        )
      }
    }

    // Update progress to 90%
    await updatePartialPlan(admin, planId, 90)
    
    // Parse and sanitize
    let parsed: any
    try {
      parsed = JSON.parse(raw)
    } catch (parseError) {
      logger.error('FAST_GENERATE_PARSE_ERROR', { error: String(parseError) })
      // If not valid JSON, try to extract JSON part
      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0])
          logger.info('FAST_GENERATE_PARSE_RECOVERED', {})
        } else {
          parsed = {}
        }
      } catch {
        parsed = {}
      }
    }

    let content_md = String(parsed?.content_markdown || '')
    const title = typeof parsed?.title === 'string' && parsed.title.trim().length ? parsed.title : (planName || 'Kế hoạch tài chính')

    // Clean content
    content_md = content_md
      .replace(/\|[^\n]*\|[^\n]*\|[\s\S]*?(?=\n\s*\n|$)/g, '')
      .replace(/```mermaid[\s\S]*?```/g, '')
      .replace(/#+\s*Xuất Dữ Liệu Bảng[\s\S]*?(#+|$)/i, '$1')
      .replace(/#+\s*$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      // Remove meta-instruction leakage lines
      .replace(/^(?:Mỗi tháng liệt kê|Không đưa ví dụ chung chung|Nếu thiếu dữ liệu|Trình bày theo văn bản|Hãy lập kế hoạch|Viết kế hoạch THEO THÁNG)[^\n]*$/gim, '')

    // Add CTA
    if (!content_md.includes('NÂNG CẤP GÓI TRẢ PHÍ NGAY')) {
      content_md += `\n\n**🏁 NÂNG CẤP GÓI TRẢ PHÍ NGAY!**\nBản kế hoạch FREE này chỉ là khởi đầu. Với gói Premium, bạn sẽ nhận được:\n✅ 24 phần phân tích chuyên sâu (gấp 3 lần)\n✅ Google Sheets tự động với 7 tabs tracking\n✅ Phân tích tử vi tài chính & thần số học\n✅ 3-5 mô hình kinh doanh cá nhân hóa\n✅ 50+ tài liệu học tập premium\n✅ Kế hoạch Ngày/Tuần/Tháng/Quý/Năm chi tiết\n✅ Dự báo 3 kịch bản & chiến lược rủi ro\n👉 Nâng cấp tại: https://planai.io.vn/pricing\n`
    }

    // Optional QA validator pass for FREE tier as well (fill gaps, enforce 9 sections)
    try {
      const qaController = new AbortController()
      // Leave headroom from the 5-minute route maxDuration
      const qaTimeoutMs = 90_000
      const qaTimeout = setTimeout(() => qaController.abort(), qaTimeoutMs)
      const qaPrompt = [
        'Bạn là Trưởng biên tập chuyên kiểm tra số liệu và logic. Hãy HOÀN THIỆN + KIỂM TRA CHÉO nội dung kế hoạch dưới đây.',
        '',
        '🔍 NHIỆM VỤ KIỂM TRA SỐ LIỆU (ƯU TIÊN CAO NHẤT):',
        '1. Đọc lại THÔNG TIN NGƯỜI DÙNG bên dưới - thu nhập hiện tại là bao nhiêu?',
        '2. Tìm tất cả chỗ trong kế hoạch có nhắc đến thu nhập hiện tại',
        '3. Kiểm tra: AI có tự bịa số liệu không? (VD: user nói "7-10 triệu" mà AI viết "giả sử 20 triệu")',
        '4. Nếu phát hiện số liệu SAI → SỬA NGAY thành số ĐÚNG từ thông tin user',
        '5. Kiểm tra logic tính toán: Gap, Tiền cần/tháng, Tỷ lệ tiết kiệm - có dùng đúng thu nhập hiện tại không?',
        '',
        'YÊU CẦU HOÀN THIỆN NỘI DUNG:',
        '- Giữ đúng cấu trúc FREE = 9 phần với tiêu đề chuẩn (PHẦN 1 → PHẦN 9)',
        '- KIỂM TRA ĐẶC BIỆT PHẦN 8: PHẢI có 10-12 tài liệu học tập chi tiết, phân loại theo 3 nhóm kỹ năng, mỗi tài liệu có: Tên, Link, Mục tiêu, Thời lượng, Lý do chọn, Cách áp dụng',
        '- Bổ sung khi thiếu: mô hình tăng thu nhập (3–5 mô hình) trong PHẦN 5, hành động chi tiết trọn vẹn timeline trong PHẦN 7, KẾT LUẬN đầy đủ 3 phần ở PHẦN 9',
        '- Nếu timeline ≥ 2 năm: PHẢI có Năm thứ nhất và Năm thứ hai, mỗi năm đủ Q1–Q4 (không được thiếu)',
        '- Không dùng bảng Markdown, không dùng Mermaid, không thêm phần Xuất dữ liệu bảng',
        '- Viết văn bản thuần, trình bày đẹp, súc tích nhưng đủ sâu',
        '',
        '⚠️ CẤM TUYỆT ĐỐI:',
        '❌ Tự bịa số liệu khi đã có dữ liệu thật từ user',
        '❌ Thay đổi số liệu user cung cấp',
        '❌ Dùng số liệu mơ hồ thay vì số cụ thể user đã nói',
        '',
        'THÔNG TIN NGƯỜI DÙNG (ĐỌC KỸ ĐỂ KIỂM TRA CHÉO):',
        userContext.slice(0, 1200),
        '',
        'NỘI DUNG GỐC CẦN HOÀN THIỆN VÀ KIỂM TRA:',
        content_md.slice(0, 24000)
      ].join('\n')

      const qa = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.25,
        max_tokens: 1800,
        messages: [
          { role: 'system', content: 'Bạn là biên tập viên nghiêm khắc, chỉ trả về NỘI DUNG MARKDOWN HOÀN CHỈNH; không thêm text ngoài lề.' },
          { role: 'user', content: qaPrompt }
        ]
      }, { signal: qaController.signal })
      clearTimeout(qaTimeout)
      const improved = qa.choices?.[0]?.message?.content || ''
      if (improved && improved.length > content_md.length * 0.7) {
        content_md = String(improved)
          .replace(/\|[^\n]*\|[^\n]*\|[\s\S]*?(?=\n\s*\n|$)/g, '')
          .replace(/```mermaid[\s\S]*?```/g, '')
          .replace(/#+\s*Xuất Dữ Liệu Bảng[\s\S]*?(#+|$)/i, '$1')
          .replace(/#+\s*$/gm, '')
          .replace(/\n{3,}/g, '\n\n')
      }
    } catch (qaErr) {
      logger.warn('FAST_QA_SKIPPED', { error: String(qaErr) })
    }

    // Update progress to 95%
    await updatePartialPlan(admin, planId, 95)
    
    // Save plan directly - update existing plan instead of creating new one
    try {
      const userId = auth.user.id
      const planPayload = {
        title,
        goal: goals || 'Kế hoạch tài chính',
        content: content_md,
        status: 'completed',
        word_count: content_md.split(/\s+/).length,
        collected_info: collectedInfo || {},
        metadata: JSON.stringify({
          model_used: usedModel,
          generated_at: new Date().toISOString(),
          progress: 100,
          status: 'completed'
        }),
        updated_at: new Date().toISOString()
      }

      logger.info('FAST_GENERATE_SAVE_START', { title, contentLength: content_md.length, userId, planId })
      
      // Update existing plan
      const { data: inserted, error: insertError } = await admin
        .from('plans')
        .update(planPayload)
        .eq('id', planId)
        .select()
        .single()

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

      logger.info('FAST_GENERATE_COMPLETE', { planId: inserted.id, model: usedModel })
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
