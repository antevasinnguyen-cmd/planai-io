'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Zap } from 'lucide-react'
import { signIn, signInWithGoogle } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Suspense } from 'react'

function LoginPageContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  
  useEffect(() => {
    if (redirectTo) {
      localStorage.setItem('auth_redirect', redirectTo)
      console.log('=== LOGIN: Luu duong dan chuyen huong ===', redirectTo)
    }
  }, [redirectTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { data, error } = await signIn(email, password)
      
      if (error) {
        setError(error.message || 'Email hoặc mật khẩu không đúng')
        return
      }

      if (data.user) {
        console.log('Đăng nhập thành công:', data.user.email)
        // AuthContext sẽ xử lý chuyển hướng
      }
    } catch (err) {
      console.error('Lỗi đăng nhập:', err)
      setError('Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">PlanAI</span>
          </Link>
          <h2 className="mt-2 text-3xl font-bold text-gray-900">Đăng nhập vào tài khoản</h2>
          <p className="mt-2 text-sm text-gray-600">
            Chào mừng bạn quay trở lại! Vui lòng đăng nhập để tiếp tục.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border-gray-300 pl-10 pr-3 py-2 placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 sm:text-sm text-gray-900"
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mật khẩu
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border-gray-300 pl-10 pr-3 py-2 placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 sm:text-sm text-gray-900"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                Đăng nhập
                <ArrowRight className="ml-2 w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Hoặc</span>
            </div>
          </div>
        </div>

        {/* Social Login */}
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={async (e) => {
              e.preventDefault()
              try {
                setIsLoading(true)
                setError('')
                
                // Lưu đường dẫn chuyển hướng nếu có
                const urlParams = new URLSearchParams(window.location.search)
                const redirectedFrom = urlParams.get('redirectedFrom')
                if (redirectedFrom) {
                  localStorage.setItem('auth_redirect', redirectedFrom)
                  console.log('=== LOGIN: Lưu đường dẫn chuyển hướng ===', redirectedFrom)
                }
                
                console.log('=== LOGIN: Gọi hàm signInWithGoogle ===')
                const result = await signInWithGoogle()
                
                if (result.error) {
                  console.error('=== LOGIN: Lỗi đăng nhập Google ===', result.error)
                  setError(`Đăng nhập bằng Google thất bại: ${result.error.message || 'Vui lòng thử lại.'}`)
                  setIsLoading(false)
                } else {
                  console.log('=== LOGIN: Đăng nhập Google thành công, đợi chuyển hướng ===')
                  // Để signInWithGoogle tự động chuyển hướng đến Google OAuth
                  // Không cần setIsLoading(false) vì sẽ chuyển trang
                }
              } catch (error) {
                console.error('=== LOGIN: Lỗi không xác định khi đăng nhập Google ===', error)
                setError('Có lỗi xảy ra khi đăng nhập bằng Google. Vui lòng thử lại.')
                setIsLoading(false)
              }
            }}
            disabled={isLoading}
            className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 font-medium transition-colors duration-150"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Đăng nhập với Google
          </button>
        </div>

        <div className="mt-6 text-center">
          <span className="text-gray-600">Chưa có tài khoản? </span>
          <Link href="/signup" className="text-primary-600 hover:text-primary-500 font-medium">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Dang tai...</p>
          </div>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}
