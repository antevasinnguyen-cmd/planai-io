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
      status: 'generating',
      word_count: 0,
      collected_info: safeCollectedInfo,
      metadata: JSON.stringify({
        generation_started: new Date().toISOString(),
        progress: 0
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
        code: createError?.code
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
    
    const body = await request.json()
    const { planName, goals, collectedInfo = {} } = body || {}

    // Auth
    const rh = createRouteHandlerClient({ cookies: () => cookies() })
    const { data: auth } = await rh.auth.getUser()
    if (!auth?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Tier & limits
    const { data: sub } = await getUserSubscription(auth.user.id)
    const tier = sub?.tier || 'free'
    const limits = getSubscriptionLimits(tier)

    // Only for Free tier
    if (tier !== 'free') {
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

    // Build prompts
    const systemPrompt = getPlanPromptV4(tier, constraints, collectedInfo)
    const userContext = getUserContextV4(collectedInfo)
    const userTimeline = collectedInfo?.timeline || '12 tháng'
    const forceTextOnly = `\n\n⚠️⚠️⚠️ CHÚ Ý QUAN TRỌNG NHẤT ⚠️⚠️⚠️\n1. TUYỆT ĐỐI KHÔNG dùng bảng Markdown\n2. TUYỆT ĐỐI KHÔNG dùng Mermaid/sơ đồ\n3. Dùng thời gian chung chung: "tháng thứ nhất", "quý thứ nhất", v.v.\n4. Nội dung là văn bản thuần với Markdown cơ bản\n5. KHÔNG có phần "Xuất Dữ Liệu Bảng"\n6. FREE = đúng 9 phần + CTA nâng cấp ở cuối\n`
    const userPrompt = `${userContext}\n\n🎯 YÊU CẦU CỤ THỂ:\n${goals}\n\n⏰ TIMELINE: ${userTimeline}\n\n📊 TIER: ${tier.toUpperCase()}\n${forceTextOnly}`

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    // Create partial plan first to avoid timeout issues
    const admin = getAdminClient()
    if (!admin) {
      logger.error('FAST_GENERATE_NO_ADMIN_CLIENT', { userId: auth.user.id })
      return NextResponse.json(
        { error: 'Failed to save plan', message: 'Lỗi cấu hình máy chủ. Vui lòng thử lại sau.' },
        { status: 500 }
      )
    }
    
    // Create partial plan first
    let planId: string
    try {
      planId = await createPartialPlan(admin, auth.user.id, planName, goals, collectedInfo)
    } catch (createError) {
      return NextResponse.json(
        { error: 'Failed to initialize plan', message: 'Không thể khởi tạo kế hoạch. Vui lòng thử lại sau.' },
        { status: 500 }
      )
    }
    
    // Update progress to 5%
    await updatePartialPlan(admin, planId, 5)
    
    // 120s timeout for GPT (we have 5 minutes total now)
    const timeoutMs = 120000 // 2 minutes for GPT
    const maxTokens = 4000 // Increase to get more content

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

    // Add CTA
    if (!content_md.includes('NÂNG CẤP GÓI TRẢ PHÍ NGAY')) {
      content_md += `\n\n**🏁 NÂNG CẤP GÓI TRẢ PHÍ NGAY!**\nBản kế hoạch FREE này chỉ là khởi đầu. Với gói Premium, bạn sẽ nhận được:\n✅ 24 phần phân tích chuyên sâu (gấp 3 lần)\n✅ Google Sheets tự động với 7 tabs tracking\n✅ Phân tích tử vi tài chính & thần số học\n✅ 3-5 mô hình kinh doanh cá nhân hóa\n✅ 50+ tài liệu học tập premium\n✅ Kế hoạch Ngày/Tuần/Tháng/Quý/Năm chi tiết\n✅ Dự báo 3 kịch bản & chiến lược rủi ro\n👉 Nâng cấp tại: https://planai.io.vn/pricing\n`
    }

    // Update progress to 95%
    await updatePartialPlan(admin, planId, 95)
    
    // Save plan directly with proper error handling
    try {
      const userId = auth.user.id
      
      // Ensure profile exists BEFORE inserting plan
      logger.info('FAST_GENERATE_ENSURE_PROFILE', { userId })
      const { data: existingProfile, error: profileCheckError } = await admin
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle()
      
      if (profileCheckError) {
        logger.error('FAST_GENERATE_PROFILE_CHECK_ERROR', { error: String(profileCheckError) })
      }
      
      if (!existingProfile) {
        logger.info('FAST_GENERATE_PROFILE_NOT_FOUND_CREATING', { userId })
        // Upsert with only fields that definitely exist in profiles table
        const { error: createError } = await admin.from('profiles').upsert({
          id: userId,
          subscription_tier: 'free',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        
        if (createError) {
          logger.error('FAST_GENERATE_PROFILE_CREATE_ERROR', { 
            error: String(createError), 
            code: createError?.code
          })
          // Continue anyway - profile might exist or will be created by auth trigger
        } else {
          logger.info('FAST_GENERATE_PROFILE_CREATED', { userId })
        }
      } else {
        logger.info('FAST_GENERATE_PROFILE_EXISTS', { userId })
      }
      
      // Update existing plan instead of creating new one
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
          progress: 100
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
    logger.error('FAST_GENERATE_ERROR', { error: String(error?.message || error) })
    return NextResponse.json(
      { error: 'Generation failed', message: 'Không thể tạo kế hoạch. Vui lòng thử lại sau.' },
      { status: 500 }
    )
  }
}
