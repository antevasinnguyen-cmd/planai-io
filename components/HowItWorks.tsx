'use client'

import { MessageCircle, Brain, FileText, Download } from 'lucide-react'

const steps = [
  {
    step: '01',
    icon: MessageCircle,
    title: 'Chat với AI',
    description: 'Chia sẻ mục tiêu tài chính và thông tin cá nhân qua chat tự nhiên. AI sẽ hỏi thêm để hiểu rõ hoàn cảnh của bạn.',
    details: [
      'Chỉ cần 3 thông tin cơ bản để bắt đầu',
      'AI hỏi thêm qua chat khi cần thiết',
      'Không cần điền form dài dòng'
    ]
  },
  {
    step: '02',
    icon: Brain,
    title: 'AI Phân Tích',
    description: 'AI sử dụng công nghệ tiên tiến để phân tích dữ liệu, đánh giá tình hình và tạo chiến lược phù hợp với bạn.',
    details: [
      'Phân tích điểm mạnh, điểm yếu, cơ hội, thách thức',
      'Tính toán lộ trình tài chính chi tiết',
      'Cá nhân hóa 100% cho từng người dùng'
    ]
  },
  {
    step: '03',
    icon: FileText,
    title: 'Nhận Kế Hoạch',
    description: 'Nhận kế hoạch tài chính hoàn chỉnh như một cuốn Ebook với lộ trình, checklist và tài liệu học tập.',
    details: [
      'Kế hoạch từ 5,000 - 20,000 từ',
      'Lộ trình theo tháng/quý/năm',
      'Checklist hàng ngày, tài liệu học tập'
    ]
  },
  {
    step: '04',
    icon: Download,
    title: 'Xuất & Thực Hiện',
    description: 'Xuất kế hoạch sang nhiều định dạng và bắt đầu thực hiện. Có thể chỉnh sửa và cập nhật khi cần.',
    details: [
      'Xuất PDF, Word, Google Sheets, Notion',
      'Chỉnh sửa trực tiếp trong ứng dụng',
      'Theo dõi tiến độ và điều chỉnh'
    ]
  }
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Hướng Dẫn Sử Dụng
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Chỉ 4 bước đơn giản để có kế hoạch tài chính hoàn hảo
          </p>
        </div>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-24 left-1/2 transform -translate-x-1/2 w-full max-w-4xl">
            <div className="h-0.5 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Step card */}
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 relative z-10">
                  {/* Step number */}
                  <div className="absolute -top-4 left-8">
                    <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {step.step}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 bg-gradient-to-r from-primary-100 to-blue-100 rounded-2xl flex items-center justify-center mb-6 mt-4">
                    <step.icon className="w-8 h-8 text-primary-600" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {step.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {step.description}
                  </p>

                  {/* Details */}
                  <ul className="space-y-2">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start text-sm text-gray-500">
                        <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Arrow for mobile */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center mt-6 mb-2">
                    <div className="w-0.5 h-8 bg-gradient-to-b from-primary-400 to-primary-200"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Additional info */}
        <div className="mt-16 bg-white rounded-3xl p-8 md:p-12 shadow-lg">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Tại Sao Chọn PlanAI?
            </h3>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">⚡</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Nhanh Chóng</h4>
                <p className="text-gray-600 text-sm">Có kế hoạch hoàn chỉnh chỉ trong 10-15 phút</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">🎯</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Chính Xác</h4>
                <p className="text-gray-600 text-sm">AI phân tích dựa trên dữ liệu thực tế và kinh nghiệm</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">💎</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Cá Nhân Hóa</h4>
                <p className="text-gray-600 text-sm">Mỗi kế hoạch được tạo riêng cho hoàn cảnh của bạn</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
