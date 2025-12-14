export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Vercel Free = 60s, Pro = 900s (15 min), Enterprise = 3600s (60 min)
// For Vercel Free, we use chunked generation with database checkpointing
export const maxDuration = 300 // 300 seconds - Vercel Free max limit (5 minutes)
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getCurrentUser, getUserSubscription, checkUsageLimits, getSubscriptionLimits, getTierName, getServerCapsByTier } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { generateLongPlanMultiStep } from '@/lib/planGeneration'

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
  const current = text.match(/(?:hiện\s*tại|đang\s*có|hiện\s*có|số\s*dư|tài\s*khoản\s*tiết\s*kiệm|\btk\b)[^\d]{0,30}(\d+(?:[.,]\d+)?)\s*(tỷ|ty|triệu|tr|bn|billion|t)/i)
  if (current) {
    const num = parseFloat(current[1].replace(/[.,]/g, ''))
    const unit = (current[2] || '').toLowerCase()
    if (unit.includes('tỷ') || unit.includes('ty') || unit.includes('bn') || unit.includes('billion')) return num * 1_000_000_000
    return num * 1_000_000
  }
  const targetCtx = /mục\s*tiêu[^\n]{0,80}(tiết\s*kiệm|tài\s*khoản\s*tiết\s*kiệm)/i.test(text)
  if (!targetCtx) {
    const generic = text.match(/(?:tiết\s*kiệm|tài\s*khoản\s*tiết\s*kiệm|\btk\b)[^\d]{0,20}(\d+(?:[.,]\d+)?)\s*(tỷ|ty|triệu|tr|bn|billion|t)/i)
    if (generic) {
      const num2 = parseFloat(generic[1].replace(/[.,]/g, ''))
      const unit2 = (generic[2] || '').toLowerCase()
      if (unit2.includes('tỷ') || unit2.includes('ty') || unit2.includes('bn') || unit2.includes('billion')) return num2 * 1_000_000_000
      return num2 * 1_000_000
    }
  }
  return null
}

// CRITICAL: Extract Tu Vi info (full_name, birth_time, gender) from chat summary
function extractTuViInfoFromChat(text: string): { full_name: string | null, birth_time: string | null, gender: string | null } {
  const result: { full_name: string | null, birth_time: string | null, gender: string | null } = {
    full_name: null,
    birth_time: null,
    gender: null
  }
  
  // Extract full name
  const fullNamePatterns = [
    /(?:họ\s*tên|full\s*name|tên\s*đầy\s*đủ)[:\s]+([A-Za-zÀ-ỹ\s]{2,50})/i,
    /(?:tên|gọi)\s+(?:tôi|mình|em|anh|chị)\s+là\s+([A-Za-zÀ-ỹ\s]{2,50})/i,
    /(?:tôi|mình|em)\s+(?:tên|là)\s+([A-Za-zÀ-ỹ\s]{2,50})/i,
    /tên\s+là\s+([A-Za-zÀ-ỹ\s]{2,50})/i,
    /tên[:\s]+([A-Za-zÀ-ỹ\s]{2,50})/i
  ]
  for (const pattern of fullNamePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      let name = match[1].trim().replace(/\s+(là|và|có|\d+|tuổi|năm).*$/i, '').trim()
      const words = name.split(/\s+/)
      if (words.length >= 2 && words.length <= 6) {
        result.full_name = name
        break
      }
    }
  }
  
  // Extract birth time
  const birthTimePatterns = [
    /(?:sinh|born)\s*(?:vào|lúc)?\s*(\d{1,2})\s*(?:h|giờ|:)?\s*(\d{0,2})?\s*(sáng|chiều|tối|đêm|trưa|am|pm)?/i,
    /(?:giờ\s*sinh|birth\s*time)[:\s]+(?:là\s*)?(\d{1,2})\s*(?:h|giờ|:)?\s*(\d{0,2})?\s*(sáng|chiều|tối|đêm|trưa|am|pm)?/i,
    /(?:lúc|vào)\s*(\d{1,2})\s*(?:h|giờ|:)\s*(\d{0,2})?\s*(sáng|chiều|tối|đêm|trưa|am|pm)?/i,
    /(\d{1,2})\s*giờ\s*(\d{0,2})?\s*(sáng|chiều|tối|đêm|trưa)?/i
  ]
  for (const pattern of birthTimePatterns) {
    const match = text.match(pattern)
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
      result.birth_time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      break
    }
  }
  
  // Extract gender
  const textLower = text.toLowerCase()
  const genderPatterns = [
    /(?:giới\s*tính|gender)[:\s]+(?:là\s*)?(nam|nữ|male|female)/i,
    /(?:tôi|mình|em)\s+là\s+(nam|nữ|nam\s*giới|nữ\s*giới)/i
  ]
  for (const pattern of genderPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const genderText = match[1].toLowerCase()
      if (genderText.includes('nam') || genderText === 'male') {
        result.gender = 'Nam'
        break
      } else if (genderText.includes('nữ') || genderText === 'female') {
        result.gender = 'Nữ'
        break
      }
    }
  }
  // Fallback: check for implicit gender mentions
  if (!result.gender) {
    if (textLower.includes('nam giới') || /\bnam\b/.test(textLower)) {
      if (!textLower.includes('việt nam') && !textLower.includes('vietnam')) {
        result.gender = 'Nam'
      }
    } else if (textLower.includes('nữ giới') || /\bnữ\b/.test(textLower)) {
      result.gender = 'Nữ'
    }
  }
  
  return result
}
/**
 * Background Job API - Starts plan generation in background
 * Returns immediately with job_id, AI processes in background
 */
