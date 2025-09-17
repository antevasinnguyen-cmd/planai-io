'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, ArrowRight, Target, Clock, DollarSign, User, MapPin, Briefcase } from 'lucide-react'
import { getCurrentUser, createUserProfile, updateUserProfile } from '@/lib/supabase'
import { OnboardingData } from '@/types'

export default function StartPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    step: 1,
    financial_goal: '',
    timeline: '',
    current_income: 0,
    age: 25,
    occupation: '',
    location: '',
    risk_tolerance: 'medium'
  })
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      router.push('/login')
      return
    }
    setUser(currentUser)
    setIsLoading(false)
  }

  const handleInputChange = (field: string, value: any) => {
    setOnboardingData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
      setOnboardingData(prev => ({
        ...prev,
        step: currentStep + 1
      }))
    } else {
      completeOnboarding()
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setOnboardingData(prev => ({
        ...prev,
        step: currentStep - 1
      }))
    }
  }

  const completeOnboarding = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      await updateUserProfile(user.id, {
        financial_goal: onboardingData.financial_goal,
        target_amount: onboardingData.target_amount,
        timeline: onboardingData.timeline,
        current_income: onboardingData.current_income,
        age: onboardingData.age,
        occupation: onboardingData.occupation,
        location: onboardingData.location,
        risk_tolerance: onboardingData.risk_tolerance
      })
      
      router.push('/dashboard')
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Thiết lập kế hoạch tài chính</h1>
            <span className="text-sm text-gray-600">Bước {currentStep}/3</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
          {/* Step 1: Basic Goals */}
          {currentStep === 1 && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Mục tiêu tài chính của bạn là gì?
                </h2>
                <p className="text-gray-600">
                  Hãy chia sẻ những gì bạn muốn đạt được về mặt tài chính
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Mô tả mục tiêu tài chính của bạn
                  </label>
                  <textarea
                    value={onboardingData.financial_goal}
                    onChange={(e) => handleInputChange('financial_goal', e.target.value)}
                    placeholder="Ví dụ: Tôi muốn có 2 tỷ VNĐ trước 30 tuổi để mua nhà và khởi nghiệp kinh doanh"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={4}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Số tiền mục tiêu (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={onboardingData.target_amount || ''}
                      onChange={(e) => handleInputChange('target_amount', parseInt(e.target.value))}
                      placeholder="2000000000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Thời gian thực hiện
                    </label>
                    <select
                      value={onboardingData.timeline}
                      onChange={(e) => handleInputChange('timeline', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Chọn thời gian</option>
                      <option value="1 năm">1 năm</option>
                      <option value="2 năm">2 năm</option>
                      <option value="3 năm">3 năm</option>
                      <option value="5 năm">5 năm</option>
                      <option value="10 năm">10 năm</option>
                      <option value="Dài hạn (>10 năm)">Dài hạn (&gt;10 năm)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Financial Situation */}
          {currentStep === 2 && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Tình hình tài chính hiện tại
                </h2>
                <p className="text-gray-600">
                  Thông tin này giúp AI tạo kế hoạch phù hợp với khả năng của bạn
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Thu nhập hiện tại (VNĐ/tháng)
                  </label>
                  <input
                    type="number"
                    value={onboardingData.current_income}
                    onChange={(e) => handleInputChange('current_income', parseInt(e.target.value))}
                    placeholder="15000000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Độ tuổi
                  </label>
                  <input
                    type="number"
                    value={onboardingData.age}
                    onChange={(e) => handleInputChange('age', parseInt(e.target.value))}
                    placeholder="25"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Nghề nghiệp
                  </label>
                  <input
                    type="text"
                    value={onboardingData.occupation}
                    onChange={(e) => handleInputChange('occupation', e.target.value)}
                    placeholder="Nhân viên IT"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Khu vực sinh sống
                  </label>
                  <select
                    value={onboardingData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Chọn khu vực</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="TP.HCM">TP.HCM</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Bắc Ninh">Bắc Ninh</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Mức độ chấp nhận rủi ro
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'low', label: 'Thấp', desc: 'An toàn, ổn định' },
                    { value: 'medium', label: 'Trung bình', desc: 'Cân bằng rủi ro-lợi nhuận' },
                    { value: 'high', label: 'Cao', desc: 'Chấp nhận rủi ro cao để có lợi nhuận lớn' }
                  ].map((risk) => (
                    <button
                      key={risk.value}
                      onClick={() => handleInputChange('risk_tolerance', risk.value)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        onboardingData.risk_tolerance === risk.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{risk.label}</div>
                      <div className="text-sm text-gray-600 mt-1">{risk.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Xác nhận thông tin
                </h2>
                <p className="text-gray-600">
                  Kiểm tra lại thông tin trước khi bắt đầu tạo kế hoạch
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Mục tiêu tài chính:</span>
                    <p className="text-gray-900 mt-1">{onboardingData.financial_goal}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Thời gian:</span>
                    <p className="text-gray-900 mt-1">{onboardingData.timeline}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Thu nhập hiện tại:</span>
                    <p className="text-gray-900 mt-1">{onboardingData.current_income?.toLocaleString()} VNĐ/tháng</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Tuổi:</span>
                    <p className="text-gray-900 mt-1">{onboardingData.age} tuổi</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Nghề nghiệp:</span>
                    <p className="text-gray-900 mt-1">{onboardingData.occupation}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Khu vực:</span>
                    <p className="text-gray-900 mt-1">{onboardingData.location}</p>
                  </div>
                </div>
              </div>

              <div className="bg-primary-50 rounded-2xl p-6">
                <h3 className="font-semibold text-primary-900 mb-2">Bước tiếp theo</h3>
                <p className="text-primary-700">
                  Sau khi xác nhận, bạn sẽ được chuyển đến dashboard để bắt đầu chat với AI và tạo kế hoạch tài chính cá nhân hóa.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-12">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Quay lại
            </button>

            <button
              onClick={nextStep}
              disabled={
                (currentStep === 1 && (!onboardingData.financial_goal || !onboardingData.timeline)) ||
                (currentStep === 2 && (!onboardingData.current_income || !onboardingData.occupation))
              }
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
            >
              {currentStep === 3 ? 'Bắt đầu tạo kế hoạch' : 'Tiếp tục'}
              <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
