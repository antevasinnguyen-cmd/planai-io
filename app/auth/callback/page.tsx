'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('=== CALLBACK: Starting ===')
        console.log('Current URL:', window.location.href)
        console.log('Current path:', window.location.pathname)

        // Đợi để đảm bảo Supabase đã xử lý xong
        await new Promise(resolve => setTimeout(resolve, 3000))

        // Lấy thông tin phiên hiện tại
        const { data: { session }, error } = await supabase.auth.getSession()

        console.log('=== CALLBACK: Session check ===', {
          hasSession: !!session,
          userEmail: session?.user?.email,
          error,
          timestamp: new Date().toISOString()
        })

        if (session && session.user) {
          console.log('=== CALLBACK: Success ===', session.user.email)

          // Lưu thông báo thành công
          localStorage.setItem('auth_success', 'true')
          localStorage.setItem('auth_user_email', session.user.email || '')

          // Chuyển hướng đến dashboard chính
          console.log('=== CALLBACK: Redirecting to main dashboard ===')

          // Sử dụng window.location.href để đảm bảo chuyển hướng
          window.location.href = '/dashboard'

        } else {
          console.log('=== CALLBACK: No session, redirecting to login ===')
          // Kiểm tra hash params
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          console.log('Hash params:', Object.fromEntries(hashParams.entries()))

          window.location.replace('/login?error=no_session')
        }
      } catch (error) {
        console.error('=== CALLBACK: Error ===', error)
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
        <p className="text-sm text-gray-500 mt-4">
          Nếu quá lâu, vui lòng thử lại hoặc kiểm tra console để debug
        </p>
      </div>
    </div>
  )
}
