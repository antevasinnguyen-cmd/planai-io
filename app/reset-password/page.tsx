'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null)

  useEffect(() => {
    // Kiểm tra xem có session (hoặc recovery session) chưa
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setHasRecoverySession(!!session)
      } catch (e) {
        setHasRecoverySession(false)
      }
    }
    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!newPassword) {
      setError('Vui lòng nhập mật khẩu mới')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        setError(error.message || 'Không thể đặt lại mật khẩu. Vui lòng mở lại liên kết trong email.')
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError('Đã xảy ra lỗi. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Đặt lại mật khẩu</h1>
          <p className="mt-2 text-sm text-gray-600">
            {hasRecoverySession === false
              ? 'Vui lòng mở trang này từ liên kết đặt lại mật khẩu trong email.'
              : 'Nhập mật khẩu mới cho tài khoản của bạn.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              Mật khẩu đã được đặt lại thành công.
            </div>
            <div className="text-center">
              <Link href="/login" className="text-primary-600 hover:text-primary-500 font-medium">
                Đăng nhập lại
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">Mật khẩu mới</label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 sm:text-sm text-gray-900"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">Xác nhận mật khẩu mới</label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 sm:text-sm text-gray-900"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading || hasRecoverySession === false}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </button>
          </form>
        )}

        <div className="text-center">
          <Link href="/forgot-password" className="text-primary-600 hover:text-primary-500 font-medium">
            Gửi lại email đặt lại mật khẩu
          </Link>
        </div>
      </div>
    </div>
  )
}
