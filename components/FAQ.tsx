'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const faqs = [
  {
    question: 'PlanAI hoạt động như thế nào?',
    answer: 'PlanAI sử dụng AI tiên tiến để phân tích thông tin cá nhân của bạn và tạo kế hoạch tài chính cá nhân hóa. Bạn chỉ cần chat với AI, chia sẻ mục tiêu và hoàn cảnh, AI sẽ tạo kế hoạch chi tiết như một cuốn Ebook hoàn chỉnh.'
  },
  {
    question: 'Tôi có cần kiến thức tài chính để sử dụng không?',
    answer: 'Không cần! PlanAI được thiết kế cho mọi người, kể cả những người chưa có kinh nghiệm về tài chính. Kế hoạch được trình bày dễ hiểu với hướng dẫn từng bước và tài liệu học tập kèm theo.'
  },
  {
    question: 'Kế hoạch có thực sự phù hợp với tôi không?',
    answer: 'Có! Mỗi kế hoạch được tạo 100% cá nhân hóa dựa trên mục tiêu, thu nhập, độ tuổi, hoàn cảnh cụ thể của bạn. AI phân tích kỹ lưỡng để đưa ra lời khuyên phù hợp nhất.'
  },
  {
    question: 'Tôi có thể chỉnh sửa kế hoạch sau khi tạo không?',
    answer: 'Có thể! Bạn có thể chỉnh sửa trực tiếp trong ứng dụng hoặc chat với AI để điều chỉnh kế hoạch. Hệ thống cũng lưu lịch sử các phiên bản để bạn có thể so sánh và quay lại.'
  },
  {
    question: 'Gói Free có những gì?',
    answer: 'Gói Free bao gồm 5 lượt chat với AI và 1 kế hoạch ngắn để bạn trải nghiệm. Đây là cách tuyệt vời để khám phá PlanAI trước khi nâng cấp lên gói trả phí.'
  },
  {
    question: 'Tôi có thể xuất kế hoạch sang định dạng nào?',
    answer: 'Bạn có thể xuất kế hoạch sang PDF, Word, Google Docs, Google Sheets và Notion. Điều này giúp bạn dễ dàng theo dõi và thực hiện kế hoạch trên các nền tảng quen thuộc.'
  },
  {
    question: 'Thông tin cá nhân của tôi có được bảo mật không?',
    answer: 'Tuyệt đối! Chúng tôi sử dụng mã hóa 256-bit và tuân thủ các tiêu chuẩn bảo mật cao nhất. Thông tin của bạn chỉ được sử dụng để tạo kế hoạch và không được chia sẻ với bên thứ ba.'
  },
  {
    question: 'Tính năng Spiritual Add-on là gì?',
    answer: 'Đây là tính năng tùy chọn kết hợp yếu tố tử vi, thần số học vào kế hoạch tài chính. Bạn có thể bật/tắt tính năng này tùy theo sở thích cá nhân.'
  },
  {
    question: 'Tôi có thể hủy gói dịch vụ bất cứ lúc nào không?',
    answer: 'Có! Bạn có thể hủy bất cứ lúc nào mà không mất phí. Các kế hoạch đã tạo vẫn thuộc về bạn và có thể truy cập ngay cả sau khi hủy gói.'
  },
  {
    question: 'PlanAI có hỗ trợ khách hàng không?',
    answer: 'Có! Chúng tôi hỗ trợ qua email để giải đáp thắc mắc và tiếp nhận góp ý. Vui lòng liên hệ: webappsaas.ai@gmail.com'
  }
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Câu Hỏi Thường Gặp
          </h2>
          <p className="text-xl text-gray-600">
            Tìm câu trả lời cho những thắc mắc phổ biến về PlanAI
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-2xl border border-gray-200 hover:border-primary-200 transition-colors duration-200"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-8 py-6 text-left flex items-center justify-between focus:outline-none"
              >
                <h3 className="text-lg md:text-xl font-bold text-gray-900 pr-4">
                  {faq.question}
                </h3>
                <div className="flex-shrink-0">
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-primary-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>
              
              {openIndex === index && (
                <div className="px-8 pb-6">
                  <div className="border-t border-gray-200 pt-6">
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact support */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Vẫn còn thắc mắc?
            </h3>
            <p className="text-gray-600 mb-6">
              Chúng tôi hỗ trợ qua email. Hãy liên hệ nếu bạn cần thêm thông tin.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:webappsaas.ai@gmail.com"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Gửi Email Hỗ Trợ
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
