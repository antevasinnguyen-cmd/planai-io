import Link from 'next/link'
import { ArrowLeft, Shield, Lock, Eye, Database, UserCheck } from 'lucide-react'

export default function PrivacyPolicyPage() {
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
              <Shield className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Chính sách bảo mật</h1>
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
              Tại <span className="font-semibold text-primary-600">PlanAI</span>, chúng tôi cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của bạn. 
              Chính sách này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn.
            </p>
          </div>

          {/* Section 1 */}
          <section className="mb-10">
            <div className="flex items-start gap-3 mb-4">
              <Database className="w-6 h-6 text-primary-600 mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">1. Thông tin chúng tôi thu thập</h2>
                <div className="space-y-4 text-gray-700">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">1.1. Thông tin cá nhân</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Họ tên, email khi bạn đăng ký tài khoản</li>
                      <li>Thông tin thanh toán (được xử lý qua bên thứ ba bảo mật)</li>
                      <li>Thông tin tài chính bạn cung cấp để tạo kế hoạch</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">1.2. Thông tin tự động</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Địa chỉ IP, loại trình duyệt, thiết bị</li>
                      <li>Thời gian truy cập và các trang bạn xem</li>
                      <li>Cookies và công nghệ theo dõi tương tự</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-10">
            <div className="flex items-start gap-3 mb-4">
              <Eye className="w-6 h-6 text-primary-600 mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">2. Cách chúng tôi sử dụng thông tin</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Cung cấp và cải thiện dịch vụ PlanAI</li>
                  <li>Tạo kế hoạch tài chính cá nhân hóa bằng AI</li>
                  <li>Xử lý thanh toán và quản lý tài khoản</li>
                  <li>Gửi thông báo quan trọng về dịch vụ</li>
                  <li>Phân tích và cải thiện trải nghiệm người dùng</li>
                  <li>Bảo vệ chống gian lận và lạm dụng</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-10">
            <div className="flex items-start gap-3 mb-4">
              <Lock className="w-6 h-6 text-primary-600 mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">3. Bảo mật thông tin</h2>
                <div className="space-y-4 text-gray-700">
                  <p>Chúng tôi áp dụng các biện pháp bảo mật tiên tiến:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Mã hóa SSL/TLS cho tất cả dữ liệu truyền tải</li>
                    <li>Lưu trữ dữ liệu trên Supabase với bảo mật cấp doanh nghiệp</li>
                    <li>Xác thực đa yếu tố cho tài khoản</li>
                    <li>Kiểm tra bảo mật định kỳ</li>
                    <li>Chỉ nhân viên được ủy quyền mới có quyền truy cập</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-10">
            <div className="flex items-start gap-3 mb-4">
              <UserCheck className="w-6 h-6 text-primary-600 mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Quyền của bạn</h2>
                <div className="space-y-4 text-gray-700">
                  <p>Bạn có quyền:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Truy cập:</strong> Xem thông tin cá nhân chúng tôi lưu trữ</li>
                    <li><strong>Chỉnh sửa:</strong> Cập nhật hoặc sửa thông tin không chính xác</li>
                    <li><strong>Xóa:</strong> Yêu cầu xóa tài khoản và dữ liệu của bạn</li>
                    <li><strong>Xuất dữ liệu:</strong> Tải xuống bản sao dữ liệu của bạn</li>
                    <li><strong>Từ chối:</strong> Không đồng ý với việc xử lý dữ liệu nhất định</li>
                  </ul>
                  <p className="mt-4">
                    Để thực hiện các quyền này, vui lòng liên hệ: <a href="mailto:support@planai.io.vn" className="text-primary-600 hover:underline">support@planai.io.vn</a>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">5. Chia sẻ thông tin</h2>
            <div className="space-y-4 text-gray-700">
              <p>Chúng tôi <strong>KHÔNG</strong> bán thông tin cá nhân của bạn. Chúng tôi chỉ chia sẻ với:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Nhà cung cấp dịch vụ:</strong> OpenAI (AI), Supabase (database), Vercel (hosting)</li>
                <li><strong>Cổng thanh toán:</strong> SePay, PayOS để xử lý thanh toán</li>
                <li><strong>Yêu cầu pháp lý:</strong> Khi được yêu cầu bởi cơ quan có thẩm quyền</li>
              </ul>
            </div>
          </section>

          {/* Section 6 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">6. Lưu trữ dữ liệu</h2>
            <div className="space-y-4 text-gray-700">
              <p>Dữ liệu của bạn được lưu trữ:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Tài khoản Free: 7 ngày</li>
                <li>Tài khoản trả phí: 30 ngày</li>
                <li>Sau khi xóa tài khoản: Dữ liệu sẽ bị xóa vĩnh viễn trong vòng 30 ngày</li>
              </ul>
            </div>
          </section>

          {/* Section 7 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">7. Cookies</h2>
            <div className="space-y-4 text-gray-700">
              <p>Chúng tôi sử dụng cookies để:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Duy trì phiên đăng nhập của bạn</li>
                <li>Ghi nhớ tùy chọn của bạn</li>
                <li>Phân tích cách sử dụng website</li>
              </ul>
              <p className="mt-4">
                Xem thêm tại <Link href="/cookies" className="text-primary-600 hover:underline">Chính sách Cookie</Link>
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">8. Thay đổi chính sách</h2>
            <p className="text-gray-700">
              Chúng tôi có thể cập nhật chính sách này theo thời gian. Thay đổi quan trọng sẽ được thông báo qua email 
              hoặc thông báo trên website. Việc bạn tiếp tục sử dụng dịch vụ sau khi thay đổi có nghĩa là bạn chấp nhận 
              chính sách mới.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl p-6 mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Liên hệ</h2>
            <p className="text-gray-700 mb-4">
              Nếu bạn có câu hỏi về chính sách bảo mật này, vui lòng liên hệ:
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
