'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Bắt đầu xử lý callback OAuth')
        
        // Đợi một chút để đảm bảo Supabase đã xử lý xong phiên đăng nhập
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Lấy thông tin phiên hiện tại
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          console.log('Đăng nhập thành công:', session.user.email)
          
          // Lưu thông báo đăng nhập thành công
          localStorage.setItem('auth_success', 'true')
          
          // Chuyển hướng đến dashboard
          console.log('Chuyển hướng đến dashboard')
          window.location.replace('/dashboard')
        } else {
          console.log('Không tìm thấy phiên đăng nhập')
          window.location.replace('/login')
        }
      } catch (error) {
        console.error('Lỗi xử lý callback:', error)
        window.location.replace('/login')
      }
    }

    handleAuthCallback()
  }, [])

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
