'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, HelpCircle, Mail, MessageCircle, ChevronDown, ChevronUp,
  Book, Zap, Shield, CreditCard
} from 'lucide-react'

const faqs = [
  {
    category: 'Bắt đầu',
    icon: Book,
    questions: [
      {
        q: 'PlanAI là gì?',
        a: 'PlanAI là nền tảng lập kế hoạch tài chính cá nhân hóa sử dụng trí tuệ nhân tạo. Chúng tôi giúp bạn tạo kế hoạch tài chính chi tiết dựa trên mục tiêu, thu nhập và hoàn cảnh cá nhân của bạn.'
      },
      {
        q: 'Làm thế nào để tạo kế hoạch đầu tiên?',
        a: 'Rất đơn giản! Nhấn vào "Tạo Plan" trên sidebar, sau đó trò chuyện với AI về mục tiêu tài chính của bạn. AI sẽ hỏi các câu hỏi để hiểu rõ tình hình của bạn, sau đó tạo kế hoạch chi tiết với lộ trình cụ thể.'
      },
      {
        q: 'Tôi có cần kiến thức tài chính để sử dụng PlanAI không?',
        a: 'Không cần! PlanAI được thiết kế để dễ sử dụng cho mọi người. AI sẽ hướng dẫn bạn từng bước và giải thích các khái niệm tài chính một cách dễ hiểu.'
      }
    ]
  },
  {
    category: 'Gói dịch vụ',
    icon: CreditCard,
    questions: [
      {
        q: 'Gói Free có những gì?',
        a: 'Gói Free cho phép bạn tạo 1 kế hoạch, 5 cuộc trò chuyện với AI, và tối đa 1,000 từ. Gói này có thời hạn 30 ngày và chỉ được sử dụng 1 lần duy nhất cho mỗi tài khoản.'
      },
      {
        q: 'Tôi có thể nâng cấp gói bất cứ lúc nào không?',
        a: 'Có! Bạn có thể nâng cấp gói bất cứ lúc nào bằng cách nhấn vào "Nâng cấp gói" trên sidebar hoặc truy cập trang Pricing. Các tính năng cao cấp sẽ được kích hoạt ngay lập tức.'
      },
      {
        q: 'Điều gì xảy ra khi gói Free hết hạn?',
        a: 'Sau 30 ngày, gói Free sẽ hết hạn và bạn sẽ không thể tạo kế hoạch mới hoặc chat với AI. Tuy nhiên, bạn vẫn có thể xem các kế hoạch đã tạo. Để tiếp tục sử dụng, vui lòng nâng cấp lên gói trả phí.'
      },
      {
        q: 'Sự khác biệt giữa các gói trả phí là gì?',
        a: 'Gói 1 (99k/tháng): 1 plan, 40 chats, 5000-8000 từ. Gói 2 (199k/tháng): 3 plans, 90 chats, 9000-12000 từ. Gói 3 (299k/tháng): 6 plans, 160 chats, 15000-20000 từ. Tất cả gói đều có thời hạn 30 ngày.'
      }
    ]
  },
  {
    category: 'Tính năng',
    icon: Zap,
    questions: [
      {
        q: 'Tôi có thể xuất kế hoạch sang định dạng nào?',
        a: 'Bạn có thể xuất kế hoạch sang PDF, Word (DOCX), Google Sheets, và Notion. Mỗi định dạng được tối ưu hóa để bạn dễ dàng theo dõi và thực hiện kế hoạch.'
      },
      {
        q: 'Kế hoạch của tôi được lưu trữ trong bao lâu?',
        a: 'Mặc định, kế hoạch được lưu trong 30 ngày. Bạn có thể thay đổi sang chế độ xóa sau 7 ngày trong phần Cài đặt nếu muốn tiết kiệm dung lượng.'
      },
      {
        q: 'AI có thể giúp tôi điều chỉnh kế hoạch không?',
        a: 'Có! Bạn có thể chat với AI bất cứ lúc nào để điều chỉnh kế hoạch theo tình hình mới. AI sẽ cập nhật kế hoạch dựa trên thông tin bạn cung cấp.'
      },
      {
        q: 'Tôi có thể tạo nhiều kế hoạch cho các mục tiêu khác nhau không?',
        a: 'Có! Tùy thuộc vào gói bạn đang sử dụng. Gói Free và Gói 1 cho phép 1 plan, Gói 2 cho phép 3 plans, và Gói 3 cho phép 6 plans trong chu kỳ 30 ngày.'
      }
    ]
  },
  {
    category: 'Bảo mật',
    icon: Shield,
    questions: [
      {
        q: 'Thông tin của tôi có an toàn không?',
        a: 'Tuyệt đối! Chúng tôi sử dụng mã hóa SSL/TLS cho tất cả dữ liệu truyền tải và lưu trữ. Thông tin cá nhân và tài chính của bạn được bảo vệ theo tiêu chuẩn ngành cao nhất.'
      },
      {
        q: 'PlanAI có chia sẻ dữ liệu của tôi không?',
        a: 'Không! Dữ liệu của bạn là của bạn. Chúng tôi không bao giờ chia sẻ, bán hoặc cho thuê thông tin cá nhân của bạn cho bên thứ ba. Xem thêm trong Chính sách Bảo mật.'
      },
      {
        q: 'Tôi có thể xóa tài khoản và dữ liệu không?',
        a: 'Có! Bạn có thể xóa tài khoản bất cứ lúc nào trong phần Cài đặt. Khi xóa tài khoản, tất cả dữ liệu của bạn sẽ được xóa vĩnh viễn khỏi hệ thống.'
      }
    ]
  }
]

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null)

  const toggleFAQ = (categoryIndex: number, questionIndex: number) => {
    const key = `${categoryIndex}-${questionIndex}`
    setOpenIndex(openIndex === key ? null : key)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f]">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại Dashboard
          </Link>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trung tâm trợ giúp</h1>
              <p className="text-gray-600 dark:text-gray-400">Tìm câu trả lời cho các câu hỏi thường gặp</p>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg p-6 mb-8 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2">Cần hỗ trợ thêm?</h2>
              <p className="text-primary-100 mb-4">
                Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn. Gửi email cho chúng tôi và chúng tôi sẽ phản hồi trong vòng 24 giờ.
              </p>
              <a
                href="mailto:webappsaas.ai@gmail.com"
                className="inline-flex items-center px-4 py-2 bg-white text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors"
              >
                <Mail className="w-4 h-4 mr-2" />
                webappsaas.ai@gmail.com
              </a>
            </div>
            <MessageCircle className="w-16 h-16 text-primary-200 hidden md:block" />
          </div>
        </div>

        {/* FAQs */}
        <div className="space-y-6">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                    <category.icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{category.category}</h2>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {category.questions.map((faq, questionIndex) => {
                  const key = `${categoryIndex}-${questionIndex}`
                  const isOpen = openIndex === key
                  
                  return (
                    <div key={questionIndex}>
                      <button
                        onClick={() => toggleFAQ(categoryIndex, questionIndex)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                      >
                        <span className="font-medium text-gray-900 dark:text-white pr-4">{faq.q}</span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                      </button>
                      
                      {isOpen && (
                        <div className="px-6 pb-4">
                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{faq.a}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Additional Resources */}
        <div className="mt-8 bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Tài nguyên hữu ích</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/pricing"
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Bảng giá</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Xem các gói dịch vụ</p>
              </div>
              <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
            </Link>
            
            <Link
              href="/dashboard/create-plan"
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Hướng dẫn sử dụng</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Bắt đầu tạo kế hoạch</p>
              </div>
              <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
            </Link>
          </div>
        </div>

        {/* Still Need Help */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Vẫn chưa tìm thấy câu trả lời?
          </p>
          <a
            href="mailto:webappsaas.ai@gmail.com"
            className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            <Mail className="w-5 h-5 mr-2" />
            Liên hệ hỗ trợ
          </a>
        </div>
      </div>
    </div>
  )
}
