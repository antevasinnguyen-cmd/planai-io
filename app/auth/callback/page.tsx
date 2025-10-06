'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Xử lý callback từ OAuth
    const handleAuthCallback = async () => {
      try {
        console.log('Bắt đầu xử lý callback OAuth')
        
        // Đợi một chút để đảm bảo Supabase đã xử lý xong phiên đăng nhập
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Lấy thông tin phiên hiện tại
        const { data: { session } } = await supabase.auth.getSession()
        
        // Nếu đã đăng nhập thành công
        if (session) {
          console.log('Phiên đăng nhập hợp lệ:', session.user.id)
          
          // Lưu thông báo đăng nhập thành công
          localStorage.setItem('auth_success', 'true')
          
          // Lấy đường dẫn chuyển hướng từ localStorage hoặc mặc định là dashboard
          const redirectPath = localStorage.getItem('auth_redirect') || '/dashboard'
          localStorage.removeItem('auth_redirect') // Xóa sau khi sử dụng
          
          // Đảm bảo redirectPath không phải là 'null' hoặc 'undefined'
          const safePath = redirectPath && redirectPath !== 'null' && redirectPath !== 'undefined' 
            ? redirectPath 
            : '/dashboard'
          
          // Chuyển hướng đến trang đích (sử dụng window.location.href để đảm bảo chuyển hướng hoàn toàn)
          console.log('Chuyển hướng đến:', safePath)
          
          // Đảm bảo URL có domain đầy đủ
          const fullUrl = safePath.startsWith('http') 
            ? safePath 
            : `${window.location.origin}${safePath}`
          
          console.log('URL đầy đủ:', fullUrl)
          
          // Sử dụng setTimeout để đảm bảo localStorage đã được cập nhật trước khi chuyển hướng
          setTimeout(() => {
            window.location.href = fullUrl
          }, 500)
        } else {
          // Nếu không có phiên, thử lấy lại phiên từ URL hash (trường hợp Supabase chưa xử lý xong)
          console.log('Không tìm thấy phiên, thử kiểm tra lại...')
          
          // Đợi thêm và thử lại
          setTimeout(async () => {
            try {
              const { data: { session: retrySession } } = await supabase.auth.getSession()
              
              if (retrySession) {
                console.log('Phiên đăng nhập hợp lệ (sau khi thử lại):', retrySession.user.id)
                localStorage.setItem('auth_success', 'true')
                const redirectPath = localStorage.getItem('auth_redirect') || '/dashboard'
                localStorage.removeItem('auth_redirect')
                const safePath = redirectPath && redirectPath !== 'null' && redirectPath !== 'undefined' 
                  ? redirectPath 
                  : '/dashboard'
                
                // Đảm bảo URL có domain đầy đủ
                const fullUrl = safePath.startsWith('http') 
                  ? safePath 
                  : `${window.location.origin}${safePath}`
                
                console.log('URL đầy đủ (retry):', fullUrl)
                window.location.href = fullUrl
              } else {
                console.log('Vẫn không tìm thấy phiên, chuyển hướng về trang đăng nhập')
                setError('Không thể xác thực phiên đăng nhập')
                window.location.href = '/login'
              }
            } catch (retryError) {
              console.error('Lỗi khi thử lại:', retryError)
              window.location.href = '/login'
            }
          }, 2000)
        }
      } catch (error) {
        console.error('Lỗi xử lý callback:', error)
        setError('Lỗi xử lý đăng nhập')
        
        // Đợi một chút trước khi chuyển hướng
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-2xl font-semibold text-gray-800">Đang xử lý đăng nhập...</h2>
        <p className="text-gray-600 mt-2">Vui lòng đợi trong giây lát</p>
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
