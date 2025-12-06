'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Star, Zap, ArrowRight, Shirt, Sparkles } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const pricingTiers = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'Miễn phí',
    description: 'Trải nghiệm PlanAI với các tính năng cơ bản',
    features: [
      '5 Chat với AI',
      'Phân tích cơ bản',
      '1 Kế hoạch ngắn'
    ],
    limitations: [
      'Không có tính năng nâng cao'
    ],
    buttonText: 'Bắt đầu miễn phí',
    buttonStyle: 'btn-secondary',
    popular: false
  },
  {
    id: 'basic',
    name: 'Gói 1',
    price: 249000,
    period: 'VNĐ',
    description: 'Phù hợp cho người mới bắt đầu lập kế hoạch tài chính',
    features: [
      '40 Chat với AI lập kế hoạch',
      '2 Ebook plan cá nhân hóa độc quyền',
      'Phân tích đầy đủ + Lộ trình',
      'Đề xuất hành động để đạt được mục tiêu',
      'Plan chuyên sâu + tất cả tài liệu liên quan',
      'Xuất file PDF, Word, Docs',
      'Xuất sang Notion, Google Trang tính, Google Tài liệu',
      '(Add-on) Phân tích kết hợp tử vi, số mệnh, thần số học',
      'Mở khoá tính năng đọc các bài blog trả phí'
    ],
    buttonText: 'Chọn gói này',
    buttonStyle: 'btn-primary',
    popular: false
  },
  {
    id: 'pro',
    name: 'Gói 2 - Pro',
    price: 479000,
    period: 'VNĐ',
    description: 'Dành cho người muốn có nhiều kế hoạch và tính năng nâng cao',
    features: [
      '100 Chat với AI lập kế hoạch',
      '4 Ebook plan cá nhân hóa độc quyền',
      'Phân tích đầy đủ + Lộ trình',
      'Đề xuất hành động để đạt được mục tiêu',
      'Plan chuyên sâu + tất cả tài liệu liên quan',
      'Xuất file PDF, Word, Docs',
      'Xuất sang Notion, Google Trang tính, Google Tài liệu',
      '(Add-on) Phân tích kết hợp tử vi, số mệnh, thần số học',
      'Mở khóa tính năng đọc các bài Blog trả phí',
      'Truy cập sớm các tính năng mới nhất'
    ],
    buttonText: 'Chọn gói Pro',
    buttonStyle: 'btn-primary',
    popular: true
  }
]

