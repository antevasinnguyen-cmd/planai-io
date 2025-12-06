'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Crown, Check, Zap, TrendingUp, Calendar, CreditCard, 
  MessageSquare, FileText, AlertCircle, Plus, Package
} from 'lucide-react'
import { getUserSubscription, getUserUsageStats, getSubscriptionLimits, checkTrialStatus, getTierName } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import UpgradePrompt from '@/components/UpgradePrompt'
import UsageProgressBar from '@/components/UsageProgressBar'
import Link from 'next/link'

// Pricing tiers
const pricingTiers = [
  {
    id: 'free',
    name: 'Free Plan',
    price: 0,
    duration: '30 ngày (1 lần duy nhất)',
    features: {
      plans: 1,
      chats: 5,
      words: 5000
    },
    description: 'Trải nghiệm PlanAI với các tính năng cơ bản',
    color: 'gray',
    detailedFeatures: [
      '5 Chat với AI',
      'Phân tích cơ bản',
      '1 Kế hoạch ngắn'
    ]
  },
  {
    id: 'basic',
    name: 'Gói 1',
    price: 249000,
    duration: '30 ngày',
    features: {
      plans: 2,
      chats: 40,
      words: 100000
    },
    description: 'Phù hợp cho người mới bắt đầu lập kế hoạch tài chính',
    color: 'blue',
    popular: false,
    detailedFeatures: [
      '40 Chat với AI lập kế hoạch',
      '1 Ebook plan cá nhân hóa độc quyền',
      'Phân tích đầy đủ + Lộ trình',
      'Đề xuất hành động để đạt được mục tiêu',
      'Plan chuyên sâu + tất cả tài liệu liên quan',
      'Xuất file PDF, Word, Docs',
      'Xuất sang Notion, Google Trang tính, Google Tài liệu',
      '(Add-on) Phân tích kết hợp tử vi, số mệnh, thần số học',
      'Mở khoá tính năng đọc các bài blog trả phí'
    ]
  },
  {
    id: 'pro',
    name: 'Gói 2 - Pro',
    price: 479000,
    duration: '30 ngày',
    features: {
      plans: 4,
      chats: 100,
      words: 100000
    },
    description: 'Dành cho người muốn có nhiều kế hoạch và tính năng nâng cao',
    color: 'purple',
    popular: true,
    detailedFeatures: [
      '100 Chat với AI lập kế hoạch',
      '2 Ebook plan cá nhân hóa độc quyền',
      'Phân tích đầy đủ + Lộ trình',
      'Đề xuất hành động để đạt được mục tiêu',
      'Plan chuyên sâu + tất cả tài liệu liên quan',
      'Xuất file PDF, Word, Docs',
      'Xuất sang Notion, Google Trang tính, Google Tài liệu',
      '(Add-on) Phân tích kết hợp tử vi, số mệnh, thần số học',
      'Mở khóa tính năng đọc các bài Blog trả phí',
      'Truy cập sớm các tính năng mới nhất'
    ]
  }
]

