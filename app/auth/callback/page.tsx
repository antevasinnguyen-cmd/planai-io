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
        console.log('Hash:', window.location.hash)

        // Kiểm tra hash params (quan trọng cho OAuth callback)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const expiresIn = hashParams.get('expires_in')
        const tokenType = hashParams.get('token_type')
        
        console.log('=== CALLBACK: Hash params ===', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          expiresIn,
          tokenType
        })

        // Đợi để đảm bảo Supabase đã xử lý xong
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Lấy thông tin phiên hiện tại
        const { data: { session }, error } = await supabase.auth.getSession()

        console.log('=== CALLBACK: Session check ===', {
          hasSession: !!session,
          userEmail: session?.user?.email,
          userId: session?.user?.id,
          error: error?.message,
          timestamp: new Date().toISOString()
        })

        if (session && session.user) {
          console.log('=== CALLBACK: Success ===', session.user.email)

          // Lưu thông báo thành công và email người dùng
          localStorage.setItem('auth_success', 'true')
          localStorage.setItem('auth_user_email', session.user.email || '')

          // Lấy đường dẫn chuyển hướng nếu có
          const redirectTo = localStorage.getItem('auth_redirect') || '/dashboard'
          localStorage.removeItem('auth_redirect')

          // Chuyển hướng đến dashboard hoặc đường dẫn được yêu cầu
          console.log(`=== CALLBACK: Redirecting to ${redirectTo} ===`)

          // Sử dụng window.location.replace để đảm bảo chuyển hướng
          window.location.replace(redirectTo)
        } else {
          console.log('=== CALLBACK: No session, checking hash params ===')
          
          // Nếu có access_token trong hash nhưng không có session, thử set session thủ công
          if (accessToken && refreshToken) {
            console.log('=== CALLBACK: Found tokens in hash, setting session ===')
            try {
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              })
              
              if (data.session) {
                console.log('=== CALLBACK: Manual session set success ===')
                localStorage.setItem('auth_success', 'true')
                localStorage.setItem('auth_user_email', data.session.user?.email || '')
                window.location.replace('/dashboard')
                return
              } else {
                console.error('=== CALLBACK: Manual session set failed ===', error)
              }
            } catch (err) {
              console.error('=== CALLBACK: Error setting session ===', err)
            }
          }
          
          // Nếu không có session và không thể set thủ công, chuyển hướng về login
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
