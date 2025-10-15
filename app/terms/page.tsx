import Link from 'next/link'
import { ArrowLeft, FileText, CheckCircle, XCircle, AlertTriangle, Scale } from 'lucide-react'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại trang chủ</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-100 rounded-lg">
              <FileText className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Điều khoản sử dụng</h1>
              <p className="text-gray-600 mt-1">Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          {/* Introduction */}
          <div className="mb-12">
            <p className="text-lg text-gray-700 leading-relaxed">
              Chào mừng bạn đến với <span className="font-semibold text-primary-600">PlanAI</span>. 
              Bằng việc sử dụng dịch vụ của chúng tôi, bạn đồng ý với các điều khoản dưới đây. 
              Vui lòng đọc kỹ trước khi sử dụng.
            </p>
          </div>

          {/* Section 1 */}
          <section className="mb-10">
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-primary-600 mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">1. Chấp nhận điều khoản</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    Khi truy cập và sử dụng PlanAI, bạn xác nhận rằng:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Bạn đã đủ 18 tuổi hoặc có sự đồng ý của người giám hộ</li>
                    <li>Bạn có năng lực pháp lý để ký kết hợp đồng</li>
                    <li>Thông tin bạn cung cấp là chính xác và đầy đủ</li>
                    <li>Bạn chịu trách nhiệm về việc sử dụng tài khoản của mình</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">2. Dịch vụ PlanAI</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">2.1. Mô tả dịch vụ</h3>
                <p>PlanAI cung cấp:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Công cụ AI tạo kế hoạch tài chính cá nhân</li>
                  <li>Phân tích tài chính và đưa ra gợi ý</li>
                  <li>Xuất kế hoạch dưới dạng PDF, Word, Google Docs</li>
                  <li>Tính năng phân tích tâm linh (tùy chọn)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">2.2. Giới hạn dịch vụ</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>PlanAI là công cụ hỗ trợ, không thay thế tư vấn tài chính chuyên nghiệp</li>
                  <li>Kết quả AI chỉ mang tính chất tham khảo</li>
                  <li>Chúng tôi không chịu trách nhiệm về quyết định tài chính của bạn</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">3. Tài khoản người dùng</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">3.1. Đăng ký tài khoản</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Bạn phải cung cấp thông tin chính xác khi đăng ký</li>
                  <li>Mỗi người chỉ được tạo một tài khoản</li>
                  <li>Bạn chịu trách nhiệm bảo mật mật khẩu</li>
                  <li>Thông báo ngay cho chúng tôi nếu tài khoản bị xâm nhập</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">3.2. Chấm dứt tài khoản</h3>
                <p>Chúng tôi có quyền đình chỉ hoặc xóa tài khoản nếu:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Vi phạm điều khoản sử dụng</li>
                  <li>Sử dụng dịch vụ cho mục đích bất hợp pháp</li>
                  <li>Cung cấp thông tin sai lệch</li>
                  <li>Lạm dụng hoặc gian lận hệ thống</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-10">
            <div className="flex items-start gap-3 mb-4">
              <Scale className="w-6 h-6 text-primary-600 mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Thanh toán và hoàn tiền</h2>
                <div className="space-y-4 text-gray-700">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">4.1. Gói dịch vụ</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong>Gói 1 (Basic):</strong> 169.000 VND - 30 chat AI, 1 ebook plan</li>
                      <li><strong>Gói 2 (Pro):</strong> 289.000 VND - 70 chat AI, 3 ebook plan</li>
                      <li><strong>Gói 3 (Pro Max):</strong> 499.000 VND - 150 chat AI, 6 ebook plan</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">4.2. Phương thức thanh toán</h3>
                    <p>Chúng tôi chấp nhận thanh toán qua:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>SePay (chuyển khoản ngân hàng)</li>
                      <li>PayOS (VietQR)</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">4.3. Chính sách hoàn tiền</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Hoàn tiền 100% nếu dịch vụ không hoạt động do lỗi hệ thống</li>
                      <li>Hoàn tiền trong vòng 7 ngày nếu chưa sử dụng dịch vụ</li>
                      <li>Không hoàn tiền sau khi đã sử dụng tính năng AI hoặc tạo kế hoạch</li>
                      <li>Thời gian xử lý hoàn tiền: 5-7 ngày làm việc</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="mb-10">
            <div className="flex items-start gap-3 mb-4">
              <XCircle className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">5. Hành vi bị cấm</h2>
                <div className="space-y-4 text-gray-700">
                  <p>Bạn <strong>KHÔNG ĐƯỢC</strong>:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Sao chép, sửa đổi hoặc phân phối nội dung của PlanAI</li>
                    <li>Sử dụng bot, script hoặc công cụ tự động</li>
                    <li>Cố gắng xâm nhập hệ thống hoặc phá hoại dịch vụ</li>
                    <li>Chia sẻ tài khoản với người khác</li>
                    <li>Sử dụng dịch vụ cho mục đích thương mại mà không có sự cho phép</li>
                    <li>Đăng tải nội dung vi phạm pháp luật hoặc xúc phạm</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">6. Quyền sở hữu trí tuệ</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Tất cả nội dung, thiết kế, logo, code của PlanAI thuộc quyền sở hữu của chúng tôi và được bảo vệ 
                bởi luật sở hữu trí tuệ Việt Nam và quốc tế.
              </p>
              <p>
                Kế hoạch tài chính bạn tạo ra thuộc về bạn, nhưng bạn cấp cho chúng tôi quyền sử dụng dữ liệu 
                ẩn danh để cải thiện dịch vụ.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section className="mb-10">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">7. Giới hạn trách nhiệm</h2>
                <div className="space-y-4 text-gray-700">
                  <p>PlanAI cung cấp dịch vụ "NGUYÊN TRẠNG" và "KHẢ DỤNG". Chúng tôi không đảm bảo:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Dịch vụ hoạt động liên tục, không lỗi</li>
                    <li>Kết quả AI chính xác 100%</li>
                    <li>Dữ liệu không bị mất trong mọi trường hợp</li>
                  </ul>
                  <p className="mt-4">
                    Chúng tôi không chịu trách nhiệm về:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Thiệt hại tài chính do quyết định dựa trên kế hoạch AI</li>
                    <li>Mất mát dữ liệu do lỗi người dùng</li>
                    <li>Gián đoạn dịch vụ do bảo trì hoặc nâng cấp</li>
                    <li>Hành vi của bên thứ ba (ngân hàng, cổng thanh toán)</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 8 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">8. Thay đổi dịch vụ</h2>
            <p className="text-gray-700">
              Chúng tôi có quyền:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mt-2">
              <li>Thay đổi, tạm ngưng hoặc ngừng cung cấp dịch vụ</li>
              <li>Cập nhật giá và gói dịch vụ (thông báo trước 30 ngày)</li>
              <li>Sửa đổi điều khoản sử dụng (thông báo qua email)</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">9. Luật áp dụng</h2>
            <p className="text-gray-700">
              Điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Mọi tranh chấp sẽ được giải quyết tại 
              Tòa án có thẩm quyền tại Việt Nam.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl p-6 mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Liên hệ</h2>
            <p className="text-gray-700 mb-4">
              Nếu bạn có câu hỏi về điều khoản sử dụng, vui lòng liên hệ:
            </p>
            <div className="space-y-2 text-gray-700">
              <p><strong>Email:</strong> <a href="mailto:support@planai.io.vn" className="text-primary-600 hover:underline">support@planai.io.vn</a></p>
              <p><strong>Website:</strong> <a href="https://planai.io.vn" className="text-primary-600 hover:underline">https://planai.io.vn</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