export default function PricingPage() {

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="pt-24 pb-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Message - Giá chỉ bằng 1 chiếc áo */}
          <div className="mb-16">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 md:p-12 border-2 border-primary-100 shadow-xl">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Left: Hook message */}
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm">
                    <Sparkles className="w-5 h-5 text-primary-600" />
                    <span className="text-sm font-medium text-primary-700">Ưu đãi đặc biệt</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                    Giá chỉ bằng 1 chiếc áo
                  </h2>
                  <p className="text-xl text-gray-600">
                    Có ngay bản kế hoạch tài chính đáng mơ ước
                  </p>
                  <div className="flex items-center gap-4 pt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                        <Check className="w-6 h-6 text-primary-600" />
                      </div>
                      <span className="text-sm text-gray-600">Cá nhân hóa 100%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-purple-600" />
                      </div>
                      <span className="text-sm text-gray-600">AI thông minh</span>
                    </div>
                  </div>
                </div>
                
                {/* Right: Illustration - 3 pricing tiers */}
                <div className="space-y-4">
                  {/* Gói 1 */}
                  <div className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Shirt className="w-12 h-12 text-gray-900" strokeWidth={1.5} />
                        <span className="text-lg font-semibold text-gray-900">Gói 1</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary-600">249K</div>
                        <div className="text-xs text-gray-500">VNĐ</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Gói 2 - Pro */}
                  <div className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex">
                          <Shirt className="w-12 h-12 text-gray-900" strokeWidth={1.5} />
                          <Shirt className="w-12 h-12 text-gray-900 -ml-4" strokeWidth={1.5} />
                        </div>
                        <span className="text-lg font-semibold text-gray-900">Gói 2 - Pro</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">479K</div>
                        <div className="text-xs text-gray-500">VNĐ</div>
                      </div>
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4">
              Chọn Gói Phù Hợp Với Bạn
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Bắt đầu miễn phí và nâng cấp khi cần. Tất cả gói đều bao gồm kế hoạch tài chính cá nhân hóa hoàn toàn.
            </p>
            
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pricingTiers.map((tier) => (
              <div
                key={tier.id}
                className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                  tier.popular
                    ? 'border-primary-500 transform scale-105'
                    : 'border-gray-200 hover:border-primary-200'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium flex items-center shadow-lg min-w-max">
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1 fill-white flex-shrink-0" />
                      <span className="whitespace-nowrap">Phổ biến nhất</span>
                    </div>
                  </div>
                )}

                <div className="p-8 flex flex-col h-full">
                  {/* Header */}
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {tier.name}
                    </h3>
                    <div className="mb-4 text-center">
                      {tier.price === 0 ? (
                        <div className="space-y-1">
                          <span className="text-4xl font-bold text-gray-900 block">Miễn phí</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-baseline justify-center">
                            <span className="text-4xl font-bold text-gray-900">{tier.price.toLocaleString()}</span>
                            <span className="text-gray-600 ml-2">VNĐ</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-6">
                      {tier.description}
                    </p>
                  </div>

                  {/* CTA Button - ngay dưới giá tiền */}
                  <div className="mb-6">
                    <Link
                      href={tier.id === 'free' ? '/start' : `/payment/checkout?plan=${tier.id}`}
                      className={`w-full inline-flex items-center justify-center py-3 px-4 rounded-lg font-medium transition-all duration-200 ${tier.buttonStyle}`}
                    >
                      {tier.price === 0 ? 'Bắt đầu miễn phí' : tier.buttonText}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </div>

                  {/* Features */}
                  <div className="space-y-4 flex-1">
                    {tier.features.map((feature, index) => (
                      <div key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))}
                    
                    {tier.limitations && (
                      <div className="pt-4 border-t border-gray-200">
                        {tier.limitations.map((limitation, index) => (
                          <div key={index} className="flex items-start mb-2">
                            <div className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0">
                              <div className="w-1 h-1 bg-gray-400 rounded-full mx-auto mt-2"></div>
                            </div>
                            <span className="text-gray-500 text-sm">{limitation}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>


          {/* Expected Users */}
          <div className="mt-16 bg-gradient-to-r from-primary-50 to-blue-50 rounded-3xl p-8 md:p-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Dự Kiến Người Dùng
              </h3>
              <p className="text-gray-600">
                Mục tiêu người dùng trả phí hàng tháng của chúng tôi
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 text-center max-w-2xl mx-auto">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-3xl font-bold text-primary-600 mb-2">10,000</div>
                <div className="text-gray-900 font-medium mb-1">Gói 1</div>
                <div className="text-gray-600 text-sm">user trả phí/tháng</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-3xl font-bold text-blue-600 mb-2">6,000</div>
                <div className="text-gray-900 font-medium mb-1">Gói 2 - Pro</div>
                <div className="text-gray-600 text-sm">user trả phí/tháng</div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Câu Hỏi Thường Gặp Về Pricing
            </h3>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Tôi có thể thay đổi gói bất cứ lúc nào không?
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Có! Bạn có thể nâng cấp hoặc hạ cấp gói bất cứ lúc nào. Chúng tôi sẽ tính phí theo tỷ lệ thời gian sử dụng.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Gói Free có giới hạn thời gian không?
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Không! Gói Free không có giới hạn thời gian, bạn có thể sử dụng miễn phí vĩnh viễn với 5 chat và 1 kế hoạch ngắn.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Thanh toán có an toàn không?
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Tuyệt đối an toàn! Chúng tôi sử dụng SePay với mã hóa 256-bit và tuân thủ các tiêu chuẩn bảo mật cao nhất.
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Tôi có thể hủy bất cứ lúc nào không?
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Có! Không có cam kết dài hạn. Bạn có thể hủy bất cứ lúc nào và vẫn giữ được các kế hoạch đã tạo.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Phương thức thanh toán được hỗ trợ?
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Bạn có thể thanh toán nhanh qua SePay bằng mã QR/chuyển khoản. Tất cả giao dịch đều được mã hóa an toàn và xác nhận ngay lập tức.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Tính năng Spiritual có tính phí thêm không?
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Không! Tính năng phân tích tử vi, thần số học đã được bao gồm trong tất cả các gói trả phí.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-3xl p-8 md:p-12 text-white">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                Sẵn sàng bắt đầu hành trình tài chính?
              </h3>
              <p className="text-primary-200 mb-8 max-w-2xl mx-auto whitespace-nowrap">
                Hơn 5,000 người đã tin tưởng PlanAI để xây dựng tương lai tài chính. Bạn sẽ là người tiếp theo?
              </p>
              <Link href="/start" className="inline-flex items-center bg-white text-primary-600 hover:bg-gray-100 font-semibold py-4 px-8 rounded-lg transition-colors">
                Bắt đầu miễn phí ngay
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}
