import { NextRequest, NextResponse } from 'next/server'
import { generateChatResponse, analyzeUserInput } from '@/lib/openai'
import { getCurrentUser, saveChatMessage, checkUsageLimits, getUserSubscription, getSubscriptionLimits, updateProfileFromAnalysis } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { message, chatHistory } = await request.json()
    
    // Lấy token từ header Authorization
    const authHeader = request.headers.get('Authorization')
    let user;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
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
      
      // Lấy user từ session
      const { data, error } = await supabase.auth.getUser()
      if (error || !data.user) {
        console.error('Auth error:', error)
        return NextResponse.json({ error: 'Unauthorized', details: error?.message }, { status: 401 })
      }
      
      user = data.user
    } else {
      // Fallback: Thử lấy user từ getCurrentUser nếu không có token
      user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized', details: 'No authentication token provided' }, { status: 401 })
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
      aiResponse = await generateChatResponse(messages)
    } catch (aiError) {
      console.error('AI Response Generation Error:', aiError)
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
    console.error('Chat API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
