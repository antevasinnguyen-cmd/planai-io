import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, checkUsageLimits, getUserSubscription, getSubscriptionLimits, getCachedResponse, saveCachedResponse } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { MODELS } from '@/lib/modelSelection'
import { processFinancialPlanWithRAG } from '@/lib/rag'
import { generatePlanWithTemplate } from '@/lib/planGenerationV2'
import { logger } from '@/lib/logger'

function extractSkillsFromText(text: string): string[] | null {
  const m = text.match(/(?:kỹ\s*năng|kinh\s*nghiệm)[\s:：-]*([^\n]+)/i)
  let list: string[] = []
  if (m && m[1]) list = m[1].split(/[;,|\/]|\s+và\s+/i).map(s => s.trim()).filter(Boolean)
  if (!list.length) {
    const dict: Array<{ re: RegExp; val: string }> = [
      { re: /digital\s*marketing/i, val: 'digital marketing' },
      { re: /\bmarketing\b/i, val: 'marketing' },
      { re: /chạy\s*ads|quảng\s*cáo|\bads\b/i, val: 'chạy ads' },
      { re: /facebook\s*ads/i, val: 'facebook ads' },
      { re: /google\s*ads/i, val: 'google ads' },
      { re: /tiktok/i, val: 'tiktok' },
      { re: /youtube/i, val: 'youtube' },
      { re: /sáng\s*tạo\s*nội\s*dung|\bcontent\b/i, val: 'sáng tạo nội dung' },
      { re: /làm\s*sản\s*phẩm|\bproduct\b/i, val: 'làm sản phẩm' },
      { re: /\bseo\b/i, val: 'SEO' },
      { re: /email\s*marketing/i, val: 'email marketing' },
      { re: /kinh\s*doanh\s*online/i, val: 'kinh doanh online' },
      { re: /growth/i, val: 'growth' },
    ]
    const set = new Set<string>()
    for (const d of dict) if (d.re.test(text)) set.add(d.val)
    if (set.size) return Array.from(set).slice(0, 10)
    return null
  }
  return Array.from(new Set(list)).slice(0, 10)
}

