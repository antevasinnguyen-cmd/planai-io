"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CreditCard, CheckCircle2, ArrowRight, Wallet, BookOpen, Lock, Sparkles, RefreshCcw, CalendarClock, User, Settings, LogOut, Trash2, FileText } from 'lucide-react'
import { getUserProfile, supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import type { UserProfile, Payment, SubscriptionTier } from '@/types'

export default function AccountPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [currentTier, setCurrentTier] = useState<SubscriptionTier | null>(null)
  const [tiers, setTiers] = useState<SubscriptionTier[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [storageOption, setStorageOption] = useState('30days') // '30days' or '7days'
  const { user, loading: authLoading, signOut } = useAuth()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    
    if (user) {
      const run = async () => {
        const { data: p } = await getUserProfile(user.id)
        if (p) setProfile(p as unknown as UserProfile)

        // Load subscription tiers
        const { data: allTiers } = await supabase
          .from('subscription_tiers')
          .select('*')
          .order('price', { ascending: true })

        if (allTiers) setTiers(allTiers as unknown as SubscriptionTier[])

        // Current tier details
        const tierId = (p?.subscription_tier || 'free') as string
        const { data: tierRow } = await supabase
          .from('subscription_tiers')
          .select('*')
          .eq('id', tierId)
          .single()
        if (tierRow) setCurrentTier(tierRow as unknown as SubscriptionTier)

        // Payments history
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        if (paymentsData) setPayments(paymentsData as unknown as Payment[])

        setIsLoading(false)
      }
      run()
    }
  }, [router, user, authLoading])

  const usage = useMemo(() => {
    const limits = currentTier || (tiers.find(t => t.id === (profile?.subscription_tier || 'free')) ?? null)
    return {
      chat: {
        used: profile?.chat_count ?? 0,
        limit: limits?.chat_limit ?? 5,
      },
      plan: {
        used: profile?.plan_count ?? 0,
        limit: limits?.plan_limit ?? 1,
      },
      words: {
        used: 0,
        limit: limits?.word_limit ?? 1500,
      },
    }
  }, [currentTier, profile, tiers])

  const handleLogOut = async () => {
    await signOut()
    router.push('/')
  }

  const handleDeleteAccount = async () => {
    if (confirm('Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.')) {
      // For now, just sign out. In production, call admin API to delete user.
      await signOut()
      router.push('/')
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải trang quản lý...</p>
        </div>
      </div>
    )
  }

  const isPaid = ['basic', 'pro', 'pro_max'].includes(profile?.subscription_tier || 'free')

  const ProgressBar = ({ used, limit }: { used: number; limit: number }) => {
    const pct = Math.min(100, Math.round(((used || 0) / Math.max(1, limit || 1)) * 100))
    return (
      <div>
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Đã dùng: {used ?? 0}</span>
          <span>Giới hạn: {limit ?? 0}</span>
        </div>
        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary-600" style={{ width: `${pct}%` }} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <div className="flex">
        <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-primary-800 rounded-md flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">PlanAI</span>
            </Link>
          </div>
          
          <nav className="p-4 space-y-1">
            <Link href="/dashboard" className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
              <User className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            
            <Link href="/dashboard/chat" className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
              <BookOpen className="w-5 h-5" />
              <span>Chat AI</span>
            </Link>
            
            <Link href="/dashboard/plans" className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
              <FileText className="w-5 h-5" />
              <span>Kế hoạch</span>
            </Link>
            
            <div className="pt-4 pb-2">
              <div className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tài khoản</div>
            </div>
            
            <Link href="/account" className="flex items-center space-x-3 px-3 py-2 rounded-md bg-blue-50 text-blue-700 font-medium">
              <Settings className="w-5 h-5" />
              <span>Quản lý tài khoản</span>
            </Link>
            
            <Link href="/pricing" className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
              <CreditCard className="w-5 h-5" />
              <span>Nâng cấp gói</span>
            </Link>
            
            <button 
              onClick={handleLogOut}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5" />
              <span>Đăng xuất</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-hidden">
          {/* Header */}
          <header className="bg-white border-b border-gray-200">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Quản lý tài khoản</h1>
                  <p className="text-gray-600 mt-1">Theo dõi sử dụng và cài đặt cá nhân</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                    {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user?.user_metadata?.full_name || 'User'}</div>
                    <div className="text-xs text-gray-500">{user?.email}</div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="p-6 space-y-6">
            {/* 1. Tính năng chính */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-primary-600" />
                Tính năng chính
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Link href="/dashboard/chat" className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <div className="text-lg font-medium text-gray-900">Chat với AI</div>
                    <div className="text-gray-600 text-sm">Tư vấn tài chính cá nhân hóa</div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link href="/dashboard/plans/create" className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <div className="text-lg font-medium text-gray-900">Tạo kế hoạch</div>
                    <div className="text-gray-600 text-sm">Lập kế hoạch tài chính AI</div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </Link>
              </div>
            </div>

            {/* 2. Quản lý tài khoản */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-primary-600" />
                Quản lý tài khoản
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Thông tin cá nhân</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tên:</span>
                      <span className="text-sm font-medium text-gray-900">{profile?.full_name || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm font-medium text-gray-900">{user?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Gói hiện tại:</span>
                      <span className={`text-sm font-medium ${getTierColor(currentTier?.id || 'free')}`}>
                        {getTierName(currentTier?.id || 'free')}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Hoạt động tài khoản</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-gray-800 mb-2">Chat với AI</div>
                      <ProgressBar used={usage.chat.used} limit={usage.chat.limit} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800 mb-2">Kế hoạch tạo</div>
                      <ProgressBar used={usage.plan.used} limit={usage.plan.limit} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800 mb-2">Từ đã sử dụng</div>
                      <ProgressBar used={usage.words.used} limit={usage.words.limit} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Link href="/pricing" className="inline-flex items-center px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Gia hạn thêm
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* 3. Cài đặt */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-primary-600" />
                Cài đặt
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Thông tin hồ sơ</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                      <input
                        type="text"
                        placeholder="Nhập họ và tên"
                        value={profile?.full_name || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        onChange={(e) => {/* Handle update */}}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        disabled
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Lưu trữ Plan</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="storage"
                        value="30days"
                        checked={storageOption === '30days'}
                        onChange={(e) => setStorageOption(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Lưu trữ theo gói đăng ký (30 ngày)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="storage"
                        value="7days"
                        checked={storageOption === '7days'}
                        onChange={(e) => setStorageOption(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Xóa sau mỗi 7 ngày</span>
                    </label>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Xóa tài khoản</h3>
                  <p className="text-sm text-gray-600 mb-3">
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
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
