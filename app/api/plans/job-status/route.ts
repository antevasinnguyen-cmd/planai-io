import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase'
import { logger } from '@/lib/logger'

// Mark this route as dynamic (uses request.headers)
export const dynamic = 'force-dynamic'

/**
 * Status Polling API - Check job status
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      logger.warn('JOB_STATUS_UNAUTHORIZED', {})
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('job_id')

    if (!jobId) {
      logger.warn('JOB_STATUS_MISSING_ID', {})
      return NextResponse.json(
        { error: 'Missing job_id parameter' },
        { status: 400 }
      )
    }

    const { supabase } = await import('@/lib/supabase')

    // Get job status
    const { data: job, error } = await supabase
      .from('plan_jobs')
      .select(`
        id,
        status,
        error_message,
        plan_id,
        created_at,
        started_at,
        completed_at,
        plans(id, title)
      `)
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      logger.error('JOB_STATUS_DB_ERROR', { error: String(error), jobId })
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    if (!job) {
      logger.warn('JOB_STATUS_NOT_FOUND', { jobId })
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Calculate elapsed time
    const createdAt = new Date(job.created_at)
    const now = new Date()
    const elapsedSeconds = Math.floor((now.getTime() - createdAt.getTime()) / 1000)

    logger.info('JOB_STATUS_OK', { jobId, status: job.status })
    return NextResponse.json({
      job_id: job.id,
      status: job.status,
      error_message: job.error_message,
      plan_id: job.plan_id,
      elapsed_seconds: elapsedSeconds,
      created_at: job.created_at,
      started_at: job.started_at,
      completed_at: job.completed_at,
      plan: job.plans
    })

  } catch (error) {
    logger.error('JOB_STATUS_UNHANDLED', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
