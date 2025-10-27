'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

interface Plan {
  id: string
  title: string
  goal: string
  word_count: number
  status: string
  created_at: string
}

interface UsageInfo {
  plans: number
  chats: number
  words: number
  error: any
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [usage, setUsage] = useState<UsageInfo | null>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    loadPlans()
    loadUsageStats()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
  }

  const loadPlans = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPlans(data || [])
    } catch (error) {
      console.error('Error loading plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsageStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get subscription
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      setSubscription(subData)

      // Get usage stats
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { data: plansData } = await supabase
        .from('plans')
        .select('id, word_count')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString())

      const { data: chatsData } = await supabase
        .from('chat_messages')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', 'user')
        .gte('created_at', startOfMonth.toISOString())

      const totalWords = plansData?.reduce((sum, plan) => sum + (plan.word_count || 0), 0) || 0

      setUsage({
        plans: plansData?.length || 0,
        chats: chatsData?.length || 0,
        words: totalWords,
        error: null
      })
    } catch (error) {
      console.error('Error loading usage stats:', error)
    }
  }

  const getSubscriptionLimits = (tier: string) => {
    const limits = {
      'free': { plans: 1, chats: 5, words: 1000 },
      'basic': { plans: 1, chats: 20, words: 2000 },
      'pro': { plans: 3, chats: 50, words: 5000 },
      'pro_max': { plans: 6, chats: 999999, words: 10000 }
    }
    return limits[tier as keyof typeof limits] || limits.free
  }

  const getTierName = (tier: string) => {
    switch (tier) {
      case 'free': return 'Free'
      case 'basic': return 'Gói 1'
      case 'pro': return 'Gói 2'
      case 'pro_max': return 'Gói 3'
      default: return 'Free'
    }
  }

  const canCreatePlan = () => {
    if (!usage || !subscription) return false
    const limits = getSubscriptionLimits(subscription.tier || 'free')
    return usage.plans < limits.plans
  }

  const deletePlan = async (planId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa kế hoạch này?')) return

    try {
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', planId)

      if (error) throw error
      
      setPlans(plans.filter(plan => plan.id !== planId))
      loadUsageStats() // Refresh usage stats
    } catch (error) {
      console.error('Error deleting plan:', error)
      alert('Có lỗi xảy ra khi xóa kế hoạch')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const tier = subscription?.tier || 'free'
  const limits = getSubscriptionLimits(tier)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f]">
      <div className="max-w-6xl mx-auto p-8">
        {/* Back to Dashboard Button */}
        <Link 
          href="/dashboard" 
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <Home className="w-4 h-4 mr-2" />
          <span className="text-sm">Quay lại tổng quan</span>
        </Link>
        
        {/* Header */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-sm p-8 mb-6 border border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kế Hoạch Tài Chính</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Quản lý các kế hoạch tài chính được tạo bởi AI</p>
            </div>
            
            {usage && (
              <div className="text-right">
                <div className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-2">
                  {getTierName(tier)}
                </div>
                <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <div>Kế hoạch: {usage.plans}/{limits.plans}</div>
                  <div>Chat: {usage.chats}/{limits.chats}</div>
                  <div>Từ đã dùng: {usage.words.toLocaleString()}</div>
                </div>
              </div>
            )}
          </div>

          {/* Usage Progress Bars */}
          {usage && (
            <div className="mt-4 space-y-2">
              <div>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>Kế hoạch trong tháng</span>
                  <span>{usage.plans}/{limits.plans}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((usage.plans / limits.plans) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          {canCreatePlan() ? (
            <Link
              href="/dashboard/create-plan"
              className="bg-primary-600 dark:bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 transition-colors inline-flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tạo Kế Hoạch Mới
            </Link>
          ) : (
            <div className="relative">
              <button
                disabled
                className="bg-gray-400 dark:bg-gray-600 text-white px-6 py-3 rounded-lg cursor-not-allowed inline-flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Đã đạt giới hạn
              </button>
              <div className="absolute top-full left-0 mt-2 p-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10">
                Bạn đã tạo {usage?.plans}/{limits.plans} kế hoạch trong tháng này
              </div>
            </div>
          )}
          
          <Link
            href="/dashboard/create-plan"
            className="border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors inline-flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tạo Plan Mới
          </Link>
        </div>

        {/* Plans Grid */}
        {plans.length === 0 ? (
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-sm p-12 text-center border border-gray-200 dark:border-gray-800">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Chưa có kế hoạch nào</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Bắt đầu tạo kế hoạch tài chính đầu tiên của bạn với sự hỗ trợ của AI
            </p>
            {canCreatePlan() ? (
              <Link
                href="/dashboard/create-plan"
                className="bg-primary-600 dark:bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 transition-colors inline-flex items-center"
              >
                Tạo Kế Hoạch Đầu Tiên
              </Link>
            ) : (
              <Link
                href="/pricing"
                className="bg-primary-600 dark:bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 transition-colors inline-flex items-center"
              >
                Nâng Cấp Để Tạo Kế Hoạch
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md dark:hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">{plan.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      plan.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {plan.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">{plan.goal}</p>
                  
                  <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <span>{plan.word_count?.toLocaleString()} từ</span>
                    <span>{new Date(plan.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/plans/${plan.id}`}
                      className="flex-1 bg-primary-600 dark:bg-primary-600 text-white text-center py-2 rounded hover:bg-primary-700 dark:hover:bg-primary-700 transition-colors text-sm"
                    >
                      Xem Chi Tiết
                    </Link>
                    <button
                      onClick={() => deletePlan(plan.id)}
                      className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upgrade Prompt */}
        {!canCreatePlan() && (
          <div className="mt-8 bg-gradient-to-r from-primary-50 dark:from-primary-500/10 to-purple-50 dark:to-purple-500/10 border border-primary-200 dark:border-primary-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Đã đạt giới hạn kế hoạch</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Nâng cấp gói để tạo thêm kế hoạch tài chính và nhận thêm nhiều tính năng
                </p>
              </div>
              <Link
                href="/pricing"
                className="bg-primary-600 dark:bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 transition-colors whitespace-nowrap"
              >
                Nâng Cấp Ngay
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
