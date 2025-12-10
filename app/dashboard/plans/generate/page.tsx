'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, CheckCircle, AlertCircle, ArrowLeft, Zap, Info } from 'lucide-react'
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
  const generationStartedRef = useRef<boolean>(false) // CRITICAL: Lock to prevent duplicate generation
  const continueInProgressRef = useRef<boolean>(false) // Prevent duplicate continue-generation calls

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
            console.log('=== PLAN GENERATION: COMPLETED ===', { planId: data.plan_id })
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
            
            // CRITICAL: Trigger plans list refresh by setting a flag
            try {
              sessionStorage.setItem('refresh_plans_list', 'true')
            } catch {}
            
            setTimeout(() => { router.push(`/dashboard/plans/${data.plan_id}`) }, 1200)
          } else if (data.status === 'failed') {
            setJobStatus('failed')
            setError(data.error_message || 'Tạo kế hoạch thất bại')
            const userId = user?.id || 'anonymous'
            sessionStorage.removeItem(`plan_job_${userId}`)
            clearJobMeta(userId)
            if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current) }
            if (eventSourceRef.current) { try { eventSourceRef.current.close() } catch {} }
          } else if (data.status === 'cancelled') {
            // treat as gracefully cancelled
            setJobStatus('failed')
            setError('Bạn đã hủy tạo kế hoạch.')
            const userId = user?.id || 'anonymous'
            sessionStorage.removeItem(`plan_job_${userId}`)
            clearJobMeta(userId)
            if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current) }
            if (eventSourceRef.current) { try { eventSourceRef.current.close() } catch {} }
          } else if (data.status === 'processing') {
            const elapsed = Number(data.elapsed_seconds || 0)
            // Progress: 10% at start, 90% at 5 minutes, stay at 90% until completed
            const estimatedProgress = Math.min(90, Math.max(10, 10 + (elapsed / 300) * 80))
            setProgress((p) => Math.max(p, estimatedProgress))
            setStatus('Đang xử lý...')
            setJobStatus('processing')
            console.log('=== PLAN GENERATION: Processing ===', { elapsed, progress: estimatedProgress })
            const userId = user?.id || 'anonymous'
            saveJobMeta(userId, {
              jobId: id,
              progress: estimatedProgress,
              status: 'processing',
              statusText: 'Đang xử lý...',
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
    // CRITICAL: Wait for user to be loaded before starting generation
    if (!user) {
      console.log('=== GENERATE: Waiting for user to load ===')
      return
    }
    
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
      
      // Always check job status from backend first (in case it was cancelled/failed)
      const checkJobStatus = async () => {
        try {
          const { supabase } = await import('@/lib/supabase')
          const { data: sessionData } = await supabase.auth.getSession()
          
          const headers: any = {}
          if (sessionData?.session?.access_token) {
            headers['Authorization'] = `Bearer ${sessionData.session.access_token}`
          }
          
          const res = await fetch(`/api/plans/job-status?job_id=${existingJobId}`, {
            credentials: 'include',
            headers
          })
          
          if (res.ok) {
            const jobData = await res.json()
            console.log('Job status from backend:', jobData.status)
            
            // If job was cancelled/failed, show error
            if (jobData.status === 'cancelled' || jobData.status === 'failed') {
              setJobStatus(jobData.status)
              setError(jobData.error_message || 'Tạo kế hoạch bị hủy hoặc thất bại')
              sessionStorage.removeItem(`plan_job_${userId}`)
              clearJobMeta(userId)
              return
            }
          }
        } catch (err) {
          console.error('Error checking job status on resume:', err)
        }
      }
      
      checkJobStatus()
      
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

    // Cleanup on unmount: DO NOT cancel job, just close connections
    // Job should continue processing in background even if user navigates away
    // Only cancel on explicit user action or beforeunload
    return () => {
      if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current) }
      if (eventSourceRef.current) { try { eventSourceRef.current.close() } catch {} ; eventSourceRef.current = null }
      // DO NOT call cancelCurrentJob here - let background job continue
    }
  }, [user, router])

  // CRITICAL: Do NOT cancel job on beforeunload
  // Background job must continue even if user closes tab/browser
  // Job will complete in background and be available when user returns to dashboard

  // Timer to update elapsed seconds
  useEffect(() => {
    if ((jobStatus === 'processing' || jobStatus === 'pending') && startTimeRef.current && !error) {
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setElapsedSeconds(elapsed)
        
        // Update progress based on elapsed time
        // Smooth progression: 10% at start, 90% at 5 minutes, stays at 90% until completion
        const estimatedProgress = Math.min(90, 10 + (elapsed / 300) * 80)
        setProgress((p) => {
          const next = Math.max(p, estimatedProgress)
          return isNaN(next) ? 10 : next
        })
      }, 1000)
      
      return () => clearInterval(timer)
    }
  }, [jobStatus, error])

  const startPlanGeneration = async () => {
    // CRITICAL: Prevent duplicate generation - set flag FIRST before any async operation
    if (generationStartedRef.current) {
      console.log('=== GENERATE: Already started, skipping duplicate call ===')
      return
    }
    // Set flag immediately to prevent race condition
    generationStartedRef.current = true
    
    // Double-check with a small delay to catch React Strict Mode double-invoke
    await new Promise(resolve => setTimeout(resolve, 50))
    
    console.log('=== GENERATE: Function called ===', { user: user?.id })
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
      // CRITICAL: Extract goals from FIRST user message (contains main goals), not last message
      const userMsgs = Array.isArray(data?.messages) ? data.messages.filter((m: any) => m.role === 'user') : []
      
      // Try to extract main goals from the FIRST user message (usually contains "Mục tiêu: ...")
      let extractedGoals = ''
      if (userMsgs.length > 0) {
        // Combine all user messages to find goals
        const allUserContent = userMsgs.map((m: any) => m.content || '').join('\n')
        
        // Look for goal patterns in order of priority
        const goalPatterns = [
          /mục\s*tiêu[:\s]*([^\n]+)/i,
          /(?:mua\s*nhà|mua\s*xe|tiết\s*kiệm)[^.]*(?:\d+\s*(?:tỷ|triệu))[^.]*/gi,
        ]
        
        for (const pattern of goalPatterns) {
          const match = allUserContent.match(pattern)
          if (match) {
            extractedGoals = Array.isArray(match) ? match.join(', ') : match[1] || match[0]
            break
          }
        }
        
        // Fallback: use first user message (usually contains main goals)
        if (!extractedGoals && userMsgs[0]?.content) {
          extractedGoals = userMsgs[0].content.slice(0, 200)
        }
      }
      
      const derivedGoal = (data?.goals && String(data.goals).trim()) || extractedGoals || 'Mục tiêu tài chính cá nhân'
      const derivedPlanName = (data?.planName && String(data.planName).trim())
        || 'Kế hoạch chi tiết cho mục tiêu của bạn'

      const finalPlanName = derivedPlanName || 'Kế hoạch tài chính cá nhân'
      const finalGoals = derivedGoal || 'Mục tiêu tài chính cá nhân'
      
      console.log('=== GENERATE: Extracted goals ===', { 
        extractedGoals, 
        finalGoals,
        userMsgsCount: userMsgs.length 
      })

      data.planName = finalPlanName
      data.goals = finalGoals

      try {
        localStorage.setItem(`pending_plan_${userId}`, JSON.stringify(data))
        localStorage.setItem('pending_plan_latest', JSON.stringify(data))
      } catch (error) {
        console.error('Error saving plan data to localStorage:', error)
      }

      setStatus('Gửi yêu cầu tới hệ thống AI...')
      // kick off timer early to avoid UI stuck at 5%
      startTimeRef.current = Date.now()
      setProgress(10)

      // Get auth token with validation and retry
      const { supabase } = await import('@/lib/supabase')
      let sessionData
      let sessionError
      
      // Try to get session, retry once if failed (session might be refreshing)
      for (let attempt = 0; attempt < 2; attempt++) {
        const result = await supabase.auth.getSession()
        sessionData = result.data
        sessionError = result.error
        
        if (sessionData?.session?.access_token) {
          break // Success
        }
        
        // If first attempt failed, wait and try refresh
        if (attempt === 0) {
          console.log('=== GENERATE: Session not found, attempting refresh ===')
          await supabase.auth.refreshSession()
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      
      if (sessionError || !sessionData?.session?.access_token) {
        console.error('=== GENERATE: Auth token missing after retry ===', { sessionError })
        setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')
        return
      }
      
      const headers: any = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionData.session.access_token}`
      }

      // Determine which route to use based on tier
      // For Free tier: use fast synchronous route (50s timeout)
      // For paid tiers: use background job route (300s timeout)
      let tier = 'free'
      let useBackgroundJob = false
      
      try {
        // Query subscriptions table (not profiles) for accurate tier
        const { data: subData, error: subError } = await supabase
          .from('subscriptions')
          .select('tier')
          .eq('user_id', user?.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
        
        console.log('=== GENERATE: Tier query result ===', { 
          hasError: !!subError, 
          error: subError,
          dataLength: Array.isArray(subData) ? subData.length : 'not-array',
          data: subData
        })
        
        if (subError) {
          console.warn('=== GENERATE: Tier query error ===', { error: subError })
          tier = 'free'
        } else if (Array.isArray(subData) && subData.length > 0) {
          tier = subData[0]?.tier || 'free'
          console.log('=== GENERATE: Tier check success ===', { tier, subscription: subData[0] })
        } else {
          console.warn('=== GENERATE: No subscription found ===', { subData })
          tier = 'free'
        }
      } catch (tierError) {
        console.warn('=== GENERATE: Tier check exception ===', { error: tierError })
        tier = 'free'
      }
      
      // CRITICAL: All tiers now use background job to avoid Vercel 60s timeout
      useBackgroundJob = true
      
      // CRITICAL: Use background job for ALL tiers to avoid Vercel 60s timeout
      // Free tier also uses background job now (returns immediately with job_id)
      const apiRoute = '/api/plans/generate-background'
      
      console.log('=== GENERATE: Route selection ===', { 
        tier, 
        useBackgroundJob, 
        apiRoute,
        reason: 'ALL_TIERS_USE_BACKGROUND_JOB_TO_AVOID_TIMEOUT'
      })

      setStatus(useBackgroundJob ? 'Hệ thống AI đang xử lý (có thể mất tới 5 phút)...' : 'Hệ thống AI đang xử lý...')
      setProgress(useBackgroundJob ? 10 : 5)

      // Call appropriate route
      console.log('=== GENERATE: Making API call ===', { 
        apiRoute, 
        tier, 
        useBackgroundJob,
        planName: finalPlanName,
        goals: finalGoals,
        hasCollectedInfo: !!data.collectedInfo
      })
      
      let res
      let retries = 0
      const maxRetries = 2
      
      while (retries <= maxRetries) {
        try {
          // Set 65 second timeout (Vercel Pro/Enterprise max is 60s, add buffer)
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 65000)
          
          res = await fetch(apiRoute, {
            method: 'POST',
            headers,
            credentials: 'include',
            signal: controller.signal,
            body: JSON.stringify({
              planName: finalPlanName || 'Kế hoạch tài chính',
              goals: finalGoals || '',
              collectedInfo: data.collectedInfo || {},
              messages: Array.isArray(data?.messages) ? data.messages : undefined
            })
          })
          
          clearTimeout(timeoutId)
          
          console.log('=== GENERATE: API response received ===', { 
            status: res.status, 
            statusText: res.statusText,
            ok: res.ok,
            contentType: res.headers.get('content-type'),
            attempt: retries + 1
          })
          break // Success, exit retry loop
        } catch (fetchError) {
          retries++
          const isTimeout = fetchError instanceof Error && fetchError.name === 'AbortError'
          const isNetworkError = fetchError instanceof TypeError
          
          console.error('=== GENERATE: Network/Fetch Error ===', { 
            error: fetchError,
            message: fetchError instanceof Error ? fetchError.message : String(fetchError),
            apiRoute,
            isTimeout,
            isNetworkError,
            attempt: retries,
            maxRetries
          })
          
          if (retries > maxRetries) {
            setError('Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.')
            return
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * retries))
        }
      }

      if (!res || !res.ok) {
        console.error('Error starting plan generation:', res?.status)
        const result = res ? await res.json().catch(() => ({})) : {}
        
        // Log chi tiết lỗi
        console.error('=== GENERATE: API Error Details ===', { 
          status: res?.status, 
          statusText: res?.statusText,
          error: result,
          route: apiRoute,
          tier
        })
        
        // Handle specific error codes
        if (res?.status === 401) {
          setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')
        } else if (res?.status === 403) {
          setError('Bạn không có quyền thực hiện hành động này. Vui lòng đăng nhập lại.')
        } else if (res?.status === 429 && result?.upgradeRequired) {
          setUpgradeRequired(true)
          setError(result.message || 'Bạn đã đạt giới hạn của gói hiện tại. Vui lòng nâng cấp để tiếp tục.')
        } else if (res?.status === 503) {
          const errorMsg = result.message || result.error || 'Hệ thống AI tạm thời không khả dụng. Vui lòng thử lại sau 1-2 phút.'
          setError(errorMsg)
        } else if (res?.status === 504) {
          setError(result.message || 'Hệ thống AI mất quá lâu để xử lý. Vui lòng thử lại sau.')
        } else {
          setError(result.error || result.message || `Lỗi ${res?.status || 'không xác định'}: Không thể tạo kế hoạch`)
        }
        return
      }

      // Check if response is streaming (SSE) or JSON
      const contentType = res.headers.get('content-type') || ''
      
      if (contentType.includes('text/event-stream')) {
        // Handle streaming response - process SSE events
        console.log('=== GENERATE: Processing streaming response ===')
        setProgress(15)
        setStatus('Đang tạo kế hoạch... (có thể mất 2-5 phút)')
        
        const reader = res.body?.getReader()
        if (!reader) {
          setError('Không thể đọc response từ server')
          return
        }
        
        const decoder = new TextDecoder()
        let buffer = ''
        
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n\n')
            buffer = lines.pop() || '' // Keep incomplete line in buffer
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const eventData = JSON.parse(line.slice(6))
                  console.log('=== GENERATE: SSE Event ===', eventData)
                  
                  if (eventData.type === 'started') {
                    const newJobId = eventData.job_id
                    setJobId(newJobId)
                    setJobStatus('processing')
                    setProgress(20)
                    setStatus('Hệ thống AI đang xử lý...')
                    
                    // Save job metadata
                    sessionStorage.setItem(`plan_job_${userId}`, newJobId)
                    saveJobMeta(userId, {
                      jobId: newJobId,
                      startedAt: Date.now(),
                      progress: 20,
                      status: 'processing',
                      statusText: 'Hệ thống AI đang xử lý...',
                      elapsedSeconds: 0
                    })
                  } else if (eventData.type === 'completed') {
                    setProgress(100)
                    setStatus('Hoàn thành!')
                    setJobStatus('completed')
                    
                    // Clear storage
                    sessionStorage.removeItem(`plan_job_${userId}`)
                    clearJobMeta(userId)
                    localStorage.removeItem(`pending_plan_${userId}`)
                    try { localStorage.removeItem('pending_plan_latest') } catch {}
                    
                    // Redirect to plan
                    if (eventData.plan_id) {
                      setTimeout(() => {
                        router.push(`/dashboard/plans/${eventData.plan_id}`)
                      }, 1200)
                    }
                    return
                  } else if (eventData.type === 'progress' && eventData.needsContinue) {
                    // Chunked generation - need to call continue-generation
                    const newJobId = eventData.job_id
                    setJobId(newJobId)
                    setJobStatus('processing')
                    setProgress(eventData.progress || 20)
                    setStatus(`Đang tạo phần ${eventData.currentSection}/${eventData.totalSections}...`)
                    
                    // Save job metadata
                    sessionStorage.setItem(`plan_job_${userId}`, newJobId)
                    saveJobMeta(userId, {
                      jobId: newJobId,
                      startedAt: Date.now(),
                      progress: eventData.progress || 20,
                      status: 'processing',
                      statusText: `Đang tạo phần ${eventData.currentSection}/${eventData.totalSections}...`,
                      elapsedSeconds: 0
                    })
                    
                    // Start continue-generation loop
                    continueGeneration(newJobId)
                    return
                  } else if (eventData.type === 'error') {
                    setError(eventData.error || 'Có lỗi xảy ra khi tạo kế hoạch')
                    setJobStatus('failed')
                    return
                  }
                } catch (parseError) {
                  console.warn('Failed to parse SSE event:', line)
                }
              }
            }
            
            // Update progress while waiting
            setProgress(prev => Math.min(prev + 1, 90))
          }
        } catch (streamError) {
          console.error('Stream reading error:', streamError)
          const isTimeout = streamError instanceof Error && streamError.name === 'AbortError'
          
          // Don't show error immediately - job might still be running
          // Check job status via polling
          const savedJobId = sessionStorage.getItem(`plan_job_${userId}`)
          if (savedJobId) {
            console.log('Job is running in background, resuming polling:', savedJobId)
            pollJobStatus(savedJobId)
          } else {
            setError(isTimeout ? 'Yêu cầu hết thời gian chờ. Kế hoạch đang được xử lý trong nền. Vui lòng quay lại sau.' : 'Mất kết nối với server. Vui lòng kiểm tra lại sau.')
          }
        }
        return
      }
      
      // Handle JSON response (fallback for non-streaming)
      const result = await res.json()

      // For fast route: result contains plan directly
      if (!useBackgroundJob && result.success && result.plan?.id) {
        console.log('=== GENERATE: Fast route completed ===', { planId: result.plan.id })
        
        // For streaming generation, we need to poll for progress updates
        let metadata = result.plan.metadata
        if (typeof result.plan.metadata === 'string') {
          try {
            metadata = JSON.parse(result.plan.metadata)
          } catch (e) {
            console.error('Error parsing plan metadata:', e)
            metadata = { progress: 10 }
          }
        }
        
        if (metadata?.status === 'generating' || (metadata && metadata.progress < 100)) {
          console.log('=== GENERATE: Plan is still generating, polling for progress ===')
          const progress = metadata?.progress || 10
          setProgress(progress)
          setStatus(`Hệ thống AI đang xử lý... ${progress}%`)
          pollPlanProgress(result.plan.id)
          return
        }
        
        // Plan is already completed
        setProgress(100)
        setStatus('Hoàn thành!')
        setJobStatus('completed')
        sessionStorage.removeItem(`plan_job_${userId}`)
        clearJobMeta(userId)
        localStorage.removeItem(`pending_plan_${userId}`)
        try { localStorage.removeItem('pending_plan_latest') } catch {}
        setTimeout(() => {
          router.push(`/dashboard/plans/${result.plan.id}`)
        }, 1200)
        return
      }

      // For background job route: result contains job_id
      if (res.status !== 200 && res.status !== 202) {
        if (res.status === 429 && result?.upgradeRequired) {
          setUpgradeRequired(true)
          setError(result.message || 'Bạn đã đạt giới hạn của gói hiện tại. Vui lòng nâng cấp để tiếp tục.')
        } else {
          setError(result.error || result.message || 'Không thể bắt đầu tạo kế hoạch')
        }
        console.error('=== GENERATE: API Error ===', { status: res.status, error: result })
        return
      }

      // Job started successfully (background route)
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
      console.error('=== GENERATE: Function error ===', { 
        error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      setError(`Có lỗi xảy ra khi bắt đầu tạo kế hoạch: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Poll for plan progress updates from metadata
  const pollPlanProgress = async (planId: string) => {
    const userId = user?.id || 'anonymous'
    const maxAttempts = 300 // 5 minutes (300 * 1 second)
    let attempts = 0
    let lastProgress = 0
    
    const checkProgress = async () => {
      try {
        // Get auth token
        const { supabase } = await import('@/lib/supabase')
        const { data: sessionData } = await supabase.auth.getSession()
        
        const headers: any = {}
        if (sessionData?.session?.access_token) {
          headers['Authorization'] = `Bearer ${sessionData.session.access_token}`
        }
        
        // Get plan metadata to check progress
        const { data: plan } = await supabase
          .from('plans')
          .select('status, metadata')
          .eq('id', planId)
          .maybeSingle()
        
        if (plan) {
          // Parse metadata from JSON string if needed
          let metadata = plan.metadata
          if (typeof plan.metadata === 'string') {
            try {
              metadata = JSON.parse(plan.metadata)
            } catch (e) {
              console.error('Error parsing plan metadata:', e)
              metadata = { progress: lastProgress }
            }
          }
          
          const progress = metadata?.progress || lastProgress
          lastProgress = progress
          
          // Update UI
          setProgress(progress)
          setStatus(`Hệ thống AI đang xử lý... ${progress}%`)
          
          // If completed, redirect to plan
          if (plan.status === 'completed' || metadata?.status === 'completed' || progress >= 100) {
            setProgress(100)
            setStatus('Hoàn thành!')
            setJobStatus('completed')
            
            // Clear storage
            localStorage.removeItem(`pending_plan_${userId}`)
            try { localStorage.removeItem('pending_plan_latest') } catch {}
            
            setTimeout(() => {
              router.push(`/dashboard/plans/${planId}`)
            }, 1200)
            return
          }
        }
        
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkProgress, 1000)
        } else {
          console.error('Max polling attempts reached')
          setError('Quá trình tạo kế hoạch mất quá lâu. Vui lòng kiểm tra lại sau.')
        }
      } catch (error) {
        console.error('Error checking plan progress:', error)
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkProgress, 1000)
        }
      }
    }
    
    checkProgress()
  }

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  // Continue generation for chunked plan generation (Vercel Free 60s limit)
  const continueGeneration = async (jobId: string) => {
    const userId = user?.id || 'anonymous'
    const maxContinueCalls = 80
    const maxFetchRetries = 5

    const invokeContinue = async () => {
      const { supabase } = await import('@/lib/supabase')
      let attempt = 0

      while (attempt < maxFetchRetries) {
        try {
          const { data: sessionData } = await supabase.auth.getSession()

          const headers: any = { 'Content-Type': 'application/json' }
          if (sessionData?.session?.access_token) {
            headers['Authorization'] = `Bearer ${sessionData.session.access_token}`
          }

          const res = await fetch('/api/plans/continue-generation', {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({ jobId })
          })

          if (res.ok) {
            return res.json()
          }

          console.error('Continue generation failed', res.status)

          if (res.status === 401 && attempt < maxFetchRetries - 1) {
            await supabase.auth.refreshSession()
          }
        } catch (error) {
          console.error('Continue generation request error:', error)
        }

        attempt++
        await sleep(500 * (attempt + 1))
      }

      setError('Không thể kết nối tới máy chủ để tiếp tục tạo kế hoạch. Vui lòng thử lại.')
      setJobStatus('failed')
      pollJobStatus(jobId)
      return null
    }

    for (let call = 0; call < maxContinueCalls; call++) {
      console.log(`=== CONTINUE GENERATION: Call ${call + 1}/${maxContinueCalls} ===`)
      const result = await invokeContinue()
      if (!result) {
        return
      }

      console.log('=== CONTINUE GENERATION RESULT ===', result)

      if (result.status === 'completed') {
        setProgress(100)
        setStatus('Hoàn thành!')
        setJobStatus('completed')
        continueInProgressRef.current = false

        sessionStorage.removeItem(`plan_job_${userId}`)
        clearJobMeta(userId)
        localStorage.removeItem(`pending_plan_${userId}`)
        try { localStorage.removeItem('pending_plan_latest') } catch {}

        if (result.plan_id) {
          setTimeout(() => {
            router.push(`/dashboard/plans/${result.plan_id}`)
          }, 1200)
        }
        return
      }

      if (result.status === 'failed') {
        setError(result.error_message || 'Tạo kế hoạch thất bại')
        setJobStatus('failed')
        continueInProgressRef.current = false
        sessionStorage.removeItem(`plan_job_${userId}`)
        clearJobMeta(userId)
        return
      }

      if (result.status === 'processing') {
        setProgress(result.progress || 50)
        setStatus(`Đang tạo phần ${result.currentSection}/${result.totalSections}...`)
        saveJobMeta(userId, {
          jobId,
          progress: result.progress || 50,
          status: 'processing',
          statusText: `Đang tạo phần ${result.currentSection}/${result.totalSections}...`,
          elapsedSeconds: 0
        })

        await sleep(1000)
        continue
      }

      console.warn('Unexpected continue-generation response', result)
      await sleep(1000)
    }

    console.error('Max continue calls reached')
    setError('Quá trình tạo kế hoạch mất quá lâu. Vui lòng thử lại.')
    setJobStatus('failed')
    continueInProgressRef.current = false
  }

  const pollJobStatus = async (id: string) => {
    const userId = user?.id || 'anonymous'
    const maxAttempts = 3600 // 60 minutes (3600 * 1 second) - increased from 20 to 60 minutes
    let attempts = 0

    const checkJob = async () => {
      try {
        // Get auth token
        const { supabase } = await import('@/lib/supabase')
        const { data: sessionData } = await supabase.auth.getSession()
        
        const headers: any = {}
        if (sessionData?.session?.access_token) {
          headers['Authorization'] = `Bearer ${sessionData.session.access_token}`
        }
        
        const res = await fetch(`/api/plans/job-status?job_id=${id}`, {
          credentials: 'include',
          headers
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

        } else if (jobData.status === 'cancelled') {
          setJobStatus('failed')
          setError('Bạn đã hủy tạo kế hoạch.')
          sessionStorage.removeItem(`plan_job_${userId}`)
          clearJobMeta(userId)
          if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current) }
          if (eventSourceRef.current) { try { eventSourceRef.current.close() } catch {} }

        } else if (jobData.status === 'processing') {
          // Still processing
          const elapsed = Number(jobData.elapsed_seconds || 0)
          setStatus('Đang xử lý...')
          // Progress: 10% at start, 90% at 5 minutes, stay at 90% until completed
          const runtimeProgress = Math.min(90, Math.max(progress, 10 + (elapsed / 300) * 80))
          setProgress((p) => Math.max(p, runtimeProgress))
          saveJobMeta(userId, {
            jobId: id,
            progress: runtimeProgress,
            status: 'processing',
            statusText: 'Đang xử lý...',
            elapsedSeconds: elapsed
          })
          
          // AUTO-CONTINUE: If job is stuck in processing for >30 seconds, try to continue it
          // This handles cases where SSE stream closed before frontend received progress event
          // CRITICAL: Set flag BEFORE check to prevent race condition
          if (elapsed > 30) {
            // Use atomic check-and-set pattern
            if (continueInProgressRef.current) {
              console.log('=== AUTO-CONTINUE: Already in progress, skipping ===')
              return
            }
            // Set flag immediately before any async operation
            continueInProgressRef.current = true
            console.log('=== AUTO-CONTINUE: Job stuck in processing, attempting to continue ===')
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
            }
            continueGeneration(id)
          }
        }

      } catch (error) {
        console.error('Error polling job status:', error)
      }

      attempts++
      if (attempts >= maxAttempts) {
        setError('Quá thời gian chờ (60 phút). Hệ thống có thể đang bận. Vui lòng thử lại sau.')
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
        {/* Back button - do NOT cancel job, let it continue in background */}
        <Link 
          href="/dashboard/create-plan" 
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span className="text-sm">Quay lại</span>
        </Link>
        
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center">
          {/* Removed duplicate pending spinner block */}
          
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
              {/* Single Loading Icon (remove yellow duplicate) */}
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

              {/* Wait Time Note */}
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-200 dark:border-blue-500/20">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-300 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 dark:text-blue-200 text-left">
                    Việc tạo kế hoạch cá nhân hoá có thể mất nhiều thời gian để cho ra tác phẩm phù hợp nhất dành cho bạn. Bạn đợi xíu nhé, sẽ xong ngay thôi!
                  </p>
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
