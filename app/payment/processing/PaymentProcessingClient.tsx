'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { QrCode, Copy, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface PaymentProcessingClientProps {
  orderId: string
  amount: string
  planId: string
  provider: string
  qrCode: string
  accountNumber: string
  accountName: string
  bankName: string
}

export default function PaymentProcessingClient({
  orderId,
  amount,
  planId,
  provider,
  qrCode,
  accountNumber,
  accountName,
  bankName
}: PaymentProcessingClientProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | 'success' | 'failed'>('pending')
  const [checkCount, setCheckCount] = useState(0)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Kiểm tra trạng thái thanh toán mỗi 5 giây
  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (paymentStatus !== 'pending' && paymentStatus !== 'checking') return
      
      setPaymentStatus('checking')
      setCheckCount(prev => prev + 1)

      try {
        const response = await fetch(`/api/payment/check-status?orderId=${orderId}`)
        const data = await response.json()

        if (data.status === 'completed') {
          setPaymentStatus('success')
          setTimeout(() => {
            router.push(`/payment/success?order=${orderId}&amount=${amount}&plan=${planId}&provider=${provider}`)
          }, 2000)
        } else if (checkCount >= 60) { // Sau 5 phút (60 lần x 5 giây)
          setPaymentStatus('failed')
        } else {
          setPaymentStatus('pending')
        }
      } catch (error) {
        console.error('Error checking payment status:', error)
        setPaymentStatus('pending')
      }
    }

    const interval = setInterval(checkPaymentStatus, 5000)
    return () => clearInterval(interval)
  }, [orderId, amount, planId, provider, router, paymentStatus, checkCount])

  const getPlanName = (id: string) => {
    switch (id) {
      case 'basic': return 'Gói 1'
      case 'pro': return 'Gói 2'
      case 'pro_max': return 'Gói 3'
      default: return id
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Quét mã QR để thanh toán</h1>
            <p className="text-gray-600">
              Sử dụng ứng dụng ngân hàng của bạn để quét mã QR bên dưới
            </p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
              {qrCode ? (
                <Image 
                  src={qrCode} 
                  alt="QR Code thanh toán" 
                  width={250} 
                  height={250}
                  className="rounded"
                />
              ) : (
                <div className="w-[250px] h-[250px] flex items-center justify-center bg-gray-100 rounded">
                  <QrCode className="w-20 h-20 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Thông tin thanh toán */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Thông tin chuyển khoản</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Ngân hàng:</span>
                <span className="font-medium text-gray-900">{bankName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Số tài khoản:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{accountNumber}</span>
                  <button
                    onClick={() => copyToClipboard(accountNumber)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tên tài khoản:</span>
                <span className="font-medium text-gray-900">{accountName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Số tiền:</span>
                <span className="font-bold text-primary-600 text-lg">
                  {parseInt(amount).toLocaleString('vi-VN')} VND
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Nội dung:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{orderId}</span>
                  <button
                    onClick={() => copyToClipboard(orderId)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Trạng thái thanh toán */}
          <div className="border-t pt-4">
            {paymentStatus === 'pending' && (
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Đang chờ thanh toán...</span>
              </div>
            )}
            {paymentStatus === 'checking' && (
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Đang kiểm tra thanh toán...</span>
              </div>
            )}
            {paymentStatus === 'success' && (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span>Thanh toán thành công! Đang chuyển hướng...</span>
              </div>
            )}
            {paymentStatus === 'failed' && (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-5 h-5" />
                  <span>Chưa nhận được thanh toán</span>
                </div>
                <button
                  onClick={() => router.push('/pricing')}
                  className="mt-2 text-primary-600 hover:underline"
                >
                  Quay lại trang giá
                </button>
              </div>
            )}
          </div>

          {/* Lưu ý */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Lưu ý quan trọng:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Vui lòng chuyển khoản <strong>chính xác số tiền</strong> như trên</li>
              <li>• Nhập <strong>đúng nội dung chuyển khoản</strong>: {orderId}</li>
              <li>• Hệ thống sẽ tự động xác nhận thanh toán trong vòng 1-2 phút</li>
              <li>• Nếu có vấn đề, vui lòng liên hệ hỗ trợ</li>
            </ul>
          </div>
        </div>

        {/* Thông tin đơn hàng */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Thông tin đơn hàng</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Mã đơn hàng:</span>
              <span className="font-medium text-gray-900">{orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Gói dịch vụ:</span>
              <span className="font-medium text-gray-900">{getPlanName(planId)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phương thức:</span>
              <span className="font-medium text-gray-900">
                {provider === 'sepay' ? 'VietQR Pro (SePay)' : 'PayOS'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