export default function SubscriptionPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)
  const [usage, setUsage] = useState<any>(null)
  const [trialStatus, setTrialStatus] = useState<any>(null)
  const [activeSubscriptions, setActiveSubscriptions] = useState<any[]>([])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      loadSubscriptionData()
    }
  }, [user, authLoading, router])

  const loadSubscriptionData = async () => {
    if (!user) return

    try {
      const [subData, trialData] = await Promise.all([
        getUserSubscription(user.id),
        checkTrialStatus(user.id)
      ])

      setSubscription(subData.data)
      setTrialStatus(trialData)

      try {
        const res = await fetch('/api/usage/stats', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setUsage(data?.usage || { plans: 0, chats: 0, words: 0 })
        } else {
          setUsage({ plans: 0, chats: 0, words: 0, error: `HTTP ${res.status}` })
        }
      } catch (e) {
        setUsage({ plans: 0, chats: 0, words: 0, error: e })
      }

      // Mock active subscriptions (in real app, fetch from database)
      setActiveSubscriptions([subData.data].filter(Boolean))
    } catch (error) {
      console.error('Error loading subscription data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: string } = {
      gray: 'border-gray-300 dark:border-gray-700',
      blue: 'border-blue-500 dark:border-blue-400',
      purple: 'border-purple-500 dark:border-purple-400',
      gradient: 'border-transparent bg-gradient-to-r from-purple-500 to-blue-500'
    }
    return colors[color] || colors.gray
  }

  const getUsagePercentage = (current: number, limit: number) => {
    return Math.min((current / limit) * 100, 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-orange-500'
    return 'bg-green-500'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải thông tin gói...</p>
        </div>
      </div>
    )
  }

  const currentTier = subscription?.tier || 'free'
  const limits = getSubscriptionLimits(currentTier)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f]">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại Dashboard
          </Link>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quản trị gói</h1>
              <p className="text-gray-600 dark:text-gray-400">Xem và nâng cấp gói của bạn</p>
            </div>
          </div>
        </div>

        {/* Current Subscription Status */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Gói hiện tại</h2>
              <p className="text-gray-600 dark:text-gray-400">Trạng thái và sử dụng của bạn</p>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <Crown className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <span className="font-semibold text-primary-600 dark:text-primary-400">{getTierName(currentTier)}</span>
            </div>
          </div>

          {/* Subscription Period Progress */}
          {subscription && (subscription.current_period_end || trialStatus?.isActive) && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      {currentTier === 'free' ? 'Gói dùng thử' : 'Thời hạn gói'}
                    </p>
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                      {currentTier === 'free' && trialStatus?.isActive
                        ? `${trialStatus.daysRemaining} ngày còn lại`
                        : subscription?.current_period_end
                        ? `${Math.ceil((new Date(subscription.current_period_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} ngày còn lại`
                        : '30 ngày'}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="relative">
                    <div className="w-full bg-blue-200 dark:bg-blue-900/40 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 dark:bg-blue-400 h-2.5 rounded-full transition-all"
                        style={{
                          width: `${currentTier === 'free' && trialStatus?.isActive
                            ? ((30 - trialStatus.daysRemaining) / 30) * 100
                            : subscription?.current_period_end
                            ? ((30 - Math.ceil((new Date(subscription.current_period_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) / 30) * 100
                            : 0}%`
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-blue-700 dark:text-blue-300">
                      <span>Ngày bắt đầu</span>
                      <span>
                        {currentTier === 'free' && trialStatus?.isActive
                          ? `${30 - trialStatus.daysRemaining}/30 ngày đã qua`
                          : subscription?.current_period_end
                          ? `${30 - Math.ceil((new Date(subscription.current_period_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}/30 ngày đã qua`
                          : '0/30 ngày'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upgrade banner when near limits (only show at 90%+) */}
          {(getUsagePercentage(usage?.plans || 0, limits.plans) >= 90 ||
            getUsagePercentage(usage?.chats || 0, limits.chats) >= 90) && (
            <UpgradePrompt
              variant="banner"
              trigger="quota_warning"
              currentUsage={{ chats: usage?.chats || 0, plans: usage?.plans || 0 }}
              limits={{ chats: limits.chats, plans: limits.plans }}
              className="mb-6"
            />
          )}

          {/* Usage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <UsageProgressBar
                current={usage?.plans || 0}
                limit={limits.plans}
                label="Kế hoạch"
                color="blue"
                showUpgradePrompt
                onUpgradeClick={() => router.push('/pricing')}
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <UsageProgressBar
                current={usage?.chats || 0}
                limit={limits.chats}
                label="Tin nhắn"
                color="green"
                showUpgradePrompt
                onUpgradeClick={() => router.push('/pricing')}
              />
            </div>
          </div>
        </div>

        {/* Available Plans */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Các gói có sẵn</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Chọn gói phù hợp với nhu cầu của bạn</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pricingTiers.map((tier) => {
              const isCurrentTier = currentTier === tier.id
              
              return (
                <div
                  key={tier.id}
                  className={`relative bg-white dark:bg-[#1a1a1a] rounded-xl border-2 ${
                    tier.popular ? 'border-purple-500 dark:border-purple-400' : getColorClasses(tier.color)
                  } p-6 ${tier.popular ? 'shadow-lg' : ''}`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        PHỔ BIẾN
                      </span>
                    </div>
                  )}

                  {isCurrentTier && (
                    <div className="absolute -top-3 right-4">
                      <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>ĐANG DÙNG</span>
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{tier.name}</h3>
                    <div className="mb-2">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        {tier.price === 0 ? 'Miễn phí' : `${tier.price.toLocaleString()}đ`}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{tier.duration}</p>
                  </div>

                  <div className="space-y-2 mb-6">
                    {tier.detailedFeatures.map((feature, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 text-left">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {isCurrentTier ? (
                    <button
                      disabled
                      className="w-full py-3 bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg font-semibold cursor-not-allowed"
                    >
                      Gói hiện tại
                    </button>
                  ) : tier.id === 'free' ? (
                    <button
                      disabled
                      className="w-full py-3 bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg font-semibold cursor-not-allowed"
                    >
                      Chỉ dùng 1 lần
                    </button>
                  ) : (
                    <Link
                      href={`/pricing?plan=${tier.id}`}
                      className={`block w-full py-3 text-center rounded-lg font-semibold transition-colors ${
                        tier.popular
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                          : 'bg-primary-600 hover:bg-primary-700 text-white'
                      }`}
                    >
                      Nâng cấp ngay
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Combo Packages Info */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Mua nhiều gói để tăng quota
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Bạn có thể mua thêm nhiều gói khác nhau để cộng dồn quota. Ví dụ: <strong>Gói 1 + Gói 2</strong> sẽ cho bạn:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">3 kế hoạch</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">1 + 2 = 3 plans</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">140 tin nhắn</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">40 + 100 = 140 chats</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">100,000+ từ</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mỗi bản kế hoạch đều siêu chuyên sâu (không giới hạn số từ)</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                💡 <strong>Mẹo:</strong> Mua combo gói để tiết kiệm và có quota dồi dào hơn!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
