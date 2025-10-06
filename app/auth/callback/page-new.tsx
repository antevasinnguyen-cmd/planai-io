'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-new'

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('=== CALLBACK-NEW: Bắt đầu xử lý ===')
        console.log('URL hiện tại:', window.location.href)
        console.log('Pathname hiện tại:', window.location.pathname)
        console.log('Hash hiện tại:', window.location.hash)
        
        // Xóa các cache cũ có thể gây xung đột
        localStorage.removeItem('auth_callback_url')
        localStorage.removeItem('auth_redirect')
        
        // Đợi để đảm bảo Supabase đã xử lý xong
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Lấy thông tin phiên hiện tại
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log('=== CALLBACK-NEW: Kiểm tra phiên ===', {
          hasSession: !!session,
          userEmail: session?.user?.email,
          error,
          timestamp: new Date().toISOString()
        })
        
        if (session && session.user) {
          console.log('=== CALLBACK-NEW: Đăng nhập thành công ===', session.user.email)
          
          // Lưu thông báo thành công
          localStorage.setItem('auth_success', 'true')
          
          // Chuyển hướng đến dashboard
          console.log('=== CALLBACK-NEW: Chuyển hướng đến dashboard ===')
          
          // Sử dụng window.location.replace để tránh lưu lịch sử
          window.location.replace('/dashboard')
          
        } else {
          console.log('=== CALLBACK-NEW: Không có phiên, kiểm tra hash ===')
          
          // Thử lấy session từ URL hash
          if (window.location.hash) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1))
            console.log('Hash params:', Object.fromEntries(hashParams.entries()))
            
            // Thử làm mới phiên
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
            
            console.log('=== CALLBACK-NEW: Sau khi làm mới phiên ===', {
              hasSession: !!refreshData.session,
              userEmail: refreshData.session?.user?.email,
              error: refreshError
            })
            
            if (refreshData.session) {
              // Lưu thông báo thành công
              localStorage.setItem('auth_success', 'true')
              
              // Chuyển hướng đến dashboard
              window.location.replace('/dashboard')
              return
            }
          }
          
          // Nếu không có phiên và không thể làm mới, chuyển hướng đến trang đăng nhập
          setError('Không thể xác thực. Vui lòng thử lại.')
          setTimeout(() => {
            window.location.replace('/login?error=no_session')
          }, 2000)
        }
      } catch (error) {
        console.error('=== CALLBACK-NEW: Lỗi ===', error)
        setError('Đã xảy ra lỗi khi xử lý đăng nhập.')
        setTimeout(() => {
          window.location.replace('/login?error=callback_error')
        }, 2000)
      } finally {
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        {loading ? (
          <>
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-2xl font-semibold text-gray-800">Đang xử lý đăng nhập...</h2>
            <p className="text-gray-600 mt-2">Vui lòng đợi trong giây lát</p>
          </>
        ) : error ? (
          <>
            <div className="w-16 h-16 text-red-500 mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">Đăng nhập thất bại</h2>
            <p className="text-red-600 mt-2">{error}</p>
            <p className="text-gray-500 mt-4">Đang chuyển hướng về trang đăng nhập...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 text-green-500 mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">Đăng nhập thành công!</h2>
            <p className="text-gray-600 mt-2">Đang chuyển hướng đến trang quản trị...</p>
          </>
        )}
      </div>
    </div>
  )
}
