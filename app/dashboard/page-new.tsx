'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Brain, FileText, Download, MessageSquare, ChevronDown, Crown, Settings, LogOut, 
  Home, HelpCircle, Menu, X, ArrowRight, Target, BarChart3, Calendar, Sun, Moon,
  User, Zap
} from 'lucide-react'
import { supabase, getUserSubscription, getUserUsageStats, getUserPlans, getSubscriptionLimits, checkTrialStatus } from '@/lib/supabase'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useTheme } from '@/lib/theme-context'
import SuccessAlert from '@/components/SuccessAlert'
import Logo from '@/components/Logo'

interface UsageStats {
  plans: number
  chats: number
  words: number
  error: any
}

export default function DashboardNew() {
  const [subscription, setSubscription] = useState<any>(null)
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [trialStatus, setTrialStatus] = useState<any>(null)
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()

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
      loadRecentPlans(user.id),
      loadTrialStatus(user.id)
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

  const loadTrialStatus = async (userId: string) => {
    try {
      const status = await checkTrialStatus(userId)
      setTrialStatus(status)
    } catch (error) {
      console.error('Error loading trial status:', error)
    }
  }

  const getTierName = (tier: string) => {
    switch (tier) {
      case 'free': return 'Free Plan'
      case 'basic': return 'Gói 1'
      case 'pro': return 'Gói 2'
      case 'pro_max': return 'Gói 3'
      default: return 'Free Plan'
    }
  }

  const getUserInitial = () => {
    if (!user?.email) return 'U'
    return user.email.charAt(0).toUpperCase()
  }

  const getUserName = () => {
    if (!user?.email) return 'User'
    return user.email.split('@')[0]
  }

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải dashboard...</p>
        </div>
      </div>
    )
  }

  const tier = subscription?.tier || 'free'
  const limits = getSubscriptionLimits(tier)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] text-gray-900 dark:text-white flex">
      {showSuccessMessage && (
        <SuccessAlert 
          message={`🎉 Chúc mừng bạn đã đăng nhập thành công! Hãy bắt đầu với PlanAI ngay nào!`}
          duration={10000}
        />
      )}

      {/* Sidebar - Fixed, không cuộn theo */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col fixed h-screen overflow-y-auto`}>
        {/* Logo & Toggle */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between flex-shrink-0">
          {sidebarOpen ? (
            <>
              <Logo href="/dashboard" size="md" showText={true} isDashboard={true} />
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </>
          ) : (
            <>
              <Logo href="/dashboard" size="md" showText={false} isDashboard={true} />
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded mx-auto mt-2"
              >
                <Menu className="w-5 h-5 text-gray-500" />
              </button>
            </>
          )}
        </div>

        {/* Navigation - Chính */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white transition-colors group"
            >
              <Home className="w-5 h-5" />
              {sidebarOpen && <span className="text-sm font-medium">Trang chủ</span>}
            </Link>
            <Link
              href="/dashboard/create-plan"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
            >
              <Target className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
              {sidebarOpen && <span className="text-sm font-medium">Tạo Plan</span>}
            </Link>
            <Link
              href="/dashboard/plans"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
            >
              <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
              {sidebarOpen && <span className="text-sm font-medium">Kế hoạch</span>}
            </Link>
            <Link
              href="/dashboard/analytics"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
            >
              <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
              {sidebarOpen && <span className="text-sm font-medium">Phân tích</span>}
            </Link>
            <Link
              href="/dashboard/calendar"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
            >
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
              {sidebarOpen && <span className="text-sm font-medium">Lịch trình</span>}
            </Link>
          </div>

          {/* Tuỳ chỉnh Section */}
          {sidebarOpen && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-3 px-3">Tuỳ chỉnh</p>
              <div className="space-y-1">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    {theme === 'light' ? (
                      <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    )}
                    <span className="text-sm font-medium">
                      {theme === 'light' ? 'Chế độ sáng' : 'Chế độ tối'}
                    </span>
                  </div>
                </button>

                {/* Cài đặt */}
                <Link
                  href="/dashboard/settings"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                >
                  <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                  <span className="text-sm font-medium">Cài đặt tài khoản</span>
                </Link>

                {/* Trợ giúp */}
                <Link
                  href="/dashboard/help"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                >
                  <HelpCircle className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                  <span className="text-sm font-medium">Trợ giúp</span>
                </Link>

                {/* Nâng cấp */}
                <Link
                  href="/pricing"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white transition-colors group mt-2"
                >
                  <Crown className="w-5 h-5" />
                  <span className="text-sm font-medium">Nâng cấp gói</span>
                </Link>
              </div>
            </div>
          )}
        </nav>

        {/* Plan Status - Ở dưới cùng, fixed */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{getTierName(tier)}</p>
                {tier === 'free' && trialStatus?.isActive && (
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                    {trialStatus.daysRemaining} ngày còn lại
                  </span>
                )}
              </div>
              
              {/* Chat Usage */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Tin nhắn</span>
                  <span className="font-medium">{usage?.chats || 0}/{limits.chats}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(((usage?.chats || 0) / limits.chats) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Plans Usage */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Kế hoạch</span>
                  <span className="font-medium">{usage?.plans || 0}/{limits.plans}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-green-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(((usage?.plans || 0) / limits.plans) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {tier === 'free' && trialStatus?.daysRemaining <= 7 && (
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                  ⚠️ Gói dùng thử sắp hết hạn
                </p>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Main Content - Có margin-left để tránh sidebar */}
      <div className={`flex-1 flex flex-col ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        {/* Top Bar */}
        <header className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800 px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Chào mừng trở lại, {getUserName()}!
              </p>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-3 py-2 transition-colors"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-primary-800 rounded-full flex items-center justify-center text-white font-bold">
                  {getUserInitial()}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{getUserName()}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20">
                  <Link
                    href="/dashboard"
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Home className="w-4 h-4" />
                    <span>Trang chủ</span>
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Cài đặt</span>
                  </Link>
                  <Link
                    href="/dashboard/help"
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Trợ giúp</span>
                  </Link>
                  <hr className="my-2 border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Kế hoạch đã tạo</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{usage?.plans || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tin nhắn AI</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{usage?.chats || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Từ đã dùng</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{(usage?.words || 0).toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-800 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bắt đầu nhanh</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/dashboard/create-plan"
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Tạo kế hoạch mới</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Bắt đầu với AI Assistant</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
              </Link>

              <Link
                href="/dashboard/plans"
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Xem kế hoạch</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Quản lý kế hoạch của bạn</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
              </Link>
            </div>
          </div>

          {/* Recent Plans */}
          {plans.length > 0 && (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Kế hoạch gần đây</h2>
                <Link href="/dashboard/plans" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400">
                  Xem tất cả →
                </Link>
              </div>
              <div className="space-y-3">
                {plans.map((plan) => (
                  <Link
                    key={plan.id}
                    href={`/dashboard/plans/${plan.id}`}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{plan.title || 'Kế hoạch tài chính'}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(plan.created_at).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
