import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Mark this route as dynamic (uses request.headers)
export const dynamic = 'force-dynamic'

/**
 * Status Polling API - Check job status
 */
export async function GET(request: NextRequest) {
  try {
    // Try to get user from Authorization header first (for fetch requests)
    let user = null
    const authHeader = request.headers.get('Authorization')
    
    logger.info('JOB_STATUS_AUTH_ATTEMPT', { hasAuthHeader: !!authHeader })
    
    if (authHeader?.startsWith('Bearer ')) {
      // Use admin client with token
      const token = authHeader.slice(7)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      
      if (supabaseUrl && supabaseKey) {
        const { createClient } = await import('@supabase/supabase-js')
        const admin = createClient(supabaseUrl, supabaseKey)
        const { data: { user: tokenUser }, error: tokenError } = await admin.auth.getUser(token)
        if (tokenUser && !tokenError) {
          user = tokenUser
          logger.info('JOB_STATUS_AUTH_TOKEN_SUCCESS', { userId: user.id })
        } else {
          logger.warn('JOB_STATUS_AUTH_TOKEN_FAILED', { error: tokenError?.message })
        }
      }
    }
    
    // Fallback to session cookies
    if (!user) {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      const { data: { user: sessionUser }, error: authError } = await supabase.auth.getUser()
      if (sessionUser && !authError) {
        user = sessionUser
        logger.info('JOB_STATUS_AUTH_COOKIE_SUCCESS', { userId: user.id })
      } else {
        logger.warn('JOB_STATUS_AUTH_COOKIE_FAILED', { error: authError?.message })
      }
    }
    
    if (!user) {
      logger.warn('JOB_STATUS_UNAUTHORIZED', { hasAuthHeader: !!authHeader })
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

    // Create supabase client for database query
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

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
