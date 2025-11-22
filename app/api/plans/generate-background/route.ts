export const runtime = 'nodejs'
export const maxDuration = 300
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getCurrentUser, getUserSubscription, checkUsageLimits, getSubscriptionLimits, getTierName, getServerCapsByTier } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { generateLongPlanMultiStep } from '@/lib/planGeneration'

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
    const finalPlanName = (planName && String(planName).trim()) || (derivedGoal ? `Kế hoạch: ${derivedGoal}` : `Kế hoạch tài chính - ${new Date().toLocaleDateString('vi-VN')}`)
    const finalGoals = derivedGoal

    if (!finalPlanName || !finalGoals) {
      return NextResponse.json(
        { error: 'Missing required fields: planName, goals' },
        { status: 400 }
      )
    }

    // Enforce tier-based plan creation limits
    const planUsage = await checkUsageLimits(user.id, 'plan')
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
    
    // Build full chat summary from messages array (not just collectedInfo.chat_summary)
    const fullChatSummary = Array.isArray(messages)
      ? messages
          .filter((m: any) => m && m.role === 'user')
          .map((m: any) => m.content || m.message)
          .join('\n')
          .slice(0, 4000)
      : chatSummary.slice(0, 4000)
    
    const enrichedCollectedInfo = { 
      ...(collectedInfo || {}), 
      maxWords: tierLimits.words, 
      tier, 
      chat_summary: fullChatSummary,
      messages: messages // Pass full messages array for AI context
    }

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

    // Start background processing (don't await)
    processJobInBackground(jobId, user.id, finalPlanName, finalGoals, enrichedCollectedInfo, authHeader)
      .catch(error => logger.error('BG_JOB_ASYNC_FAIL', { jobId, error: String(error) }))

    // Return immediately with job_id
    return NextResponse.json(
      { 
        job_id: jobId,
        message: 'Plan generation started. You can close this tab or continue browsing.'
      },
      { status: 202 } // 202 Accepted
    )

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
) {
  // Create an authenticated Supabase client using the passed token for RLS-compliant operations
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : ''
  const supabase = createClient(supabaseUrl, supabaseAnonKey, token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {})
  // Admin client (no RLS) for robust job status updates
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined
  const admin = serviceKey ? createClient(supabaseUrl, serviceKey) : null
  
  try {
    logger.info('BG_PROCESS_START', { jobId, userId })

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
      return
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
    logger.info('BG_GENERATOR_V4_START', { jobId })
    const tier = String(collectedInfo?.tier || 'free')
    const limits = getSubscriptionLimits(tier)
    const safeTitle = planName || 'Kế hoạch tài chính'
    const safeGoals = goals || collectedInfo?.goal || 'Kế hoạch tài chính'
    let content_md = await generateLongPlanMultiStep(safeTitle, safeGoals, { ...collectedInfo, maxWords: limits.words, tier })
    const title = safeTitle

    content_md = content_md
      .replace(/\|[^\n]*\|[^\n]*\|[\s\S]*?(?=\n\s*\n|$)/g, '')
      .replace(/```mermaid[\s\S]*?```/g, '')
      .replace(/#+\s*Xuất Dữ Liệu Bảng[\s\S]*?(#+|$)/i, '$1')
      .replace(/#+\s*$/gm, '')
      .replace(/\n{3,}/g, '\n\n')

    // Do not inject CTA or legacy text

    // No QA rewriter pass in background route

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
    return

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
  }
}
