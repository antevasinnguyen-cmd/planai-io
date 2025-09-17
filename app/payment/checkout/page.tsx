'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, CreditCard, Shield, Check } from 'lucide-react'
import { getCurrentUser, getUserProfile } from '@/lib/supabase'

const plans = {
  basic: {
    name: 'Gói 1',
    price: 169000,
    features: ['30 Chat với AI', '1 Ebook plan (5-8k từ)', 'Xuất PDF/Word/Docs', 'Phân tích tâm linh']
  },
  pro: {
    name: 'Gói 2 - Pro',
    price: 289000,
    features: ['70 Chat với AI', '3 Ebook plan (9-12k từ)', 'Xuất PDF/Word/Docs', 'Phân tích tâm linh', 'Blog trả phí']
  },
  pro_max: {
    name: 'Gói 3 - Pro Max',
    price: 499000,
    features: ['150 Chat với AI', '6 Ebook plan (15-20k từ)', 'Xuất PDF/Word/Docs', 'Phân tích tâm linh', 'Blog trả phí', 'Hỗ trợ 24/7']
  }
}

export default function CheckoutPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('sepay')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    initializeCheckout()
  }, [])

  const initializeCheckout = async () => {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      router.push('/login')
      return
    }

    setUser(currentUser)
    
    const { data: profileData } = await getUserProfile(currentUser.id)
    if (profileData) {
      setProfile(profileData)
    }

    const planId = searchParams.get('plan')
    if (planId && plans[planId as keyof typeof plans]) {
      setSelectedPlan({ id: planId, ...plans[planId as keyof typeof plans] })
    } else {
      router.push('/pricing')
      return
    }

    setIsLoading(false)
  }

  const handlePayment = async () => {
    if (!selectedPlan || !user) return

    setIsProcessing(true)

    try {
      // Tạo payment request với SePay
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          amount: selectedPlan.price,
          userId: user.id,
          paymentMethod
        })
      })

      const data = await response.json()

      if (data.success) {
        // Redirect to SePay payment page
        window.location.href = data.paymentUrl
      } else {
        alert('Có lỗi xảy ra khi tạo thanh toán. Vui lòng thử lại.')
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Có lỗi xảy ra. Vui lòng thử lại sau.')
    }

    setIsProcessing(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin thanh toán...</p>
        </div>
      </div>
    )
  }

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy gói dịch vụ</h2>
          <button
            onClick={() => router.push('/pricing')}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700"
          >
            Quay về Pricing
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Quay lại
          </button>
          
          <h1 className="text-2xl font-bold text-gray-900">Thanh toán</h1>
          
          <div></div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Thông tin đơn hàng</h2>
            
            <div className="border-2 border-primary-200 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{selectedPlan.name}</h3>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-600">
                    {selectedPlan.price.toLocaleString()} VNĐ
                  </div>
                  <div className="text-sm text-gray-500">Thanh toán 1 lần</div>
                </div>
              </div>
              
              <div className="space-y-2">
                {selectedPlan.features.map((feature: string, index: number) => (
                  <div key={index} className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* User Info */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Thông tin khách hàng</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Email:</span>
                  <span className="ml-2 text-gray-900">{user?.email}</span>
                </div>
                {profile?.full_name && (
                  <div>
                    <span className="text-gray-500">Họ tên:</span>
                    <span className="ml-2 text-gray-900">{profile.full_name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Total */}
            <div className="border-t pt-6 mt-6">
              <div className="flex items-center justify-between text-xl font-bold">
                <span>Tổng cộng:</span>
                <span className="text-primary-600">{selectedPlan.price.toLocaleString()} VNĐ</span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Phương thức thanh toán</h2>
            
            {/* Payment Methods */}
            <div className="space-y-4 mb-8">
              <div className="border-2 border-primary-500 rounded-xl p-4 bg-primary-50">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="sepay"
                    name="payment"
                    value="sepay"
                    checked={paymentMethod === 'sepay'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <label htmlFor="sepay" className="ml-3 flex items-center">
                    <CreditCard className="w-5 h-5 text-primary-600 mr-2" />
                    <span className="font-medium text-gray-900">SePay</span>
                  </label>
                </div>
                <p className="text-sm text-gray-600 mt-2 ml-7">
                  Thanh toán qua SePay - An toàn, nhanh chóng, hỗ trợ tất cả ngân hàng Việt Nam
                </p>
              </div>

              <div className="border-2 border-gray-200 rounded-xl p-4 opacity-50">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="momo"
                    name="payment"
                    value="momo"
                    disabled
                    className="w-4 h-4 text-primary-600"
                  />
                  <label htmlFor="momo" className="ml-3 flex items-center">
                    <div className="w-5 h-5 bg-pink-500 rounded mr-2"></div>
                    <span className="font-medium text-gray-500">MoMo (Sắp có)</span>
                  </label>
                </div>
              </div>

              <div className="border-2 border-gray-200 rounded-xl p-4 opacity-50">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="zalopay"
                    name="payment"
                    value="zalopay"
                    disabled
                    className="w-4 h-4 text-primary-600"
                  />
                  <label htmlFor="zalopay" className="ml-3 flex items-center">
                    <div className="w-5 h-5 bg-blue-500 rounded mr-2"></div>
                    <span className="font-medium text-gray-500">ZaloPay (Sắp có)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8">
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">Thanh toán được bảo mật 100%</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Thông tin thanh toán được mã hóa SSL 256-bit và tuân thủ tiêu chuẩn PCI DSS
              </p>
            </div>

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  Đang xử lý...
                </div>
              ) : (
                `Thanh toán ${selectedPlan.price.toLocaleString()} VNĐ`
              )}
            </button>

            {/* Terms */}
            <p className="text-xs text-gray-500 text-center mt-4">
              Bằng việc thanh toán, bạn đồng ý với{' '}
              <a href="/terms" className="text-primary-600 hover:underline">Điều khoản dịch vụ</a>
              {' '}và{' '}
              <a href="/privacy" className="text-primary-600 hover:underline">Chính sách bảo mật</a>
              {' '}của chúng tôi.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
