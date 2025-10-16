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
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    initializeCheckout()
  }, [])

  const initializeCheckout = async () => {
    try {
      const currentUser = await getCurrentUser()
      
      // Nếu chưa đăng nhập => redirect đến login
      if (!currentUser) {
        console.log('User not logged in, redirecting to login')
        router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)
        return
      }
      
      // Nếu có người dùng đăng nhập, sử dụng thông tin của họ
      setUser(currentUser)
      const { data: profileData } = await getUserProfile(currentUser.id)
      setProfile(profileData)
    } catch (error) {
      console.error('Error initializing checkout:', error)
      // Nếu có lỗi, redirect đến login
      router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)
      return
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
    setErrorMessage('') // Xóa thông báo lỗi cũ

    // Thêm timeout để tránh chờ mãi mài
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout: Request took too long')), 15000) // 15 giây timeout
    })

    try {
      // Tạo payment request với SePay hoặc PayOS
      console.log('Sending payment request:', {
        planId: selectedPlan.id,
        amount: selectedPlan.price,
        userId: user.id,
        paymentMethod
      })

      const fetchPromise = fetch('/api/payment/create', {
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

      // Race giữa fetch và timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response
      console.log('Payment API response received')

      const data = await response.json()
      console.log('Payment response data:', data)

      if (data.success) {
        console.log('Payment created successfully, redirecting to:', data.paymentUrl)
        // Redirect to payment page
        window.location.href = data.paymentUrl
      } else {
        // Hiển thị lỗi chi tiết
        console.error('Payment creation error:', data)
        
        // Nếu lỗi với SePay, đề xuất chuyển sang PayOS
        if (paymentMethod === 'sepay') {
          setErrorMessage(`${data.details || data.error || 'Có lỗi xảy ra khi tạo thanh toán.'} Bạn có thể thử phương thức thanh toán PayOS.`)
          setPaymentMethod('payos') // Tự động chuyển sang PayOS
        } else {
          setErrorMessage(data.details || data.error || 'Có lỗi xảy ra khi tạo thanh toán. Vui lòng thử lại sau.')
        }
      }
    } catch (error) {
      console.error('Payment error:', error)
      if (error instanceof Error && error.message.includes('Timeout')) {
        setErrorMessage('Yêu cầu thanh toán đã hết thời gian chờ. Vui lòng thử lại sau.')
      } else {
        setErrorMessage('Có lỗi xảy ra khi kết nối với hệ thống thanh toán. Vui lòng thử lại sau.')
      }
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
            <h2 className="text-xl font-bold text-gray-900 mb-6">Tóm tắt đơn hàng</h2>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">{selectedPlan.name}</span>
                <span className="font-semibold">{selectedPlan.price.toLocaleString('vi-VN')} VND</span>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng cộng</span>
                  <span className="text-primary-600">{selectedPlan.price.toLocaleString('vi-VN')} VND</span>
                </div>
              </div>
            </div>

            {/* Plan Features */}
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Bao gồm:</h3>
              <ul className="space-y-2">
                {selectedPlan.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Thông tin thanh toán</h2>

            {/* Payment Method */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Phương thức thanh toán
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="sepay"
                    checked={paymentMethod === 'sepay'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-3 flex items-center">
                    <CreditCard className="w-5 h-5 text-gray-700 mr-2" />
                    <span className="text-gray-700">SePay</span>
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="payos"
                    checked={paymentMethod === 'payos'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-3 flex items-center">
                    <CreditCard className="w-5 h-5 text-gray-700 mr-2" />
                    <span className="text-gray-700">PayOS</span>
                  </span>
                </label>
              </div>
            </div>

            {/* User Info */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Thông tin khách hàng</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Email:</strong> {user?.email}</p>
                {profile && (
                  <>
                    <p><strong>Họ tên:</strong> {profile.full_name || 'Chưa cập nhật'}</p>
                  </>
                )}
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{errorMessage}</p>
              </div>
            )}
            
            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full bg-primary-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Thanh toán {selectedPlan.price.toLocaleString('vi-VN')} VND
                </>
              )}
            </button>

            {/* Security Notice */}
            <div className="mt-6 flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Shield className="w-4 h-4 text-green-500 mr-2" />
              Thanh toán được bảo mật bởi SePay/PayOS
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
