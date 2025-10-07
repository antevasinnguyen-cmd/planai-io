'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AuthSuccessModalProps {
  message?: string
  onClose?: () => void
  autoRedirect?: boolean
  redirectTo?: string
  redirectDelay?: number
}

export default function AuthSuccessModal({
  message = '🎉 Chúc mừng bạn đã đăng ký / đăng nhập thành công. Hãy bắt đầu với PlanAI ngay nào!',
  onClose,
  autoRedirect = true,
  redirectTo = '/dashboard',
  redirectDelay = 3000
}: AuthSuccessModalProps) {
  const router = useRouter()

  useEffect(() => {
    if (autoRedirect) {
      const timer = setTimeout(() => {
        router.push(redirectTo)
        onClose?.()
      }, redirectDelay)

      return () => clearTimeout(timer)
    }
  }, [autoRedirect, redirectTo, redirectDelay, router, onClose])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-2xl">
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        )}

        <div className="text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Đăng nhập thành công!
          </h2>

          {/* Message */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            {message}
          </p>

          {/* Progress indicator */}
          {autoRedirect && (
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-100 ease-linear"
                  style={{
                    width: '100%',
                    animation: `shrink ${redirectDelay}ms linear forwards`
                  }}
                />
              </div>
              <p className="text-sm text-gray-500">
                Chuyển hướng trong {Math.ceil(redirectDelay / 1000)} giây...
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                router.push(redirectTo)
                onClose?.()
              }}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Bắt đầu ngay
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Ở lại trang này
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}
