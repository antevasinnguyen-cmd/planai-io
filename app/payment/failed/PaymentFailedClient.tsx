'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { XCircle, Mail, ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface PaymentFailedClientProps {
  orderId?: string
  amount?: string
  planId?: string
  reason?: string
}

const PLAN_INFO = {
  basic: { name: 'Gói 1', price: 169000 },
  pro: { name: 'Gói 2 - Pro', price: 289000 },
  pro_max: { name: 'Gói 3 - Pro Max', price: 499000 }
}

export default function PaymentFailedClient({ 
  orderId, 
  amount, 
  planId,
  reason 
}: PaymentFailedClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [failureReason, setFailureReason] = useState(reason || 'unknown')

  useEffect(() => {
    // Lấy reason từ URL nếu có
    const urlReason = searchParams.get('reason')
    if (urlReason) {
      setFailureReason(urlReason)
    }
  }, [searchParams])

  const getFailureMessage = () => {
    switch (failureReason) {
      case 'expired':
        return {
          title: '⏰ Hết thời gian thanh toán',
          description: 'Mã QR và yêu cầu thanh toán của bạn đã hết hạn (30 phút).',
          action: 'Vui lòng tạo một yêu cầu thanh toán mới'
        }
      case 'cancelled':
        return {
          title: '❌ Thanh toán bị hủy',
          description: 'Bạn đã hủy quá trình thanh toán.',
          action: 'Bạn có thể thử lại bất kỳ lúc nào'
        }
      case 'incorrect_amount':
        return {
          title: '💰 Số tiền không chính xác',
          description: 'Số tiền bạn chuyển không khớp với số tiền yêu cầu.',
          action: 'Vui lòng chuyển lại với số tiền chính xác'
        }
      case 'incorrect_content':
        return {
          title: '📝 Nội dung chuyển khoản sai',
          description: 'Nội dung chuyển khoản không khớp với yêu cầu.',
          action: 'Vui lòng chuyển lại với nội dung chính xác'
        }
      case 'timeout':
        return {
          title: '⏱️ Hết thời gian chờ',
          description: 'Hệ thống không nhận được xác nhận thanh toán trong thời gian quy định.',
          action: 'Vui lòng kiểm tra tài khoản ngân hàng và thử lại'
        }
      default:
        return {
          title: '❌ Thanh toán thất bại',
          description: 'Có lỗi xảy ra trong quá trình xử lý thanh toán.',
          action: 'Vui lòng thử lại hoặc liên hệ hỗ trợ'
        }
    }
  }

  const message = getFailureMessage()
  const planInfo = PLAN_INFO[planId as keyof typeof PLAN_INFO] || { name: planId || 'N/A', price: parseInt(amount || '0') }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/pricing')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Quay lại</span>
          </button>
        </div>

        {/* Failed Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Failed Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-16 h-16 text-red-500" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-red-600 mb-3">Thanh toán thất bại</h1>
          
          {/* Subtitle */}
          <p className="text-gray-600 mb-8 text-lg">
            {message.description}
          </p>

          {/* Plan Details */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 mb-8 border border-red-200">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Gói dịch vụ</p>
                <p className="text-2xl font-bold text-gray-900">{planInfo.name}</p>
              </div>
              
              <div className="border-t border-red-200 pt-4">
                <p className="text-sm text-gray-600 mb-1">Số tiền thanh toán</p>
                <p className="text-3xl font-bold text-red-600">
                  {parseInt(amount || '0').toLocaleString('vi-VN')} VND
                </p>
              </div>

              <div className="border-t border-red-200 pt-4 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Mã đơn hàng:</span>
                  <span className="font-medium text-gray-900">{orderId || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Lý do:</span>
                  <span className="font-medium text-red-600">{message.title}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Troubleshooting Guide */}
          <div className="bg-blue-50 rounded-xl p-4 mb-8 text-left border border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-3">💡 Hướng dẫn khắc phục:</p>
            
            <div className="space-y-3">
              {failureReason === 'expired' && (
                <>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <p className="font-medium text-gray-900">Quay lại trang giá dịch vụ</p>
                      <p className="text-sm text-gray-600">Chọn gói dịch vụ bạn muốn nâng cấp</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <p className="font-medium text-gray-900">Tạo yêu cầu thanh toán mới</p>
                      <p className="text-sm text-gray-600">Mã QR cũ không còn hiệu lực</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <p className="font-medium text-gray-900">Hoàn thành thanh toán</p>
                      <p className="text-sm text-gray-600">Quét mã QR mới để thanh toán</p>
                    </div>
                  </div>
                </>
              )}
              
              {failureReason === 'incorrect_amount' && (
                <>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <p className="font-medium text-gray-900">Kiểm tra số tiền yêu cầu</p>
                      <p className="text-sm text-gray-600">Số tiền phải chính xác: <strong>{amount ? parseInt(amount).toLocaleString('vi-VN') : 'N/A'} VND</strong></p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <p className="font-medium text-gray-900">Chuyển khoản lại với số tiền chính xác</p>
                      <p className="text-sm text-gray-600">Không được thêm hoặc bớt tiền</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <p className="font-medium text-gray-900">Hệ thống sẽ tự động xác nhận</p>
                      <p className="text-sm text-gray-600">Trong vòng 1-2 phút sau khi chuyển khoản</p>
                    </div>
                  </div>
                </>
              )}
              
              {failureReason === 'incorrect_content' && (
                <>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <p className="font-medium text-gray-900">Kiểm tra nội dung chuyển khoản</p>
                      <p className="text-sm text-gray-600">Nội dung phải chính xác: <strong>{orderId}</strong></p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <p className="font-medium text-gray-900">Chuyển khoản lại với nội dung chính xác</p>
                      <p className="text-sm text-gray-600">Sao chép nội dung từ yêu cầu thanh toán</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <p className="font-medium text-gray-900">Hệ thống sẽ tự động xác nhận</p>
                      <p className="text-sm text-gray-600">Trong vòng 1-2 phút sau khi chuyển khoản</p>
                    </div>
                  </div>
                </>
              )}
              
              {!['expired', 'incorrect_amount', 'incorrect_content'].includes(failureReason) && (
                <>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <p className="font-medium text-gray-900">Kiểm tra kết nối internet</p>
                      <p className="text-sm text-gray-600">Đảm bảo kết nối ổn định</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <p className="font-medium text-gray-900">Thử lại thanh toán</p>
                      <p className="text-sm text-gray-600">Quay lại trang giá và tạo yêu cầu mới</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <p className="font-medium text-gray-900">Liên hệ hỗ trợ nếu vấn đề tiếp tục</p>
                      <p className="text-sm text-gray-600">Chúng tôi sẽ giúp bạn giải quyết</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 rounded-xl p-4 mb-8 border border-yellow-200">
            <p className="text-sm font-semibold text-yellow-900 mb-3">⚠️ Lưu ý quan trọng:</p>
            <ul className="text-xs text-yellow-800 space-y-1">
              <li>• Kiểm tra lại số tiền và nội dung chuyển khoản</li>
              <li>• Nếu đã chuyển khoản, chờ 1-2 phút để hệ thống xác nhận</li>
              <li>• Liên hệ hỗ trợ nếu vấn đề tiếp tục</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/pricing')}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-semibold text-lg shadow-md"
            >
              Thử lại thanh toán
            </button>
            
            <Link
              href="/dashboard"
              className="w-full bg-gray-100 text-gray-900 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-semibold text-center"
            >
              Quay về Dashboard
            </Link>
          </div>

          {/* Support Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-3">Cần hỗ trợ?</p>
            <a 
              href="mailto:support@planai.io.vn" 
              className="flex items-center gap-2 text-primary-600 hover:underline text-sm"
            >
              <Mail className="w-4 h-4" />
              support@planai.io.vn
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
