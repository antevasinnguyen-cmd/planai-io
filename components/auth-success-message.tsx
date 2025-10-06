'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context-new'

export default function AuthSuccessMessage() {
  const { showSuccessMessage, setShowSuccessMessage } = useAuth()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Kiểm tra xem có thông báo thành công không
    const hasAuthSuccess = localStorage.getItem('auth_success')
    
    if (hasAuthSuccess === 'true' || showSuccessMessage) {
      console.log('=== AUTH-SUCCESS-MESSAGE: Hiển thị thông báo ===')
      setIsVisible(true)
      
      // Xóa thông báo sau khi hiển thị
      setTimeout(() => {
        localStorage.removeItem('auth_success')
        setShowSuccessMessage(false)
        setIsVisible(false)
      }, 5000)
    }
  }, [showSuccessMessage, setShowSuccessMessage])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-gray-900">Đăng nhập thành công!</p>
            <p className="mt-1 text-sm text-gray-500">
              Chúc mừng bạn đã đăng nhập thành công. Hãy bắt đầu với PlanAI ngay nào!
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => {
                setIsVisible(false)
                setShowSuccessMessage(false)
                localStorage.removeItem('auth_success')
              }}
            >
              <span className="sr-only">Đóng</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div className="bg-green-50 px-4 py-3">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="ml-3 text-sm font-medium text-green-800">
            Bạn đã sẵn sàng sử dụng tất cả tính năng của PlanAI!
          </p>
        </div>
      </div>
    </div>
  )
}