function extractSavingsVndFromText(text: string): number | null {
  const current = text.match(/(?:hiện\s*tại|đang\s*có|hiện\s*có|số\s*dư|tài\s*khoản\s*tiết\s*kiệm)[^\d]{0,30}(\d+(?:[.,]\d+)?)\s*(tỷ|ty|triệu|tr|bn|billion|t)/i)
  if (current) {
    const num = parseFloat(current[1].replace(/[.,]/g, ''))
    const unit = (current[2] || '').toLowerCase()
    if (unit.includes('tỷ') || unit.includes('ty') || unit.includes('bn') || unit.includes('billion')) return num * 1_000_000_000
    return num * 1_000_000
  }
  const targetCtx = /mục\s*tiêu[^\n]{0,80}(tiết\s*kiệm|tài\s*khoản\s*tiết\s*kiệm)/i.test(text)
  if (!targetCtx) {
    const generic = text.match(/(?:tiết\s*kiệm|tài\s*khoản\s*tiết\s*kiệm|tk)[^\d]{0,20}(\d+(?:[.,]\d+)?)\s*(tỷ|ty|triệu|tr|bn|billion|t)/i)
    if (generic) {
      const num2 = parseFloat(generic[1].replace(/[.,]/g, ''))
      const unit2 = (generic[2] || '').toLowerCase()
      if (unit2.includes('tỷ') || unit2.includes('ty') || unit2.includes('bn') || unit2.includes('billion')) return num2 * 1_000_000_000
      return num2 * 1_000_000
    }
  }
  return null
}
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
    const usageCheck = await checkUsageLimits(user.id, 'plan', request)
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
    
    // Generate cache key for this plan request (bump version to avoid stale cached layout and legacy prompts)
    const CACHE_VERSION = 'v9_force_exact_format_no_section_9';
    const cacheKey = `plan_${CACHE_VERSION}_${user.id}_${JSON.stringify(userProfile).slice(0, 100)}`
    
    // Check if we have a cached plan
    const { data: cachedPlan } = await getCachedResponse(cacheKey)
    let planContent = ''
    
    if (cachedPlan) {
      logger.info('PLAN_GENERATE_USE_CACHE', { userId: user.id })
      planContent = cachedPlan
    } else {
      // Generate plan content using AI with fallback mechanism (multi-step for long content)
      try {
        // First try with OpenAI's GPT-4o-mini
        // CRITICAL: Pass full userProfile with chat history
        logger.info('PLAN_GENERATE_CALL_OPENAI', { goal: userProfile.financial_goal, income: userProfile.current_income, messagesCount: messages.length })
        // Derive planName/goals + enrich collected info with chat summary
        // CRITICAL: Include BOTH user messages AND AI responses to capture full context
        const chatSummary = Array.isArray(messages)
          ? messages
              .map((m: any) => {
                const role = m.role === 'user' ? '👤 User' : '🤖 AI'
                return `${role}: ${m.content || m.message || ''}`
              })
              .join('\n\n')
              .slice(0, 8000)  // Increased from 4000 to capture more context
          : ''
        // Resolve tier + words for deeper personalization limits
        const { data: subscription } = await getUserSubscription(user.id)
        const resolvedTier = subscription?.tier || usageCheck.tier || 'free'
        const tierLimits = getSubscriptionLimits(resolvedTier)
        const enrichedCollectedInfo = {
          ...(collectedInfo || {}),
          // Merge extracted profile for reliability
          goal: userProfile.financial_goal,
          income: userProfile.current_income,
          current_income: userProfile.current_income,
          occupation: userProfile.occupation,
          timeline: userProfile.timeline,
          location: userProfile.location,
          savings: userProfile.savings,
          skills: extractSkillsFromText(chatSummary) || (collectedInfo as any)?.skills || undefined,
          current_savings: (collectedInfo as any)?.current_savings || extractSavingsVndFromText(chatSummary) || undefined,
          readiness: (userProfile as any).readiness || userProfile.readiness_level,
          age: (userProfile as any).age || null,
          family_status: (userProfile as any).family_status || '',
          risk_tolerance: (userProfile as any).risk_tolerance || 'moderate',
          free_hours_per_week: (userProfile as any).free_hours_per_week || null,
          available_time: (userProfile as any).available_time || '',
          debts: (userProfile as any).debts || null,
          assets_value: (userProfile as any).assets_value || null,
          assets: (userProfile as any).assets || [],
          // Context & tier limits
          chat_summary: chatSummary,
          tier: resolvedTier,
          maxWords: tierLimits.words,
          // CRITICAL: Pass full messages array so V2 can access entire conversation (user + AI)
          messages: messages
        }
        const goalsText = userProfile.financial_goal || (userProfile.description || 'Mục tiêu tài chính cá nhân')
        const planTitle = "Kế hoạch chi tiết cho mục tiêu của bạn"
        planContent = await generatePlanWithTemplate(
          planTitle,
          goalsText,
          enrichedCollectedInfo
        )
      } catch (aiError) {
        logger.error('PLAN_GENERATE_OPENAI_ERROR', { error: aiError instanceof Error ? aiError.message : String(aiError) })
        // No legacy prompt fallbacks. Re-throw to surface meaningful error to client
        throw aiError
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

    // Combine final content: Multi-step already contains checklist/roadmap/learning sections.
    // To avoid exceeding tier limits and truncation, we DO NOT append extra sections here.
    logger.info('PLAN_GENERATE_COMPOSE_FINAL', {})
    const enhancedPlanContent = displayContent
    
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

    // Get UPDATED usage stats after plan creation
    const updatedUsageAfterPlan = await checkUsageLimits(user.id, 'plan')
    const remainingPlans = Math.max(updatedUsageAfterPlan.limit - updatedUsageAfterPlan.current, 0)
    
    logger.info('PLAN_GENERATE_RESPONSE_USAGE', { 
      current: updatedUsageAfterPlan.current, 
      limit: updatedUsageAfterPlan.limit, 
      remaining: remainingPlans,
      tier: updatedUsageAfterPlan.tier 
    })

    return NextResponse.json({
      success: true,
      planId: plan.id,
      message: 'Kế hoạch đã được tạo thành công',
      wordCount,
      usage: {
        current: updatedUsageAfterPlan.current,  // UPDATED count after saving
        limit: updatedUsageAfterPlan.limit,
        tier: updatedUsageAfterPlan.tier,
        remaining: remainingPlans
      }
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
    birth_time: null,  // CRITICAL: Giờ sinh cho tử vi
    gender: null,       // CRITICAL: Giới tính cho tử vi
    savings: null,
    location: '',
    readiness: '',
    description: '',
    chat_history: messages,
    goals: [], // NEW: mảng mục tiêu nhỏ
    goals_total_value: 0 // NEW: tổng giá trị mục tiêu
  }

  // Combine all user messages into one text for better extraction
  const allUserMessages = messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join(' ');

  const contentLower = allUserMessages.toLowerCase();

  // Extract all financial goals (multi-goal) - CRITICAL: Phân biệt GOALS vs CURRENT STATE
  const goalRegexes = [
    // Mua nhà (GOAL) - linh hoạt hơn, cho phép từ như "tầm", "khoảng", "vào khoảng"
    /(?:mua|sở hữu|có)\s*(?:1|một)?\s*(?:căn)?\s*nhà[^.!?]*?(\d+[.,]?\d*)\s*(tỷ|triệu|tr|ty|bn)/gi,
    // Mua xe (GOAL) - linh hoạt hơn
    /(?:mua|sở hữu|có)\s*(?:1|một)?\s*(?:chiếc)?\s*(?:ô\s*tô|xe)[^.!?]*?(\d+[.,]?\d*)\s*(tỷ|triệu|tr|ty|bn)/gi,
    // Tài khoản tiết kiệm MỤC TIÊU (GOAL) - "có tài khoản tiết kiệm X" = GOAL
    /(?:có|sở hữu|đạt)\s*(?:1|một)?\s*tài\s*khoản\s*(?:ngân\s*hàng)?\s*(?:tiết\s*kiệm)?[^.!?]*?(\d+[.,]?\d*)\s*(tỷ|triệu|tr|ty|bn)/gi,
    // Thu nhập mục tiêu (GOAL)
    /(?:thu\s*nhập|kiếm|đạt|có\s*thu\s*nhập)[^.!?]*?(?:mục\s*tiêu)?[^.!?]*?(\d+[.,]?\d*)\s*(tỷ|triệu|tr|ty|bn)(?:\/tháng)?/gi,
  ];
  let goalsArr: any[] = [];
  let goalsTotal = 0;
  
  // Track seen goals to avoid duplicates
  const seenGoals = new Set<string>();
  
  for (const regex of goalRegexes) {
    let m;
    while ((m = regex.exec(allUserMessages)) !== null) {
      // Extract label, value, unit
      let fullMatch = m[0];
      let value = m[1] ? parseFloat(m[1].replace(',', '.')) : null;
      let unit = m[2] ? m[2].toLowerCase() : '';
      
      // Skip if this is CURRENT STATE (not GOAL)
      // "hiện có X tiết kiệm" = CURRENT STATE (skip)
      // "có tài khoản tiết kiệm X" = GOAL (keep)
      const isCurrentState = /(?:hiện\s*(?:có|tại)|đang\s*có|đã\s*có|số\s*dư)/.test(fullMatch.slice(0, 30));
      if (isCurrentState) continue; // Skip current state, only keep goals
      
      // Calculate VND value
      let vnd = 0;
      if (value) {
        if (unit.includes('tỷ') || unit.includes('ty') || unit.includes('bn')) vnd = value * 1_000_000_000;
        else if (unit.includes('triệu') || unit.includes('tr')) vnd = value * 1_000_000;
      }
      
      // Extract clean label
      let label = fullMatch.replace(/\d+[.,]?\d*\s*(tỷ|triệu|tr|ty|bn)?/g, '').trim();
      label = label.replace(/^(?:mua|sở hữu|có|đạt)\s*/i, '').trim(); // Remove prefixes
      
      // Categorize by type
      if (label.includes('nhà')) label = 'Mua nhà';
      else if (label.includes('xe') || label.includes('ô tô')) label = 'Mua xe ô tô';
      else if (label.includes('tài khoản') || label.includes('tiết kiệm')) label = 'Tài khoản tiết kiệm';
      else if (label.includes('thu nhập') || label.includes('kiếm')) label = 'Thu nhập mục tiêu';
      
      // Only add if has valid value and not duplicate
      if (vnd > 0 && label) {
        const key = `${label}:${vnd}`;
        if (!seenGoals.has(key)) {
          seenGoals.add(key);
          goalsArr.push({ label, value: vnd });
          // Only add to total if it's an ASSET goal (not income goal)
          if (!label.includes('Thu nhập')) {
            goalsTotal += vnd;
          }
        }
      }
    }
  }
  
  // Nếu có nhiều mục tiêu, lưu vào userProfile.goals và tổng
  if (goalsArr.length > 0) {
    userProfile.goals = goalsArr;
    userProfile.goals_total_value = goalsTotal;
    userProfile.financial_goal = goalsArr.map(g => {
      const amount = g.value >= 1_000_000_000 
        ? `${(g.value / 1_000_000_000).toFixed(1)} tỷ`
        : `${Math.round(g.value / 1_000_000)} triệu`;
      return `${g.label}: ${amount} VNĐ`;
    }).join(' | ');
  }

  // Extract financial goal (fallback)
  if (!userProfile.financial_goal) {
    const goalMatches = allUserMessages.match(/(?:mục tiêu|muốn|cần|mong muốn)[^.!?]*/gi);
    if (goalMatches) {
      userProfile.financial_goal = goalMatches[0].trim();
    }
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
  
  // CRITICAL: Extract full name for Tu Vi analysis
  const fullNamePatterns = [
    /(?:họ\s*tên|full\s*name|tên\s*đầy\s*đủ)[:\s]+([A-Za-zÀ-ỹ\s]{2,50})/i,
    /(?:tên|gọi)\s+(?:tôi|mình|em|anh|chị)\s+là\s+([A-Za-zÀ-ỹ\s]{2,50})/i,
    /(?:tôi|mình|em)\s+(?:tên|là)\s+([A-Za-zÀ-ỹ\s]{2,50})/i,
    /tên\s+là\s+([A-Za-zÀ-ỹ\s]{2,50})/i,
    /tên[:\s]+([A-Za-zÀ-ỹ\s]{2,50})/i
  ]
  for (const pattern of fullNamePatterns) {
    const match = allUserMessages.match(pattern)
    if (match && match[1]) {
      let name = match[1].trim().replace(/\s+(là|và|có|\d+|tuổi|năm).*$/i, '').trim()
      const words = name.split(/\s+/)
      if (words.length >= 2 && words.length <= 6) {
        userProfile.full_name = name
        break
      }
    }
  }
  
  // CRITICAL: Extract birth time for Tu Vi analysis
  const birthTimePatterns = [
    /(?:sinh|born)\s*(?:vào|lúc)?\s*(\d{1,2})\s*(?:h|giờ|:)?\s*(\d{0,2})?\s*(sáng|chiều|tối|đêm|trưa|am|pm)?/i,
    /(?:giờ\s*sinh|birth\s*time)[:\s]+(?:là\s*)?(\d{1,2})\s*(?:h|giờ|:)?\s*(\d{0,2})?\s*(sáng|chiều|tối|đêm|trưa|am|pm)?/i,
    /(?:lúc|vào)\s*(\d{1,2})\s*(?:h|giờ|:)\s*(\d{0,2})?\s*(sáng|chiều|tối|đêm|trưa|am|pm)?/i,
    /(\d{1,2})\s*giờ\s*(\d{0,2})?\s*(sáng|chiều|tối|đêm|trưa)?/i
  ]
  for (const pattern of birthTimePatterns) {
    const match = allUserMessages.match(pattern)
    if (match && match[1]) {
      let hour = parseInt(match[1])
      const minute = match[2] ? parseInt(match[2]) : 0
      const period = (match[3] || '').toLowerCase()
      if (period === 'chiều' || period === 'tối' || period === 'pm') {
        if (hour < 12) hour += 12
      } else if (period === 'sáng' || period === 'am') {
        if (hour === 12) hour = 0
      } else if (period === 'đêm') {
        if (hour >= 6 && hour <= 11) hour += 12
      } else if (period === 'trưa') {
        if (hour < 12) hour = 12
      }
      userProfile.birth_time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      break
    }
  }
  
  // CRITICAL: Extract gender for Tu Vi analysis
  const genderPatterns = [
    /(?:giới\s*tính|gender)[:\s]+(?:là\s*)?(nam|nữ|male|female)/i,
    /(?:tôi|mình|em)\s+là\s+(nam|nữ|nam\s*giới|nữ\s*giới)/i
  ]
  for (const pattern of genderPatterns) {
    const match = allUserMessages.match(pattern)
    if (match && match[1]) {
      const genderText = match[1].toLowerCase()
      if (genderText.includes('nam') || genderText === 'male') {
        userProfile.gender = 'Nam'
        break
      } else if (genderText.includes('nữ') || genderText === 'female') {
        userProfile.gender = 'Nữ'
        break
      }
    }
  }
  // Fallback: check for implicit gender mentions
  if (!userProfile.gender) {
    if (contentLower.includes('nam giới') || /\bnam\b/.test(contentLower)) {
      if (!contentLower.includes('việt nam') && !contentLower.includes('vietnam')) {
        userProfile.gender = 'Nam'
      }
    } else if (contentLower.includes('nữ giới') || /\bnữ\b/.test(contentLower)) {
      userProfile.gender = 'Nữ'
    }
  }
  
  // Extract current savings (CRITICAL: Only "hiện có X tiết kiệm", NOT "có tài khoản tiết kiệm X")
  // "hiện có 280tr tiết kiệm" = CURRENT SAVINGS ✅
  // "có tài khoản tiết kiệm 10 tỷ" = GOAL (already in goals array) ❌
  const currentSavingsRegex = /(?:hiện\s*(?:có|tại)|đang\s*có|đã\s*có|số\s*dư)[^.!?]*?(\d+[.,]?\d*)\s*(tỷ|triệu|tr|ty|bn)?[^.!?]*?(?:tiết\s*kiệm)?/gi;
  const savingsMatch = currentSavingsRegex.exec(allUserMessages);
  if (savingsMatch) {
    const value = parseFloat(savingsMatch[1].replace(',', '.'));
    const unit = (savingsMatch[2] || '').toLowerCase();
    if (unit.includes('tỷ') || unit.includes('ty') || unit.includes('bn')) {
      userProfile.savings = value * 1_000_000_000;
    } else if (unit.includes('triệu') || unit.includes('tr')) {
      userProfile.savings = value * 1_000_000;
    } else {
      userProfile.savings = value * 1_000_000; // Default to triệu
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
