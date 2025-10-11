import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, checkUsageLimits, getUserSubscription, getSubscriptionLimits, getCachedResponse, saveCachedResponse } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { generateFinancialPlan } from '@/lib/openai'
import { generateFinancialPlanWithClaude } from '@/lib/claude'
import { TaskType, selectModel, MODELS } from '@/lib/modelSelection'
import { processFinancialPlanWithRAG } from '@/lib/rag'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check usage limits before processing
    const usageCheck = await checkUsageLimits(user.id, 'plan')
    if (!usageCheck.allowed) {
      const { data: subscription } = await getUserSubscription(user.id)
      const limits = getSubscriptionLimits(usageCheck.tier)
      
      return NextResponse.json({ 
        error: 'Đã đạt giới hạn tạo kế hoạch',
        message: `Bạn đã sử dụng ${usageCheck.current}/${usageCheck.limit} kế hoạch trong tháng này. Hãy nâng cấp gói để tiếp tục sử dụng.`,
        usage: {
          current: usageCheck.current,
          limit: usageCheck.limit,
          tier: usageCheck.tier
        },
        upgradeRequired: true
      }, { status: 429 })
    }

    const { messages, collectedInfo } = await request.json()

    // Extract user profile information from messages and collectedInfo
    const userProfile = extractUserProfile(messages, collectedInfo)
    
    // Generate cache key for this plan request
    const cacheKey = `plan_${user.id}_${JSON.stringify(userProfile).slice(0, 100)}`
    
    // Check if we have a cached plan
    const { data: cachedPlan } = await getCachedResponse(cacheKey)
    let planContent = ''
    
    if (cachedPlan) {
      console.log('Using cached plan')
      planContent = cachedPlan
    } else {
      // Generate plan content using AI with fallback mechanism
      try {
        // First try with OpenAI's GPT-4o-mini
        planContent = await generateFinancialPlan(userProfile)
      } catch (aiError) {
        console.error('OpenAI Plan Generation Error, falling back to Claude:', aiError)
        
        try {
          // Fallback to Claude-3.5-Sonnet
          const systemPrompt = `Bạn là chuyên gia tài chính hàng đầu Việt Nam, chuyên tạo kế hoạch tài chính cá nhân hóa chi tiết.`
          
          const userPrompt = `Tạo một kế hoạch tài chính chi tiết cho người dùng Việt Nam với thông tin sau:

Thông tin cá nhân:
- Họ tên: ${userProfile.full_name || 'Không cung cấp'}
- Tuổi: ${userProfile.age || 'Không cung cấp'}
- Nghề nghiệp: ${userProfile.occupation || 'Không cung cấp'}
- Thu nhập: ${userProfile.current_income ? userProfile.current_income.toLocaleString() + ' VNĐ/tháng' : 'Không cung cấp'}
- Mục tiêu: ${userProfile.financial_goal || 'Không cung cấp'}
- Thời gian: ${userProfile.timeline || 'Không cung cấp'}

Hãy tạo kế hoạch bao gồm:
1. Tóm tắt mục tiêu
2. Phân tích tình hình hiện tại
3. Lộ trình chi tiết (từng bước cụ thể)
4. Ngân sách và phân bổ tài chính
5. Timeline thực hiện
6. Checklist hành động
7. Rủi ro và giải pháp
8. Lời khuyên và động viên

Format: Markdown với headings, lists, và tables.`
          
          planContent = await generateFinancialPlanWithClaude(systemPrompt, userPrompt)
        } catch (claudeError) {
          console.error('Claude Plan Generation Error:', claudeError)
          throw new Error('Không thể tạo kế hoạch tài chính. Vui lòng thử lại sau.')
        }
      }
      
      // Cache the generated plan
      await saveCachedResponse(cacheKey, planContent, 30) // Cache for 30 days
    }

    // Calculate word count for analytics
    const wordCount = planContent.split(/\s+/).length

    // Save plan to database
    const { data: plan, error } = await supabase
      .from('plans')
      .insert({
        user_id: user.id,
        title: `Kế hoạch tài chính - ${new Date().toLocaleDateString('vi-VN')}`,
        content: planContent,
        collected_info: collectedInfo,
        status: 'active',
        word_count: wordCount,
        created_at: new Date().toISOString(),
        model_used: planContent.length > 8000 ? MODELS.COMPLEX_PLANNING : MODELS.CHAT_DEFAULT,
        rag_processed: false
      })
      .select()
      .single()

    if (error) throw error
    
    // Process plan with RAG in the background (don't await)
    processFinancialPlanWithRAG(user.id, plan.id, planContent)
      .then(() => console.log(`RAG processing initiated for plan ${plan.id}`))
      .catch(err => console.error(`RAG processing failed for plan ${plan.id}:`, err))

    return NextResponse.json({
      success: true,
      planId: plan.id,
      message: 'Kế hoạch đã được tạo thành công',
      wordCount
    })

  } catch (error) {
    console.error('Generate plan error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate plan' },
      { status: 500 }
    )
  }
}

// Helper function to extract user profile from messages and collectedInfo
function extractUserProfile(messages: any[], collectedInfo: Record<string, boolean>): any {
  const userProfile: any = {
    full_name: '',
    age: null,
    occupation: '',
    current_income: null,
    financial_goal: '',
    timeline: '',
    risk_tolerance: 'medium',
  }
  
  // Extract information from messages
  for (const message of messages) {
    if (message.role === 'user') {
      const content = message.content.toLowerCase()
      
      // Extract financial goal
      if (content.includes('mục tiêu') || content.includes('muốn')) {
        const goalMatch = message.content.match(/mục tiêu[^.!?]*|muốn[^.!?]*/i)
        if (goalMatch) userProfile.financial_goal = goalMatch[0]
      }
      
      // Extract income
      const incomeMatch = message.content.match(/(\d+)\s*(triệu|tr|trieu)/i)
      if (incomeMatch) {
        userProfile.current_income = parseInt(incomeMatch[1]) * 1000000
      }
      
      // Extract occupation
      if (content.includes('nghề') || content.includes('làm việc') || content.includes('công việc')) {
        const occupationMatch = message.content.match(/nghề[^.!?]*|làm việc[^.!?]*|công việc[^.!?]*/i)
        if (occupationMatch) userProfile.occupation = occupationMatch[0]
      }
      
      // Extract timeline
      if (content.includes('thời gian') || content.includes('năm') || content.includes('tháng')) {
        const timelineMatch = message.content.match(/thời gian[^.!?]*|trong\s*\d+\s*(năm|tháng)[^.!?]*/i)
        if (timelineMatch) userProfile.timeline = timelineMatch[0]
      }
    }
  }
  
  return userProfile
}
