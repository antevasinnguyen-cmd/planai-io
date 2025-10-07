'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, CheckCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function GeneratePlanPage() {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('Đang phân tích thông tin...')
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
    const planData = localStorage.getItem('pending_plan')
    if (!planData) {
      router.push('/dashboard/create-plan')
      return
    }

    const data = JSON.parse(planData)
    
    // Simulate plan generation with progress
    const steps = [
      { progress: 20, status: 'Đang phân tích mục tiêu tài chính...' },
      { progress: 40, status: 'Đang tạo lộ trình chi tiết...' },
      { progress: 60, status: 'Đang tính toán ngân sách...' },
      { progress: 80, status: 'Đang tạo checklist hành động...' },
      { progress: 100, status: 'Hoàn thành!' }
    ]

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 1500))
      setProgress(step.progress)
      setStatus(step.status)
    }

    // Call API to generate plan
    try {
      const res = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await res.json()
      
      if (res.ok) {
        localStorage.removeItem('pending_plan')
        router.push(`/dashboard/plans/${result.planId}`)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error generating plan:', error)
      alert('Có lỗi xảy ra khi tạo kế hoạch. Vui lòng thử lại.')
      router.push('/dashboard/create-plan')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            {progress < 100 ? (
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            ) : (
              <CheckCircle className="w-10 h-10 text-white" />
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {progress < 100 ? 'Đang tạo kế hoạch...' : 'Hoàn thành!'}
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

          {/* AI Magic Message */}
          <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-500/10 rounded-lg">
            <div className="flex items-center justify-center space-x-2 text-purple-700 dark:text-purple-400">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">AI đang tạo kế hoạch tài chính hoàn hảo cho bạn</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
