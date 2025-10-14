'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { XCircle } from 'lucide-react'
import Link from 'next/link'

export default function PaymentCancelClient() {
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
          <XCircle className="w-20 h-20 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Thanh toán đã bị hủy</h1>
        
        <p className="text-gray-600 mb-6">
          Bạn đã hủy quá trình thanh toán. Nếu bạn gặp vấn đề khi thanh toán hoặc cần hỗ trợ, vui lòng liên hệ với chúng tôi.
        </p>
        
        <div className="flex flex-col space-y-3">
          <Link 
            href="/dashboard" 
            className="bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Quay về Dashboard ({countdown}s)
          </Link>
          
          <Link 
            href="/pricing" 
            className="text-primary-600 py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Xem lại các gói dịch vụ
          </Link>
        </div>
      </div>
    </div>
  )
}
