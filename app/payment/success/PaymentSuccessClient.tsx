'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface PaymentSuccessClientProps {
  orderId: string
  amount: string
  planId: string
  provider: string
}

export default function PaymentSuccessClient({ orderId, amount, planId, provider }: PaymentSuccessClientProps) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)
  
  useEffect(() => {
    // Đếm ngược và chuyển hướng về trang dashboard
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/dashboard')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-20 h-20 text-green-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Thanh toán thành công!</h1>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-left text-gray-600">Mã đơn hàng:</div>
            <div className="text-right font-medium text-gray-900">{orderId}</div>
            
            <div className="text-left text-gray-600">Số tiền:</div>
            <div className="text-right font-medium text-gray-900">{parseInt(amount || '0').toLocaleString('vi-VN')} VND</div>
            
            <div className="text-left text-gray-600">Gói:</div>
            <div className="text-right font-medium text-gray-900">{planId === 'basic' ? 'Gói 1' : planId === 'pro' ? 'Gói 2' : planId === 'pro_max' ? 'Gói 3' : planId}</div>
            
            <div className="text-left text-gray-600">Phương thức:</div>
            <div className="text-right font-medium text-gray-900">{provider === 'sepay' ? 'VietQR Pro (SePay)' : 'PayOS'}</div>
          </div>
        </div>
        
        <p className="text-gray-600 mb-6">
          Cảm ơn bạn đã sử dụng dịch vụ của PlanAI. Tài khoản của bạn đã được nâng cấp thành công.
        </p>
        
        <div className="flex flex-col space-y-3">
          <Link 
            href="/dashboard" 
            className="bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Quay về Dashboard ({countdown}s)
          </Link>
          
          <Link 
            href="/dashboard/create-plan" 
            className="text-primary-600 py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Tạo kế hoạch mới
          </Link>
        </div>
      </div>
    </div>
  )
}
