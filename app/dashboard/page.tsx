'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Sparkles, MessageCircle, FileText, TrendingUp, Zap,
  ChevronDown, Crown, Settings, LogOut, Home, HelpCircle
} from 'lucide-react'
import { supabase, getUserSubscription, getUserUsageStats, getUserPlans, getSubscriptionLimits } from '@/lib/supabase'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import SuccessAlert from '@/components/SuccessAlert'
import UsageProgressBar from '@/components/UsageProgressBar'

interface UsageStats {
  plans: number
  chats: number
  words: number
  error: any
}

export default function DashboardPageRedesign() {
  const [subscription, setSubscription] = useState<any>(null)
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/login'
      return
    }

    if (user) {
      initializeDashboard()
      
      const hasAuthSuccess = localStorage.getItem('auth_success')
      if (hasAuthSuccess === 'true') {
        setShowSuccessMessage(true)
        localStorage.removeItem('auth_success')
        localStorage.removeItem('auth_user_email')
      }
    }
  }, [user, authLoading, router])

  const initializeDashboard = async () => {
    if (!user) return

    await Promise.all([
      loadSubscription(user.id),
      loadUsageStats(user.id),
      loadRecentPlans(user.id)
    ])
    
    setIsLoading(false)
  }

  const loadSubscription = async (userId: string) => {
    try {
      const { data } = await getUserSubscription(userId)
      setSubscription(data)
    } catch (error) {
      console.error('Error loading subscription:', error)
    }
  }

  const loadUsageStats = async (userId: string) => {
    try {
      const usageStats = await getUserUsageStats(userId)
      setUsage(usageStats)
    } catch (error) {
      console.error('Error loading usage stats:', error)
    }
  }

  const loadRecentPlans = async (userId: string) => {
    try {
      const { data } = await getUserPlans(userId)
      setPlans(data?.slice(0, 5) || [])
    } catch (error) {
      console.error('Error loading plans:', error)
    }
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

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-gray-100 text-gray-700'
      case 'basic': return 'bg-blue-100 text-blue-700'
      case 'pro': return 'bg-purple-100 text-purple-700'
      case 'pro_max': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getUserInitial = () => {
    if (!user?.email) return 'U'
    return user.email.charAt(0).toUpperCase()
  }

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Đang tải dashboard...</p>
        </div>
      </div>
    )
  }

  const tier = subscription?.tier || 'free'
  const limits = getSubscriptionLimits(tier)

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {showSuccessMessage && (
        <SuccessAlert 
          message={`🎉 Chúc mừng bạn đã đăng nhập thành công! Hãy bắt đầu với PlanAI ngay nào!`}
          duration={10000}
        />
      )}

      {/* Top Navigation Bar */}
      <nav className="bg-[#1a1a1a] border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Avatar + Tier Badge */}
            <div className="flex items-center space-x-3">
              {/* Avatar with dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 hover:bg-gray-800 rounded-lg px-3 py-2 transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-lg">
                    {getUserInitial()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-white">
                      {user?.email?.split('@')[0] || 'User'}
                    </div>
                    <div className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${getTierBadgeColor(tier)}`}>
                      {getTierName(tier)}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute left-0 mt-2 w-56 bg-[#1a1a1a] border border-gray-800 rounded-lg shadow-xl py-2 z-50">
                    <Link
                      href="/"
                      className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-800 transition-colors"
                    >
                      <Home className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">Trang chủ</span>
                    </Link>
                    <Link
                      href="/account"
                      className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-800 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">Cài đặt</span>
                    </Link>
                    <Link
                      href="/help"
                      className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-800 transition-colors"
                    >
                      <HelpCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">Trợ giúp</span>
                    </Link>
                    <div className="border-t border-gray-800 my-2"></div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-800 transition-colors w-full text-left text-red-400"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Center: Logo */}
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold hidden sm:block">PlanAI</span>
            </Link>

            {/* Right: Upgrade Button */}
            <Link
              href="/pricing"
              className="flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700 px-6 py-2.5 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
            >
              <Crown className="w-5 h-5" />
              <span className="hidden sm:inline">Nâng cấp gói</span>
              <span className="sm:hidden">Nâng cấp</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Chào mừng trở lại, {user?.email?.split('@')[0] || 'User'}! 👋
          </h1>
          <p className="text-gray-400">
            Đây là tổng quan về hoạt động của bạn
          </p>
        </div>

        {/* Usage Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Chat Usage */}
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 hover:border-primary-500 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Chat AI</p>
                  <p className="text-2xl font-bold">{usage?.chats || 0}</p>
                </div>
              </div>
            </div>
            <UsageProgressBar
              current={usage?.chats || 0}
              limit={limits.chats}
              label="cuộc hội thoại"
              color="blue"
            />
          </div>

          {/* Plans Usage */}
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 hover:border-primary-500 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Kế hoạch</p>
                  <p className="text-2xl font-bold">{usage?.plans || 0}</p>
                </div>
              </div>
            </div>
            <UsageProgressBar
              current={usage?.plans || 0}
              limit={limits.plans}
              label="kế hoạch"
              color="green"
            />
          </div>

          {/* Words Usage */}
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 hover:border-primary-500 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Từ phân tích</p>
                  <p className="text-2xl font-bold">{usage?.words?.toLocaleString() || 0}</p>
                </div>
              </div>
            </div>
            <UsageProgressBar
              current={usage?.words || 0}
              limit={limits.words}
              label="từ"
              color="purple"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Create New Chat */}
          <Link
            href="/dashboard/chat"
            className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 hover:border-blue-500 rounded-xl p-8 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">
                  Bắt đầu Chat AI
                </h3>
                <p className="text-gray-400 text-sm">
                  Trò chuyện với AI để lập kế hoạch tài chính
                </p>
              </div>
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </Link>

          {/* Create New Plan */}
          <Link
            href="/dashboard/plans/create"
            className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 hover:border-green-500 rounded-xl p-8 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-green-400 transition-colors">
                  Tạo kế hoạch mới
                </h3>
                <p className="text-gray-400 text-sm">
                  Tạo kế hoạch tài chính chi tiết ngay
                </p>
              </div>
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Plans */}
        {plans.length > 0 && (
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Kế hoạch gần đây</h2>
              <Link
                href="/dashboard/plans"
                className="text-primary-500 hover:text-primary-400 text-sm font-medium"
              >
                Xem tất cả →
              </Link>
            </div>
            <div className="space-y-3">
              {plans.map((plan) => (
                <Link
                  key={plan.id}
                  href={`/dashboard/plans/${plan.id}`}
                  className="flex items-center justify-between p-4 bg-[#0f0f0f] hover:bg-gray-800 rounded-lg transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                      <p className="font-medium group-hover:text-primary-400 transition-colors">
                        {plan.title || 'Kế hoạch tài chính'}
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(plan.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <Zap className="w-5 h-5 text-gray-600 group-hover:text-primary-500 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {plans.length === 0 && (
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-12 text-center">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Chưa có kế hoạch nào</h3>
            <p className="text-gray-400 mb-6">
              Bắt đầu tạo kế hoạch tài chính đầu tiên của bạn
            </p>
            <Link
              href="/dashboard/chat"
              className="inline-flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Bắt đầu với Chat AI</span>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