export async function POST(request: NextRequest) {
  try {
    logger.info('BG_START', {})
    
    // Prefer session-bound client for RLS operations
    const cookieStore = cookies()
    const rhSupabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: authData } = await rhSupabase.auth.getUser()
    const user = authData?.user
    if (!user) {
      logger.warn('BG_UNAUTHORIZED', {})
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { planName, goals, collectedInfo, messages } = await request.json()

    // Capture Authorization token (for background processing)
    const authHeader = request.headers.get('Authorization') || ''

    // Fallback: derive plan name and goals if missing from chat_summary
    const chatSummary: string = String(collectedInfo?.chat_summary || '')
    const derivedGoal = (goals && String(goals).trim()) || chatSummary.slice(0, 80).trim() || 'Mục tiêu tài chính cá nhân'
    const finalPlanName = (planName && String(planName).trim()) || 'Kế hoạch chi tiết cho mục tiêu của bạn'
    const finalGoals = derivedGoal

    if (!finalPlanName || !finalGoals) {
      return NextResponse.json(
        { error: 'Missing required fields: planName, goals' },
        { status: 400 }
      )
    }

    // Enforce tier-based plan creation limits
    let planUsage
    try {
      planUsage = await checkUsageLimits(user.id, 'plan', request)
      logger.info('BG_USAGE_CHECK_SUCCESS', { 
        userId: user.id, 
        allowed: planUsage.allowed,
        current: planUsage.current,
        limit: planUsage.limit,
        tier: planUsage.tier
      })
    } catch (usageError) {
      logger.error('BG_USAGE_CHECK_ERROR', { 
        userId: user.id,
        error: String(usageError)
      })
      // Continue anyway - don't block plan generation due to usage check failure
      planUsage = { allowed: true, current: 0, limit: 1, tier: 'free' }
    }
    
    if (!planUsage.allowed) {
      const tier = planUsage.tier || 'free'
      const limits = getSubscriptionLimits(tier)
      const tierName = getTierName(tier)
      return NextResponse.json(
        {
          error: 'Đã đạt giới hạn kế hoạch',
          message: `Bạn đã tạo ${planUsage.current}/${planUsage.limit} kế hoạch trong tháng của gói ${tierName}. Hãy nâng cấp gói để tiếp tục sử dụng.`,
          usage: {
            current: planUsage.current,
            limit: planUsage.limit,
            tier,
          },
          upgradeRequired: true,
        },
        { status: 429 }
      )
    }

    const { data: subData } = await getUserSubscription(user.id)
    const tier = subData?.tier || 'free'
    const tierLimits = getSubscriptionLimits(tier)
    
    // Build full chat summary from messages array - INCLUDE BOTH USER AND AI MESSAGES
    // Increased limit to 12000 chars to capture more context for paid tiers
    const chatLimit = tier === 'free' ? 4000 : 12000
    const fullChatSummary = Array.isArray(messages)
      ? messages
          .map((m: any) => {
            const role = m.role === 'user' ? '👤 User' : '🤖 AI'
            return `${role}: ${m.content || m.message || ''}`
          })
          .join('\n\n')
          .slice(0, chatLimit)
      : chatSummary.slice(0, chatLimit)
    
    logger.info('BG_GENERATE_CHAT_CONTEXT', { 
      messagesCount: Array.isArray(messages) ? messages.length : 0,
      chatSummaryLength: fullChatSummary.length,
      tier
    })
    
    // CRITICAL: Log tier info for debugging Free vs Paid issue
    logger.info('BG_GENERATE_TIER_INFO', {
      tier,
      expectedWordRange: tier === 'free' ? '3000-5000' : '20000-50000',
      expectedSections: tier === 'free' ? 9 : 24,
      userId: user.id,
      route: 'generate-background'
    })
    
    // CRITICAL: Extract full_name, birth_time, gender for Tu Vi analysis
    const extractedTuViInfo = extractTuViInfoFromChat(fullChatSummary)
    
    const enrichedCollectedInfo = { 
      ...(collectedInfo || {}), 
      maxWords: tierLimits.words, 
      tier, 
      chat_summary: fullChatSummary,
      messages: messages, // Pass full messages array for AI context
      skills: extractSkillsFromText(fullChatSummary) || (collectedInfo as any)?.skills || undefined,
      current_savings: (collectedInfo as any)?.current_savings || extractSavingsVndFromText(fullChatSummary) || undefined,
      // CRITICAL: Tu Vi fields - extracted from chat summary and collectedInfo
      full_name: extractedTuViInfo.full_name || (collectedInfo as any)?.full_name || (collectedInfo as any)?.userProfile?.full_name || undefined,
      birth_time: extractedTuViInfo.birth_time || (collectedInfo as any)?.birth_time || (collectedInfo as any)?.userProfile?.birth_time || undefined,
      gender: extractedTuViInfo.gender || (collectedInfo as any)?.gender || (collectedInfo as any)?.userProfile?.gender || undefined
    }
    
    logger.info('BG_GENERATE_TUVI_INFO', {
      full_name: enrichedCollectedInfo.full_name,
      birth_time: enrichedCollectedInfo.birth_time,
      gender: enrichedCollectedInfo.gender,
      userId: user.id
    })

    const caps = getServerCapsByTier(tier)

    // --- Auto-clean stale jobs (>30m) to prevent blocking (increased for longer Free plans) ---
    try {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined
      const admin = serviceKey ? createClient(supabaseUrl, serviceKey) : null
      if (admin) {
        await admin
          .from('plan_jobs')
          .update({ status: 'failed', error_message: 'auto-timeout', completed_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .in('status', ['pending', 'processing'])
          .lte('created_at', thirtyMinAgo)
      }
    } catch (cleanErr) {
      logger.warn('BG_CLEAN_STALE_FAIL', { error: String(cleanErr) })
    }
    // Use session-bound client for counting running jobs
    const { count: runningCount, error: countError } = await rhSupabase
      .from('plan_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('status', ['pending', 'processing'])
      .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())

    if (countError) {
      return NextResponse.json(
        { error: 'Không thể kiểm tra số job đang chạy' },
        { status: 500 }
      )
    }

    if ((runningCount || 0) >= caps.maxConcurrentJobs) {
      const tierName = getTierName(tier)
      return NextResponse.json(
        {
          error: 'Quá nhiều tác vụ đang chạy',
          message: `Bạn đang có ${(runningCount || 0)} tác vụ tạo kế hoạch đang chạy. Giới hạn đồng thời của gói ${tierName} là ${caps.maxConcurrentJobs}. Hãy đợi tác vụ hiện tại hoàn tất hoặc nâng cấp gói.`,
          upgradeRequired: true
        },
        { status: 429 }
      )
    }

    // Create job ID
    const jobId = randomUUID()
    logger.info('BG_JOB_CREATED', { jobId, userId: user.id })

    // Insert job record
    const { error: insertError } = await rhSupabase
      .from('plan_jobs')
      .insert({
        id: jobId,
        user_id: user.id,
        plan_name: finalPlanName,
        goals: finalGoals,
        status: 'pending',
        created_at: new Date().toISOString()
      })

    if (insertError) {
      logger.error('BG_DB_INSERT_ERROR', { jobId, userId: user.id, error: String(insertError) })
      return NextResponse.json(
        { error: 'Failed to create job' },
        { status: 500 }
      )
    }

    // CHUNKED GENERATION: For Vercel Free (60s limit)
    // Instead of generating entire plan in one request, we:
    // 1. Start the job and generate first 1-2 sections
    // 2. Save progress to database
    // 3. Frontend polls and calls /api/plans/continue-generation to continue
    
    // Generate first batch of sections (within 60s limit)
    const { generatePlanSection } = await import('@/lib/planGenerationChunked')
    
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        // Create admin client INSIDE stream callback to ensure it's available
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
        const admin = serviceKey ? createClient(supabaseUrl, serviceKey) : null
        
        if (!admin) {
          logger.error('BG_NO_ADMIN_CLIENT', { jobId })
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', job_id: jobId, error: 'Server configuration error' })}\n\n`))
          controller.close()
          return
        }
        
        try {
          // Update job status to processing FIRST - with error checking
          const { error: updateError } = await admin
            .from('plan_jobs')
            .update({
              status: 'processing',
              started_at: new Date().toISOString(),
              metadata: {
                currentSectionIndex: 0,
                generatedSections: [],
                collectedInfo: enrichedCollectedInfo,
                tier
              }
            })
            .eq('id', jobId)
          
          if (updateError) {
            logger.error('BG_UPDATE_PROCESSING_FAILED', { jobId, error: updateError.message })
          } else {
            logger.info('BG_UPDATE_PROCESSING_OK', { jobId })
          }
          
          // Send initial response
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'started', job_id: jobId })}\n\n`))
          
          // Generate first sections
          const result = await generatePlanSection(
            finalPlanName,
            finalGoals,
            enrichedCollectedInfo,
            0, // Start from section 0
            [] // No previous sections
          )
          
          if (result.error) {
            // Update job with error
            if (admin) {
              await admin
                .from('plan_jobs')
                .update({
                  status: 'failed',
                  error_message: result.error,
                  completed_at: new Date().toISOString()
                })
                .eq('id', jobId)
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', job_id: jobId, error: result.error })}\n\n`))
            controller.close()
            return
          }
          
          if (result.isComplete) {
            // All sections generated in first batch (unlikely but possible for very short plans)
            const planContent = result.fullPlanContent || ''
            
            // CRITICAL: Re-check job status to prevent race condition duplicate insert
            const { data: freshJob } = await admin
              .from('plan_jobs')
              .select('status, plan_id')
              .eq('id', jobId)
              .single()
            
            if (freshJob?.plan_id || freshJob?.status === 'completed') {
              logger.info('BG_RACE_PREVENTED', { jobId, existingPlanId: freshJob?.plan_id })
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'completed', job_id: jobId, plan_id: freshJob.plan_id })}\n\n`))
              controller.close()
              return
            }
            
            // Save plan
            const { data: planData, error: planError } = await (admin || rhSupabase)
              .from('plans')
              .insert({
                user_id: user.id,
                title: finalPlanName,
                goal: finalGoals,
                content: planContent,
                status: 'completed',
                word_count: planContent.split(/\s+/).length,
                collected_info: enrichedCollectedInfo,
                created_at: new Date().toISOString()
              })
              .select()
              .single()
            
            if (planError) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', job_id: jobId, error: 'Failed to save plan' })}\n\n`))
              controller.close()
              return
            }
            
            // Update job as completed
            if (admin) {
              await admin
                .from('plan_jobs')
                .update({
                  status: 'completed',
                  plan_id: planData.id,
                  completed_at: new Date().toISOString()
                })
                .eq('id', jobId)
            }
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'completed', job_id: jobId, plan_id: planData.id })}\n\n`))
            controller.close()
            return
          }
          
          // Save progress - more sections to generate - WITH ERROR CHECKING
          const metadataToSave = {
            currentSectionIndex: result.nextSectionIndex,
            generatedSections: result.generatedSections,
            collectedInfo: enrichedCollectedInfo,
            totalSections: result.totalSections,
            tier,
            lastUpdated: new Date().toISOString()
          }
          
          const { error: metaError } = await admin
            .from('plan_jobs')
            .update({
              status: 'processing',
              metadata: metadataToSave
            })
            .eq('id', jobId)
          
          if (metaError) {
            logger.error('BG_SAVE_METADATA_FAILED', { jobId, error: metaError.message, nextSectionIndex: result.nextSectionIndex })
            // Still send progress to frontend, but log the error
          } else {
            logger.info('BG_SAVE_METADATA_OK', { jobId, nextSectionIndex: result.nextSectionIndex, totalSections: result.totalSections })
          }
          
          // Send progress update - frontend will call continue-generation
          const progress = Math.round((result.nextSectionIndex / result.totalSections) * 90) + 5
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'progress', 
            job_id: jobId, 
            progress,
            currentSection: result.nextSectionIndex,
            totalSections: result.totalSections,
            needsContinue: true
          })}\n\n`))
          controller.close()
          
        } catch (error: any) {
          logger.error('BG_STREAM_ERROR', { jobId, error: error?.message })
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', job_id: jobId, error: error?.message || 'Unknown error' })}\n\n`))
          controller.close()
        }
      }
    })
    
    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })

  } catch (error) {
    logger.error('BG_UNHANDLED', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Background processing function - runs independently
 */
async function processJobInBackground(
  jobId: string,
  userId: string,
  planName: string,
  goals: string,
  collectedInfo: any,
  authHeader: string
): Promise<{ planId: string } | null> {
  // Create an authenticated Supabase client using the passed token for RLS-compliant operations
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : ''
  const supabase = createClient(supabaseUrl, supabaseAnonKey, token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {})
  // Admin client (no RLS) for robust job status updates
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined
  const admin = serviceKey ? createClient(supabaseUrl, serviceKey) : null
  
  // Set timeout for entire job processing based on tier
  // Free tier: 10 minutes, Paid tiers (basic, pro): 30 minutes
  // Note: Vercel maxDuration must be set high enough (900s for Pro, 3600s for Enterprise)
  const tier = String(collectedInfo?.tier || 'free')
  const timeoutMs = tier === 'free' 
    ? 10 * 60 * 1000  // 10 minutes for free tier
    : 30 * 60 * 1000  // 30 minutes for paid tiers (basic, pro)
  let timeoutHandle: NodeJS.Timeout | null = null
  
  try {
    logger.info('BG_PROCESS_START', { jobId, userId, tier, timeoutMs })
    
    // Set timeout to auto-fail job if it takes too long
    timeoutHandle = setTimeout(async () => {
      logger.error('BG_JOB_TIMEOUT', { jobId, userId, tier, timeoutMs })
      try {
        const client = admin || supabase
        await client
          .from('plan_jobs')
          .update({ 
            status: 'failed', 
            error_message: `Job timeout after ${timeoutMs / 1000}s`, 
            completed_at: new Date().toISOString() 
          })
          .eq('id', jobId)
      } catch (e) {
        logger.error('BG_TIMEOUT_UPDATE_FAIL', { jobId, error: String(e) })
      }
    }, timeoutMs)

    const getJobStatus = async (): Promise<string | null> => {
      try {
        const client = admin || supabase
        const { data } = await client
          .from('plan_jobs')
          .select('status')
          .eq('id', jobId)
          .maybeSingle()
        return (data as any)?.status || null
      } catch {
        return null
      }
    }

    // If job already cancelled before processing, exit
    const initialStatus = await getJobStatus()
    if (initialStatus === 'cancelled') {
      logger.info('BG_JOB_CANCELLED_EARLY', { jobId })
      return null
    }

    // Update status to processing (prefer admin client to avoid RLS/token issues)
    if (admin) {
      await admin
        .from('plan_jobs')
        .update({ status: 'processing', started_at: new Date().toISOString() })
        .eq('id', jobId)
    } else {
      await supabase
        .from('plan_jobs')
        .update({ status: 'processing', started_at: new Date().toISOString() })
        .eq('id', jobId)
    }

    // Ensure profile exists to satisfy potential FK (plans.user_id -> profiles.id or auth.users.id)
    try {
      // Try with admin client first (most reliable)
      if (admin) {
        const { data: prof } = await admin
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle()
        
        if (!prof) {
          // Profile doesn't exist, create it with required email field
          const { error: insertErr } = await admin
            .from('profiles')
            .insert({ 
              id: userId, 
              email: `user_${userId}@planai.io`, // Fallback email if not available
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          
          if (insertErr) {
            logger.warn('BG_ENSURE_PROFILE_INSERT_FAIL', { userId, error: String(insertErr) })
          } else {
            logger.info('BG_ENSURE_PROFILE_CREATED', { userId })
          }
        }
      } else {
        // Fallback to user-scoped client
        const { data: prof } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle()
        
        if (!prof) {
          // Profile doesn't exist, create it with required email field
          const { error: insertErr } = await supabase
            .from('profiles')
            .insert({ 
              id: userId, 
              email: `user_${userId}@planai.io`, // Fallback email if not available
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          
          if (insertErr) {
            logger.warn('BG_ENSURE_PROFILE_INSERT_FAIL_FALLBACK', { userId, error: String(insertErr) })
          }
        }
      }
    } catch (ensureErr) {
      logger.error('BG_ENSURE_PROFILE_FAIL', { userId, error: String(ensureErr) })
    }

    // Generate plan using unified clean generator (no legacy prompts)
    logger.info('BG_GENERATOR_V4_START', { jobId, tier })
    const limits = getSubscriptionLimits(tier)
    const safeTitle = planName || 'Kế hoạch tài chính'
    const safeGoals = goals || collectedInfo?.goal || 'Kế hoạch tài chính'
    
    let content_md
    try {
      logger.info('BG_GENERATOR_CALLING', { jobId, safeTitle, safeGoalsLength: safeGoals.length })
      content_md = await generateLongPlanMultiStep(safeTitle, safeGoals, { ...collectedInfo, maxWords: limits.words, tier })
      logger.info('BG_GENERATOR_SUCCESS', { jobId, contentLength: content_md.length })
    } catch (genError) {
      logger.error('BG_GENERATOR_ERROR', { jobId, error: String(genError) })
      throw genError
    }
    const title = safeTitle

    content_md = content_md
      .replace(/\|[^\n]*\|[^\n]*\|[\s\S]*?(?=\n\s*\n|$)/g, '')
      .replace(/```mermaid[\s\S]*?```/g, '')
      .replace(/#+\s*Xuất Dữ Liệu Bảng[\s\S]*?(#+|$)/i, '$1')
      .replace(/#+\s*$/gm, '')
      .replace(/\n{3,}/g, '\n\n')

    // Do not inject CTA or legacy text

    // No QA rewriter pass in background route

    // CRITICAL: Re-check job status to prevent race condition duplicate insert
    const client = admin || supabase
    const { data: freshJob } = await client
      .from('plan_jobs')
      .select('status, plan_id')
      .eq('id', jobId)
      .single()
    
    if (freshJob?.plan_id || freshJob?.status === 'completed') {
      logger.info('BG_PROCESS_RACE_PREVENTED', { jobId, existingPlanId: freshJob?.plan_id })
      return { planId: freshJob.plan_id }
    }

    // Save plan (RLS first, fallback admin)
    let planData: any = null
    let planError: any = null
    {
      const resp = await supabase
        .from('plans')
        .insert({
          user_id: userId,
          title,
          goal: goals,
          content: content_md,
          status: 'completed',
          word_count: content_md.split(/\s+/).length,
          collected_info: { ...collectedInfo, tier },
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      planData = resp.data
      planError = resp.error
    }
    if (planError && admin) {
      const resp = await admin
        .from('plans')
        .insert({
          user_id: userId,
          title,
          goal: goals,
          content: content_md,
          status: 'completed',
          word_count: content_md.split(/\s+/).length,
          collected_info: { ...collectedInfo, tier },
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      planData = resp.data
      planError = resp.error
    }
    if (planError) {
      const isFK = String(planError.message || '').toLowerCase().includes('foreign key')
      if (isFK) {
        const client = admin || supabase
        await client.from('profiles').upsert({ id: userId, created_at: new Date().toISOString() })
        const retry = await (admin || supabase)
          .from('plans')
          .insert({
            user_id: userId,
            title,
            goal: goals,
            content: content_md,
            status: 'completed',
            word_count: content_md.split(/\s+/).length,
            collected_info: { ...collectedInfo, tier },
            created_at: new Date().toISOString()
          })
          .select()
          .single()
        if (retry.error) throw new Error(`Failed to save plan (retry): ${retry.error.message}`)
        planData = retry.data
      } else {
        throw new Error(`Failed to save plan: ${planError.message}`)
      }
    }

    const updatePayload = { status: 'completed', plan_id: planData.id, completed_at: new Date().toISOString() }
    let statusUpdateError: any = null
    if (admin) {
      const { error: updateErr } = await admin.from('plan_jobs').update(updatePayload).eq('id', jobId)
      statusUpdateError = updateErr
    } else {
      const { error: updateErr } = await supabase.from('plan_jobs').update(updatePayload).eq('id', jobId)
      statusUpdateError = updateErr
    }
    if (statusUpdateError) {
      logger.error('BG_JOB_STATUS_UPDATE_FAILED', { jobId, error: String(statusUpdateError) })
      throw new Error(`Failed to update job status: ${statusUpdateError.message}`)
    }
    logger.info('BG_JOB_COMPLETED', { jobId, planId: planData.id })
    return { planId: planData.id }

  } catch (error: any) {
    logger.error('BG_JOB_FAILED', { jobId, error: error?.message || String(error) })

    // Update job with error (prefer admin to guarantee write)
    const errMsg = (error?.message || 'Unknown error').slice(0, 500)
    if (admin) {
      await admin
        .from('plan_jobs')
        .update({ status: 'failed', error_message: errMsg, completed_at: new Date().toISOString() })
        .eq('id', jobId)
    } else {
      await supabase
        .from('plan_jobs')
        .update({ status: 'failed', error_message: errMsg, completed_at: new Date().toISOString() })
        .eq('id', jobId)
    }
    throw error // Re-throw to be caught by streaming handler
  } finally {
    // Clear timeout to prevent memory leak
    if (timeoutHandle) {
      clearTimeout(timeoutHandle)
    }
  }
}
