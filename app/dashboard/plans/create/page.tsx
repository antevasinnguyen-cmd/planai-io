'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  full_name: string
  age: number
  occupation: string
  current_income: number
  financial_goal: string
  timeline: string
  risk_tolerance: string
  birth_date?: string
}

export default function CreatePlanPage() {
  const [profile, setProfile] = useState<UserProfile>({
    full_name: '',
    age: 25,
    occupation: '',
    current_income: 0,
    financial_goal: '',
    timeline: '',
    risk_tolerance: 'medium'
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [usage, setUsage] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    loadUserProfile()
    checkUsageLimits()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUser(user)
  }

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          age: data.age || 25,
          occupation: data.occupation || '',
          current_income: data.current_income || 0,
          financial_goal: data.financial_goal || '',
          timeline: data.timeline || '',
          risk_tolerance: data.risk_tolerance || 'medium',
          birth_date: data.birth_date
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const checkUsageLimits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get subscription
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      setSubscription(subData)

      // Check usage
      const response = await fetch('/api/check-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'plan' })
      })

      if (response.ok) {
        const usageData = await response.json()
        setUsage(usageData)
        
        if (!usageData.allowed) {
          alert('Bạn đã đạt giới hạn tạo kế hoạch trong tháng này. Hãy nâng cấp gói để tiếp tục.')
          router.push('/dashboard/plans')
        }
      }
    } catch (error) {
      console.error('Error checking usage:', error)
    }
  }

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const generatePlan = async () => {
    if (!profile.full_name || !profile.occupation || !profile.financial_goal) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    setIsGenerating(true)

    try {
      // Update profile first
      await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          age: profile.age,
          occupation: profile.occupation,
          current_income: profile.current_income,
          financial_goal: profile.financial_goal,
          timeline: profile.timeline,
          risk_tolerance: profile.risk_tolerance
        })
        .eq('id', user.id)

      // Generate plan
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          alert(data.message || 'Đã đạt giới hạn tạo kế hoạch')
          router.push('/dashboard/plans')
          return
        }
        throw new Error(data.error || 'Failed to generate plan')
      }

      // Redirect to the generated plan
      router.push(`/dashboard/plans/${data.plan[0].id}`)

    } catch (error) {
      console.error('Error generating plan:', error)
      alert('Có lỗi xảy ra khi tạo kế hoạch. Vui lòng thử lại.')
    } finally {
      setIsGenerating(false)
    }
  }

  const getSubscriptionLimits = (tier: string) => {
    const limits = {
      'free': { plans: 1, chats: 5, words: 1000 },
      'basic': { plans: 2, chats: 20, words: 2000 },   // Gói 1: 2 plans
      'pro': { plans: 4, chats: 50, words: 5000 },     // Gói 2: 4 plans
      'pro_max': { plans: 6, chats: 999999, words: 10000 }
    }
    return limits[tier as keyof typeof limits] || limits.free
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

  const tier = subscription?.tier || 'free'
  const limits = getSubscriptionLimits(tier)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tạo Kế Hoạch Tài Chính AI</h1>
              <p className="text-gray-600 mt-1">AI sẽ tạo kế hoạch tài chính cá nhân hóa dựa trên thông tin của bạn</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-blue-600">{getTierName(tier)}</div>
              <div className="text-xs text-gray-500">Tối đa {limits.words.toLocaleString()} từ</div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cá nhân</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    value={profile.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tuổi *
                  </label>
                  <input
                    type="number"
                    value={profile.age}
                    onChange={(e) => handleInputChange('age', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="18"
                    max="100"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nghề nghiệp *
                  </label>
                  <input
                    type="text"
                    value={profile.occupation}
                    onChange={(e) => handleInputChange('occupation', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Kỹ sư phần mềm"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thu nhập hàng tháng (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={profile.current_income}
                    onChange={(e) => handleInputChange('current_income', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="15000000"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Financial Goals */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mục tiêu tài chính</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mục tiêu chính *
                  </label>
                  <textarea
                    value={profile.financial_goal}
                    onChange={(e) => handleInputChange('financial_goal', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Ví dụ: Mua nhà 3 tỷ trong 5 năm, tích lũy 500 triệu cho con học đại học..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thời gian thực hiện
                  </label>
                  <select
                    value={profile.timeline}
                    onChange={(e) => handleInputChange('timeline', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Chọn thời gian</option>
                    <option value="1-2 năm">1-2 năm</option>
                    <option value="3-5 năm">3-5 năm</option>
                    <option value="5-10 năm">5-10 năm</option>
                    <option value="Trên 10 năm">Trên 10 năm</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mức độ chấp nhận rủi ro
                  </label>
                  <select
                    value={profile.risk_tolerance}
                    onChange={(e) => handleInputChange('risk_tolerance', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Thấp - Ưu tiên an toàn</option>
                    <option value="medium">Trung bình - Cân bằng</option>
                    <option value="high">Cao - Chấp nhận rủi ro để có lợi nhuận cao</option>
                  </select>
                </div>
              </div>
            </div>

            {/* AI Generation Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="text-blue-600 mr-3 mt-1">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">AI sẽ tạo kế hoạch tài chính cho bạn</h4>
                  <p className="text-blue-800 text-sm">
                    Dựa trên thông tin bạn cung cấp, AI sẽ tạo một kế hoạch tài chính chi tiết với:
                  </p>
                  <ul className="text-blue-800 text-sm mt-2 space-y-1">
                    <li>• Phân tích tình hình tài chính hiện tại</li>
                    <li>• Lộ trình đầu tư và tiết kiệm cụ thể</li>
                    <li>• Checklist hành động hàng ngày/tuần/tháng</li>
                    <li>• Tài liệu học tập và nguồn tham khảo</li>
                    <li>• Tối đa {limits.words.toLocaleString()} từ cho gói {getTierName(tier)}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => router.back()}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Quay lại
              </button>
              
              <button
                onClick={generatePlan}
                disabled={isGenerating || !profile.full_name || !profile.occupation || !profile.financial_goal}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Đang tạo kế hoạch...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Tạo Kế Hoạch AI
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Examples */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Ví dụ mục tiêu tài chính</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleInputChange('financial_goal', 'Mua nhà 3 tỷ trong 5 năm tại TP.HCM')}
              className="text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-gray-900">🏠 Mua nhà</div>
              <div className="text-sm text-gray-600">Mua nhà 3 tỷ trong 5 năm tại TP.HCM</div>
            </button>
            
            <button
              onClick={() => handleInputChange('financial_goal', 'Tích lũy 500 triệu cho con học đại học trong 15 năm')}
              className="text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-gray-900">🎓 Học phí con</div>
              <div className="text-sm text-gray-600">Tích lũy 500 triệu cho con học đại học trong 15 năm</div>
            </button>
            
            <button
              onClick={() => handleInputChange('financial_goal', 'Nghỉ hưu sớm ở tuổi 45 với 5 tỷ đồng')}
              className="text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-gray-900">🏖️ Nghỉ hưu sớm</div>
              <div className="text-sm text-gray-600">Nghỉ hưu sớm ở tuổi 45 với 5 tỷ đồng</div>
            </button>
            
            <button
              onClick={() => handleInputChange('financial_goal', 'Tạo thu nhập thụ động 20 triệu/tháng từ đầu tư')}
              className="text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-gray-900">💰 Thu nhập thụ động</div>
              <div className="text-sm text-gray-600">Tạo thu nhập thụ động 20 triệu/tháng từ đầu tư</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
