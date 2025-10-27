import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getCurrentUser, getUserSubscription, checkUsageLimits, getSubscriptionLimits, getTierName, getServerCapsByTier } from '@/lib/supabase'
import { generateFinancialPlan } from '@/lib/openai'

/**
 * Background Job API - Starts plan generation in background
 * Returns immediately with job_id, AI processes in background
 */
export async function POST(request: NextRequest) {
  try {
    console.log('=== BACKGROUND JOB: Starting plan generation ===')
    
    // Get user
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { planName, goals, collectedInfo } = await request.json()

    if (!planName || !goals) {
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
    const enrichedCollectedInfo = { ...(collectedInfo || {}), maxWords: tierLimits.words, tier }

    const caps = getServerCapsByTier(tier)
    const { supabase } = await import('@/lib/supabase')
    const { count: runningCount, error: countError } = await supabase
      .from('plan_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('status', ['pending', 'processing'])

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
    console.log(`=== BACKGROUND JOB: Created job ${jobId} for user ${user.id} ===`)

    // Insert job record
    const { error: insertError } = await supabase
      .from('plan_jobs')
      .insert({
        id: jobId,
        user_id: user.id,
        plan_name: planName,
        goals: goals,
        status: 'pending',
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error inserting job:', insertError)
      return NextResponse.json(
        { error: 'Failed to create job' },
        { status: 500 }
      )
    }

    // Start background processing (don't await)
    processJobInBackground(jobId, user.id, planName, goals, enrichedCollectedInfo)
      .catch(error => console.error(`Job ${jobId} failed:`, error))

    // Return immediately with job_id
    return NextResponse.json(
      { 
        job_id: jobId,
        message: 'Plan generation started. You can close this tab or continue browsing.'
      },
      { status: 202 } // 202 Accepted
    )

  } catch (error) {
    console.error('=== BACKGROUND JOB: Error ===', error)
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
  collectedInfo: any
) {
  const { supabase } = await import('@/lib/supabase')
  
  try {
    console.log(`=== BACKGROUND JOB: Processing ${jobId} ===`)

    // Update status to processing
    await supabase
      .from('plan_jobs')
      .update({ 
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', jobId)

    // Generate plan with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minute timeout

    try {
      console.log(`=== BACKGROUND JOB: Calling AI for ${jobId} ===`)
      
      const planContent = await generateFinancialPlan(
        planName,
        goals,
        collectedInfo,
        controller.signal
      )

      clearTimeout(timeoutId)
      console.log(`=== BACKGROUND JOB: AI completed for ${jobId} ===`)

      // Save plan
      const { data: planData, error: planError } = await supabase
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

      if (planError) {
        throw new Error(`Failed to save plan: ${planError.message}`)
      }

      // Update job status
      await supabase
        .from('plan_jobs')
        .update({
          status: 'completed',
          plan_id: planData.id,
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId)

      console.log(`=== BACKGROUND JOB: Completed ${jobId} with plan ${planData.id} ===`)

    } catch (aiError: any) {
      clearTimeout(timeoutId)
      
      if (aiError.name === 'AbortError') {
        throw new Error('Plan generation timeout (exceeded 2 minutes)')
      }
      throw aiError
    }

  } catch (error: any) {
    console.error(`=== BACKGROUND JOB: Failed ${jobId} ===`, error)

    // Update job with error
    await supabase
      .from('plan_jobs')
      .update({
        status: 'failed',
        error_message: error.message || 'Unknown error',
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId)
  }
}
