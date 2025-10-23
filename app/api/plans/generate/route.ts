import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, checkUsageLimits, getUserSubscription, getSubscriptionLimits, getCachedResponse, saveCachedResponse } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { generateFinancialPlan } from '@/lib/openai'
import { generateFinancialPlanWithClaude } from '@/lib/claude'
import { TaskType, selectModel, MODELS } from '@/lib/modelSelection'
import { processFinancialPlanWithRAG } from '@/lib/rag'
import { generateMicroTasks, generateWeeklyChecklist, generateMonthlyChecklist, generateLearningResources, formatMicroTasks, formatChecklists } from '@/lib/planGeneration'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      console.error('=== PLAN GENERATE: No user found, unauthorized ===')
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Bạn cần đăng nhập để sử dụng tính năng này'
      }, { status: 401 })
    }
    
    console.log('=== PLAN GENERATE: User authenticated ===', { userId: user.id })

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
        // CRITICAL: Pass full userProfile with chat history
        console.log('=== PLAN GENERATION: Starting with GPT-4o-mini ===', { 
          goal: userProfile.financial_goal, 
          income: userProfile.current_income,
          messagesCount: messages.length
        })
        planContent = await generateFinancialPlan(userProfile)
      } catch (aiError) {
        console.error('OpenAI Plan Generation Error, falling back to Claude:', aiError)
        
        try {
          // Fallback to Claude-3.5-Sonnet
          const systemPrompt = `Bạn là chuyên gia tài chính hàng đầu Việt Nam, chuyên tạo kế hoạch tài chính cá nhân hóa chi tiết.

Thông tin người dùng:
- Mục tiêu: ${userProfile.financial_goal}
- Thu nhập: ${userProfile.current_income} VĐ/tháng
- Nghề nghiệp: ${userProfile.occupation}
- Thời gian: ${userProfile.timeline}
- Địa điểm: ${userProfile.location}
- Sẵn sàng: ${userProfile.readiness}

Thông tin từ cuộc trò chuyện:
${userProfile.description || 'Không có'}`
          
          const userPrompt = `Tạo một kế hoạch tài chính chi tiết và cá nhân hóa cho người dùng Việt Nam.

Mục tiêu cụ thể: ${userProfile.financial_goal}
Thu nhập: ${userProfile.current_income?.toLocaleString()} VĐ/tháng
Thời gian: ${userProfile.timeline}

Hãy tạo kế hoạch bao gồm:
1. Tóm tắt mục tiêu với số liệu cụ thể
2. Phân tích tình hình hiện tại
3. Lộ trình chi tiết theo tháng/quý/năm
4. Ngân sách và phân bổ tài chính
5. Checklist hành động hàng ngày
6. Tài liệu học tập
7. Lời không và động viên

Format: Markdown với headings, lists, và tables.`
          
          console.log('=== PLAN GENERATION: Falling back to Claude ===', { goal: userProfile.financial_goal })
          planContent = await generateFinancialPlanWithClaude(systemPrompt, userPrompt)
        } catch (claudeError) {
          console.error('Claude Plan Generation Error:', claudeError)
          throw new Error('Không thể tạo kế hoạch tài chính. Vui lòng thử lại sau.')
        }
      }
      
      // Cache the generated plan
      await saveCachedResponse(cacheKey, planContent, 30) // Cache for 30 days
    }

    // Generate enhanced plan components
    console.log('=== PLAN GENERATION: Generating micro-tasks, checklists, and resources ===');
    
    let microTasks, weeklyChecklist, monthlyChecklist, learningResources;
    
    try {
      // Generate micro-tasks
      microTasks = await generateMicroTasks(
        userProfile,
        userProfile.financial_goal || 'Mục tiêu tài chính',
        userProfile.timeline || '1 năm'
      )
      console.log('=== PLAN GENERATION: Micro-tasks generated successfully ===');
    } catch (e) {
      console.error('=== PLAN GENERATION: Error generating micro-tasks ===', e);
      microTasks = { weekday: { tasks: [] }, weekend: { tasks: [] } }
    }
    
    try {
      // Generate weekly checklist
      weeklyChecklist = await generateWeeklyChecklist(
        userProfile.financial_goal || 'Mục tiêu tài chính'
      )
      console.log('=== PLAN GENERATION: Weekly checklist generated successfully ===');
    } catch (e) {
      console.error('=== PLAN GENERATION: Error generating weekly checklist ===', e);
      weeklyChecklist = { tasks: [] }
    }
    
    try {
      // Generate monthly checklist
      monthlyChecklist = await generateMonthlyChecklist(
        userProfile.financial_goal || 'Mục tiêu tài chính'
      )
      console.log('=== PLAN GENERATION: Monthly checklist generated successfully ===');
    } catch (e) {
      console.error('=== PLAN GENERATION: Error generating monthly checklist ===', e);
      monthlyChecklist = { tasks: [] }
    }
    
    try {
      // Generate learning resources
      learningResources = await generateLearningResources(
        userProfile.financial_goal || 'Mục tiêu tài chính',
        userProfile.occupation || 'Chuyên gia tài chính'
      )
      console.log('=== PLAN GENERATION: Learning resources generated successfully ===');
    } catch (e) {
      console.error('=== PLAN GENERATION: Error generating learning resources ===', e);
      learningResources = ''
    }
    
    // Combine all components into enhanced plan content
    const enhancedPlanContent = planContent + '\n\n' +
      formatMicroTasks(microTasks) + '\n\n' +
      formatChecklists(weeklyChecklist, monthlyChecklist) + '\n\n' +
      (learningResources ? '📚 TÀI LIỆU HỌC TẬP:\n' + learningResources : '')
    
    // Calculate word count for analytics
    const wordCount = enhancedPlanContent.split(/\s+/).length

    // Save plan to database
    const { data: plan, error } = await supabase
      .from('plans')
      .insert({
        user_id: user.id,
        title: `Kế hoạch tài chính - ${new Date().toLocaleDateString('vi-VN')}`,
        content: enhancedPlanContent,
        collected_info: collectedInfo,
        status: 'active',
        word_count: wordCount,
        created_at: new Date().toISOString(),
        model_used: enhancedPlanContent.length > 8000 ? MODELS.COMPLEX_PLANNING : MODELS.CHAT_DEFAULT,
        rag_processed: false
      })
      .select()
      .single()

    if (error) throw error
    
    // Process plan with RAG in the background (don't await)
    processFinancialPlanWithRAG(user.id, plan.id, enhancedPlanContent)
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
    birth_date: null,
    savings: null,
    location: '',
    readiness: '',
    description: '',
    chat_history: messages // CRITICAL: Include full chat history for context
  }
  
  // Combine all user messages into one text for better extraction
  const allUserMessages = messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join(' ')
  
  const contentLower = allUserMessages.toLowerCase()
  
  // Extract financial goal (IMPROVED)
  const goalMatches = allUserMessages.match(/(?:mục tiêu|muốn|cần|mong muốn)[^.!?]*/gi)
  if (goalMatches) {
    userProfile.financial_goal = goalMatches[0].trim()
  }
  
  // Extract income (IMPROVED - handle multiple formats)
  const incomeMatches = allUserMessages.match(/(\d+(?:[.,]\d+)?)\s*(?:triệu|tr|trieu|vnd|đ|đồng)\/tháng/gi)
  if (incomeMatches) {
    const incomeNumMatch = incomeMatches[0].match(/(\d+(?:[.,]\d+)?)/)
    if (incomeNumMatch) {
      const incomeStr = incomeNumMatch[1].replace(/[.,]/g, '')
      userProfile.current_income = parseInt(incomeStr) * 1000000
    }
  }
  
  // Extract occupation (IMPROVED)
  const occupationMatches = allUserMessages.match(/(?:nghề|làm việc|công việc|kỹ năng|chuyên môn)[^.!?]*/gi)
  if (occupationMatches) {
    userProfile.occupation = occupationMatches[0].trim()
  }
  
  // Extract timeline (IMPROVED - handle multiple formats)
  const timelineMatches = allUserMessages.match(/(?:trong|sau|khoảng)\s*(?:\d+\s*)?(?:năm|tháng|tuần|ngày)[^.!?]*/gi)
  if (timelineMatches) {
    userProfile.timeline = timelineMatches[0].trim()
  }
  
  // Extract age (NEW)
  const ageMatches = allUserMessages.match(/(\d{1,2})\s*(?:tuổi|tuoi|age)/gi)
  if (ageMatches) {
    const ageNumMatch = ageMatches[0].match(/(\d{1,2})/)
    if (ageNumMatch) {
      userProfile.age = parseInt(ageNumMatch[1])
    }
  }
  
  // Extract birth date (NEW - format: dd/mm/yyyy or dd-mm-yyyy)
  const birthDateMatches = allUserMessages.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/)
  if (birthDateMatches) {
    userProfile.birth_date = birthDateMatches[0]
  }
  
  // Extract savings (NEW)
  const savingsMatches = allUserMessages.match(/(?:tiết kiệm|có|đã tiết kiệm|hiện có)[^.!?]*?(\d+(?:[.,]\d+)?)\s*(?:triệu|tr|trieu|vnd|đ|đồng)/gi)
  if (savingsMatches) {
    const savingsNumMatch = savingsMatches[0].match(/(\d+(?:[.,]\d+)?)/)
    if (savingsNumMatch) {
      const savingsStr = savingsNumMatch[1].replace(/[.,]/g, '')
      userProfile.savings = parseInt(savingsStr) * 1000000
    }
  }
  
  // Extract location (NEW)
  const locations = ['hà nội', 'hcm', 'sài gòn', 'đà nẵng', 'hải phòng', 'cần thơ', 'nha trang', 'đà lạt']
  for (const loc of locations) {
    if (contentLower.includes(loc)) {
      userProfile.location = loc
      break
    }
  }
  
  // Extract readiness (NEW)
  const readinessMatches = allUserMessages.match(/(?:sẵn sàng|học hỏi|thời gian dành|có thể|cam kết)[^.!?]*/gi)
  if (readinessMatches) {
    userProfile.readiness = readinessMatches.slice(0, 2).join('; ')
  }
  
  // Extract description (NEW - longest user message)
  const userMessages = messages.filter(m => m.role === 'user')
  if (userMessages.length > 0) {
    const longestMessage = userMessages.reduce((prev, curr) => 
      curr.content.length > prev.content.length ? curr : prev
    )
    if (longestMessage.content.length > 50) {
      userProfile.description = longestMessage.content
    }
  }
  
  return userProfile
}
