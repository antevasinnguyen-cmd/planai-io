import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, checkUsageLimits, getUserSubscription, getSubscriptionLimits, getCachedResponse, saveCachedResponse } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { generateFinancialPlan } from '@/lib/openai'
import { generateFinancialPlanWithClaude } from '@/lib/claude'
import { TaskType, selectModel, MODELS } from '@/lib/modelSelection'
import { processFinancialPlanWithRAG } from '@/lib/rag'
import { generateMicroTasks, generateWeeklyChecklist, generateMonthlyChecklist, generateLearningResources, formatMicroTasks, formatChecklists } from '@/lib/planGeneration'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    let user = await getCurrentUser(request)
    
    // If no user found, try to refresh session and retry
    if (!user) {
      logger.warn('PLAN_GENERATE_AUTH_RETRY', {})
      
      // Try to get fresh session from cookies
      try {
        const { cookies } = await import('next/headers')
        const cookieStore = cookies()
        const projectRef = 'wjzmscsoiibzlxejqpgg'
        
        // Try all possible cookie names
        const possibleCookies = [
          `sb-${projectRef}-auth-token`,
          `sb-${projectRef}-auth-token.0`,
          `sb-${projectRef}-auth-token.1`,
          'sb-access-token',
          'supabase-auth-token'
        ]
        
        for (const cookieName of possibleCookies) {
          const cookie = cookieStore.get(cookieName)
          if (cookie?.value) {
            logger.info('PLAN_GENERATE_FOUND_COOKIE', { cookieName })
            const { data: { user: authUser }, error } = await supabase.auth.getUser(cookie.value)
            if (authUser && !error) {
              user = authUser
              logger.info('PLAN_GENERATE_AUTH_VIA_COOKIE', { userId: user.id })
              break
            }
          }
        }
      } catch (cookieRetryError) {
        logger.warn('PLAN_GENERATE_COOKIE_RETRY_FAILED', { error: String(cookieRetryError) })
      }
    }
    
    if (!user) {
      logger.error('PLAN_GENERATE_UNAUTHORIZED', {})
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Bạn cần đăng nhập để sử dụng tính năng này. Vui lòng đăng nhập lại.'
      }, { status: 401 })
    }
    
    logger.info('PLAN_GENERATE_AUTH_OK', { userId: user.id })

    // Check usage limits before processing
    const usageCheck = await checkUsageLimits(user.id, 'plan')
    if (!usageCheck.allowed) {
      // Get subscription with fallback
      const { data: subscription } = await getUserSubscription(user.id)
      const tier = subscription?.tier || usageCheck.tier || 'free'
      const limits = getSubscriptionLimits(tier)
      
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

    const { messages, collectedInfo, aiMemoryData, userProfile: memoryProfile } = await request.json()

    // Use AI Memory profile if available, otherwise extract from messages
    const userProfile = memoryProfile || extractUserProfile(messages, collectedInfo)
    
    // Merge with extracted data for completeness
    if (!memoryProfile && messages) {
      const extracted = extractUserProfile(messages, collectedInfo)
      Object.assign(userProfile, extracted)
    }
    
    // Generate cache key for this plan request
    const cacheKey = `plan_${user.id}_${JSON.stringify(userProfile).slice(0, 100)}`
    
    // Check if we have a cached plan
    const { data: cachedPlan } = await getCachedResponse(cacheKey)
    let planContent = ''
    
    if (cachedPlan) {
      logger.info('PLAN_GENERATE_USE_CACHE', { userId: user.id })
      planContent = cachedPlan
    } else {
      // Generate plan content using AI with fallback mechanism
      try {
        // First try with OpenAI's GPT-4o-mini
        // CRITICAL: Pass full userProfile with chat history
        logger.info('PLAN_GENERATE_CALL_OPENAI', { goal: userProfile.financial_goal, income: userProfile.current_income, messagesCount: messages.length })
        // Derive planName/goals + enrich collected info with chat summary
        const chatSummary = Array.isArray(messages)
          ? messages.filter((m: any) => m.role === 'user').map((m: any) => m.content).join('\n').slice(0, 4000)
          : ''
        // Resolve tier + words for deeper personalization limits
        const { data: subscription } = await getUserSubscription(user.id)
        const resolvedTier = subscription?.tier || usageCheck.tier || 'free'
        const tierLimits = getSubscriptionLimits(resolvedTier)
        const enrichedCollectedInfo = { ...(collectedInfo || {}), chat_summary: chatSummary, tier: resolvedTier, maxWords: tierLimits.words }
        const goalsText = userProfile.financial_goal || (userProfile.description || 'Mục tiêu tài chính cá nhân')
        const planTitle = userProfile.financial_goal
          ? `Kế hoạch: ${userProfile.financial_goal}`
          : `Kế hoạch tài chính - ${new Date().toLocaleDateString('vi-VN')}`
        planContent = await generateFinancialPlan(
          planTitle,
          goalsText,
          enrichedCollectedInfo
        )
      } catch (aiError) {
        logger.error('PLAN_GENERATE_OPENAI_ERROR', { error: aiError instanceof Error ? aiError.message : String(aiError) })
        
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
          
          logger.info('PLAN_GENERATE_FALLBACK_CLAUDE', { goal: userProfile.financial_goal })
          planContent = await generateFinancialPlanWithClaude(systemPrompt, userPrompt)
        } catch (claudeError) {
          logger.error('PLAN_GENERATE_CLAUDE_ERROR', { error: claudeError instanceof Error ? claudeError.message : String(claudeError) })
          throw new Error('Không thể tạo kế hoạch tài chính. Vui lòng thử lại sau.')
        }
      }
      
      // Cache the generated plan
      await saveCachedResponse(cacheKey, planContent, 30) // Cache for 30 days
    }

    // Helper: extract JSON Data Layer at the end of plan (if any)
    const extractJsonFromMarkdown = (md: string): any | null => {
      try {
        const codeFenceRegex = /```json\s*([\s\S]*?)\s*```/gi
        let match: RegExpExecArray | null = null
        let last: string | null = null
        while ((match = codeFenceRegex.exec(md)) !== null) {
          last = match[1]
        }
        if (!last) return null
        return JSON.parse(last)
      } catch {
        return null
      }
    }

    // Parse structured data and strip JSON block from content shown to users
    const structuredData = extractJsonFromMarkdown(planContent)
    const displayContent = structuredData
      ? planContent.replace(/```json[\s\S]*?```\s*$/i, '').trim()
      : planContent

    // Generate enhanced plan components
    logger.info('PLAN_GENERATE_ENHANCE_COMPONENTS', {})
    
    let microTasks, weeklyChecklist, monthlyChecklist, learningResources;
    
    try {
      // Generate micro-tasks
      microTasks = await generateMicroTasks(
        userProfile,
        userProfile.financial_goal || 'Mục tiêu tài chính',
        userProfile.timeline || '1 năm'
      )
      logger.info('PLAN_GENERATE_MICROTASKS_OK', {})
    } catch (e) {
      logger.warn('PLAN_GENERATE_MICROTASKS_FAIL', { error: String(e) })
      microTasks = { weekday: { tasks: [] }, weekend: { tasks: [] } }
    }
    
    try {
      // Generate weekly checklist
      weeklyChecklist = await generateWeeklyChecklist(
        userProfile.financial_goal || 'Mục tiêu tài chính'
      )
      logger.info('PLAN_GENERATE_WEEKLY_OK', {})
    } catch (e) {
      logger.warn('PLAN_GENERATE_WEEKLY_FAIL', { error: String(e) })
      weeklyChecklist = { tasks: [] }
    }
    
    try {
      // Generate monthly checklist
      monthlyChecklist = await generateMonthlyChecklist(
        userProfile.financial_goal || 'Mục tiêu tài chính'
      )
      logger.info('PLAN_GENERATE_MONTHLY_OK', {})
    } catch (e) {
      logger.warn('PLAN_GENERATE_MONTHLY_FAIL', { error: String(e) })
      monthlyChecklist = { tasks: [] }
    }
    
    try {
      // Generate learning resources
      learningResources = await generateLearningResources(
        userProfile.financial_goal || 'Mục tiêu tài chính',
        userProfile.occupation || 'Chuyên gia tài chính'
      )
      logger.info('PLAN_GENERATE_LEARNING_OK', {})
    } catch (e) {
      logger.warn('PLAN_GENERATE_LEARNING_FAIL', { error: String(e) })
      learningResources = ''
    }
    
    // Combine all components into enhanced plan content
    const enhancedPlanContent = displayContent + '\n\n' +
      formatMicroTasks(microTasks) + '\n\n' +
      formatChecklists(weeklyChecklist, monthlyChecklist) + '\n\n' +
      (learningResources ? '📚 TÀI LIỆU HỌC TẬP:\n' + learningResources : '')
    
    // Calculate word count for analytics
    const wordCount = enhancedPlanContent.split(/\s+/).length

    // Save plan to database (RLS-aware, ensure profile FK)
    const cookieStore = cookies()
    const rh = createRouteHandlerClient({ cookies: () => cookieStore })

    // Ensure profile exists to satisfy FK profiles(id) → plans.user_id
    try {
      const email = (user as any).email || null
      const profileResp = await rh.from('profiles').upsert({ id: user.id, email, created_at: new Date().toISOString() }, { onConflict: 'id' })
      if (profileResp.error) {
        logger.warn('PLAN_GENERATE_PROFILE_UPSERT_FAIL', { error: String(profileResp.error) })
      } else {
        logger.info('PLAN_GENERATE_PROFILE_UPSERT_OK', { userId: user.id })
      }
    } catch (profileErr) {
      logger.error('PLAN_GENERATE_PROFILE_UPSERT_ERROR', { error: String(profileErr) })
    }

    let plan: any = null
    let insertErr: any = null

    // Attempt full insert (with optional columns)
    {
      const resp = await rh
        .from('plans')
        .insert({
          user_id: user.id,
          title: `Kế hoạch tài chính - ${new Date().toLocaleDateString('vi-VN')}`,
          goal: userProfile.financial_goal || 'Kế hoạch tài chính cá nhân',
          content: enhancedPlanContent,
          collected_info: {
            ...(collectedInfo || {}),
            tier: (structuredData && structuredData.tier) ? structuredData.tier : (usageCheck.tier || 'free'),
            maxWords: (collectedInfo && (collectedInfo as any).maxWords) || undefined,
            structured_data: structuredData || null
          },
          status: 'active',
          word_count: wordCount,
          created_at: new Date().toISOString(),
          model_used: enhancedPlanContent.length > 8000 ? MODELS.COMPLEX_PLANNING : MODELS.CHAT_DEFAULT,
          rag_processed: false
        })
        .select()
        .single()
      plan = resp.data
      insertErr = resp.error
    }

    // If missing-column or RLS error, try fallbacks
    if (insertErr) {
      const msg = String(insertErr.message || '')
      const isMissingColumn = msg.toLowerCase().includes('column') && msg.toLowerCase().includes('does not exist')
      const isRls = msg.toLowerCase().includes('violates row level security') || msg.toLowerCase().includes('not authorized')

      if (isMissingColumn) {
        // Retry with minimal columns only
        const retry = await rh
          .from('plans')
          .insert({
            user_id: user.id,
            title: `Kế hoạch tài chính - ${new Date().toLocaleDateString('vi-VN')}`,
            goal: userProfile.financial_goal || 'Kế hoạch tài chính cá nhân',
            content: enhancedPlanContent,
            status: 'active',
            word_count: wordCount,
            created_at: new Date().toISOString()
          })
          .select()
          .single()
        plan = retry.data
        insertErr = retry.error
      }

      // If still failing due to RLS or FK, try admin fallback if available
      if ((insertErr && (isRls || String(insertErr.message || '').toLowerCase().includes('foreign key'))) || (insertErr && process.env.SUPABASE_SERVICE_ROLE_KEY)) {
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined
          if (supabaseUrl && serviceKey) {
            const admin = createClient(supabaseUrl, serviceKey)
            // Ensure profile again
            const email = (user as any).email || null
            await admin.from('profiles').upsert({ id: user.id, email, created_at: new Date().toISOString() }, { onConflict: 'id' })
            const adminResp = await admin
              .from('plans')
              .insert({
                user_id: user.id,
                title: `Kế hoạch tài chính - ${new Date().toLocaleDateString('vi-VN')}`,
                goal: userProfile.financial_goal || 'Kế hoạch tài chính cá nhân',
                content: enhancedPlanContent,
                status: 'active',
                word_count: wordCount,
                created_at: new Date().toISOString()
              })
              .select()
              .single()
            plan = adminResp.data
            insertErr = adminResp.error
          }
        } catch (e) {
          insertErr = e
        }
      }
    }

    if (insertErr) {
      logger.error('PLAN_GENERATE_INSERT_FINAL_FAIL', { 
        error: String(insertErr),
        message: insertErr?.message,
        code: insertErr?.code,
        userId: user.id
      })
      throw insertErr
    }
    
    logger.info('PLAN_GENERATE_INSERT_SUCCESS', { planId: plan?.id, userId: user.id })
    
    // Process plan with RAG in the background (don't await)
    processFinancialPlanWithRAG(user.id, plan.id, enhancedPlanContent)
      .then(() => logger.info('PLAN_GENERATE_RAG_STARTED', { planId: plan.id }))
      .catch(err => logger.warn('PLAN_GENERATE_RAG_FAILED', { planId: plan.id, error: String(err) }))

    return NextResponse.json({
      success: true,
      planId: plan.id,
      message: 'Kế hoạch đã được tạo thành công',
      wordCount
    })

  } catch (error) {
    logger.error('PLAN_GENERATE_UNHANDLED', { error: error instanceof Error ? error.message : String(error) })
    
    // Provide more specific error messages
    let statusCode = 500
    let errorMessage = 'Có lỗi xảy ra khi tạo kế hoạch'
    
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        statusCode = 401
        errorMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'
      } else if (error.message.includes('Forbidden') || error.message.includes('403')) {
        statusCode = 403
        errorMessage = 'Bạn không có quyền thực hiện hành động này'
      } else if (error.message.includes('Not Found') || error.message.includes('404')) {
        statusCode = 404
        errorMessage = 'Không tìm thấy tài nguyên'
      } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        statusCode = 408
        errorMessage = 'Yêu cầu hết thời gian chờ. Vui lòng thử lại.'
      } else {
        errorMessage = error.message
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        message: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: statusCode }
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
