'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { LogOut, User, Home } from 'lucide-react'
import Link from 'next/link'

export default function SimpleDashboard() {
  const { user, loading, signOut } = useAuth()

  useEffect(() => {
    console.log('=== SIMPLE DASHBOARD: useEffect ===', { user, loading })
    
    if (!loading && !user) {
      console.log('=== SIMPLE DASHBOARD: Không có user, chuyển hướng login ===')
      window.location.href = '/login'
      return
    }
  }, [user, loading])

  const handleLogout = async () => {
    await signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Đang chuyển hướng đến trang đăng nhập...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <Home className="w-6 h-6 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">PlanAI</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-700">{user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                🎉 Chào mừng bạn đến với PlanAI!
              </h1>
              <p className="text-gray-600">
                Đăng nhập thành công! Email: <strong>{user.email}</strong>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                User ID: {user.id}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/dashboard"
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Home className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Dashboard Chính
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        Xem dashboard đầy đủ
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </Link>

            <Link
              href="/account"
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <User className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Tài Khoản
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        Quản lý hồ sơ
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </Link>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-semibold">AI</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Tính Năng AI
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        Sắp ra mắt
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Debug Info */}
          <div className="mt-8 bg-gray-100 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Debug Info</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
              <p><strong>User Email:</strong> {user.email}</p>
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Auth Loading:</strong> {loading ? 'true' : 'false'}</p>
              <p><strong>Timestamp:</strong> {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
