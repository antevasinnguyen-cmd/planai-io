import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getCurrentUser, getUserSubscription } from '@/lib/supabase'
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

    // Check subscription
    const { data: subscription } = await getUserSubscription(user.id)
    if (!subscription || subscription.status !== 'active') {
      return NextResponse.json(
        { error: 'No active subscription' },
        { status: 403 }
      )
    }

    // Create job ID
    const jobId = uuidv4()
    console.log(`=== BACKGROUND JOB: Created job ${jobId} for user ${user.id} ===`)

    // Insert job record
    const { supabase } = await import('@/lib/supabase')
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
    processJobInBackground(jobId, user.id, planName, goals, collectedInfo)
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
