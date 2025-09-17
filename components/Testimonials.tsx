'use client'

import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Nguyễn Minh Anh',
    role: 'Nhân viên IT, 28 tuổi',
    location: 'Hà Nội',
    rating: 5,
    content: 'PlanAI đã giúp tôi có kế hoạch rõ ràng để mua nhà trong 3 năm. Kế hoạch chi tiết từng bước, dễ hiểu và thực tế. Tôi đã tiết kiệm được 200 triệu chỉ trong 8 tháng đầu!',
    avatar: 'MA'
  },
  {
    name: 'Trần Văn Hùng',
    role: 'Kinh doanh tự do, 32 tuổi',
    location: 'TP.HCM',
    rating: 5,
    content: 'Từ khi dùng PlanAI, thu nhập của tôi tăng từ 15 triệu lên 35 triệu/tháng. AI đã gợi ý những cách kiếm tiền mà tôi chưa bao giờ nghĩ tới. Đầu tư 289k nhưng thu về gấp 100 lần!',
    avatar: 'TH'
  },
  {
    name: 'Lê Thị Hương',
    role: 'Marketing Manager, 26 tuổi',
    location: 'Đà Nẵng',
    rating: 5,
    content: 'Kế hoạch nghỉ hưu sớm ở tuổi 40 của tôi giờ không còn là giấc mơ. PlanAI đã tạo lộ trình đầu tư cụ thể, kèm checklist hàng ngày. Tôi cảm thấy tự tin hơn về tương lai tài chính.',
    avatar: 'LH'
  },
  {
    name: 'Phạm Đức Nam',
    role: 'Kỹ sư xây dựng, 30 tuổi',
    location: 'Bắc Ninh',
    rating: 5,
    content: 'Tôi đã thử nhiều app lập kế hoạch tài chính nhưng không có cái nào chi tiết như PlanAI. Kế hoạch như một cuốn sách thật sự, có cả phân tích tử vi phù hợp với tính cách tôi.',
    avatar: 'PN'
  },
  {
    name: 'Võ Thị Mai',
    role: 'Nhân viên ngân hàng, 29 tuổi',
    location: 'Hà Nội',
    rating: 5,
    content: 'Mặc dù làm trong ngành tài chính nhưng tôi vẫn học được rất nhiều từ PlanAI. Cách AI phân tích và đưa ra lời khuyên rất chuyên nghiệp, không thua gì các chuyên gia tư vấn.',
    avatar: 'VM'
  },
  {
    name: 'Hoàng Văn Đức',
    role: 'Giáo viên, 27 tuổi',
    location: 'TP.HCM',
    rating: 5,
    content: 'Với mức lương giáo viên, tôi nghĩ khó có thể giàu có. Nhưng PlanAI đã chỉ cho tôi cách tối ưu hóa tài chính và tạo thêm nguồn thu. Giờ tôi có kế hoạch mua xe trong năm tới!',
    avatar: 'HD'
  }
]

export default function Testimonials() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Trusted by the Community
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Hàng nghìn người Việt đã thay đổi cuộc sống tài chính nhờ PlanAI
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-2xl p-8 hover:bg-white hover:shadow-xl transition-all duration-300 border border-gray-100"
            >
              {/* Quote icon */}
              <Quote className="w-8 h-8 text-primary-600 mb-4" />
              
              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              
              {/* Content */}
              <p className="text-gray-700 leading-relaxed mb-6">
                "{testimonial.content}"
              </p>
              
              {/* Author */}
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {testimonial.role}
                  </div>
                  <div className="text-sm text-primary-600">
                    {testimonial.location}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust indicators */}
        <div className="mt-16 bg-gradient-to-r from-primary-50 to-blue-50 rounded-3xl p-8 md:p-12">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Được Tin Tưởng Bởi Cộng Đồng
            </h3>
            
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">4.9/5</div>
                <div className="text-gray-600">Đánh giá trung bình</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">95%</div>
                <div className="text-gray-600">Tỷ lệ thành công</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">5,000+</div>
                <div className="text-gray-600">Người dùng hài lòng</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">17.000+</div>
                <div className="text-gray-600">Kế hoạch được sử dụng</div>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-4 text-sm text-gray-600">
              <span className="bg-white px-4 py-2 rounded-full">✓ Nhân viên văn phòng</span>
              <span className="bg-white px-4 py-2 rounded-full">✓ Kinh doanh tự do</span>
              <span className="bg-white px-4 py-2 rounded-full">✓ Chuyên gia IT</span>
              <span className="bg-white px-4 py-2 rounded-full">✓ Giáo viên</span>
              <span className="bg-white px-4 py-2 rounded-full">✓ Và nhiều nghề khác</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
