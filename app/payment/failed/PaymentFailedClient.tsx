'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertTriangle, Clock, CheckCircle, Phone, Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface PaymentFailedClientProps {
  orderId?: string
  amount?: string
  planId?: string
  reason?: string
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link 
            href="/pricing"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại trang giá
          </Link>
        </div>

        {/* Main Error Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <AlertTriangle className="w-20 h-20 text-red-500" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{message.title}</h1>
            <p className="text-lg text-gray-600 mb-6">{message.description}</p>
            
            {/* Order Info */}
            {orderId && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 inline-block">
                <div className="text-sm text-gray-600 mb-1">Mã đơn hàng:</div>
                <div className="font-mono font-bold text-gray-900">{orderId}</div>
              </div>
            )}
          </div>

          {/* Troubleshooting Guide */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6 border border-blue-200">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              Hướng dẫn khắc phục
            </h3>
            
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
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <h4 className="font-bold text-yellow-900 mb-2">⚠️ Lưu ý quan trọng</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Nếu bạn đã chuyển khoản thành công, vui lòng chờ 1-2 phút để hệ thống xác nhận</li>
              <li>• Kiểm tra lại số tiền và nội dung chuyển khoản trước khi thử lại</li>
              <li>• Nếu vấn đề vẫn tiếp tục, vui lòng liên hệ hỗ trợ kỹ thuật</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link 
              href="/pricing" 
              className="flex-1 bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium text-center"
            >
              Thử lại thanh toán
            </Link>
            
            <Link 
              href="/dashboard" 
              className="flex-1 bg-gray-200 text-gray-900 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium text-center"
            >
              Quay về Dashboard
            </Link>
          </div>
        </div>

        {/* Support Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-bold text-gray-900 mb-4">Cần hỗ trợ?</h3>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Email hỗ trợ</p>
                <a href="mailto:webappsaas.ai@gmail.com" className="text-primary-600 hover:underline">
                  webappsaas.ai@gmail.com
                </a>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Thời gian hỗ trợ</p>
                <p className="text-gray-600">Thứ Hai - Chủ Nhật, 8:00 - 22:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
