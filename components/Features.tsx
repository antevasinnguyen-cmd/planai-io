'use client'

import { Brain, MessageSquare, FileText, Download, Zap, Shield } from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'AI Thông Minh',
    description: 'Sử dụng công nghệ AI tiên tiến để phân tích dữ liệu và tạo kế hoạch tài chính cá nhân hóa chính xác nhất'
  },
  {
    icon: MessageSquare,
    title: 'Chat Tương Tác',
    description: 'Trò chuyện tự nhiên với AI để thu thập thông tin và điều chỉnh kế hoạch theo nhu cầu cụ thể của bạn'
  },
  {
    icon: FileText,
    title: 'Kế Hoạch Chi Tiết',
    description: 'Nhận kế hoạch tài chính như một cuốn Ebook độc quyền với lộ trình, checklist và tài liệu học tập'
  },
  {
    icon: Download,
    title: 'Xuất Đa Định Dạng',
    description: 'Xuất kế hoạch sang PDF, Word, Google Sheets, Notion để dễ dàng theo dõi và thực hiện'
  },
  {
    icon: Zap,
    title: 'Cá Nhân Hóa 100%',
    description: 'Mỗi kế hoạch được tạo riêng cho bạn dựa trên mục tiêu, thu nhập và hoàn cảnh cá nhân'
  },
  {
    icon: Shield,
    title: 'Bảo Mật Tuyệt Đối',
    description: 'Thông tin cá nhân được mã hóa và bảo vệ theo tiêu chuẩn bảo mật cao nhất'
  }
]

export default function Features() {
  return (
    <section id="benefits" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Tính Năng AI Vượt Trội
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Khám phá những tính năng mạnh mẽ giúp bạn tạo ra kế hoạch tài chính hoàn hảo
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 bg-gray-50 hover:bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Additional feature highlight */}
        <div className="mt-16 bg-gradient-to-r from-primary-50 to-blue-50 rounded-3xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Bạn cần làm gì?
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Giúp AI hiểu về bạn và nhu cầu của bạn. Thông tin đưa càng chi tiết, kế hoạch được tạo ra càng chính xác với bạn.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mr-3"></div>
                  Giúp AI hiểu đúng về mục tiêu và hoàn cảnh của bạn
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mr-3"></div>
                  Dữ liệu càng chi tiết, kế hoạch càng chính xác
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mr-3"></div>
                  AI có thể hỏi thêm qua chat nhằm hiểu rõ hơn các thông tin
                </li>
              </ul>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">1</span>
                    </div>
                    <span className="text-gray-900 font-medium">Mục tiêu tài chính?</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">2</span>
                    </div>
                    <span className="text-gray-900 font-medium">Thời gian thực hiện?</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">3</span>
                    </div>
                    <span className="text-gray-900 font-medium">Thu nhập hiện tại?</span>
                  </div>
                  <div className="mt-6 p-4 bg-primary-50 rounded-lg">
                    <p className="text-primary-700 text-sm font-medium">
                      ✨ AI sẽ hỏi thêm thông tin qua chat để tối ưu kế hoạch
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Spiritual Add-on */}
        <div className="mt-12 bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Tính năng thú vị với Spiritual Add-on
              </h3>
              <p className="text-lg text-gray-600">
                Tùy chọn kết hợp yếu tố tử vi, thần số học vào kế hoạch tài chính. Bạn có thể bật/tắt tính năng này tùy theo sở thích cá nhân để tăng cảm hứng và mức độ gắn kết với lộ trình.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="space-y-4 text-gray-700">
                <div className="flex items-center"><span className="w-2 h-2 bg-purple-600 rounded-full mr-3"></span> Gợi ý thời điểm thuận lợi để hành động</div>
                <div className="flex items-center"><span className="w-2 h-2 bg-purple-600 rounded-full mr-3"></span> Phù hợp tính cách – tăng tính kỷ luật</div>
                <div className="flex items-center"><span className="w-2 h-2 bg-purple-600 rounded-full mr-3"></span> Dễ bật/tắt – không ảnh hưởng cốt lõi tài chính</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
