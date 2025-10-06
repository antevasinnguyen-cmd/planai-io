'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // Xử lý callback từ OAuth
    const handleAuthCallback = async () => {
      try {
        // Lấy thông tin phiên hiện tại
        const { data: { session } } = await supabase.auth.getSession()
        
        // Nếu đã đăng nhập thành công
        if (session) {
          // Lưu thông báo đăng nhập thành công
          localStorage.setItem('auth_success', 'true')
          
          // Lấy đường dẫn chuyển hướng từ localStorage hoặc mặc định là dashboard
          const redirectPath = localStorage.getItem('auth_redirect') || '/dashboard'
          localStorage.removeItem('auth_redirect') // Xóa sau khi sử dụng
          
          // Chuyển hướng đến trang đích
          router.push(redirectPath)
        } else {
          // Nếu không có phiên, chuyển hướng về trang đăng nhập
          router.push('/login')
        }
      } catch (error) {
        console.error('Lỗi xử lý callback:', error)
        router.push('/login')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-2xl font-semibold text-gray-800">Đang xử lý đăng nhập...</h2>
        <p className="text-gray-600 mt-2">Vui lòng đợi trong giây lát</p>
      </div>
    </div>
  )
}
