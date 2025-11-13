/**
 * EMERGENCY FAST ROUTE - Direct synchronous generation (no background job)
 * For testing and quick generation when background job is slow
 * Used for Free tier only - returns immediately with plan or error
 */

export const runtime = 'nodejs'
export const maxDuration = 70

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getUserSubscription, getSubscriptionLimits } from '@/lib/supabase'
import { getPlanPromptV4, getUserContextV4 } from '@/lib/planPromptV4'
import { logger } from '@/lib/logger'

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

    // 50 second timeout for Free tier
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
      logger.warn('FAST_GENERATE_TIMEOUT', { timeout: '50s' })
    }, 50000)

    let raw = '{}'
    try {
      logger.info('FAST_GENERATE_CALL_OPENAI', {})
      const completion = await openai.chat.completions.create(
        {
          model: 'gpt-4-turbo',
          response_format: { type: 'json_object' },
          temperature: 0.5,
          max_tokens: 2500,
          messages: [
            { role: 'system', content: String(systemPrompt) },
            { role: 'user', content: userPrompt.slice(0, 8000) }
          ]
        },
        { signal: controller.signal }
      )
      clearTimeout(timeoutId)
      raw = completion.choices?.[0]?.message?.content || '{}'
      logger.info('FAST_GENERATE_OPENAI_DONE', { size: raw.length })
    } catch (e: any) {
      clearTimeout(timeoutId)
      logger.error('FAST_GENERATE_OPENAI_ERROR', { error: String(e?.message || e) })
      return NextResponse.json(
        { error: 'AI call failed', message: String(e?.message || e) },
        { status: 500 }
      )
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

    // Save plan directly
    const { data: inserted, error: insertError } = await rh
      .from('plans')
      .insert({
        user_id: auth.user.id,
        title,
        goal: goals,
        content: content_md,
        status: 'completed',
        word_count: content_md.split(/\s+/).length,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError || !inserted) {
      logger.error('FAST_GENERATE_SAVE_ERROR', { error: String(insertError) })
      return NextResponse.json(
        { error: 'Failed to save plan', details: insertError?.message },
        { status: 500 }
      )
    }

    logger.info('FAST_GENERATE_COMPLETE', { planId: inserted.id })
    return NextResponse.json({
      success: true,
      plan: {
        id: inserted.id,
        title: inserted.title,
        content: inserted.content,
        created_at: inserted.created_at
      }
    })
  } catch (error: any) {
    logger.error('FAST_GENERATE_ERROR', { error: String(error?.message || error) })
    return NextResponse.json(
      { error: 'Generation failed', details: String(error?.message || error) },
      { status: 500 }
    )
  }
}
