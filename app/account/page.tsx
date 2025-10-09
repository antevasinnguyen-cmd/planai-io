"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  CreditCard, ArrowRight, User, Settings, LogOut, Trash2, FileText,
  Home, Target, BarChart3, Calendar, Sun, Moon, Crown, Menu, X, ChevronDown,
  HelpCircle
} from 'lucide-react'
import { getUserProfile, supabase, getUserSubscription, getUserUsageStats, getSubscriptionLimits } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { useTheme } from '@/lib/theme-context'
import Logo from '@/components/Logo'
import type { UserProfile } from '@/types'

export default function AccountPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [storageOption, setStorageOption] = useState('30days')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [subscription, setSubscription] = useState<any>(null)
  const [usageStats, setUsageStats] = useState<any>(null)
  const { user, loading: authLoading, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    
    if (user) {
      const run = async () => {
        const { data: p } = await getUserProfile(user.id)
        if (p) setProfile(p as unknown as UserProfile)

        const { data: sub } = await getUserSubscription(user.id)
        setSubscription(sub)

        const stats = await getUserUsageStats(user.id)
        setUsageStats(stats)

        setIsLoading(false)
      }
      run()
    }
  }, [router, user, authLoading])

  const getUserName = () => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  }

  const getUserInitial = () => {
    const name = getUserName()
    return name.charAt(0).toUpperCase()
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  const handleDeleteAccount = async () => {
    if (confirm('Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.')) {
      await signOut()
      router.push('/')
    }
  }

  const getTierName = (tier: string) => {
    switch (tier) {
      case 'free': return 'Free Plan'
      case 'basic': return 'Gói 1'
      case 'pro': return 'Gói 2 - Pro'
      case 'pro_max': return 'Gói 3 - Pro Max'
      default: return 'Free Plan'
    }
  }

  const tier = subscription?.tier || 'free'
  const limits = getSubscriptionLimits(tier)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] text-gray-900 dark:text-white flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col fixed h-screen z-20`}>
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
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
              >
                <Home className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-600" />
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
                {sidebarOpen && <span className="text-sm font-medium">Lịch trình</span>}
              </Link>
            </div>
          </div>

          {/* Customization Section */}
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

        {/* Plan Status */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{getTierName(tier)}</p>
              </div>
              
              {/* Chat Usage */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Tin nhắn</span>
                  <span className="font-medium">{usageStats?.chats || 0}/{limits.chats}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(((usageStats?.chats || 0) / limits.chats) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Plans Usage */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Kế hoạch</span>
                  <span className="font-medium">{usageStats?.plans || 0}/{limits.plans}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-green-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(((usageStats?.plans || 0) / limits.plans) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Top Bar */}
        <header className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Cài đặt tài khoản</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Quản lý thông tin cá nhân và cài đặt</p>
            </div>

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
                    href="/help"
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
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Account Information */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <User className="w-5 h-5 mr-2 text-primary-600" />
                Thông tin tài khoản
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập họ và tên"
                    value={profile?.full_name || ''}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    onChange={(e) => {/* Handle update */}}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                    disabled
                  />
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Gói hiện tại</p>
                    <p className="text-lg font-semibold text-primary-600 dark:text-primary-400 mt-1">
                      {getTierName(tier)}
                    </p>
                  </div>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Nâng cấp
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Usage Statistics */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-primary-600" />
                Thống kê sử dụng
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Chat với AI</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {usageStats?.chats || 0} / {limits.chats}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-blue-500 h-2.5 rounded-full transition-all"
                      style={{ width: `${Math.min(((usageStats?.chats || 0) / limits.chats) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Kế hoạch đã tạo</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {usageStats?.plans || 0} / {limits.plans}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-green-500 h-2.5 rounded-full transition-all"
                      style={{ width: `${Math.min(((usageStats?.plans || 0) / limits.plans) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Từ đã sử dụng</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {usageStats?.words || 0} / {limits.words}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-purple-500 h-2.5 rounded-full transition-all"
                      style={{ width: `${Math.min(((usageStats?.words || 0) / limits.words) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Storage Settings */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-primary-600" />
                Cài đặt lưu trữ
              </h2>
              <div className="space-y-3">
                <label className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <input
                    type="radio"
                    name="storage"
                    value="30days"
                    checked={storageOption === '30days'}
                    onChange={(e) => setStorageOption(e.target.value)}
                    className="mr-3 w-4 h-4 text-primary-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Lưu trữ theo gói đăng ký (30 ngày)</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Dữ liệu sẽ được lưu trữ trong 30 ngày</p>
                  </div>
                </label>
                <label className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <input
                    type="radio"
                    name="storage"
                    value="7days"
                    checked={storageOption === '7days'}
                    onChange={(e) => setStorageOption(e.target.value)}
                    className="mr-3 w-4 h-4 text-primary-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Xóa sau mỗi 7 ngày</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Dữ liệu sẽ tự động xóa sau 7 ngày</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-red-200 dark:border-red-900 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center text-red-600 dark:text-red-400">
                <Trash2 className="w-5 h-5 mr-2" />
                Vùng nguy hiểm
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Hành động này sẽ xóa vĩnh viễn tài khoản và tất cả dữ liệu của bạn. Không thể hoàn tác.
              </p>
              <button
                onClick={handleDeleteAccount}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa tài khoản
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
