export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 300 seconds - Vercel Free max limit

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { generatePlanSection } from '@/lib/planGenerationChunked'

/**
 * Continue Generation API - Generates one section at a time
 * This allows long plans to be generated across multiple requests
 * Each request generates 1-2 sections within the 60s Vercel limit
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const rhSupabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: authData } = await rhSupabase.auth.getUser()
    const user = authData?.user
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { jobId } = body

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 })
    }

    // Get admin client for reliable DB operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
    const admin = serviceKey ? createClient(supabaseUrl, serviceKey) : null

    if (!admin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Get job details
    const { data: job, error: jobError } = await admin
      .from('plan_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      logger.error('CONTINUE_GEN_JOB_NOT_FOUND', { jobId, error: jobError?.message })
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.status === 'completed') {
      return NextResponse.json({ 
        status: 'completed', 
        plan_id: job.plan_id,
        message: 'Plan already completed'
      })
    }

    if (job.status === 'failed' || job.status === 'cancelled') {
      return NextResponse.json({ 
        status: job.status, 
        error_message: job.error_message,
        message: 'Job is not active'
      })
    }

    // Get current progress from job metadata
    const metadata = job.metadata || {}
    const currentSectionIndex = metadata.currentSectionIndex || 0
    const generatedSections = metadata.generatedSections || []
    const collectedInfo = metadata.collectedInfo || {}
    const tier = collectedInfo.tier || 'free'

    logger.info('CONTINUE_GEN_START', { 
      jobId, 
      currentSectionIndex, 
      generatedSectionsCount: generatedSections.length,
      tier 
    })

    // Generate next section(s) - aim for 1-2 sections per request within 60s
    const result = await generatePlanSection(
      job.plan_name,
      job.goals,
      collectedInfo,
      currentSectionIndex,
      generatedSections
    )

    if (result.error) {
      // Update job with error
      await admin
        .from('plan_jobs')
        .update({
          status: 'failed',
          error_message: result.error,
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId)

      return NextResponse.json({
        status: 'failed',
        error_message: result.error
      })
    }

    // Update job with progress
    const newMetadata = {
      ...metadata,
      currentSectionIndex: result.nextSectionIndex,
      generatedSections: result.generatedSections,
      collectedInfo,
      lastUpdated: new Date().toISOString()
    }

    if (result.isComplete) {
      // All sections generated - save the plan
      const planContent = result.fullPlanContent || ''
      
      // Save plan to database
      const { data: planData, error: planError } = await admin
        .from('plans')
        .insert({
          user_id: user.id,
          title: job.plan_name,
          goal: job.goals,
          content: planContent,
          status: 'completed',
          word_count: planContent.split(/\s+/).length,
          collected_info: collectedInfo,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (planError) {
        logger.error('CONTINUE_GEN_SAVE_ERROR', { jobId, error: planError.message })
        await admin
          .from('plan_jobs')
          .update({
            status: 'failed',
            error_message: `Failed to save plan: ${planError.message}`,
            completed_at: new Date().toISOString()
          })
          .eq('id', jobId)

        return NextResponse.json({
          status: 'failed',
          error_message: 'Failed to save plan'
        })
      }

      // Update job as completed
      await admin
        .from('plan_jobs')
        .update({
          status: 'completed',
          plan_id: planData.id,
          metadata: newMetadata,
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId)

      logger.info('CONTINUE_GEN_COMPLETED', { jobId, planId: planData.id })

      return NextResponse.json({
        status: 'completed',
        plan_id: planData.id,
        progress: 100,
        message: 'Plan generation completed'
      })
    } else {
      // Still in progress - update metadata
      await admin
        .from('plan_jobs')
        .update({
          status: 'processing',
          metadata: newMetadata
        })
        .eq('id', jobId)

      // Calculate progress percentage
      const totalSections = result.totalSections || 9
      const progress = Math.round((result.nextSectionIndex / totalSections) * 90) + 5 // 5-95%

      logger.info('CONTINUE_GEN_PROGRESS', { 
        jobId, 
        nextSectionIndex: result.nextSectionIndex,
        totalSections,
        progress 
      })

      return NextResponse.json({
        status: 'processing',
        progress,
        currentSection: result.nextSectionIndex,
        totalSections: result.totalSections,
        message: `Generated section ${result.nextSectionIndex} of ${result.totalSections}`
      })
    }

  } catch (error: any) {
    logger.error('CONTINUE_GEN_ERROR', { error: error?.message || String(error) })
    return NextResponse.json(
      { error: 'Internal server error', message: error?.message },
      { status: 500 }
    )
  }
}
