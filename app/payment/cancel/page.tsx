// Trang này sử dụng Server Component để tránh lỗi useSearchParams()
import { Suspense } from 'react'
import PaymentCancelClient from './PaymentCancelClient'

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-pulse flex flex-col items-center space-y-4">
            <div className="rounded-full bg-gray-200 h-20 w-20"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    }>
      <PaymentCancelClient />
    </Suspense>
  )
}
