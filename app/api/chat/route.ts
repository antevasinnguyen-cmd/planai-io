import { NextRequest, NextResponse } from 'next/server'
import { generateChatResponse, generateChatResponseWithSystemPrompt, analyzeUserInput } from '@/lib/openai'
import { getCurrentUser, checkUsageLimits, getUserSubscription, getSubscriptionLimits, updateProfileFromAnalysis, getUserProfile } from '@/lib/supabase'
import { getChatSystemPrompt } from '@/lib/prompts'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    logger.info('API_CHAT_REQUEST', {})
    const { message, chatHistory } = await request.json()
    logger.info('API_CHAT_PAYLOAD', { messageLength: message?.length, historyLength: chatHistory?.length })
    
    // Lấy token từ header Authorization
    const authHeader = request.headers.get('Authorization')
    logger.info('API_CHAT_AUTH_HEADER', { hasAuthHeader: !!authHeader })
    
    let user;
    
    // Kiểm tra cookie session trực tiếp (header string)
    const cookieHeader = request.headers.get('cookie')
    logger.info('API_CHAT_COOKIES', { hasCookies: !!cookieHeader })
    
    // Thử cả hai cách để lấy user
    try {
      // Cách 1: Lấy user từ getCurrentUser (sử dụng cookie session)
      logger.info('API_CHAT_TRY_SESSION', {})
      const { supabase } = await import('@/lib/supabase')
      const { data: sessionData } = await supabase.auth.getSession()
      logger.info('API_CHAT_SESSION_DATA', { hasSession: !!sessionData?.session, userId: sessionData?.session?.user?.id })
      
      if (sessionData?.session?.user) {
        user = sessionData.session.user
        logger.info('API_CHAT_USER_FROM_SESSION', { userId: user.id })
      } else {
        logger.warn('API_CHAT_NO_SESSION', {})
      }
    } catch (sessionError) {
      logger.error('API_CHAT_SESSION_ERROR', { error: String(sessionError) })
    }
    
    // Nếu không có user từ session, thử dùng token
    if (!user && authHeader && authHeader.startsWith('Bearer ')) {
      logger.info('API_CHAT_TRY_TOKEN', {})
      // Xác thực bằng token từ header
      const token = authHeader.substring(7)
      
      // Khởi tạo Supabase client với token
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const tokenClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      })
      
      // Lấy user từ token
      const { data, error } = await tokenClient.auth.getUser()
      if (error) {
        logger.error('API_CHAT_TOKEN_ERROR', { error: String(error) })
      } else if (data?.user) {
        logger.info('API_CHAT_USER_FROM_TOKEN', { userId: data.user.id })
        user = data.user
        ;(request as any)._tokenClient = tokenClient // store for later fallback inserts
      }
    }
    
    // Nếu vẫn không có user, thử lấy từ getCurrentUser
    if (!user) {
      logger.info('API_CHAT_TRY_FALLBACK_GET_USER', {})
      user = await getCurrentUser()
      if (user) {
        logger.info('API_CHAT_USER_FROM_FALLBACK', { userId: user.id })
      } else {
        logger.error('API_CHAT_UNAUTHORIZED', {})
        return NextResponse.json({ 
          error: 'Unauthorized', 
          details: 'Không thể xác thực người dùng. Vui lòng đăng nhập lại.' 
        }, { status: 401 })
      }
    }

    // Check usage limits before processing
    const usageCheck = await checkUsageLimits(user.id, 'chat')
    if (!usageCheck.allowed) {
      const { data: subscription } = await getUserSubscription(user.id)
      const limits = getSubscriptionLimits(usageCheck.tier)
      
      logger.warn('API_CHAT_LIMIT_EXCEEDED', { userId: user.id, tier: usageCheck.tier, current: usageCheck.current, limit: usageCheck.limit })
      return NextResponse.json({ 
        error: 'Đã đạt giới hạn chat',
        message: `Bạn đã sử dụng ${usageCheck.current}/${usageCheck.limit} chat trong tháng này. Hãy nâng cấp gói để tiếp tục sử dụng.`,
        usage: {
          current: usageCheck.current,
          limit: usageCheck.limit,
          tier: usageCheck.tier
        },
        upgradeRequired: true
      }, { status: 429 })
    }

    // Prepare messages for OpenAI
    const messages = [
      ...chatHistory.map((msg: any) => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.message
      })),
      {
        role: 'user',
        content: message
      }
    ]

    // Build tier-aware, formatting-rich system prompt
    const { data: subData } = await getUserSubscription(user.id)
    const tier = subData?.tier || usageCheck.tier || 'free'
    // simple timeline extraction from current message and last few history items
    const recentText = [message, ...(chatHistory?.slice(-3)?.map((h: any) => h?.message || '') || [])].join(' \n ')
    const tlMatch = recentText.match(/(\d+)\s*[-–—]?\s*(\d+)?\s*(năm|tháng|year|month)/i)
    const timelineHint = tlMatch ? (tlMatch[2] ? `${tlMatch[1]}-${tlMatch[2]} ${tlMatch[3]}` : `${tlMatch[1]} ${tlMatch[3]}`) : ''
    const basePrompt = getChatSystemPrompt()
    // Fetch profile for deeper personalization
    let profileBlock = ''
    try {
      const { data: profile } = await getUserProfile(user.id)
      if (profile) {
        const lines: string[] = []
        if (profile.full_name) lines.push(`Họ tên: ${profile.full_name}`)
        if (profile.age) lines.push(`Tuổi: ${profile.age}`)
        if (profile.occupation) lines.push(`Nghề nghiệp: ${profile.occupation}`)
        if (profile.location) lines.push(`Khu vực: ${profile.location}`)
        if (profile.current_income) lines.push(`Thu nhập: ${Number(profile.current_income).toLocaleString('vi-VN')} VNĐ/tháng`)
        if (profile.savings) lines.push(`Tiết kiệm: ${Number(profile.savings).toLocaleString('vi-VN')} VNĐ`)
        if (profile.timeline) lines.push(`Thời gian mục tiêu: ${profile.timeline}`)
        if (profile.financial_goal) lines.push(`Mục tiêu: ${profile.financial_goal}`)
        if (lines.length) {
          profileBlock = `\n\nHỒ SƠ NGƯỜI DÙNG (tóm tắt):\n- ${lines.join('\n- ')}`
        }
      }
    } catch {}
    const tierAddons = (() => {
      if (tier === 'free') {
        return `\n\nFormatting: Sử dụng **Markdown cơ bản** (tiêu đề ##, bullet, in đậm số liệu). Tập trung gợi ý ngắn gọn, giá trị ngay.`
      }
      if (tier === 'basic') {
        return `\n\nFormatting nâng cao cho gói trả phí:\n- Dùng **Markdown đầy đủ**: ##, ###, ####, **đậm**, *nghiêng*\n- Thêm 1 bảng tóm tắt số liệu chính (Markdown table)\n- Lộ trình (Roadmap) chia mốc theo tháng/quý${timelineHint ? ` để phù hợp thời gian: ${timelineHint}` : ''}\n- Đưa ví dụ/công thức và 3 nguồn tham khảo (link).`
      }
      if (tier === 'pro') {
        return `\n\nFormatting chuyên sâu:\n- Nhiều mục H2/H3, bullet nested\n- Ít nhất 2 bảng: (1) Dòng tiền, (2) Kế hoạch tiết kiệm/đầu tư\n- Roadmap theo mốc thời gian cụ thể${timelineHint ? ` (${timelineHint})` : ''}\n- Tính toán chi tiết, tỷ lệ %, kịch bản A/B, rủi ro và cách giảm thiểu.`
      }
      return `\n\nFormatting tối đa (Gói 3):\n- Cấu trúc như tài liệu tư vấn: Mục lục, H2/H3/H4, tóm tắt điều hành\n- Ít nhất 3 bảng (dòng tiền, danh mục, KPI), biểu đồ dưới dạng bảng ASCII nếu phù hợp\n- Roadmap 5 năm với mốc theo quý${timelineHint ? ` (khớp timeline: ${timelineHint})` : ''}\n- Tài liệu tham khảo, link học tập, checklist hàng tuần/tháng, KPI đo lường.`
    })()
    const timelineDirective = timelineHint ? `\n\nQuan trọng: Mọi đề xuất phải **phù hợp với thời gian** người dùng đã nói: ${timelineHint}. Không đưa mốc vượt quá thời gian này trừ khi giải thích rõ lý do.` : ''
    const personalizationDirectives = `\n\nYÊU CẦU CÁ NHÂN HÓA MẠNH (không máy móc):\n- Trích dẫn lại dữ liệu của người dùng trong câu trả lời.\n- Giải thích tại sao gợi ý phù hợp với hồ sơ hiện tại.\n- Đề xuất kịch bản A/B (an toàn vs tăng trưởng) và điều kiện chuyển đổi.\n- Đưa KPI đo lường, con số cụ thể, ước tính chi phí/lợi ích.\n- Cuối câu luôn có 🎯 1-2 câu hỏi chiến lược tiếp theo.\n${tier !== 'free' ? '- Thêm bảng số liệu, roadmap, và 2-3 tài liệu tham khảo đáng tin cậy.\n' : ''}`
    const customSystemPrompt = `${basePrompt}${profileBlock}${tierAddons}${timelineDirective}${personalizationDirectives}`

    // Generate AI response
    let aiResponse: string
    try {
      logger.info('API_CHAT_CALLING_AI', { userId: user.id })
      aiResponse = await generateChatResponseWithSystemPrompt(messages, customSystemPrompt)
      logger.info('API_CHAT_AI_SUCCESS', { responseLength: aiResponse?.length })
    } catch (aiError) {
      logger.error('API_CHAT_AI_ERROR', { error: aiError instanceof Error ? aiError.message : String(aiError) })
      
      // Provide specific error messages based on error type
      let errorMessage = 'Ui, có lỗi xảy ra khi kết nối với AI. Bạn vui lòng thử lại sau ít phút nữa nhé.'
      let userFriendlyMessage = errorMessage
      let isQuotaError = false
      
      if (aiError instanceof Error) {
        const errorMsg = aiError.message.toLowerCase()
        
        if (errorMsg.includes('api key')) {
          errorMessage = 'Hệ thống AI chưa được cấu hình đầy đủ. Vui lòng liên hệ admin.'
          userFriendlyMessage = '🔧 Hệ thống đang được bảo trì. Chúng tôi sẽ khắc phục sớm nhất có thể!'
        } else if (errorMsg.includes('rate limit') || errorMsg.includes('quota') || errorMsg.includes('insufficient_quota') || errorMsg.includes('exceeded your current quota')) {
          errorMessage = 'Đã hết giới hạn sử dụng API OpenAI'
          userFriendlyMessage = '🚨 **OpenAI API đã hết hạn mức sử dụng.**\n\nChúng tôi đang xử lý vấn đề này. Vui lòng thử lại sau hoặc liên hệ webappsaas.ai@gmail.com để được hỗ trợ.'
          isQuotaError = true
        } else if (errorMsg.includes('credit balance') || errorMsg.includes('low to access') || errorMsg.includes('too low to access')) {
          errorMessage = 'API credit Anthropic không đủ'
          userFriendlyMessage = '🚨 **Anthropic API đã hết credit.**\n\nChúng tôi đang xử lý vấn đề này. Vui lòng thử lại sau hoặc liên hệ webappsaas.ai@gmail.com để được hỗ trợ.'
          isQuotaError = true
        } else if (errorMsg.includes('network') || errorMsg.includes('timeout')) {
          errorMessage = 'Lỗi kết nối mạng'
          userFriendlyMessage = '🌐 Kết nối không ổn định. Vui lòng kiểm tra mạng và thử lại.'
        } else {
          // Fallback response khi AI không hoạt động
          logger.warn('API_CHAT_USE_FALLBACK_RESPONSE', {})
          userFriendlyMessage = '🤖 **Xin chào! Tôi là PlanAI Assistant.**\n\nHiện tại hệ thống AI đang được bảo trì. Tôi sẽ giúp bạn tạo kế hoạch tài chính cơ bản bằng cách trả lời một số câu hỏi:\n\n**Hãy cho tôi biết:**\n• Mục tiêu tài chính của bạn là gì?\n• Thu nhập hàng tháng hiện tại?\n• Bạn muốn đạt được mục tiêu trong bao lâu?\n\nHoặc bạn có thể nhấn nút "Plan" để xem demo kế hoạch mẫu.'
          isQuotaError = true
        }
      }
      
      // Nếu là lỗi quota hoặc không xác định, trả về fallback response
      if (isQuotaError) {
        return NextResponse.json({ 
          response: userFriendlyMessage,
          success: true,
          usage: {
            current: 0,
            limit: 0,
            tier: 'maintenance',
            remaining: 0
          },
          quotaExceeded: true,
          analysis: null
        })
      }
      
      return NextResponse.json({ 
        error: 'AI_CONNECTION_ERROR',
        message: userFriendlyMessage,
        details: errorMessage,
        suggestion: 'Nếu lỗi tiếp tục xảy ra, vui lòng liên hệ webappsaas.ai@gmail.com'
      }, { status: 500 })
    }

    // Analyze user input to guide next questions and UI suggestions
    let analysis
    try {
      analysis = await analyzeUserInput(message)
    } catch (analysisError) {
      logger.warn('API_CHAT_ANALYSIS_FAILED', { error: String(analysisError) })
      analysis = null
    }
    // Persist any structured fields into the user's profile (best-effort, ignore errors)
    try {
      if (analysis?.extractedInfo) {
        await updateProfileFromAnalysis(user.id, analysis.extractedInfo)
      }
    } catch (e) {
      logger.warn('API_CHAT_PROFILE_UPDATE_FAILED', { error: String(e) })
    }

    // Save messages to DB under session (RLS-safe). If it fails (no cookies), fallback to token client when possible.
    try {
      const cookieStore = cookies()
      const rhSupabase = createRouteHandlerClient({ cookies: () => cookieStore })
      // user message
      await rhSupabase
        .from('chat_messages')
        .insert({ user_id: user.id, message, type: 'user', created_at: new Date().toISOString(), source: 'api' })
      // ai response
      await rhSupabase
        .from('chat_messages')
        .insert({ user_id: user.id, message: aiResponse, type: 'ai', created_at: new Date().toISOString(), source: 'api' })
    } catch (e) {
      logger.warn('API_CHAT_SAVE_DB_FAILED', { error: String(e) })
      // Fallback using token-auth client if available
      try {
        const tokenClient = (request as any)._tokenClient
        if (tokenClient) {
          await tokenClient
            .from('chat_messages')
            .insert({ user_id: user.id, message, type: 'user', created_at: new Date().toISOString(), source: 'api' })
          await tokenClient
            .from('chat_messages')
            .insert({ user_id: user.id, message: aiResponse, type: 'ai', created_at: new Date().toISOString(), source: 'api' })
          logger.info('API_CHAT_SAVE_DB_FALLBACK_TOKEN_OK', { userId: user.id })
        }
      } catch (e2) {
        logger.error('API_CHAT_SAVE_DB_FALLBACK_TOKEN_FAILED', { error: String(e2) })
      }
    }

    // Return response with usage info (clamped)
    const updatedUsage = await checkUsageLimits(user.id, 'chat')
    const nextCount = Math.min(updatedUsage.current + 1, updatedUsage.limit)
    const remaining = Math.max(updatedUsage.limit - nextCount, 0)
    
    return NextResponse.json({ 
      response: aiResponse,
      success: true,
      usage: {
        current: nextCount,
        limit: updatedUsage.limit,
        tier: updatedUsage.tier,
        remaining
      },
      analysis
    })

  } catch (error) {
    logger.error('API_CHAT_UNHANDLED', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}
