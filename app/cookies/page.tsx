import Link from 'next/link'
import { ArrowLeft, Cookie, Settings, BarChart, Shield } from 'lucide-react'

export default function CookiePolicyPage() {
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
              <Cookie className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Chính sách Cookie</h1>
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
              <span className="font-semibold text-primary-600">PlanAI</span> sử dụng cookies và công nghệ tương tự 
              để cải thiện trải nghiệm của bạn, phân tích lưu lượng truy cập và cá nhân hóa nội dung. 
              Trang này giải thích cách chúng tôi sử dụng cookies.
            </p>
          </div>

          {/* Section 1 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">1. Cookie là gì?</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Cookies là các tệp văn bản nhỏ được lưu trữ trên thiết bị của bạn (máy tính, điện thoại, máy tính bảng) 
                khi bạn truy cập website. Chúng giúp website "nhớ" thông tin về lượt truy cập của bạn.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-blue-900">
                  <strong>Ví dụ:</strong> Cookies giúp bạn không phải đăng nhập lại mỗi lần truy cập, 
                  hoặc ghi nhớ ngôn ngữ bạn đã chọn.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">2. Các loại cookies chúng tôi sử dụng</h2>
            
            {/* Essential Cookies */}
            <div className="mb-6">
              <div className="flex items-start gap-3 mb-3">
                <Shield className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">2.1. Cookies cần thiết</h3>
                  <p className="text-gray-700 mb-2">
                    Những cookies này là bắt buộc để website hoạt động. Bạn không thể tắt chúng.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-semibold">Cookie</th>
                          <th className="text-left py-2 font-semibold">Mục đích</th>
                          <th className="text-left py-2 font-semibold">Thời hạn</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-700">
                        <tr className="border-b">
                          <td className="py-2 font-mono text-xs">sb-access-token</td>
                          <td className="py-2">Xác thực đăng nhập</td>
                          <td className="py-2">7 ngày</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-mono text-xs">sb-refresh-token</td>
                          <td className="py-2">Làm mới phiên</td>
                          <td className="py-2">30 ngày</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono text-xs">csrf_token</td>
                          <td className="py-2">Bảo mật CSRF</td>
                          <td className="py-2">Phiên</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Functional Cookies */}
            <div className="mb-6">
              <div className="flex items-start gap-3 mb-3">
                <Settings className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">2.2. Cookies chức năng</h3>
                  <p className="text-gray-700 mb-2">
                    Giúp ghi nhớ tùy chọn của bạn và cung cấp trải nghiệm cá nhân hóa.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-semibold">Cookie</th>
                          <th className="text-left py-2 font-semibold">Mục đích</th>
                          <th className="text-left py-2 font-semibold">Thời hạn</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-700">
                        <tr className="border-b">
                          <td className="py-2 font-mono text-xs">user_preferences</td>
                          <td className="py-2">Lưu cài đặt người dùng</td>
                          <td className="py-2">1 năm</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-mono text-xs">theme</td>
                          <td className="py-2">Giao diện sáng/tối</td>
                          <td className="py-2">1 năm</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono text-xs">language</td>
                          <td className="py-2">Ngôn ngữ hiển thị</td>
                          <td className="py-2">1 năm</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="mb-6">
              <div className="flex items-start gap-3 mb-3">
                <BarChart className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">2.3. Cookies phân tích</h3>
                  <p className="text-gray-700 mb-2">
                    Giúp chúng tôi hiểu cách người dùng tương tác với website để cải thiện dịch vụ.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-semibold">Cookie</th>
                          <th className="text-left py-2 font-semibold">Mục đích</th>
                          <th className="text-left py-2 font-semibold">Thời hạn</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-700">
                        <tr className="border-b">
                          <td className="py-2 font-mono text-xs">_ga</td>
                          <td className="py-2">Google Analytics - Phân biệt người dùng</td>
                          <td className="py-2">2 năm</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-mono text-xs">_gid</td>
                          <td className="py-2">Google Analytics - Phân biệt người dùng</td>
                          <td className="py-2">24 giờ</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono text-xs">_gat</td>
                          <td className="py-2">Google Analytics - Giới hạn tỷ lệ yêu cầu</td>
                          <td className="py-2">1 phút</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">3. Cookies của bên thứ ba</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Chúng tôi sử dụng dịch vụ của bên thứ ba có thể đặt cookies trên thiết bị của bạn:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Google Analytics</h4>
                  <p className="text-sm">Phân tích lưu lượng truy cập và hành vi người dùng</p>
                  <a 
                    href="https://policies.google.com/privacy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline text-sm mt-2 inline-block"
                  >
                    Chính sách riêng tư →
                  </a>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Vercel Analytics</h4>
                  <p className="text-sm">Giám sát hiệu suất website</p>
                  <a 
                    href="https://vercel.com/legal/privacy-policy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline text-sm mt-2 inline-block"
                  >
                    Chính sách riêng tư →
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Quản lý cookies</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Bạn có thể kiểm soát và xóa cookies thông qua cài đặt trình duyệt:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">🌐 Chrome</h4>
                  <p className="text-sm">Settings → Privacy and security → Cookies and other site data</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">🦊 Firefox</h4>
                  <p className="text-sm">Options → Privacy & Security → Cookies and Site Data</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">🧭 Safari</h4>
                  <p className="text-sm">Preferences → Privacy → Manage Website Data</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">🌊 Edge</h4>
                  <p className="text-sm">Settings → Cookies and site permissions → Cookies and site data</p>
                </div>
              </div>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                <p className="text-yellow-900">
                  <strong>Lưu ý:</strong> Nếu bạn chặn hoặc xóa cookies, một số tính năng của website có thể không hoạt động đúng cách.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">5. Do Not Track (DNT)</h2>
            <p className="text-gray-700">
              Chúng tôi tôn trọng tín hiệu "Do Not Track" từ trình duyệt của bạn. Khi DNT được bật, 
              chúng tôi sẽ không sử dụng cookies phân tích hoặc theo dõi hành vi của bạn.
            </p>
          </section>

          {/* Section 6 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">6. Cập nhật chính sách</h2>
            <p className="text-gray-700">
              Chúng tôi có thể cập nhật chính sách cookies này theo thời gian. Thay đổi sẽ được đăng trên trang này 
              với ngày cập nhật mới. Chúng tôi khuyến khích bạn xem lại định kỳ.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl p-6 mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Liên hệ</h2>
            <p className="text-gray-700 mb-4">
              Nếu bạn có câu hỏi về chính sách cookies, vui lòng liên hệ:
            </p>
            <div className="space-y-2 text-gray-700">
              <p><strong>Email:</strong> <a href="mailto:webappsaas.ai@gmail.com" className="text-primary-600 hover:underline">webappsaas.ai@gmail.com</a></p>
              <p><strong>Website:</strong> <a href="https://planai.io.vn" className="text-primary-600 hover:underline">https://planai.io.vn</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
