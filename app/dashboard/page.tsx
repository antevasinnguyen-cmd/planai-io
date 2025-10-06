'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, FileText, MessageCircle, Sparkles, User, LogOut, BarChart3, 
  Target, TrendingUp, Calendar, Home, Settings, CreditCard, 
  Users, HelpCircle, Command, Search, Bell, ChevronDown, Menu, X
} from 'lucide-react'
import { supabase, getUserSubscription, getUserUsageStats, getUserPlans, getSubscriptionLimits } from '@/lib/supabase'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import SuccessAlert from '@/components/SuccessAlert'
import Image from 'next/image'

interface UsageStats {
  plans: number
  chats: number
  words: number
  error: any
}

export default function DashboardPage() {
  const [subscription, setSubscription] = useState<any>(null)
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()

  useEffect(() => {
    console.log('=== DASHBOARD: useEffect ===', { user, authLoading })
    
    if (!authLoading && !user) {
      console.log('=== DASHBOARD: Không có user, chuyển hướng login ===')
      window.location.href = '/login'
      return
    }

    if (user) {
      console.log('=== DASHBOARD: Có user, khởi tạo dashboard ===', user.email)
      initializeDashboard()
      
      // Kiểm tra thông báo đăng nhập thành công
      const hasAuthSuccess = localStorage.getItem('auth_success')
      const userEmail = localStorage.getItem('auth_user_email')
      if (hasAuthSuccess === 'true') {
        console.log('=== DASHBOARD: Hiển thị thông báo thành công ===')
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
      setPlans(data?.slice(0, 3) || []) // Only show 3 recent plans
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

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'text-gray-600'
      case 'basic': return 'text-blue-600'
      case 'pro': return 'text-purple-600'
      case 'pro_max': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dashboard...</p>
        </div>
      </div>
    )
  }
  const tier = subscription?.tier || 'free'
  const limits = getSubscriptionLimits(tier)

  return (
    <div className="min-h-screen bg-[#fafafa] flex">
      {showSuccessMessage && (
        <SuccessAlert 
          message={`🎉 Chúc mừng bạn đã đăng nhập thành công! Hãy bắt đầu với PlanAI ngay nào!`}
          duration={10000}
        />
      )}
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 overflow-y-auto hidden md:block">
        <div className="p-4 border-b border-gray-200">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-primary-800 rounded-md flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">PlanAI</span>
          </Link>
        </div>
        
        <nav className="p-4 space-y-1">
          <Link href="/dashboard" className="flex items-center space-x-3 px-3 py-2 rounded-md bg-blue-50 text-blue-700 font-medium">
            <Home className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          
          <Link href="/dashboard/chat" className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
            <MessageCircle className="w-5 h-5" />
            <span>Chat AI</span>
          </Link>
          
          <Link href="/dashboard/plans" className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
            <FileText className="w-5 h-5" />
            <span>Kế hoạch</span>
          </Link>
          
          <div className="pt-4 pb-2">
            <div className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tài khoản</div>
          </div>
          
          <Link href="/account" className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
            <User className="w-5 h-5" />
            <span>Hồ sơ</span>
          </Link>
          
          <Link href="/account/billing" className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
            <CreditCard className="w-5 h-5" />
            <span>Thanh toán</span>
          </Link>
          
          <Link href="/account/settings" className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
            <Settings className="w-5 h-5" />
            <span>Cài đặt</span>
          </Link>
          
          <div className="pt-4 pb-2">
            <div className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Hỗ trợ</div>
          </div>
          
          <Link href="/help" className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
            <HelpCircle className="w-5 h-5" />
            <span>Trợ giúp</span>
          </Link>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
            <span>Đăng xuất</span>
          </button>
        </nav>
      </aside>
      
      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center md:hidden">
              <button className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                <Menu className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative hidden md:block w-64">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="Tìm kiếm..." 
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-1 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              </button>
              
              <div className="relative">
                <button className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-gray-900">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {user?.user_metadata?.avatar_url ? (
                      <Image 
                        src={user.user_metadata.avatar_url} 
                        alt="Avatar" 
                        width={32} 
                        height={32} 
                        className="object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                  <span className="hidden md:inline-block">{user?.user_metadata?.full_name || user?.email}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>
        
        <main className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Chào mừng trở lại với PlanAI</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className={`text-sm font-medium ${getTierColor(tier)}`}>
                  {getTierName(tier)}
                </div>
                <div className="text-xs text-gray-500">{user?.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>

          {/* Usage Stats Cards */}
          {usage && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Chat AI</p>
                    <p className="text-2xl font-bold text-gray-900">{usage.chats}/{limits.chats}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((usage.chats / limits.chats) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Còn lại: {Math.max(0, limits.chats - usage.chats)} chat
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Kế hoạch</p>
                    <p className="text-2xl font-bold text-gray-900">{usage.plans}/{limits.plans}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((usage.plans / limits.plans) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Còn lại: {Math.max(0, limits.plans - usage.plans)} kế hoạch
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Từ đã dùng</p>
                    <p className="text-2xl font-bold text-gray-900">{usage.words.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((usage.words / limits.words) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Giới hạn: {limits.words.toLocaleString()} từ
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link
              href="/dashboard/chat"
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    Chat AI
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Tư vấn tài chính cá nhân</p>
                </div>
                <MessageCircle className="w-8 h-8 text-blue-600" />
              </div>
            </Link>

            <Link
              href="/dashboard/plans/create"
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                    Tạo Kế Hoạch
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">AI tạo kế hoạch tài chính</p>
                </div>
                <Plus className="w-8 h-8 text-green-600" />
              </div>
            </Link>

            <Link
              href="/dashboard/plans"
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                    Quản Lý Kế Hoạch
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Xem và chỉnh sửa kế hoạch</p>
                </div>
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
            </Link>

            <Link
              href="/pricing"
              className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow group text-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    Nâng Cấp
                  </h3>
                  <p className="text-sm text-blue-100 mt-1">Mở khóa tính năng cao cấp</p>
                </div>
                <TrendingUp className="w-8 h-8" />
              </div>
            </Link>
          </div>

          {/* Recent Plans */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Kế Hoạch Gần Đây</h2>
              <Link
                href="/dashboard/plans"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Xem tất cả
              </Link>
            </div>

            {plans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plans.slice(0, 6).map((plan) => (
                  <Link
                    key={plan.id}
                    href={`/dashboard/plans/${plan.id}`}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{plan.title}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{plan.goal}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{plan.word_count?.toLocaleString()} từ</span>
                      <span>{new Date(plan.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có kế hoạch nào</h3>
                <p className="text-gray-600 mb-6">
                  Bắt đầu tạo kế hoạch tài chính đầu tiên của bạn với sự hỗ trợ của AI
                </p>
                <Link
                  href="/dashboard/plans/create"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Tạo Kế Hoạch Đầu Tiên
                </Link>
              </div>
            )}
          </div>

          {/* Upgrade Prompt */}
          {tier === 'free' && (
            <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Nâng cấp để mở khóa toàn bộ tính năng</h3>
                  <p className="text-gray-600 text-sm">
                    Tạo nhiều kế hoạch hơn, chat không giới hạn và nhận kế hoạch chi tiết hơn
                  </p>
                </div>
                <Link
                  href="/pricing"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  Xem Gói Nâng Cấp
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
