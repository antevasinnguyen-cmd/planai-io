'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, CheckCircle, Brain, AlertCircle, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

export default function GeneratePlanPage() {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('Đang phân tích thông tin...')
  const [error, setError] = useState('')
  const [isGenerating, setIsGenerating] = useState(true)
  const [modelInfo, setModelInfo] = useState({ name: 'GPT-4o-mini', type: 'primary' })
  const [planId, setPlanId] = useState('')
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    generatePlan()
  }, [user, router])

  const generatePlan = async () => {
    // Get plan data from localStorage with user ID
    const userId = user?.id || 'anonymous'
    const planData = localStorage.getItem(`pending_plan_${userId}`)
    if (!planData) {
      router.push('/dashboard/create-plan')
      return
    }

    try {
      const data = JSON.parse(planData)
      setIsGenerating(true)
      setError('')
      
      // Simulate plan generation with progress
      const steps = [
        { progress: 10, status: 'Đang phân tích thông tin cá nhân...', model: { name: 'Sắp xong rồi!', type: 'primary' } },
        { progress: 25, status: 'Đang phân tích mục tiêu tài chính...', model: { name: 'Sắp xong rồi!', type: 'primary' } },
        { progress: 40, status: 'Đang tạo lộ trình chi tiết...', model: { name: 'Sắp xong rồi!', type: 'primary' } },
        { progress: 60, status: 'Đang tính toán ngân sách...', model: { name: 'Sắp xong rồi!', type: 'primary' } },
        { progress: 75, status: 'Đang tạo checklist hành động...', model: { name: 'Sắp xong rồi!', type: 'primary' } },
        { progress: 90, status: 'Đang tối ưu kế hoạch...', model: { name: 'Sắp xong rồi!', type: 'primary' } },
        { progress: 95, status: 'Đang xử lý RAG...', model: { name: 'Sắp xong rồi!', type: 'secondary' } },
        { progress: 100, status: 'Hoàn thành!', model: { name: 'Sắp xong rồi!', type: 'primary' } }
      ]

      // Simulate progress steps
      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setProgress(step.progress)
        setStatus(step.status)
        setModelInfo(step.model)
      }

      // Call API to generate plan
      const res = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await res.json()
      
      if (res.ok) {
        const userId = user?.id || 'anonymous'
        localStorage.removeItem(`pending_plan_${userId}`)
        setPlanId(result.planId)
        setIsGenerating(false)
        
        // Redirect after a short delay to show completion
        setTimeout(() => {
          router.push(`/dashboard/plans/${result.planId}`)
        }, 2000)
      } else {
        // Handle API error
        setError(result.message || result.error || 'Có lỗi xảy ra khi tạo kế hoạch')
        setIsGenerating(false)
      }
    } catch (error) {
      console.error('Error generating plan:', error)
      setError('Có lỗi xảy ra khi tạo kế hoạch. Vui lòng thử lại.')
      setIsGenerating(false)
    }
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
          {isGenerating && (
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
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-500">{progress}%</p>

              {/* AI Model Info */}
              <div className="mt-4 mb-4 flex items-center justify-center space-x-2">
                <Brain className={`w-4 h-4 ${modelInfo.type === 'primary' ? 'text-blue-500' : 'text-purple-500'}`} />
                <span className="text-sm font-medium">
                  {modelInfo.name}
                </span>
              </div>

              {/* AI Magic Message */}
              <div className="mt-2 p-4 bg-purple-50 dark:bg-purple-500/10 rounded-lg">
                <div className="flex items-center justify-center space-x-2 text-purple-700 dark:text-purple-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm">AI đang tạo kế hoạch tài chính hoàn hảo cho bạn</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
