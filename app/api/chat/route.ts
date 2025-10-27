import { NextRequest, NextResponse } from 'next/server'
import { generateChatResponse, analyzeUserInput } from '@/lib/openai'
import { getCurrentUser, saveChatMessage, checkUsageLimits, getUserSubscription, getSubscriptionLimits, updateProfileFromAnalysis } from '@/lib/supabase'
import { getChatSystemPrompt } from '@/lib/prompts'
import { createClient } from '@supabase/supabase-js'
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
    
    // Kiểm tra cookie session trực tiếp
    const cookies = request.headers.get('cookie')
    console.log('=== API CHAT: Cookies ===', { hasCookies: !!cookies })
    
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
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      })
      
      // Lấy user từ token
      const { data, error } = await supabase.auth.getUser()
      if (error) {
        logger.error('API_CHAT_TOKEN_ERROR', { error: String(error) })
      } else if (data?.user) {
        logger.info('API_CHAT_USER_FROM_TOKEN', { userId: data.user.id })
        user = data.user
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

    // Generate AI response
    let aiResponse: string
    try {
      logger.info('API_CHAT_CALLING_AI', { userId: user.id })
      aiResponse = await generateChatResponse(messages)
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

    // Save user message
    await saveChatMessage(user.id, message, 'user')
    
    // Save AI response
    await saveChatMessage(user.id, aiResponse, 'ai')

    // Return response with usage info
    const updatedUsage = await checkUsageLimits(user.id, 'chat')
    
    return NextResponse.json({ 
      response: aiResponse,
      success: true,
      usage: {
        current: updatedUsage.current + 1, // +1 for the message just sent
        limit: updatedUsage.limit,
        tier: updatedUsage.tier,
        remaining: updatedUsage.limit - (updatedUsage.current + 1)
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
