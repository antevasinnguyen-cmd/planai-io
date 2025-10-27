import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('job_id')
    if (!jobId) {
      return new Response('Missing job_id', { status: 400 })
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        const { supabase } = await import('@/lib/supabase')

        let closed = false
        const send = (event: string, data: any) => {
          const payload = `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(payload))
        }

        const abort = request.signal
        const intervalMs = 1000

        const loop = async () => {
          while (!closed && !abort.aborted) {
            try {
              const { data: job } = await supabase
                .from('plan_jobs')
                .select(
                  `id,status,error_message,plan_id,created_at,started_at,completed_at`
                )
                .eq('id', jobId)
                .eq('user_id', user.id)
                .single()

              const now = new Date()
              let elapsedSeconds = 0
              if (job?.created_at) {
                const createdAt = new Date(job.created_at)
                elapsedSeconds = Math.floor((now.getTime() - createdAt.getTime()) / 1000)
              }

              if (job) {
                send('status', {
                  job_id: job.id,
                  status: job.status,
                  error_message: job.error_message,
                  plan_id: job.plan_id,
                  elapsed_seconds: elapsedSeconds,
                  created_at: job.created_at,
                  started_at: job.started_at,
                  completed_at: job.completed_at,
                })

                if (job.status === 'completed' || job.status === 'failed') {
                  closed = true
                  controller.close()
                  break
                }
              } else {
                send('status', { job_id: jobId, status: 'not_found' })
                closed = true
                controller.close()
                break
              }
            } catch (e) {
              send('error', { message: 'internal_error' })
            }

            await new Promise((r) => setTimeout(r, intervalMs))
          }
        }

        loop()

        abort.addEventListener('abort', () => {
          closed = true
          try { controller.close() } catch {}
        })
      },
      cancel() {},
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (e) {
    return new Response('Internal server error', { status: 500 })
  }
}
