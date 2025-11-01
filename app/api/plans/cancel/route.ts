'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''
    let jobId: string | null = null
    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => ({}))
      jobId = body?.job_id || null
    }
    if (!jobId) {
      const { searchParams } = new URL(request.url)
      jobId = searchParams.get('job_id')
    }

    if (!jobId) {
      return NextResponse.json({ error: 'Missing job_id' }, { status: 400 })
    }

    // Only allow cancelling own pending/processing jobs
    const { data: job, error: jobErr } = await supabase
      .from('plan_jobs')
      .select('id, status')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (jobErr || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
      return NextResponse.json({ status: job.status }, { status: 200 })
    }

    const { error: updateError } = await supabase
      .from('plan_jobs')
      .update({ status: 'cancelled', error_message: 'user_cancelled', completed_at: new Date().toISOString() })
      .eq('id', jobId)
      .eq('user_id', user.id)

    if (updateError) {
      logger.error('CANCEL_UPDATE_FAIL', { jobId, error: String(updateError) })
      return NextResponse.json({ error: 'Failed to cancel job' }, { status: 500 })
    }

    logger.info('JOB_CANCELLED', { jobId, userId: user.id })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
