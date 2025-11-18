'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface PaymentSuccessClientProps {
  orderId: string
  amount: string
  planId: string
  provider: string
}

const PLAN_INFO = {
  basic: { name: 'Gói 1', price: 169000 },
  pro: { name: 'Gói 2 - Pro', price: 289000 },
  pro_max: { name: 'Gói 3 - Pro Max', price: 499000 }
}

export default function PaymentSuccessClient({ orderId, amount, planId, provider }: PaymentSuccessClientProps) {
  const router = useRouter()
  
  const planInfo = PLAN_INFO[planId as keyof typeof PLAN_INFO] || { name: planId, price: parseInt(amount || '0') }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/pricing')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Quay lại</span>
          </button>
        </div>

        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-green-600 mb-3">Thanh toán thành công</h1>
          
          {/* Subtitle */}
          <p className="text-gray-600 mb-8 text-lg">
            Đơn hàng của bạn đã được thanh toán thành công.
          </p>

          {/* Plan Details */}
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 mb-8 border border-green-200">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Gói đã mua</p>
                <p className="text-2xl font-bold text-gray-900">{planInfo.name}</p>
              </div>
              
              <div className="border-t border-green-200 pt-4">
                <p className="text-sm text-gray-600 mb-1">Số tiền thanh toán</p>
                <p className="text-3xl font-bold text-green-600">
                  {parseInt(amount || '0').toLocaleString('vi-VN')} VND
                </p>
              </div>

              <div className="border-t border-green-200 pt-4 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Mã đơn hàng:</span>
                  <span className="font-medium text-gray-900">{orderId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Phương thức:</span>
                  <span className="font-medium text-gray-900">
                    {provider === 'sepay' ? 'VietQR Pro (SePay)' : 'PayOS (VietQR)'}
                  </span>
                </div>
              </div>
            </div>
          </div>


          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg shadow-md"
            >
              Vào Dashboard
            </button>
            
            <Link
              href="/dashboard/create-plan"
              className="w-full bg-gray-100 text-gray-900 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-semibold text-center"
            >
              Tạo kế hoạch mới
            </Link>
          </div>

          {/* Footer */}
          <p className="text-xs text-gray-500 mt-6">
            Cảm ơn bạn đã tin tưởng PlanAI. Nếu có vấn đề, vui lòng liên hệ support@planai.io.vn
          </p>
        </div>
      </div>
    </div>
  )
}
