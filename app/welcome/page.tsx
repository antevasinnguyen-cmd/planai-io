'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  CheckCircle, ArrowRight, MessageCircle, FileText, 
  Star, Gift, Clock, TrendingUp, Zap 
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function WelcomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login')
      } else {
        setIsLoading(false)
      }
    }
  }, [user, authLoading, router])

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
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎉 Chào mừng bạn đến với PlanAI!
          </h1>
          
          <p className="text-xl text-gray-600 mb-2">
            Tài khoản của bạn đã được tạo thành công
          </p>
          
          <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
            <Gift className="w-4 h-4 mr-2" />
            Bạn đã nhận được gói Free với 5 chat và 1 kế hoạch
          </div>
        </div>

        {/* Quick Start Guide */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Bắt đầu trong 3 bước đơn giản
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Chat với AI</h3>
              <p className="text-gray-600 text-sm">
                Chia sẻ mục tiêu tài chính và tình hình hiện tại của bạn
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">2. Nhận kế hoạch</h3>
              <p className="text-gray-600 text-sm">
                AI tạo kế hoạch tài chính cá nhân hóa cho bạn
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Thực hiện</h3>
              <p className="text-gray-600 text-sm">
                Theo dõi tiến độ và đạt được mục tiêu tài chính
              </p>
            </div>
          </div>
        </div>

        {/* Free Plan Benefits */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Gói Free của bạn</h3>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              Đang hoạt động
            </span>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">5</div>
              <div className="text-sm text-gray-600">Chat với AI</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">1</div>
              <div className="text-sm text-gray-600">Kế hoạch ngắn</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">1K</div>
              <div className="text-sm text-gray-600">Từ phân tích</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-start space-x-3">
              <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900 mb-1">Muốn nhiều hơn?</div>
                <div className="text-sm text-gray-600 mb-3">
                  Nâng cấp để có 40-160 chat, 1-6 kế hoạch chi tiết và tính năng cao cấp
                </div>
                <Link
                  href="/pricing"
                  className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Xem gói nâng cấp
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Link
            href="/dashboard/chat"
            className="bg-blue-600 text-white p-6 rounded-2xl hover:bg-blue-700 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Bắt đầu Chat AI</h3>
                <p className="text-blue-100 text-sm">
                  Chia sẻ mục tiêu tài chính của bạn ngay
                </p>
              </div>
              <MessageCircle className="w-8 h-8 group-hover:scale-110 transition-transform" />
            </div>
          </Link>
          
          <Link
            href="/dashboard/plans/create"
            className="bg-green-600 text-white p-6 rounded-2xl hover:bg-green-700 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Tạo kế hoạch</h3>
                <p className="text-green-100 text-sm">
                  Tạo kế hoạch tài chính đầu tiên
                </p>
              </div>
              <FileText className="w-8 h-8 group-hover:scale-110 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Social Proof */}
        <div className="text-center">
          <div className="flex justify-center items-center space-x-1 mb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
            ))}
          </div>
          <p className="text-gray-600 text-sm">
            Được tin tưởng bởi 5,000+ người dùng đã tạo kế hoạch tài chính thành công
          </p>
        </div>

        {/* Skip to Dashboard */}
        <div className="text-center mt-8">
          <Link
            href="/dashboard"
            className="text-gray-600 hover:text-gray-800 text-sm underline"
          >
            Bỏ qua và đi đến Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
