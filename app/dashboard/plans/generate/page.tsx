'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, CheckCircle, AlertCircle, ArrowLeft, Zap } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

export default function GeneratePlanPage() {
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending')
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('Khởi động hệ thống AI...')
  const [error, setError] = useState('')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [planId, setPlanId] = useState('')
  const { user } = useAuth()
  const router = useRouter()
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    // Check if there's already a job in progress (user came back from another tab)
    const userId = user?.id || 'anonymous'
    const existingJobId = sessionStorage.getItem(`plan_job_${userId}`)
    
    if (existingJobId) {
      console.log('Found existing job, resuming:', existingJobId)
      setJobId(existingJobId)
      setJobStatus('processing')
      setStatus('Tiếp tục xử lý kế hoạch...')
      setProgress(50) // Assume it's halfway done
      startTimeRef.current = Date.now()
      pollJobStatus(existingJobId)
    } else {
      startPlanGeneration()
    }

    // Cleanup on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
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
    const planData = localStorage.getItem(`pending_plan_${userId}`)
    if (!planData) {
      router.push('/dashboard/create-plan')
      return
    }

    try {
      const data = JSON.parse(planData)
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
          planName: data.planName || 'Kế hoạch tài chính',
          goals: data.goals || '',
          collectedInfo: data.collectedInfo || {}
        })
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || 'Không thể bắt đầu tạo kế hoạch')
        return
      }

      // Job started successfully
      const newJobId = result.job_id
      setJobId(newJobId)
      setJobStatus('processing')
      startTimeRef.current = Date.now()
      setProgress(10)
      setStatus('Hệ thống AI đang xử lý...')

      // Save job ID to session storage
      sessionStorage.setItem(`plan_job_${userId}`, newJobId)

      // Start polling for job status
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

          // Clear session storage
          sessionStorage.removeItem(`plan_job_${userId}`)
          localStorage.removeItem(`pending_plan_${userId}`)

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

          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
          }

        } else if (jobData.status === 'processing') {
          // Still processing
          setStatus(`Đang xử lý... (${jobData.elapsed_seconds}s)`)
        }

      } catch (error) {
        console.error('Error polling job status:', error)
      }

      attempts++
      if (attempts >= maxAttempts) {
        setError('Quá thời gian chờ. Vui lòng thử lại.')
        sessionStorage.removeItem(`plan_job_${userId}`)
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
          {/* Error state */}
          {error && !isGenerating && (
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
              <button
                onClick={() => generatePlan()}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                Thử lại
              </button>
            </>
          )}
          
          {/* Success state */}
          {!error && !isGenerating && planId && (
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
