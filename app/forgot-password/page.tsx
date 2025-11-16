'use client'

import { useState } from 'react'
import Link from 'next/link'
import { resetPasswordRequest } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await resetPasswordRequest(email)
      if (error) {
        setError(error.message || 'Không thể gửi email đặt lại mật khẩu')
      } else {
        setSent(true)
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
          <h1 className="text-3xl font-bold text-gray-900">Quên mật khẩu</h1>
          <p className="mt-2 text-sm text-gray-600">Nhập email của bạn để nhận liên kết đặt lại mật khẩu.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {sent ? (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư của bạn và làm theo hướng dẫn.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 sm:text-sm text-gray-900"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại mật khẩu'}
            </button>
          </form>
        )}

        <div className="text-center">
          <Link href="/login" className="text-primary-600 hover:text-primary-500 font-medium">Quay lại đăng nhập</Link>
        </div>
      </div>
    </div>
  )
}
