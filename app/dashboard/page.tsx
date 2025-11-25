'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Brain, FileText, Download, MessageSquare, ChevronDown, Crown, Settings, LogOut, 
  Home, HelpCircle, Menu, X, ArrowRight, Target, BarChart3, Calendar, Sun, Moon,
  User, Zap, Shield, CreditCard
} from 'lucide-react'
import { supabase, getUserSubscription, getUserUsageStats, getUserPlans, getSubscriptionLimits, checkTrialStatus, getTierName, initializeFreeTrialForNewUser } from '@/lib/supabase'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useTheme } from '@/lib/theme-context'
import SuccessAlert from '@/components/SuccessAlert'
import Logo from '@/components/Logo'
import UpgradePrompt from '@/components/UpgradePrompt'

interface UsageStats {
  plans: number
  chats: number
  words: number
  error: any
}

export default function DashboardFinal() {
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
    // CRITICAL: Chỉ xử lý khi auth loading hoàn thành
    if (authLoading) {
      console.log('=== DASHBOARD: Auth đang loading, chờ... ===')
      return
    }

    // CRITICAL: Nếu không có user sau khi loading xong, redirect đến login
    if (!user) {
      console.log('=== DASHBOARD: Không có user sau khi auth loading xong, redirect đến login ===')
      // Add small delay to ensure session is fully loaded
      const timer = setTimeout(() => {
        router.push('/login')
      }, 100)
      return () => clearTimeout(timer)
    }

    // User tồn tại, khởi tạo dashboard
    console.log('=== DASHBOARD: User đã đăng nhập, khởi tạo dashboard ===', {
      email: user.email,
      id: user.id
    })
    initializeDashboard()
    
    const hasAuthSuccess = localStorage.getItem('auth_success')
    const hasShownWelcome = sessionStorage.getItem('welcome_shown')
    if (hasAuthSuccess === 'true' && !hasShownWelcome) {
      setShowSuccessMessage(true)
      sessionStorage.setItem('welcome_shown', 'true')
      localStorage.removeItem('auth_success')
      localStorage.removeItem('auth_user_email')
    }
  }, [user, authLoading, router])

  // Effect: Refetch subscription/usage if just upgraded (after payment)
  useEffect(() => {
    if (!user) return;
    const refreshSub = sessionStorage.getItem('refresh_subscription');
    if (refreshSub) {
      sessionStorage.removeItem('refresh_subscription');
      console.log('=== DASHBOARD: Refresh triggered after payment/subscription upgrade ===');
      // Force refetch subscription & usage
      loadSubscription(user.id);
      loadUsageStats(user.id);
    }
  }, [user]);

  // Separate effect to check for refresh flag after plan creation
  useEffect(() => {
    if (!user) return;
    const refreshFlag = sessionStorage.getItem('refresh_plans_list');
    if (refreshFlag) {
      sessionStorage.removeItem('refresh_plans_list');
      console.log('=== DASHBOARD: Refresh triggered after plan creation ===');
      setTimeout(() => {
        loadRecentPlans(user.id);
      }, 1000);
    }
  }, [user]);

  const initializeDashboard = async () => {
    if (!user) return

    // Run sequentially to ensure trial creation (for brand-new users) happens before reading trial status
    await loadSubscription(user.id)
    await Promise.all([
      loadUsageStats(user.id),
      loadRecentPlans(user.id),
      loadTrialStatus(user.id)
    ])
    setIsLoading(false)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Chào buổi sáng'
    if (hour < 18) return 'Chào buổi chiều'
    return 'Chào buổi tối'
  }

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500',
      green: 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-500',
      purple: 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-500',
      yellow: 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-500'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const loadSubscription = async (userId: string) => {
    try {
      const { data } = await getUserSubscription(userId)
      console.log('=== DASHBOARD: Subscription data loaded ===', { 
        userId,
        tier: data?.tier,
        status: data?.status,
        hasData: !!data
      })
      if (!data) {
        // Initialize free trial via secure API route (service role)
        try {
          const res = await fetch('/api/subscriptions/init', { method: 'POST' })
          const init = await res.json()
          if (res.ok && init?.data) {
            console.log('=== DASHBOARD: Free trial initialized ===', { tier: init.data.tier })
            setSubscription(init.data)
            return
          }
        } catch (e) {
          console.error('=== DASHBOARD: Failed to initialize free trial ===', e)
        }
      }
      setSubscription(data)
    } catch (error) {
      console.error('=== DASHBOARD: Error loading subscription ===', error)
    }
  }

  // Refresh subscription mỗi 5 giây để catch payment updates
  useEffect(() => {
    if (!user?.id) return
    
    const refreshInterval = setInterval(() => {
      console.log('=== DASHBOARD: Auto-refreshing subscription ===')
      loadSubscription(user.id)
    }, 5000)

    return () => clearInterval(refreshInterval)
  }, [user?.id])

  const loadUsageStats = async (_userId: string) => {
    try {
      const res = await fetch('/api/usage/stats', { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const usageStats = data?.usage || { plans: 0, chats: 0, words: 0 }
      setUsage({ ...usageStats, error: null })
    } catch (error) {
      console.error('Error loading usage stats:', error)
      setUsage({ plans: 0, chats: 0, words: 0, error })
    }
  }

  const loadRecentPlans = useCallback(async (userId: string) => {
    try {
      console.log('=== DASHBOARD: Loading recent plans for user', userId)
      const { data } = await getUserPlans(userId)
      console.log('=== DASHBOARD: Recent plans loaded', { count: data?.length || 0 })
      setPlans(data?.slice(0, 5) || [])
    } catch (error) {
      console.error('Error loading plans:', error)
      setPlans([])
    }
  }, [])

  const loadTrialStatus = async (userId: string) => {
    try {
      const status = await checkTrialStatus(userId)
      setTrialStatus(status)
    } catch (error) {
      console.error('Error loading trial status:', error)
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

  const DAY_MS = 24 * 60 * 60 * 1000
  const normalizeDate = (input?: string | null) => {
    if (!input) return null
    const parsed = new Date(input)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const computeEndDate = () => {
    const now = new Date()
    
    // Nếu có trial status active, sử dụng nó (cho free tier)
    if (trialStatus?.isActive && typeof trialStatus?.daysRemaining === 'number' && trialStatus.daysRemaining > 0) {
      console.log('=== DASHBOARD: Using trial status ===', trialStatus)
      return new Date(now.getTime() + trialStatus.daysRemaining * DAY_MS)
    }
    
    // Nếu không phải free tier, kiểm tra current_period_end
    if (tier !== 'free') {
      const periodEnd = normalizeDate(subscription?.current_period_end)
      if (periodEnd) return periodEnd
      const createdDate = normalizeDate(subscription?.created_at)
      if (createdDate) {
        return new Date(createdDate.getTime() + 30 * DAY_MS)
      }
      return null
    }

    // Fallback cho free tier: 30 ngày từ created_at
    const createdSource = normalizeDate(subscription?.created_at) || normalizeDate(user?.created_at)
    if (createdSource) {
      console.log('=== DASHBOARD: Using created_at fallback ===', createdSource)
      return new Date(createdSource.getTime() + 30 * DAY_MS)
    }

    return null
  }

  const planEndDate = computeEndDate()
  const daysLeft = planEndDate ? Math.ceil((planEndDate.getTime() - new Date().getTime()) / DAY_MS) : null
  const endDateSuffix = daysLeft === null
    ? ''
    : daysLeft < 0
      ? ' (đã hết hạn)'
      : daysLeft === 0
        ? ' (hôm nay)'
        : ''
  
  // Tính năng nổi bật
  const features = [
    {
      icon: Brain,
      title: 'AI Thông Minh',
      description: 'Sử dụng công nghệ AI tiên tiến để phân tích dữ liệu và tạo kế hoạch tài chính cá nhân hóa',
      color: 'blue',
      href: '/dashboard/create-plan'
    },
    {
      icon: MessageSquare,
      title: 'Chat Tương Tác',
      description: 'Trò chuyện tự nhiên với AI để thu thập thông tin và điều chỉnh kế hoạch theo nhu cầu',
      color: 'green',
      href: '/dashboard/create-plan'
    },
    {
      icon: FileText,
      title: 'Kế Hoạch Chi Tiết',
      description: 'Nhận kế hoạch tài chính như một cuốn Ebook độc quyền với lộ trình và checklist',
      color: 'purple',
      href: '/dashboard/plans'
    },
    {
      icon: Download,
      title: 'Xuất Đa Định Dạng',
      description: 'Xuất kế hoạch sang PDF, Word, Google Sheets, Notion để dễ dàng theo dõi',
      color: 'yellow',
      href: '/dashboard/plans'
    }
  ]
  
  // Hướng dẫn sử dụng cho Feature Cards
  const usageSteps = [
    {
      icon: MessageSquare,
      title: 'Bước 1: Trò chuyện với AI',
      description: 'Trả lời các câu hỏi về mục tiêu tài chính, thu nhập và chi tiêu của bạn qua chat tự nhiên',
      color: 'blue',
      href: '/dashboard/create-plan'
    },
    {
      icon: Brain,
      title: 'Bước 2: Phân tích dữ liệu',
      description: 'AI phân tích thông tin và đề xuất kế hoạch tài chính phù hợp với hoàn cảnh cá nhân của bạn',
      color: 'green',
      href: '/dashboard/create-plan'
    },
    {
      icon: FileText,
      title: 'Bước 3: Nhận kế hoạch',
      description: 'Xem kế hoạch chi tiết với lộ trình, mục tiêu và các bước thực hiện cụ thể',
      color: 'purple',
      href: '/dashboard/plans'
    },
    {
      icon: Download,
      title: 'Bước 4: Xuất & Thực hiện',
      description: 'Xuất kế hoạch sang nhiều định dạng và bắt đầu hành trình tài chính của bạn',
      color: 'yellow',
      href: '/dashboard/plans'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] text-gray-900 dark:text-white flex">
      {showSuccessMessage && (
        <SuccessAlert 
          message={`🎉 Chúc mừng bạn đã đăng nhập thành công! Hãy bắt đầu với PlanAI ngay nào!`}
          duration={10000}
        />
      )}

      {/* Sidebar - Fixed, responsive for mobile */}
      <aside className={`${sidebarOpen ? 'w-64' : 'hidden'} md:flex ${sidebarOpen ? 'md:w-64' : 'md:w-20'} bg-white dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex-col fixed md:relative h-screen z-20`}>
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

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {/* Main Section */}
          <div className="mb-0 pb-1">
            {sidebarOpen && (
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Chính</p>
            )}
            <div className="space-y-1">
              <Link
                href="/dashboard"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 transition-colors group"
              >
                <Home className="w-5 h-5" />
                {sidebarOpen && <span className="text-sm font-medium">Tổng quan</span>}
              </Link>
              <Link
                href="/dashboard/create-plan"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
              >
                <Target className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-600" />
                {sidebarOpen && <span className="text-sm font-medium">Tạo Plan</span>}
              </Link>
              <Link
                href="/dashboard/plans"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
              >
                <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-600" />
                {sidebarOpen && <span className="text-sm font-medium">Kế hoạch</span>}
              </Link>
              <Link
                href="/dashboard/analytics"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
              >
                <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-600" />
                {sidebarOpen && <span className="text-sm font-medium">Phân tích</span>}
              </Link>
              <Link
                href="/dashboard/calendar"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
              >
                <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-600" />
                {sidebarOpen && <span className="text-sm font-medium">Tiến độ</span>}
              </Link>
            </div>
          </div>
          
          {/* Phần Tuỳ chỉnh - Ngay dưới phần Chính */}
          {sidebarOpen && (
            <div className="px-4 pb-4 space-y-1 border-t border-gray-200 dark:border-gray-800 pt-2 -mt-1">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Tuỳ chỉnh</p>
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
            >
              <div className="flex items-center space-x-2">
                {theme === 'light' ? (
                  <Sun className="w-4 h-4 text-gray-600" />
                ) : (
                  <Moon className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-sm font-medium">
                  {theme === 'light' ? 'Sáng' : 'Tối'}
                </span>
              </div>
              <div className="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full relative">
                <div className={`absolute top-1 ${theme === 'dark' ? 'right-1' : 'left-1'} w-4 h-4 bg-white dark:bg-primary-500 rounded-full transition-all`} />
              </div>
            </button>

            {/* Quản trị gói */}
            <Link
              href="/dashboard/subscription"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
            >
              <CreditCard className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-600" />
              <span className="text-sm font-medium">Quản trị gói</span>
            </Link>

            {/* Upgrade Button */}
            <Link
              href="/pricing"
              className="flex items-center justify-center space-x-2 w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-all"
            >
              <Crown className="w-4 h-4" />
              <span>Nâng cấp gói</span>
            </Link>
          </div>
        )}
        </nav>

        {/* Plan Status - Ở dưới cùng, fixed */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
              <div className="flex flex-col mb-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {getTierName(tier)}
                  </p>
                  {typeof daysLeft === 'number' && (
                    daysLeft <= 7
                      ? (
                        <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full">
                          {daysLeft >= 0 ? `Còn ${daysLeft} ngày` : 'Đã hết hạn'}
                        </span>
                      )
                      : (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">
                          Còn {daysLeft} ngày
                        </span>
                      )
                  )}
                  {tier === 'free' && trialStatus?.isActive && typeof trialStatus?.daysRemaining === 'number' && (
                    trialStatus.daysRemaining <= 7 ? (
                      <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full">
                        {trialStatus.daysRemaining} ngày dùng thử
                      </span>
                    ) : (
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                        {trialStatus.daysRemaining} ngày dùng thử
                      </span>
                    )
                  )}
                </div>
                
                {/* Hiển thị thời gian hết hạn */}
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {planEndDate && (
                  <span>Hết hạn: {planEndDate.toLocaleDateString('vi-VN')}{endDateSuffix}</span>
                )}
              </div>
              </div>
              
              {/* Cảnh báo khi gói sắp hết hạn */}
              {(typeof daysLeft === 'number' && daysLeft <= 7) && (
                <div className="mb-2 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md flex items-center space-x-2">
                  <div className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-800 flex items-center justify-center flex-shrink-0">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white">Còn {daysLeft} ngày</span>
                  </div>
                  <div className="text-xs text-orange-700 dark:text-orange-400">
                    <Link href="/pricing" className="font-medium hover:underline">Nâng cấp ngay</Link> để tiếp tục sử dụng
                  </div>
                </div>
              )}
              
              {/* Chat Usage */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Tin nhắn</span>
                  <span className="font-medium">{Math.min(usage?.chats || 0, limits.chats)}/{limits.chats}</span>
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
                  <span className="font-medium">{Math.min(usage?.plans || 0, limits.plans)}/{limits.plans}</span>
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

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-10"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800 px-4 md:px-6 py-4 md:py-5">
          <div className="flex items-center justify-between md:justify-end">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            {/* Right: User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-3 py-2 transition-colors"
              >
                <span className="text-sm font-medium hidden sm:block">{getUserName()}</span>
                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-white">
                  {getUserInitial()}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl py-2 z-50">
                  <Link
                    href="/"
                    className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Home className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm">Trang chủ</span>
                  </Link>
                  <Link
                    href="/account"
                    className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm">Cài đặt</span>
                  </Link>
                  <Link
                    href="/dashboard/help"
                    className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm">Trợ giúp</span>
                  </Link>
                  <div className="border-t border-gray-200 dark:border-gray-800 my-2"></div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full text-left text-red-600 dark:text-red-400"
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
        <main className="flex-1 p-4 md:p-6 overflow-y-auto w-full max-w-full">
          {/* Upgrade banner when near limits (only show at 90%+) */}
          {usage && limits && (
            (() => {
              const chatPct = Math.min(((usage.chats || 0) / (limits.chats || 1)) * 100, 100)
              const planPct = Math.min(((usage.plans || 0) / (limits.plans || 1)) * 100, 100)
              const showBanner = chatPct >= 90 || planPct >= 90
              if (!showBanner) return null
              return (
                <UpgradePrompt
                  variant="banner"
                  trigger="quota_warning"
                  currentUsage={{
                    chats: Math.min(usage.chats || 0, limits.chats),
                    plans: Math.min(usage.plans || 0, limits.plans),
                    words: usage.words || 0
                  }}
                  limits={{ chats: limits.chats, plans: limits.plans, words: limits.words }}
                  className="mb-6"
                />
              )
            })()
          )}
          {/* Welcome Message */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {getGreeting()}, {getUserName()}! 🎯
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Sẵn sàng bắt đầu lập kế hoạch tài chính?</p>
          </div>

          {/* CTA Card - Đẩy lên trên */}
          <div className="bg-gradient-to-r from-primary-500 to-purple-600 rounded-xl p-4 md:p-8 mb-6 md:mb-8 text-white">
            <div className="max-w-3xl">
              <h2 className="text-xl md:text-2xl font-bold mb-3">Bắt đầu tạo kế hoạch tài chính ngay!</h2>
              <p className="text-white/90 mb-6">
                AI sẽ hướng dẫn bạn từng bước để thu thập thông tin và tạo ra kế hoạch tài chính cá nhân hóa hoàn hảo.
              </p>
              <Link
                href="/dashboard/create-plan"
                className="inline-flex items-center space-x-2 bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                <span>Tạo Plan ngay</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
          
          {/* Nét nổi bật của PlanAI */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-4 md:p-6 mb-6 md:mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-5">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold">Cá Nhân Hóa 100%</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Mỗi kế hoạch được tạo riêng cho bạn dựa trên mục tiêu, thu nhập và hoàn cảnh cá nhân.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-5">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Brain className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold">AI Tiên Tiến</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Sử dụng mô hình AI tiên tiến nhất để phân tích tài chính và đưa ra lời khuyên chuyên nghiệp.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-5">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold">Bảo Mật Tuyệt Đối</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Dữ liệu tài chính của bạn được mã hóa và bảo vệ theo tiêu chuẩn bảo mật cao nhất.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-5">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <h3 className="font-semibold">Cập Nhật Liên Tục</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Kế hoạch của bạn được cập nhật theo thời gian thực khi có thay đổi về tài chính hoặc mục tiêu.
                </p>
              </div>
            </div>
          </div>

          {/* Recent Plans */}
          {plans.length > 0 && (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Kế hoạch gần đây</h2>
                <Link
                  href="/dashboard/plans"
                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                >
                  Xem tất cả →
                </Link>
              </div>
              <div className="space-y-2">
                {plans.map((plan) => (
                  <Link
                    key={plan.id}
                    href={`/dashboard/plans/${plan.id}`}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium group-hover:text-primary-600 dark:group-hover:text-primary-400">
                          {plan.title || 'Kế hoạch tài chính'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(plan.created_at).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {plans.length === 0 && (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center mb-8">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Chưa có kế hoạch nào</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Bắt đầu tạo kế hoạch tài chính đầu tiên của bạn với AI
              </p>
              <Link
                href="/dashboard/create-plan"
                className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                <Target className="w-5 h-5" />
                <span>Tạo Plan ngay</span>
              </Link>
            </div>
          )}

          {/* Hướng dẫn sử dụng - Ở dưới cùng */}
          <h2 className="text-2xl font-bold mb-6">Hướng dẫn sử dụng</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {usageSteps.map((feature, index) => (
              <Link
                key={index}
                href={feature.href}
                className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-lg transition-all group"
              >
                <div className={`w-12 h-12 ${getColorClasses(feature.color)} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 whitespace-nowrap">{feature.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
