'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function AuthCallbackPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const [status, setStatus] = useState<'processing' | 'error'>('processing')

  useEffect(() => {
    // Nếu có lỗi trong URL, hiển thị lỗi
    if (error) {
      console.error('=== CALLBACK PAGE: Error from route handler ===', { error, errorDescription })
      setStatus('error')
      // Redirect sau 3 giây
      const timer = setTimeout(() => {
        window.location.replace('/login')
      }, 3000)
      return () => clearTimeout(timer)
    }

    // Nếu không có lỗi, route handler đã xử lý redirect
    // Page này chỉ hiển thị loading
    console.log('=== CALLBACK PAGE: Processing... ===')
  }, [error, errorDescription])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 px-4">
      {status === 'processing' ? (
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-800">Đang xử lý đăng nhập...</h2>
          <p className="text-gray-600 mt-2">Vui lòng đợi trong giây lát</p>
        </div>
      ) : (
        <div className="text-center max-w-md">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-800">Không thể đăng nhập</h2>
          <p className="text-gray-600 mt-3">
            {errorDescription || error || 'Không thể hoàn tất đăng nhập. Trang sẽ chuyển về màn hình đăng nhập sau ít giây.'}
          </p>
        </div>
      )}
    </div>
  )
}
