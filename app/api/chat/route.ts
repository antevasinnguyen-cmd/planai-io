import { NextRequest, NextResponse } from 'next/server'
import { generateChatResponse, analyzeUserInput } from '@/lib/openai'
import { getCurrentUser, saveChatMessage, checkUsageLimits, getUserSubscription, getSubscriptionLimits, updateProfileFromAnalysis } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('=== API CHAT: Nhận request ===');
    const { message, chatHistory } = await request.json()
    console.log('=== API CHAT: Message nhận được ===', { messageLength: message?.length, historyLength: chatHistory?.length })
    
    // Lấy token từ header Authorization
    const authHeader = request.headers.get('Authorization')
    console.log('=== API CHAT: Auth header ===', { hasAuthHeader: !!authHeader })
    
    let user;
    
    // Kiểm tra cookie session trực tiếp
    const cookies = request.headers.get('cookie')
    console.log('=== API CHAT: Cookies ===', { hasCookies: !!cookies })
    
    // Thử cả hai cách để lấy user
    try {
      // Cách 1: Lấy user từ getCurrentUser (sử dụng cookie session)
      console.log('=== API CHAT: Đang thử lấy user từ getCurrentUser ===');
      const { supabase } = await import('@/lib/supabase')
      const { data: sessionData } = await supabase.auth.getSession()
      console.log('=== API CHAT: Session data ===', { hasSession: !!sessionData?.session, userId: sessionData?.session?.user?.id })
      
      if (sessionData?.session?.user) {
        user = sessionData.session.user
        console.log('=== API CHAT: Lấy user thành công từ session ===', { userId: user.id })
      } else {
        console.log('=== API CHAT: Không tìm thấy session ===');
      }
    } catch (sessionError) {
      console.error('=== API CHAT: Lỗi khi lấy session ===', sessionError)
    }
    
    // Nếu không có user từ session, thử dùng token
    if (!user && authHeader && authHeader.startsWith('Bearer ')) {
      console.log('=== API CHAT: Đang thử xác thực bằng token ===');
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
        console.error('=== API CHAT: Lỗi xác thực token ===', error)
      } else if (data?.user) {
        console.log('=== API CHAT: Lấy user thành công từ token ===', { userId: data.user.id })
        user = data.user
      }
    }
    
    // Nếu vẫn không có user, thử lấy từ getCurrentUser
    if (!user) {
      console.log('=== API CHAT: Thử lấy user từ getCurrentUser ===');
      user = await getCurrentUser()
      if (user) {
        console.log('=== API CHAT: Lấy user thành công từ getCurrentUser ===', { userId: user.id })
      } else {
        console.error('=== API CHAT: Không thể xác thực người dùng ===');
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
      console.log('=== API CHAT: Đang gọi AI ===');
      aiResponse = await generateChatResponse(messages)
      console.log('=== API CHAT: Nhận phản hồi từ AI thành công ===', { responseLength: aiResponse?.length })
    } catch (aiError) {
      console.error('=== API CHAT: Lỗi khi gọi AI ===', aiError)
      return NextResponse.json({ 
        error: 'Không thể kết nối với AI',
        message: 'Xin lỗi, có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại sau.',
        details: aiError instanceof Error ? aiError.message : 'Unknown error'
      }, { status: 500 })
    }

    // Analyze user input to guide next questions and UI suggestions
    let analysis
    try {
      analysis = await analyzeUserInput(message)
    } catch (analysisError) {
      console.warn('Analysis failed, continuing without it:', analysisError)
      analysis = null
    }
    // Persist any structured fields into the user's profile (best-effort, ignore errors)
    try {
      if (analysis?.extractedInfo) {
        await updateProfileFromAnalysis(user.id, analysis.extractedInfo)
      }
    } catch (e) {
      console.warn('Profile update from analysis failed', e)
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
    console.error('=== API CHAT: Lỗi không xác định ===', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}
