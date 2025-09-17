"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CreditCard, CheckCircle2, ArrowRight, Wallet, BookOpen, Lock, Sparkles, RefreshCcw, CalendarClock, User, Settings, LogOut, Trash2 } from 'lucide-react'
import { getCurrentUser, getUserProfile, supabase } from '@/lib/supabase'
import type { UserProfile, Payment, SubscriptionTier } from '@/types'

export default function AccountPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [currentTier, setCurrentTier] = useState<SubscriptionTier | null>(null)
  const [tiers, setTiers] = useState<SubscriptionTier[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [storageOption, setStorageOption] = useState('30days') // '30days' or '7days'

  useEffect(() => {
    const run = async () => {
      const u = await getCurrentUser()
      if (!u) {
        router.push('/login')
        return
      }
      setUser(u)

      const { data: p } = await getUserProfile(u.id)
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
        .eq('user_id', u.id)
        .order('created_at', { ascending: false })
      if (paymentsData) setPayments(paymentsData as unknown as Payment[])

      setIsLoading(false)
    }
    run()
  }, [router])

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
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleDeleteAccount = async () => {
    if (confirm('Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.')) {
      // For now, just sign out. In production, call admin API to delete user.
      await supabase.auth.signOut()
      router.push('/')
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
    <main className="min-h-screen bg-white">
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">P</span>
                </div>
                <span className="text-xl font-bold gradient-text">PlanAI</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/chat" className="text-gray-600 hover:text-primary-600 transition-colors">
                Chat AI
              </Link>
              <Link href="/dashboard/plans/create" className="text-gray-600 hover:text-primary-600 transition-colors">
                Tạo kế hoạch
              </Link>
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user.email.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="pt-24 pb-8 bg-gradient-to-br from-primary-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Tài khoản của bạn</h1>
          <p className="text-gray-600">Quản lý tài khoản, theo dõi sử dụng và cài đặt cá nhân.</p>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* 1. Trang chính tính năng */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Tính năng chính</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Link href="/dashboard/chat" className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50">
                <div>
                  <div className="text-lg font-semibold text-gray-900">Chat với AI</div>
                  <div className="text-gray-600 text-sm">Nhận tư vấn tài chính cá nhân hóa</div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </Link>
              <Link href="/dashboard/plans/create" className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50">
                <div>
                  <div className="text-lg font-semibold text-gray-900">Tạo kế hoạch</div>
                  <div className="text-gray-600 text-sm">Lập kế hoạch tài chính độc quyền</div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* 2. Quản lý */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Quản lý tài khoản</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Thông tin cá nhân</h3>
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">Tên: {profile?.full_name || 'Chưa cập nhật'}</div>
                  <div className="text-sm text-gray-600">Email: {user.email}</div>
                  <div className="text-sm text-gray-600">Gói hiện tại: {currentTier?.name || 'Free'}</div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Hoạt động tài khoản</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-800 mb-1">Chat với AI</div>
                    <ProgressBar used={usage.chat.used} limit={usage.chat.limit} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800 mb-1">Số kế hoạch</div>
                    <ProgressBar used={usage.plan.used} limit={usage.plan.limit} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800 mb-1">Giới hạn từ</div>
                    <ProgressBar used={usage.words.used} limit={usage.words.limit} />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Link href="/pricing" className="inline-flex items-center px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700">
                Gia hạn thêm <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>

          {/* 3. Setting */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Cài đặt</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Thông tin hồ sơ</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Họ và tên"
                    value={profile?.full_name || ''}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                    onChange={(e) => {/* Handle update */}}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={user.email}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                    disabled
                  />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Lưu trữ Plan</h3>
                <select
                  value={storageOption}
                  onChange={(e) => setStorageOption(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="30days">Lưu trữ theo gói (30 ngày)</option>
                  <option value="7days">Xóa sau 7 ngày</option>
                </select>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Xóa tài khoản</h3>
                <button
                  onClick={handleDeleteAccount}
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa tài khoản
                </button>
              </div>
            </div>
          </div>

          {/* 4. Log out */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <button
              onClick={handleLogOut}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-gray-600 text-white hover:bg-gray-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Đăng xuất
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
