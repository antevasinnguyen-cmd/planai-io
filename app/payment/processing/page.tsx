// Trang này sử dụng Server Component để tránh lỗi useSearchParams()
import { Suspense } from 'react'
import PaymentProcessingClient from './PaymentProcessingClient'

export default function PaymentProcessingPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  // Lấy thông tin thanh toán từ URL server-side
  const orderId = searchParams.order as string
  const amount = searchParams.amount as string
  const planId = searchParams.plan as string
  const provider = (searchParams.provider as string) || 'payos'
  const qrCode = searchParams.qr as string
  const accountNumber = searchParams.account as string
  const accountName = searchParams.name as string
  const bankName = searchParams.bank as string
  
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-pulse flex flex-col items-center space-y-4">
            <div className="rounded-full bg-gray-200 h-20 w-20"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-32 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    }>
      <PaymentProcessingClient 
        orderId={orderId} 
        amount={amount} 
        planId={planId} 
        provider={provider}
        qrCode={qrCode}
        accountNumber={accountNumber}
        accountName={accountName}
        bankName={bankName}
      />
    </Suspense>
  )
}
