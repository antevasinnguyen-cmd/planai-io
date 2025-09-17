import { NextRequest, NextResponse } from 'next/server'
import { generateChatResponse } from '@/lib/openai'
import { getCurrentUser, saveChatMessage, checkUsageLimits, getUserSubscription, getSubscriptionLimits } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { message, chatHistory } = await request.json()
    
    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    const aiResponse = await generateChatResponse(messages)

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
      }
    })

  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
