'use client'

import { useEffect, useState } from 'react'
import { supabase, initializeFreeTrialForNewUser } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'processing' | 'error'>('processing')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const recordFailure = (message: string, details: Record<string, unknown> = {}) => {
      const payload = {
        message,
        details,
        timestamp: new Date().toISOString()
      }
      console.error('=== CALLBACK: Failure ===', payload)
      try {
        localStorage.setItem('auth_callback_debug', JSON.stringify(payload))
      } catch (storageError) {
        console.error('=== CALLBACK: Unable to store debug info ===', storageError)
      }
      setErrorMessage(message)
      setStatus('error')
      setTimeout(() => {
        window.location.replace('/login?error=callback_error')
      }, 4000)
    }

    const handleAuthCallback = async () => {
      try {
        console.log('=== CALLBACK: Starting ===')
        console.log('Current URL:', window.location.href)
        console.log('Current path:', window.location.pathname)
        console.log('Hash:', window.location.hash)

        const searchParams = new URLSearchParams(window.location.search)
        const code = searchParams.get('code')
        const state = searchParams.get('state')

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

        if (code) {
          try {
            console.log('=== CALLBACK: Found PKCE code, exchanging for session ===', { hasCode: !!code, state })
            const { data, error } = await supabase.auth.exchangeCodeForSession({ code })
            if (error) {
              recordFailure('Không thể hoàn tất xác thực với Google.', {
                step: 'exchangeCodeForSession',
                error: error.message,
                code,
                state
              })
              return
            }
            console.log('=== CALLBACK: exchangeCodeForSession success ===', { userId: data?.user?.id })
          } catch (exchangeError) {
            recordFailure('Gặp lỗi khi xử lý mã đăng nhập từ Google.', {
              step: 'exchangeCodeForSession_catch',
              error: exchangeError instanceof Error ? exchangeError.message : String(exchangeError),
              code,
              state
            })
            return
          }
        } else {
          // Đợi để đảm bảo Supabase đã xử lý xong
          await new Promise(resolve => setTimeout(resolve, 500))
        }

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

          // Initialize free trial for new users
          try {
            const trialResult = await initializeFreeTrialForNewUser(session.user.id)
            if (trialResult.alreadyUsed) {
              console.log('=== CALLBACK: User already had free trial ===')
            } else if (trialResult.data) {
              console.log('=== CALLBACK: Free trial initialized ===')
            }
          } catch (error) {
            console.error('=== CALLBACK: Error initializing trial ===', error)
          }

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
          
          recordFailure('Không thể xác thực phiên đăng nhập.', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            supabaseError: error?.message,
            hasCode: !!code
          })
        }
      } catch (error) {
        console.error('=== CALLBACK: Error ===', error)
        recordFailure('Có lỗi xảy ra khi xử lý đăng nhập.', {
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    handleAuthCallback()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 px-4">
      {status === 'processing' ? (
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-800">Đang xử lý đăng nhập...</h2>
          <p className="text-gray-600 mt-2">Vui lòng đợi trong giây lát</p>
          <p className="text-sm text-gray-500 mt-4">
            Nếu quá lâu, vui lòng thử lại hoặc kiểm tra console để debug
          </p>
        </div>
      ) : (
        <div className="text-center max-w-md">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-800">Không thể đăng nhập</h2>
          <p className="text-gray-600 mt-3">
            {errorMessage || 'Không thể hoàn tất đăng nhập với Google. Trang sẽ chuyển về màn hình đăng nhập sau ít giây.'}
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Bạn có thể thử lại sau hoặc liên hệ đội hỗ trợ nếu vấn đề tiếp diễn.
          </p>
        </div>
      )}
    </div>
  )
}
