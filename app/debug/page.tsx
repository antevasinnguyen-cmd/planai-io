'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [authRedirect, setAuthRedirect] = useState<string | null>(null)
  const [authSuccess, setAuthSuccess] = useState<string | null>(null)
  const [pathname, setPathname] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Lấy thông tin phiên hiện tại
        const { data } = await supabase.auth.getSession()
        setSessionInfo(data)
        
        // Lấy thông tin từ localStorage
        const redirect = localStorage.getItem('auth_redirect')
        const success = localStorage.getItem('auth_success')
        setAuthRedirect(redirect)
        setAuthSuccess(success)
        
        // Lấy đường dẫn hiện tại
        setPathname(window.location.pathname)
        
        setLoading(false)
      } catch (error) {
        console.error('Lỗi khi kiểm tra phiên:', error)
        setLoading(false)
      }
    }
    
    checkSession()
  }, [])
  
  const handleFixRedirect = () => {
    localStorage.setItem('auth_redirect', '/dashboard')
    window.location.href = '/dashboard'
  }
  
  const handleClearStorage = () => {
    localStorage.removeItem('auth_redirect')
    localStorage.removeItem('auth_success')
    window.location.reload()
  }
  
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }
  
  const handleGoToDashboard = () => {
    window.location.href = '/dashboard'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Đang tải thông tin...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-6">Trang Debug</h1>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-2">Thông tin phiên hiện tại</h2>
            <div className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-60">
              <pre className="text-sm">{JSON.stringify(sessionInfo, null, 2)}</pre>
            </div>
            <p className="mt-2 text-sm">
              <strong>Trạng thái đăng nhập:</strong> {sessionInfo?.session ? 'Đã đăng nhập' : 'Chưa đăng nhập'}
            </p>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-2">Thông tin localStorage</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium">auth_redirect:</p>
                <div className="bg-gray-100 p-2 rounded">{authRedirect || '(không có)'}</div>
              </div>
              <div>
                <p className="font-medium">auth_success:</p>
                <div className="bg-gray-100 p-2 rounded">{authSuccess || '(không có)'}</div>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-2">Thông tin đường dẫn</h2>
            <p><strong>Đường dẫn hiện tại:</strong> {pathname}</p>
            <p><strong>URL đầy đủ:</strong> {typeof window !== 'undefined' ? window.location.href : ''}</p>
          </div>
          
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Công cụ sửa lỗi</h2>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={handleFixRedirect}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Sửa chuyển hướng và đi đến Dashboard
              </button>
              
              <button 
                onClick={handleClearStorage}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                Xóa localStorage
              </button>
              
              <button 
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Đăng xuất
              </button>
              
              <button 
                onClick={handleGoToDashboard}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Đi đến Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
