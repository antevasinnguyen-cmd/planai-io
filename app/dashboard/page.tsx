'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Sparkles, MessageCircle, FileText, TrendingUp, Zap, Upload, BarChart3,
  ChevronDown, Crown, Settings, LogOut, Home, HelpCircle, Menu, X,
  ArrowUpRight, Lightbulb, Target, Calendar
} from 'lucide-react'
import { supabase, getUserSubscription, getUserUsageStats, getUserPlans, getSubscriptionLimits } from '@/lib/supabase'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import SuccessAlert from '@/components/SuccessAlert'

interface UsageStats {
  plans: number
  chats: number
  words: number
  error: any
}

export default function DashboardV2() {
  const [subscription, setSubscription] = useState<any>(null)
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
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

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Chào buổi sáng'
    if (hour < 18) return 'Chào buổi chiều'
    return 'Chào buổi tối'
  }

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dashboard...</p>
        </div>
      </div>
    )
  }

  const tier = subscription?.tier || 'free'
  const limits = getSubscriptionLimits(tier)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {showSuccessMessage && (
        <SuccessAlert 
          message={`🎉 Chúc mừng bạn đã đăng nhập thành công! Hãy bắt đầu với PlanAI ngay nào!`}
          duration={10000}
        />
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        {/* Logo & Toggle */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen ? (
            <>
              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">PlanAI</span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1 hover:bg-gray-100 rounded mx-auto"
            >
              <Menu className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6">
          {/* Spaces Section */}
          <div>
            {sidebarOpen && (
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Không gian làm việc</p>
            )}
            <div className="space-y-1">
              <Link
                href="/dashboard/chat"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <MessageCircle className="w-5 h-5 text-gray-600 group-hover:text-primary-600" />
                {sidebarOpen && <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Chat AI</span>}
              </Link>
              <Link
                href="/dashboard/plans"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <FileText className="w-5 h-5 text-gray-600 group-hover:text-primary-600" />
                {sidebarOpen && <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Kế hoạch</span>}
              </Link>
              <Link
                href="/dashboard/analytics"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <BarChart3 className="w-5 h-5 text-gray-600 group-hover:text-primary-600" />
                {sidebarOpen && <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Phân tích</span>}
              </Link>
            </div>
          </div>

          {/* Tools Section */}
          <div>
            {sidebarOpen && (
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Công cụ</p>
            )}
            <div className="space-y-1">
              <Link
                href="/dashboard/plans/create"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <Target className="w-5 h-5 text-gray-600 group-hover:text-primary-600" />
                {sidebarOpen && <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Tạo kế hoạch</span>}
              </Link>
              <Link
                href="/dashboard/calendar"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <Calendar className="w-5 h-5 text-gray-600 group-hover:text-primary-600" />
                {sidebarOpen && <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Lịch trình</span>}
              </Link>
            </div>
          </div>
        </nav>

        {/* Usage Stats in Sidebar */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200 space-y-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-500 mb-2">{getTierName(tier)}</p>
              
              {/* Chat Usage */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">Chat</span>
                  <span className="font-medium text-gray-900">{usage?.chats || 0}/{limits.chats}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(((usage?.chats || 0) / limits.chats) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Plans Usage */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">Kế hoạch</span>
                  <span className="font-medium text-gray-900">{usage?.plans || 0}/{limits.plans}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-green-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(((usage?.plans || 0) / limits.plans) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Words Usage */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">Từ</span>
                  <span className="font-medium text-gray-900">{(usage?.words || 0).toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-500">Resets in 25 days</p>
              </div>
            </div>

            {/* Upgrade Button */}
            <Link
              href="/pricing"
              className="flex items-center justify-center space-x-2 w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Nâng cấp ngay</span>
            </Link>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Empty left for balance */}
            <div></div>

            {/* Right: User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{getUserName()}</span>
                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-white">
                  {getUserInitial()}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl py-2 z-50">
                  <Link
                    href="/"
                    className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <Home className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Trang chủ</span>
                  </Link>
                  <Link
                    href="/account"
                    className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Cài đặt</span>
                  </Link>
                  <Link
                    href="/help"
                    className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Trợ giúp</span>
                  </Link>
                  <div className="border-t border-gray-200 my-2"></div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 transition-colors w-full text-left text-red-600"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Welcome Message */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {getGreeting()}, {getUserName()}! 🎯
            </h1>
            <p className="text-gray-600">Sẵn sàng bắt đầu lập kế hoạch tài chính?</p>
          </div>

          {/* Main Input Area - Like FormulaBot */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8 shadow-sm">
            <div className="max-w-3xl mx-auto">
              <textarea
                placeholder="Hỏi PlanAI để tạo kế hoạch tài chính..."
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-400"
              />
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2">
                  <button className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Thêm dữ liệu</span>
                  </button>
                </div>
                <Link
                  href="/dashboard/chat"
                  className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                >
                  <span>Bắt đầu</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Link
              href="/dashboard/chat"
              className="bg-white border border-gray-200 rounded-xl p-6 hover:border-primary-500 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Hỏi đáp</h3>
              <p className="text-sm text-gray-500">Tạo charts, tables, insights và nhiều hơn nữa</p>
            </Link>

            <Link
              href="/dashboard/plans/create"
              className="bg-white border border-gray-200 rounded-xl p-6 hover:border-primary-500 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Tạo kế hoạch</h3>
              <p className="text-sm text-gray-500">Viết prompt để tạo kế hoạch chi tiết</p>
            </Link>

            <Link
              href="/dashboard/analytics"
              className="bg-white border border-gray-200 rounded-xl p-6 hover:border-primary-500 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Phân tích</h3>
              <p className="text-sm text-gray-500">Tôi có thể giúp bất cứ điều gì như Excel formulas, SQL queries, VBA...</p>
            </Link>

            <Link
              href="/templates"
              className="bg-white border border-gray-200 rounded-xl p-6 hover:border-primary-500 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Lightbulb className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Templates</h3>
              <p className="text-sm text-gray-500">Hoặc bắt đầu nhanh với một template có sẵn</p>
            </Link>
          </div>

          {/* Recent Plans */}
          {plans.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Kế hoạch gần đây</h2>
                <Link
                  href="/dashboard/plans"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Xem tất cả →
                </Link>
              </div>
              <div className="space-y-2">
                {plans.map((plan) => (
                  <Link
                    key={plan.id}
                    href={`/dashboard/plans/${plan.id}`}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 group-hover:text-primary-600">
                          {plan.title || 'Kế hoạch tài chính'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(plan.created_at).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600" />
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
