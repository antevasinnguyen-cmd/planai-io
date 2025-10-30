import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getCurrentUser, getUserSubscription, checkUsageLimits, getSubscriptionLimits, getTierName, getServerCapsByTier } from '@/lib/supabase'
import { generateFinancialPlan } from '@/lib/openai'
import { logger } from '@/lib/logger'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

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

    const { planName, goals, collectedInfo } = await request.json()

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
    const enrichedCollectedInfo = { ...(collectedInfo || {}), maxWords: tierLimits.words, tier, chat_summary: chatSummary.slice(0, 4000) }

    const caps = getServerCapsByTier(tier)

    // --- Auto-clean stale jobs (>10m) to prevent blocking ---
    try {
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined
      const admin = serviceKey ? createClient(supabaseUrl, serviceKey) : null
      if (admin) {
        await admin
          .from('plan_jobs')
          .update({ status: 'failed', error_message: 'auto-timeout', completed_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .in('status', ['pending', 'processing'])
          .lte('created_at', tenMinAgo)
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
      const client = admin || supabase
      // Fetch email from auth if possible (service role only)
      let email: string | null = null
      try {
        if (admin && (admin as any).auth?.admin?.getUserById) {
          const { data: authUser } = await (admin as any).auth.admin.getUserById(userId)
          email = authUser?.user?.email || null
        }
      } catch {}
      const { data: prof } = await client
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle()
      if (!prof) {
        await client
          .from('profiles')
          .insert({ id: userId, email: email || undefined, created_at: new Date().toISOString() })
      }
    } catch (ensureErr) {
      logger.warn('BG_ENSURE_PROFILE_FAIL', { userId, error: String(ensureErr) })
    }

    // Generate plan with timeout + retry/backoff
    const maxAttempts = 3
    let attempt = 0
    let lastError: any = null
    while (attempt < maxAttempts) {
      attempt++
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000)
      try {
        logger.info('BG_ATTEMPT_CALL_AI', { jobId, attempt })
        
        const planContent = await generateFinancialPlan(
          planName,
          goals,
          collectedInfo,
          controller.signal
        )
        clearTimeout(timeoutId)
        logger.info('BG_ATTEMPT_AI_DONE', { jobId, attempt })

        // Save plan
        // First, try to save plan with user-scoped client (RLS)
        let planData: any = null
        let planError: any = null
        {
          const resp = await supabase
            .from('plans')
            .insert({
              user_id: userId,
              title: planName,
              goal: goals,
              content: planContent,
              status: 'completed',
              word_count: planContent.split(' ').length,
              created_at: new Date().toISOString()
            })
            .select()
            .single()
          planData = resp.data
          planError = resp.error
        }
        // Fallback to admin client if RLS/token fails
        if (planError && admin) {
          const resp = await admin
            .from('plans')
            .insert({
              user_id: userId,
              title: planName,
              goal: goals,
              content: planContent,
              status: 'completed',
              word_count: planContent.split(' ').length,
              created_at: new Date().toISOString()
            })
            .select()
            .single()
          planData = resp.data
          planError = resp.error
        }

        if (planError) {
          // If FK violation, try once more after ensuring profile again
          const isFK = String(planError.message || '').toLowerCase().includes('foreign key')
          if (isFK) {
            try {
              // Re-ensure profile, then retry once
              const client = admin || supabase
              await client.from('profiles').upsert({ id: userId, created_at: new Date().toISOString() })
              const retry = await (admin || supabase)
                .from('plans')
                .insert({
                  user_id: userId,
                  title: planName,
                  goal: goals,
                  content: planContent,
                  status: 'completed',
                  word_count: planContent.split(' ').length,
                  created_at: new Date().toISOString()
                })
                .select()
                .single()
              if (retry.error) throw new Error(`Failed to save plan (retry): ${retry.error.message}`)
              planData = retry.data
            } catch (retryErr: any) {
              throw new Error(`Failed to save plan: ${retryErr.message || String(retryErr)}`)
            }
          } else {
            throw new Error(`Failed to save plan: ${planError.message}`)
          }
        }

        // Update job status (prefer admin)
        if (admin) {
          await admin
            .from('plan_jobs')
            .update({ status: 'completed', plan_id: planData.id, completed_at: new Date().toISOString() })
            .eq('id', jobId)
        } else {
          await supabase
            .from('plan_jobs')
            .update({ status: 'completed', plan_id: planData.id, completed_at: new Date().toISOString() })
            .eq('id', jobId)
        }

        logger.info('BG_JOB_COMPLETED', { jobId, planId: planData.id })
        return
      } catch (err: any) {
        clearTimeout(timeoutId)
        lastError = err
        const message = err?.message || String(err)
        logger.warn('BG_ATTEMPT_FAILED', { jobId, attempt, error: message })
        // Update job interim status
        if (admin) {
          await admin
            .from('plan_jobs')
            .update({ status: 'processing', error_message: `attempt ${attempt} failed: ${message}` })
            .eq('id', jobId)
        } else {
          await supabase
            .from('plan_jobs')
            .update({ status: 'processing', error_message: `attempt ${attempt} failed: ${message}` })
            .eq('id', jobId)
        }
        if (err?.name === 'AbortError') {
          // Abort/timeouts: continue retry
        }
        if (attempt < maxAttempts) {
          const backoff = 1000 * Math.pow(2, attempt - 1) // 1s, 2s, 4s
          await new Promise((r) => setTimeout(r, backoff))
          continue
        }
      }
    }
    // If reached here, all attempts failed
    throw lastError || new Error('Unknown error after retries')

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
