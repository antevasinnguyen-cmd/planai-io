'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('=== CALLBACK: Bắt đầu xử lý ===')
        console.log('URL hiện tại:', window.location.href)
        
        // Đợi để đảm bảo Supabase đã xử lý xong
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Lấy thông tin phiên hiện tại
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log('=== CALLBACK: Session result ===', { session, error })
        
        if (session && session.user) {
          console.log('=== CALLBACK: Có session, user:', session.user.email, '===')
          
          // Lưu thông báo thành công
          localStorage.setItem('auth_success', 'true')
          
          // Chuyển hướng đến dashboard
          console.log('=== CALLBACK: Chuyển hướng đến dashboard ===')
          
          // Thử chuyển hướng đến dashboard đơn giản trước
          setTimeout(() => {
            window.location.href = '/dashboard/simple'
          }, 500)
          
        } else {
          console.log('=== CALLBACK: Không có session ===')
          // Thử lấy session từ URL hash
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          console.log('Hash params:', Object.fromEntries(hashParams.entries()))
          
          window.location.replace('/login?error=auth_failed')
        }
      } catch (error) {
        console.error('=== CALLBACK: Lỗi ===', error)
        window.location.replace('/login?error=callback_error')
      }
    }

    handleAuthCallback()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-2xl font-semibold text-gray-800">Đang xử lý đăng nhập...</h2>
        <p className="text-gray-600 mt-2">Vui lòng đợi trong giây lát</p>
        <p className="text-sm text-gray-500 mt-4">Nếu quá lâu, vui lòng thử lại</p>
      </div>
    </div>
  )
}
