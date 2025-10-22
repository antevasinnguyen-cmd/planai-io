'use client'

import { useEffect, useState } from 'react'
import { FileText, ArrowRight, CheckCircle, Calendar, Target, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

export default function PlanDemo() {
  const [activeTab, setActiveTab] = useState('overview')
  const [fullPlan, setFullPlan] = useState<string>('')
  const [isLoadingFull, setIsLoadingFull] = useState<boolean>(false)

  useEffect(() => {
    // Preload the full plan for better UX
    const load = async () => {
      try {
        setIsLoadingFull(true)
        const res = await fetch('/demo/plan-demo.md')
        const text = await res.text()
        setFullPlan(text)
      } catch (e) {
        setFullPlan('# Không thể tải Bản Demo\nVui lòng tải lại trang hoặc thử lại sau.')
      } finally {
        setIsLoadingFull(false)
      }
    }
    load()
  }, [])

  const planSections = {
    overview: {
      title: 'Tổng quan kế hoạch',
      content: `
        **Mục tiêu:** Có 2 tỷ VNĐ trước 30 tuổi (trong 4 năm) để tích lũy mua nhà và khởi sự kinh doanh online
        
        **Thông tin cá nhân (persona demo):**
        - Tuổi hiện tại: 25 tuổi
        - Công việc: Nhân viên văn phòng
        - Kỹ năng nổi bật: Sale/Bán hàng, giao tiếp
        - Mong muốn học hỏi: Kinh doanh online (thương mại điện tử/affiliate/content)
        - Thu nhập hiện tại: 15 triệu/tháng
        - Thời gian thực hiện: 4 năm
        - Mức độ rủi ro: Trung bình
        
        **Phân tích tình hình:**
        - Điểm mạnh: Kỹ năng sale tốt, khả năng giao tiếp và thuyết phục; còn trẻ, dư địa thời gian lớn
        - Điểm yếu: Chưa có kinh nghiệm vận hành kinh doanh online; vốn khởi nghiệp hạn chế
        - Cơ hội: Tăng trưởng thương mại điện tử; mô hình kinh doanh tinh gọn, vốn nhỏ; tận dụng kỹ năng sale để tạo doanh số
        - Thách thức: Cạnh tranh cao; yêu cầu kỷ luật và nhất quán học tập/thử nghiệm trong 6-12 tháng đầu
      `
    },
    roadmap: {
      title: 'Lộ trình chi tiết',
      content: `
        **Năm 1:** (Học & xây nền tảng)
        - Tiết kiệm: 7-8 triệu/tháng (kỷ luật 50-55% thu nhập ròng)
        - Học tập: 3 trụ cột kinh doanh online (sản phẩm, kênh phân phối, nội dung/bán hàng)
        - Thử nghiệm: 2-3 sản phẩm ngách phù hợp kỹ năng sale; triển khai kênh TikTok/FB/Shoppe cơ bản
        - Mục tiêu tài chính: 120-150 triệu tích lũy + tạo được kênh bán đầu tiên (>=10 đơn/tháng)
        
        **Năm 2:** (Tăng tốc & tạo dòng tiền)
        - Xây hệ thống nội dung bán hàng: 3-4 video/ngày (ngắn), 2 bài dài/tuần
        - Chuẩn hóa quy trình sale: kịch bản inbox, chăm sóc khách, upsell/cross-sell
        - Doanh thu phụ: 10-15 triệu/tháng từ kinh doanh online; bắt đầu tái đầu tư 30-40%
        - Mục tiêu tài chính: 400-500 triệu (gồm tiết kiệm + lợi nhuận)
        
        **Năm 3:** (Mở rộng & tối ưu lợi nhuận)
        - Mở rộng kênh: sàn TMĐT + kênh riêng (website/landing)
        - Thuê part-time: 1-2 bạn hỗ trợ CSKH/đóng gói; tập trung vào tăng trưởng
        - Đầu tư tài chính thận trọng (ETF/Index/tiền gửi) 40-50% quỹ tích lũy
        - Mục tiêu tài chính: 1.1-1.3 tỷ
        
        **Năm 4:** (Quy mô hóa & cán mốc 2 tỷ)
        - Tối ưu biên lợi nhuận, mở rộng danh mục sản phẩm lợi thế sale
        - Xây quỹ dự phòng 6-9 tháng chi tiêu; phần còn lại tích lũy tài sản (ETF/BĐS nhỏ)
        - Mục tiêu tài chính: 2 tỷ VNĐ trước tuổi 30
      `
    },
    tasks: {
      title: 'Checklist hàng ngày/tháng',
      content: `
        **Hàng ngày:**
        ✓ Ghi chép chi tiêu & doanh thu/chi phí kênh kinh doanh
        ✓ 60-90 phút học/triển khai nội dung bán hàng
        ✓ Kiểm tra số liệu kênh: view, CTR, chuyển đổi
        
        **Hàng tuần:**
        ✓ Phân tích hiệu suất kênh & tối ưu nội dung
        ✓ Học 1 kỹ năng mới (quay/dựng/nội dung/ads/sale)
        ✓ Networking với cộng đồng kinh doanh online
        
        **Hàng tháng:**
        ✓ Đánh giá P/L; điều chỉnh chiến lược sản phẩm/kênh
        ✓ Tăng tỷ lệ tiết kiệm theo mức tăng thu nhập
        ✓ Tái đầu tư 30-40% lợi nhuận vào kênh hiệu quả
        
        **Hàng quý:**
        ✓ Review toàn bộ danh mục/kênh và cập nhật mục tiêu
        ✓ Mở rộng sản phẩm hoặc kênh mới nếu đạt chỉ tiêu
        ✓ Tham gia khóa học nâng cao (ads, funnel, branding)
      `
    }
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16 px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 break-words">
            Demo Kế Hoạch Chi Tiết
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto break-words">
            Xem trước một kế hoạch tài chính hoàn chỉnh được tạo bởi AI - như một cuốn Ebook cá nhân hóa
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Plan Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 sm:px-8 py-4 sm:py-6 overflow-x-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 break-words">
                    Kế Hoạch Tài Chính Cá Nhân
                  </h3>
                  <p className="text-primary-200 text-sm sm:text-base break-words">
                    "Có 2 tỷ VNĐ trước 30 tuổi" - Được tạo bởi PlanAI
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-white text-xs sm:text-sm mb-1 whitespace-nowrap">Độ dài kế hoạch</div>
                  <div className="text-xl sm:text-2xl font-bold text-white whitespace-nowrap">8,500 từ</div>
                </div>
              </div>
            </div>

            {/* Plan Navigation */}
            <div className="border-b border-gray-200 overflow-x-auto">
              <div className="flex items-center space-x-2 sm:space-x-4 px-4 sm:px-6 py-3 sm:py-4 min-w-min">
              {Object.values(planSections).map((section) => (
                <button
                  key={section.title}
                  onClick={() => setActiveTab(section.title === 'Tổng quan kế hoạch' ? 'overview' : section.title === 'Lộ trình chi tiết' ? 'roadmap' : 'tasks')}
                  className={`px-3 sm:px-4 py-2 rounded-full border transition-colors whitespace-nowrap text-sm sm:text-base ${
                    (activeTab === 'overview' && section.title === 'Tổng quan kế hoạch') ||
                    (activeTab === 'roadmap' && section.title === 'Lộ trình chi tiết') ||
                    (activeTab === 'tasks' && section.title === 'Checklist hàng ngày/tháng')
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {section.title}
                </button>
              ))}
              <button
                onClick={() => setActiveTab('full')}
                className={`px-3 sm:px-4 py-2 rounded-full border transition-colors whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'full'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Bản demo đầy đủ
              </button>
            </div>
            </div>

            {/* Plan Content (scrollable) */}
            <div className="p-4 sm:p-8 max-h-[600px] overflow-y-auto">
              {activeTab === 'full' ? (
                <div className="prose prose-sm sm:prose-lg max-w-none">
                  {isLoadingFull ? (
                    <div className="text-gray-500 text-sm sm:text-base">\u0110ang tải Bản demo...</div>
                  ) : (
                    <ReactMarkdown>{fullPlan}</ReactMarkdown>
                  )}
                </div>
              ) : (
                <div className="prose prose-sm sm:prose-lg max-w-none">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center break-words">
                    {activeTab === 'overview' && <Target className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary-600 flex-shrink-0" />}
                    {activeTab === 'roadmap' && <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary-600 flex-shrink-0" />}
                    {activeTab === 'tasks' && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary-600 flex-shrink-0" />}
                    {planSections[activeTab as keyof typeof planSections].title}
                  </h3>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                    {planSections[activeTab as keyof typeof planSections].content}
                  </div>
                </div>
              )}
            </div>

            {/* Plan Actions */}
            <div className="bg-gray-50 px-4 sm:px-8 py-4 sm:py-6 border-t border-gray-200 overflow-x-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                  <div className="flex items-center whitespace-nowrap">
                    <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                    8,500 từ
                  </div>
                  <div className="flex items-center whitespace-nowrap">
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                    95% khả năng thành công
                  </div>
                  <div className="flex items-center whitespace-nowrap">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                    4 năm thực hiện
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
                  <Link href="/start" className="btn-primary whitespace-nowrap inline-flex text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start">
                    Tạo kế hoạch riêng bạn →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Demo notice */}
          <div className="mt-6 sm:mt-8 text-center px-4">
            <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 bg-yellow-100 text-yellow-800 rounded-full text-sm sm:text-base">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>Đây chỉ là bản demo. Kế hoạch thực tế sẽ chi tiết và cá nhân hóa hơn nhiều!</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
