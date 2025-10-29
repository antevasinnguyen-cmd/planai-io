'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, CheckCircle, AlertCircle, ArrowLeft, Zap } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

interface JobMeta {
  jobId: string
  startedAt?: number
  progress?: number
  status?: 'pending' | 'processing' | 'completed' | 'failed'
  statusText?: string
  elapsedSeconds?: number
}

const JOB_META_PREFIX = 'plan_job_meta_'

const calculateProgress = (elapsedSeconds: number) => {
  if (!elapsedSeconds || elapsedSeconds < 0) return 10
  return Math.min(95, Math.max(10, 10 + (elapsedSeconds / 120) * 80))
}

const loadJobMeta = (userId: string): JobMeta | null => {
  if (!userId) return null
  try {
    const raw = localStorage.getItem(`${JOB_META_PREFIX}${userId}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const saveJobMeta = (userId: string, meta: Partial<JobMeta>) => {
  if (!userId) return
  try {
    const current = loadJobMeta(userId) || {}
    const merged = { ...current, ...meta }
    localStorage.setItem(`${JOB_META_PREFIX}${userId}`, JSON.stringify(merged))
  } catch {}
}

const clearJobMeta = (userId: string) => {
  if (!userId) return
  try { localStorage.removeItem(`${JOB_META_PREFIX}${userId}`) } catch {}
}

export default function GeneratePlanPage() {
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending')
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('Khởi động hệ thống AI...')
  const [error, setError] = useState('')
  const [upgradeRequired, setUpgradeRequired] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [planId, setPlanId] = useState('')
  const { user } = useAuth()
  const router = useRouter()
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const eventSourceRef = useRef<EventSource | null>(null)

  const startSSE = (id: string) => {
    try {
      if (eventSourceRef.current) {
        try { eventSourceRef.current.close() } catch {}
        eventSourceRef.current = null
      }
      const es = new EventSource(`/api/plans/events?job_id=${id}`)
      eventSourceRef.current = es

      const handleStatus = (e: any) => {
        try {
          const data = JSON.parse(e.data)
          if (!data) return
          if (data.status === 'completed') {
            setProgress(100)
            setStatus('Hoàn thành!')
            setJobStatus('completed')
            setPlanId(data.plan_id)
            const userId = user?.id || 'anonymous'
            sessionStorage.removeItem(`plan_job_${userId}`)
            clearJobMeta(userId)
            localStorage.removeItem(`pending_plan_${userId}`)
            try { localStorage.removeItem('pending_plan_latest') } catch {}
            if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current) }
            if (eventSourceRef.current) { try { eventSourceRef.current.close() } catch {} }
            setTimeout(() => { router.push(`/dashboard/plans/${data.plan_id}`) }, 1200)
          } else if (data.status === 'failed') {
            setJobStatus('failed')
            setError(data.error_message || 'Tạo kế hoạch thất bại')
            const userId = user?.id || 'anonymous'
            sessionStorage.removeItem(`plan_job_${userId}`)
            clearJobMeta(userId)
            if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current) }
            if (eventSourceRef.current) { try { eventSourceRef.current.close() } catch {} }
          } else if (data.status === 'processing') {
            const elapsed = Number(data.elapsed_seconds || 0)
            const estimatedProgress = Math.min(95, Math.max(10, 10 + (elapsed / 120) * 80))
            setProgress(estimatedProgress)
            setStatus(`Đang xử lý... (${elapsed}s)`)
            setJobStatus('processing')
            const userId = user?.id || 'anonymous'
            saveJobMeta(userId, {
              jobId: id,
              progress: estimatedProgress,
              status: 'processing',
              statusText: `Đang xử lý... (${elapsed}s)`,
              elapsedSeconds: elapsed
            })
          }
        } catch {}
      }

      es.addEventListener('status', handleStatus as any)
      es.addEventListener('error', () => {
        // Polling fallback remains active
      })
    } catch {}
  }

  useEffect(() => {
    // Do not force redirect immediately; attempt to proceed using cookies if available
    const userId = user?.id || 'anonymous'
    // Check both user-specific and stable fallback keys
    const planData = localStorage.getItem(`pending_plan_${userId}`) || localStorage.getItem('pending_plan_latest')
    
    // Check if there's already a job in progress (user came back from another tab)
    const storedMeta = loadJobMeta(userId)
    const existingJobId = sessionStorage.getItem(`plan_job_${userId}`) || storedMeta?.jobId || null

    if (existingJobId) {
      console.log('Found existing job, resuming:', existingJobId)
      setJobId(existingJobId)
      const restoredStatus = storedMeta?.status || 'processing'
      setJobStatus(restoredStatus)

      const restoredStatusText = storedMeta?.statusText || 'Tiếp tục xử lý kế hoạch...'
      setStatus(restoredStatusText)

      const elapsed = storedMeta?.elapsedSeconds ?? (storedMeta?.startedAt ? Math.floor((Date.now() - storedMeta.startedAt) / 1000) : 0)
      if (elapsed && elapsed > 0) {
        setElapsedSeconds(elapsed)
      }
      const restoredProgress = storedMeta?.progress ?? calculateProgress(elapsed)
      setProgress(restoredProgress)

      startTimeRef.current = storedMeta?.startedAt || Date.now()

      // Start SSE first; fallback to polling
      startSSE(existingJobId)
      pollJobStatus(existingJobId)
    } else {
      startPlanGeneration()
    }

    // Cleanup on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
      if (eventSourceRef.current) {
        try { eventSourceRef.current.close() } catch {}
        eventSourceRef.current = null
      }
    }
  }, [user, router])

  // Timer to update elapsed seconds
  useEffect(() => {
    if (jobStatus === 'processing' && startTimeRef.current) {
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setElapsedSeconds(elapsed)
        
        // Update progress based on elapsed time
        const estimatedProgress = Math.min(90, 10 + (elapsed / 120) * 80)
        setProgress(estimatedProgress)
      }, 1000)
      
      return () => clearInterval(timer)
    }
  }, [jobStatus])

  const startPlanGeneration = async () => {
    const userId = user?.id || 'anonymous'
    const planData = localStorage.getItem(`pending_plan_${userId}`) || localStorage.getItem('pending_plan_latest')

    if (!planData) {
      console.warn('=== GENERATE: No plan data found in localStorage, creating placeholder ===')
      const placeholder = {
        planName: `Kế hoạch tài chính - ${new Date().toLocaleDateString('vi-VN')}`,
        goals: 'Mục tiêu tài chính cá nhân',
        collectedInfo: {}
      }
      localStorage.setItem(`pending_plan_${userId}`, JSON.stringify(placeholder))
      localStorage.setItem('pending_plan_latest', JSON.stringify(placeholder))
    }

    try {
      const data = planData ? JSON.parse(planData) : JSON.parse(localStorage.getItem(`pending_plan_${userId}`) || '{}')
      console.log('=== GENERATE: Plan data from localStorage ===', {
        hasPlanName: !!data.planName,
        hasGoals: !!data.goals,
        planName: data.planName,
        goalsLength: data.goals?.length || 0
      })
      
      // Validate required fields (with robust fallback from messages)
      const userMsgs = Array.isArray(data?.messages) ? data.messages.filter((m: any) => m.role === 'user') : []
      const lastUser = userMsgs.length > 0 ? userMsgs[userMsgs.length - 1].content : ''
      const derivedGoal = (data?.goals && String(data.goals).trim()) || (lastUser || '').slice(0, 80).trim()
      const derivedPlanName = (data?.planName && String(data.planName).trim())
        || (derivedGoal ? `Kế hoạch: ${derivedGoal}` : `Kế hoạch tài chính - ${new Date().toLocaleDateString('vi-VN')}`)

      const finalPlanName = derivedPlanName || 'Kế hoạch tài chính cá nhân'
      const finalGoals = derivedGoal || 'Mục tiêu tài chính cá nhân'

      data.planName = finalPlanName
      data.goals = finalGoals

      try {
        localStorage.setItem(`pending_plan_${userId}`, JSON.stringify(data))
        localStorage.setItem('pending_plan_latest', JSON.stringify(data))
      } catch {}

      setStatus('Gửi yêu cầu tới hệ thống AI...')
      setProgress(5)

      // Get auth token
      const { supabase } = await import('@/lib/supabase')
      const { data: sessionData } = await supabase.auth.getSession()
      
      const headers: any = { 
        'Content-Type': 'application/json'
      }
      
      if (sessionData?.session?.access_token) {
        headers['Authorization'] = `Bearer ${sessionData.session.access_token}`
      }

      // Start background job (returns immediately)
      const res = await fetch('/api/plans/generate-background', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          planName: finalPlanName || 'Kế hoạch tài chính',
          goals: finalGoals || '',
          collectedInfo: data.collectedInfo || {}
        })
      })

      const result = await res.json()

      if (!res.ok) {
        if (res.status === 429 && result?.upgradeRequired) {
          setUpgradeRequired(true)
          setError(result.message || 'Bạn đã đạt giới hạn của gói hiện tại. Vui lòng nâng cấp để tiếp tục.')
        } else {
          setError(result.error || 'Không thể bắt đầu tạo kế hoạch')
        }
        return
      }

      // Job started successfully
      const newJobId = result.job_id
      const startedAt = Date.now()
      setJobId(newJobId)
      setJobStatus('processing')
      startTimeRef.current = startedAt
      setProgress(10)
      setStatus('Hệ thống AI đang xử lý...')

      // Save job metadata
      sessionStorage.setItem(`plan_job_${userId}`, newJobId)
      saveJobMeta(userId, {
        jobId: newJobId,
        startedAt,
        progress: 10,
        status: 'processing',
        statusText: 'Hệ thống AI đang xử lý...',
        elapsedSeconds: 0
      })

      // Start polling for job status
      // Start SSE for real-time updates; keep polling as fallback
      startSSE(newJobId)
      pollJobStatus(newJobId)

    } catch (error) {
      console.error('Error starting plan generation:', error)
      setError('Có lỗi xảy ra khi bắt đầu tạo kế hoạch. Vui lòng thử lại.')
    }
  }

  const pollJobStatus = async (id: string) => {
    const userId = user?.id || 'anonymous'
    const maxAttempts = 600 // 10 minutes (600 * 1 second)
    let attempts = 0

    const checkJob = async () => {
      try {
        const res = await fetch(`/api/plans/job-status?job_id=${id}`, {
          credentials: 'include'
        })

        if (!res.ok) {
          console.error('Error checking job status:', res.status)
          return
        }

        const jobData = await res.json()
        console.log('Job status:', jobData.status)

        if (jobData.status === 'completed') {
          // Success!
          setProgress(100)
          setStatus('Hoàn thành!')
          setJobStatus('completed')
          setPlanId(jobData.plan_id)

          // Clear storage
          sessionStorage.removeItem(`plan_job_${userId}`)
          clearJobMeta(userId)
          localStorage.removeItem(`pending_plan_${userId}`)
          try { localStorage.removeItem('pending_plan_latest') } catch {}

          // Redirect after 2 seconds
          setTimeout(() => {
            router.push(`/dashboard/plans/${jobData.plan_id}`)
          }, 2000)

          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
          }

        } else if (jobData.status === 'failed') {
          // Failed
          setJobStatus('failed')
          setError(jobData.error_message || 'Tạo kế hoạch thất bại')
          sessionStorage.removeItem(`plan_job_${userId}`)
          clearJobMeta(userId)

          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
          }

        } else if (jobData.status === 'processing') {
          // Still processing
          const elapsed = Number(jobData.elapsed_seconds || 0)
          setStatus(`Đang xử lý... (${elapsed}s)`)
          const runtimeProgress = Math.min(95, Math.max(progress, 10 + (elapsed / 120) * 80))
          setProgress(runtimeProgress)
          saveJobMeta(userId, {
            jobId: id,
            progress: runtimeProgress,
            status: 'processing',
            statusText: `Đang xử lý... (${elapsed}s)`,
            elapsedSeconds: elapsed
          })
        }

      } catch (error) {
        console.error('Error polling job status:', error)
      }

      attempts++
      if (attempts >= maxAttempts) {
        setError('Quá thời gian chờ. Vui lòng thử lại.')
        sessionStorage.removeItem(`plan_job_${userId}`)
        clearJobMeta(userId)
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
        }
      }
    }

    // Poll every 1 second
    pollIntervalRef.current = setInterval(checkJob, 1000)
    
    // Check immediately
    await checkJob()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Back button */}
        <Link 
          href="/dashboard/create-plan" 
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span className="text-sm">Quay lại</span>
        </Link>
        
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center">
          {/* No data state */}
          {!error && jobStatus === 'pending' && !jobId && (
            <>
              <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Đang chuẩn bị dữ liệu kế hoạch...
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                AI đang hoàn thiện các thông tin còn thiếu trước khi tạo kế hoạch.
              </p>
            </>
          )}
          
          {/* Error state */}
          {error && jobStatus !== 'processing' && (
            <>
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Có lỗi xảy ra
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error}
              </p>
              {upgradeRequired && (
                <Link
                  href="/pricing"
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors inline-block mb-3"
                >
                  Nâng cấp gói để tiếp tục
                </Link>
              )}
              <button
                onClick={() => startPlanGeneration()}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                Thử lại
              </button>
            </>
          )}
          
          {/* Success state */}
          {!error && jobStatus === 'completed' && planId && (
            <>
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Hoàn thành!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Kế hoạch tài chính của bạn đã được tạo thành công.
              </p>
              <Link
                href={`/dashboard/plans/${planId}`}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors inline-block"
              >
                Xem kế hoạch
              </Link>
            </>
          )}
          
          {/* Loading state */}
          {(jobStatus === 'pending' || jobStatus === 'processing') && (
            <>
              {/* Icon */}
              <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Đang tạo kế hoạch...
              </h2>
              
              {/* Status */}
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {status}
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
                <div
                  className="bg-gradient-to-r from-primary-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round(progress)}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-500">{Math.round(progress)}%</p>

              {/* AI Magic Message */}
              <div className="mt-2 p-4 bg-purple-50 dark:bg-purple-500/10 rounded-lg">
                <div className="flex items-center justify-center space-x-2 text-purple-700 dark:text-purple-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm">AI đang tạo kế hoạch tài chính hoàn hảo cho bạn</span>
                </div>
              </div>

              {/* Info Message - Can Switch Tabs */}
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-500/20">
                <div className="flex items-start space-x-2">
                  <Zap className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-green-800 dark:text-green-200">
                    ✓ Bạn có thể đóng tab hoặc chuyển sang tab khác. AI sẽ tiếp tục xử lý trong nền.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
