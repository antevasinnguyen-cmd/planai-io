'use client'

import { Users, FileText, TrendingUp, Award } from 'lucide-react'

const stats = [
  {
    icon: Users,
    number: '5,000+',
    label: 'Người dùng tin tưởng',
    description: 'Đã sử dụng PlanAI để tạo kế hoạch tài chính'
  },
  {
    icon: FileText,
    number: '17.000+',
    label: 'Kế hoạch được tạo',
    description: 'Các kế hoạch tài chính cá nhân hóa đã được sinh ra'
  },
  {
    icon: TrendingUp,
    number: '95%',
    label: 'Tỷ lệ thành công',
    description: 'Người dùng đạt được mục tiêu tài chính đề ra'
  },
  {
    icon: Award,
    number: '4.9/5',
    label: 'Đánh giá trung bình',
    description: 'Từ phản hồi của người dùng thực tế'
  }
]

export default function Stats() {
  return (
    <section className="py-20 bg-gradient-to-br from-primary-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Con Số Ấn Tượng
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto whitespace-nowrap">
            Hàng nghìn người Việt đã tin tưởng PlanAI để xây dựng tương lai tài chính vững chắc
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <stat.icon className="w-8 h-8 text-white" />
              </div>
              
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {stat.number}
              </div>
              
              <div className="text-lg font-semibold text-primary-600 mb-3">
                {stat.label}
              </div>
              
              <p className="text-gray-600 text-sm leading-relaxed">
                {stat.description}
              </p>
            </div>
          ))}
        </div>

        {/* Additional stats section */}
        <div className="mt-16 bg-white rounded-3xl p-8 md:p-12 shadow-xl">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-4">
              <div className="text-3xl font-bold text-primary-600">169K - 499K</div>
              <div className="text-gray-900 font-semibold">Giá cả phải chăng</div>
              <p className="text-gray-600 text-sm">
                Chỉ từ 169,000đ để có kế hoạch tài chính chuyên nghiệp
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="text-3xl font-bold text-green-600">5-20K từ</div>
              <div className="text-gray-900 font-semibold">Kế hoạch chi tiết</div>
              <p className="text-gray-600 text-sm">
                Từ 5,000 đến 20,000 từ như một cuốn Ebook hoàn chỉnh
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="text-3xl font-bold text-blue-600">23-35 tuổi</div>
              <div className="text-gray-900 font-semibold">Độ tuổi mục tiêu</div>
              <p className="text-gray-600 text-sm">
                Phù hợp với Gen Y/Z có thu nhập ổn định từ 5 triệu+
              </p>
            </div>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-6">Được tin tưởng bởi cộng đồng tại:</p>
          <div className="flex flex-wrap justify-center items-center gap-8 text-gray-400">
            <div className="font-semibold">Hà Nội</div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="font-semibold">TP.HCM</div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="font-semibold">Đà Nẵng</div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="font-semibold">Bắc Ninh</div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="font-semibold">Các tỉnh thành khác</div>
          </div>
        </div>
      </div>
    </section>
  )
}
