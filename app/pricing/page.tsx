'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Star, Zap, ArrowRight } from 'lucide-react'
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
      'Giới hạn 1,000 từ',
      'Không có tính năng nâng cao'
    ],
    buttonText: 'Bắt đầu miễn phí',
    buttonStyle: 'btn-secondary',
    popular: false
  },
  {
    id: 'basic',
    name: 'Gói 1',
    price: 169000,
    period: 'VNĐ',
    description: 'Phù hợp cho người mới bắt đầu lập kế hoạch tài chính',
    features: [
      '40 Chat với AI lập kế hoạch',
      '1 Ebook plan cá nhân hóa độc quyền (5.000 - 8.000 từ)',
      'Phân tích đầy đủ + Lộ trình + Sơ đồ nhánh',
      'Plan chuyên sâu + tất cả tài liệu liên quan',
      'Xuất file PDF, Word, Docs',
      'Xuất sang Notion, Google Trang tính, Google Tài liệu',
      'Phân tích kết hợp tử vi, số mệnh, thần số học'
    ],
    buttonText: 'Chọn gói này',
    buttonStyle: 'btn-primary',
    popular: false
  },
  {
    id: 'pro',
    name: 'Gói 2 - Pro',
    price: 289000,
    period: 'VNĐ',
    description: 'Dành cho người muốn có nhiều kế hoạch và tính năng nâng cao',
    features: [
      '90 Chat với AI lập kế hoạch',
      '3 Ebook plan cá nhân hóa độc quyền (9.000 - 12.000 từ)',
      'Phân tích đầy đủ + Lộ trình + Sơ đồ nhánh',
      'Plan chuyên sâu + tất cả tài liệu liên quan',
      'Xuất file PDF, Word, Docs',
      'Xuất sang Notion, Google Trang tính, Google Tài liệu',
      'Phân tích kết hợp tử vi, số mệnh, thần số học',
      'Truy cập sớm các tính năng mới nhất',
      'Mở khóa tính năng đọc các bài Blog trả phí'
    ],
    buttonText: 'Chọn gói Pro',
    buttonStyle: 'btn-primary',
    popular: true
  },
  {
    id: 'pro_max',
    name: 'Gói 3 - Pro Max',
    price: 499000,
    period: 'VNĐ',
    description: 'Giải pháp hoàn hảo cho những người nghiêm túc với tài chính',
    features: [
      '160 Chat với AI lập kế hoạch',
      '6 Ebook plan cá nhân hóa độc quyền (15.000 - 20.000 từ)',
      'Phân tích đầy đủ + Lộ trình + Sơ đồ nhánh',
      'Plan chuyên sâu + tất cả tài liệu liên quan',
      'Xuất file PDF, Word, Docs',
      'Xuất sang Notion, Google Trang Tính, Google Tài liệu',
      'Phân tích kết hợp tử vi, số mệnh, thần số học',
      'Truy cập sớm các tính năng mới nhất',
      'Mở khóa tính năng đọc các bài Blog trả phí'
    ],
    buttonText: 'Chọn Pro Max',
    buttonStyle: 'btn-primary',
    popular: false
  }
]

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState('monthly')

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Chọn Gói Phù Hợp Với Bạn
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Bắt đầu miễn phí và nâng cấp khi cần. Tất cả gói đều bao gồm kế hoạch tài chính cá nhân hóa hoàn toàn.
            </p>
            
            {/* Billing Toggle */}
            <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Thanh toán 1 lần
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Gói năm (Tiết kiệm 10%)
              </button>
            </div>

            {/* Yearly value proposition */}
            {billingCycle === 'yearly' && (
              <div className="mt-4 flex items-center justify-center gap-3 text-sm">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold">−10% mỗi năm</span>
                <span className="text-gray-600">Trả trước 1 lần cho 12 tháng • Không lo gia hạn hàng tháng • Tiết kiệm chi phí ngay</span>
              </div>
            )}
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
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
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      Phổ biến nhất
                    </div>
                  </div>
                )}

                <div className="p-8 flex flex-col h-full">
                  {/* Header */}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {tier.name}
                    </h3>
                    <div className="mb-6 text-center">
                      {tier.price === 0 ? (
                        <div className="space-y-1">
                          <span className="text-4xl font-bold text-gray-900 block">Miễn phí</span>
                        </div>
                      ) : billingCycle === 'yearly' ? (
                        <div className="space-y-1">
                          {(() => {
                            // Hardcoded discounted monthly prices for each tier
                            let discountedMonthly = 0;
                            if (tier.id === 'basic') discountedMonthly = 152000;
                            else if (tier.id === 'pro') discountedMonthly = 260000;
                            else if (tier.id === 'pro_max') discountedMonthly = 449000;
                            const monthly = tier.price;
                            const yearlyTotal = discountedMonthly * 12;
                            const savings = monthly * 12 - yearlyTotal;
                            return (
                              <>
                                <div className="flex items-baseline justify-center">
                                  <span className="text-4xl font-bold text-gray-900">{discountedMonthly.toLocaleString()}</span>
                                  <span className="text-gray-600 ml-2">VNĐ/tháng</span>
                                </div>
                                <div className="text-sm text-gray-600 flex items-center justify-center gap-2">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">−10%</span>
                                  <span>Thanh toán {yearlyTotal.toLocaleString()}đ/năm</span>
                                </div>
                                <div className="text-xs text-gray-500">Tiết kiệm {savings.toLocaleString()}đ so với thanh toán hàng tháng</div>
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-baseline justify-center">
                            <span className="text-4xl font-bold text-gray-900">{tier.price.toLocaleString()}</span>
                            <span className="text-gray-600 ml-2">VNĐ/tháng</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">
                      {tier.description}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-4 mb-8">
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

                  {/* CTA Button */}
                  <div className="mt-auto pt-6">
                    <Link
                      href={tier.id === 'free' ? '/start' : `/checkout?plan=${tier.id}`}
                      className={`w-full inline-flex items-center justify-center py-3 px-4 rounded-lg font-medium transition-all duration-200 ${tier.buttonStyle}`}
                    >
                      {tier.price === 0 ? 'Bắt đầu miễn phí' : billingCycle === 'yearly' ? `${tier.buttonText} (Tiết kiệm 10%)` : tier.buttonText}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Yearly Promo Band */}
          {billingCycle === 'yearly' && (
            <div className="mt-10 rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
              <div className="text-lg font-semibold text-green-800 mb-2">Ưu đãi gói năm: tiết kiệm 10% ngay hôm nay</div>
              <div className="text-sm text-green-700 mb-4">Trả trước 12 tháng, nhận giá tốt nhất • Không lo gia hạn mỗi tháng • Toàn quyền sử dụng mọi tính năng</div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
                <span className="px-3 py-1 rounded-full bg-white text-green-800 border border-green-200">Tối ưu chi phí</span>
                <span className="px-3 py-1 rounded-full bg-white text-green-800 border border-green-200">Tập trung vào kế hoạch dài hạn</span>
                <span className="px-3 py-1 rounded-full bg-white text-green-800 border border-green-200">Không bị gián đoạn dịch vụ</span>
              </div>
            </div>
          )}

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
            
            <div className="grid md:grid-cols-3 gap-8 text-center">
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
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-3xl font-bold text-purple-600 mb-2">2,000</div>
                <div className="text-gray-900 font-medium mb-1">Gói 3 - Pro Max</div>
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
