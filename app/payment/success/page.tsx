// Trang này sử dụng Server Component để tránh lỗi useSearchParams()
import { Suspense } from 'react'
import PaymentSuccessClient from './PaymentSuccessClient'

export default function PaymentSuccessPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  // Lấy thông tin thanh toán từ URL server-side
  const orderId = searchParams.order as string
  const amount = searchParams.amount as string
  const planId = searchParams.plan as string
  const provider = (searchParams.provider as string) || 'payos'
  
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-pulse flex flex-col items-center space-y-4">
            <div className="rounded-full bg-gray-200 h-20 w-20"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-32 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    }>
      <PaymentSuccessClient 
        orderId={orderId} 
        amount={amount} 
        planId={planId} 
        provider={provider} 
      />
    </Suspense>
  )
}
