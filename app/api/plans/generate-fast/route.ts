/**
 * FAST GENERATION ROUTE - Direct synchronous generation for Free tier
 * Tries GPT-4o mini first, falls back to Claude 3 Opus on failure
 * Returns immediately with plan or error
 */

export const runtime = 'nodejs'
export const maxDuration = 70

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getUserSubscription, getSubscriptionLimits, getAdminClient } from '@/lib/supabase'
import { getPlanPromptV4, getUserContextV4 } from '@/lib/planPromptV4'
import { logger } from '@/lib/logger'

// Helper: Call Claude 3 Opus as fallback
async function callClaude(systemPrompt: string, userPrompt: string, maxTokens: number) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Claude API key not configured')
    }
    const Anthropic = require('@anthropic-ai/sdk').default
    const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    
    logger.info('FAST_FALLBACK_CLAUDE_START', {})
    const response = await claude.messages.create({
      model: 'claude-3-5-sonnet-20241022', // Cập nhật model mới nhất
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: `${systemPrompt}\n\n${userPrompt}`
        }
      ]
    })
    
    const content = response.content?.[0]?.type === 'text' ? response.content[0].text : '{}'
    logger.info('FAST_FALLBACK_CLAUDE_DONE', { size: content.length })
    return content
  } catch (e: any) {
    logger.error('FAST_FALLBACK_CLAUDE_ERROR', { error: String(e?.message || e) })
    throw e
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

    // 50s timeout for GPT (leave ~15s headroom for Claude fallback within Vercel 70s)
    const timeoutMs = 50000 // Tăng từ 35s lên 50s để tránh timeout
    const maxTokens = 2000 // Tăng từ 1500 lên 2000 để đủ nội dung

    let raw = '{}'
    let usedModel = 'gpt-4o-mini'

    // Try GPT-4o mini first
    try {
      logger.info('FAST_GENERATE_CALL_OPENAI', {})
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
      
      const completion = await openai.chat.completions.create(
        {
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          temperature: 0.5,
          max_tokens: maxTokens,
          messages: [
            { role: 'system', content: String(systemPrompt) },
            { role: 'user', content: userPrompt.slice(0, 7000) }
          ]
        },
        { signal: controller.signal }
      )
      clearTimeout(timeoutId)
      raw = completion.choices?.[0]?.message?.content || '{}'
      logger.info('FAST_GENERATE_OPENAI_DONE', { size: raw.length, model: 'gpt-4o-mini' })
    } catch (gptError: any) {
      const gptErrorMsg = String(gptError?.message || gptError)
      logger.error('FAST_GENERATE_OPENAI_FAILED', { error: gptErrorMsg })
      
      // Fallback to Claude only if API key is configured
      if (process.env.ANTHROPIC_API_KEY) {
        try {
          logger.info('FAST_GENERATE_FALLBACK_CLAUDE', {})
          raw = await callClaude(String(systemPrompt), userPrompt.slice(0, 7000), maxTokens)
          usedModel = 'claude-3.5-sonnet'
          logger.info('FAST_GENERATE_CLAUDE_DONE', { size: raw.length, model: usedModel })
        } catch (claudeError: any) {
          const claudeErrorMsg = String(claudeError?.message || claudeError)
          logger.error('FAST_GENERATE_CLAUDE_FAILED', { error: claudeErrorMsg })
          return NextResponse.json(
            { error: 'AI generation failed', message: 'Cả GPT-4o mini và Claude đều không thể xử lý. Vui lòng thử lại sau.' },
            { status: 503 }
          )
        }
      } else {
        // No Claude API key, return GPT error
        logger.error('FAST_GENERATE_NO_FALLBACK', { error: 'Claude API key not configured' })
        return NextResponse.json(
          { error: 'AI generation failed', message: `GPT-4o mini không thể xử lý: ${gptErrorMsg}. Vui lòng thử lại sau.` },
          { status: 503 }
        )
      }
    }

    // Parse and sanitize
    let parsed: any
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = {}
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

    // Save plan directly with proper error handling
    try {
      const userId = auth.user.id
      
      // ĐẢM BẢO PROFILE TỒN TẠI TRƯỚC KHI INSERT PLAN
      logger.info('FAST_GENERATE_ENSURE_PROFILE', { userId })
      const admin = getAdminClient()
      
      if (admin) {
        // Kiểm tra profile có tồn tại không
        const { data: existingProfile } = await admin
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .single()
        
        if (!existingProfile) {
          logger.info('FAST_GENERATE_PROFILE_NOT_FOUND', { userId })
          // Tạo profile mới
          const { error: createError } = await admin.from('profiles').insert({
            id: userId,
            created_at: new Date().toISOString()
          })
          
          if (createError) {
            logger.error('FAST_GENERATE_PROFILE_CREATE_ERROR', { error: String(createError) })
          } else {
            logger.info('FAST_GENERATE_PROFILE_CREATED_PREEMPTIVE', { userId })
          }
        } else {
          logger.info('FAST_GENERATE_PROFILE_EXISTS', { userId })
        }
      }
      
      const planPayload = {
        user_id: userId,
        title,
        goal: goals || 'Kế hoạch tài chính',
        content: content_md,
        status: 'completed',
        word_count: content_md.split(/\s+/).length,
        collected_info: collectedInfo || {},
        metadata: {
          model_used: usedModel,
          generated_at: new Date().toISOString()
        }
      }

      logger.info('FAST_GENERATE_SAVE_START', { title, contentLength: content_md.length, userId })
      
      // Dùng admin client để insert plan (bypass RLS)
      const insertClient = admin || rh
      const { data: inserted, error: insertError } = await insertClient
        .from('plans')
        .insert([planPayload])
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
          { error: 'Failed to save plan', details: insertError?.message || 'Database error' },
          { status: 500 }
        )
      }

      if (!inserted) {
        logger.error('FAST_GENERATE_SAVE_NO_DATA', { error: 'No data returned from insert' })
        return NextResponse.json(
          { error: 'Failed to save plan', details: 'No data returned' },
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
        { error: 'Failed to save plan', details: String(saveError?.message || saveError) },
        { status: 500 }
      )
    }
  } catch (error: any) {
    logger.error('FAST_GENERATE_ERROR', { error: String(error?.message || error) })
    return NextResponse.json(
      { error: 'Generation failed', details: String(error?.message || error) },
      { status: 500 }
    )
  }
}
