'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, TrendingUp, BarChart3, PieChart, Calendar,
  DollarSign, Target, Clock, Award
} from 'lucide-react'
import { getTierName, getUserSubscription, getUserUsageStats, getUserPlans } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    loadAnalytics()
  }, [user, router])

  const loadAnalytics = async () => {
    if (!user) return
    
    try {
      const [subscription, usage, plans] = await Promise.all([
        getUserSubscription(user.id),
        getUserUsageStats(user.id),
        getUserPlans(user.id)
      ])

      setStats({
        subscription: subscription.data,
        usage,
        plans: plans.data || []
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải phân tích...</p>
        </div>
      </div>
    )
  }

  const totalPlans = stats?.plans?.length || 0
  const totalChats = stats?.usage?.chats || 0
  const totalWords = stats?.usage?.words || 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Quay lại Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Phân tích & Thống kê
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Xem tổng quan về hoạt động và tiến độ của bạn
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Plans */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600 dark:text-blue-500" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{totalPlans}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng kế hoạch</h3>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Đã tạo</p>
          </div>

          {/* Total Chats */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-500/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-500" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{totalChats}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Cuộc hội thoại</h3>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Với AI</p>
          </div>

          {/* Total Words */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-500" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{totalWords.toLocaleString()}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Từ đã phân tích</h3>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Tổng cộng</p>
          </div>

          {/* Subscription */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {getTierName(stats?.subscription?.tier || 'free')}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Gói hiện tại</h3>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Subscription</p>
          </div>
        </div>

        {/* Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Activity Chart */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Hoạt động theo thời gian
            </h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="text-center">
                <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-500">Biểu đồ sẽ hiển thị ở đây</p>
              </div>
            </div>
          </div>

          {/* Usage Breakdown */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Phân tích sử dụng
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Kế hoạch</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{totalPlans}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min((totalPlans / 10) * 100, 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Chat</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{totalChats}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min((totalChats / 10) * 100, 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Từ phân tích</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{totalWords.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.min((totalWords / 10000) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Hoạt động gần đây
          </h3>
          <div className="space-y-3">
            {stats?.plans?.slice(0, 5).map((plan: any) => (
              <div key={plan.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-500/10 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 text-primary-600 dark:text-primary-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {plan.title || 'Kế hoạch tài chính'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {new Date(plan.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/dashboard/plans/${plan.id}`}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Xem
                </Link>
              </div>
            ))}
            {(!stats?.plans || stats.plans.length === 0) && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-500">Chưa có hoạt động nào</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
