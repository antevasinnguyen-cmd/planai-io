'use client'

import Link from 'next/link'
import { ArrowRight, Star, Check } from 'lucide-react'

export default function CTA() {
  return (
    <section className="py-20 md:py-24 bg-gradient-to-r from-primary-600 to-primary-800">
      <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-10 text-center">
        <div className="space-y-8">
          <div className="flex justify-center items-center space-x-1 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
            ))}
            <span className="ml-2 text-primary-200 text-sm sm:text-base">Được tin tưởng bởi 5,000+ người dùng</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Sẵn sàng biến ước mơ tài chính thành hiện thực?
          </h2>
          
          {/* Quote */}
          <blockquote className="text-white/90 italic text-lg md:text-xl max-w-3xl mx-auto mb-8">
            <span className="whitespace-nowrap">"Một kế hoạch tốt có thể giúp bạn tiết kiệm hàng ngàn giờ chìm đắm trong sự trì hoãn"</span>
          </blockquote>
          
          {/* Benefits */}
          <div className="bg-white/10 rounded-2xl p-6 text-left w-full max-w-3xl mx-auto">
            <div className="text-white/80 font-semibold mb-3">Những gì bạn nhận được:</div>
            <ul className="text-primary-100 space-y-2 list-none p-0">
              <li className="flex items-start"><Check className="w-5 h-5 mt-0.5 mr-2 flex-shrink-0 text-primary-200" /> Định hướng rõ ràng</li>
              <li className="flex items-start"><Check className="w-5 h-5 mt-0.5 mr-2 flex-shrink-0 text-primary-200" /> Tiết kiệm thời gian</li>
              <li className="flex items-start"><Check className="w-5 h-5 mt-0.5 mr-2 flex-shrink-0 text-primary-200" /> Thoát khỏi sự trì hoãn, mông lung, mất định hướng</li>
              <li className="flex items-start"><Check className="w-5 h-5 mt-0.5 mr-2 flex-shrink-0 text-primary-200" /> Sẵn sàng hành động</li>
              <li className="flex items-start"><Check className="w-5 h-5 mt-0.5 mr-2 flex-shrink-0 text-primary-200" /> Đạt kết quả nhanh chóng</li>
            </ul>
          </div>
          
          <p className="text-xl text-primary-200 px-4">
            Bắt đầu miễn phí ngay hôm nay và nhận kế hoạch tài chính cá nhân&nbsp;hóa đầu tiên của bạn
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/start" className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl inline-flex items-center">
              Tạo kế hoạch miễn phí
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            
            <Link href="#demo" className="text-white hover:text-primary-200 font-medium py-3 px-8 border-2 border-white/30 hover:border-white/50 rounded-lg transition-all duration-200 inline-flex items-center">
              Xem cách hoạt động
            </Link>
          </div>
          
          <div className="text-primary-200 text-sm flex flex-wrap justify-center gap-x-6 gap-y-2">
            <span className="inline-flex items-center">✓ Không cần thẻ tín dụng</span>
            <span className="inline-flex items-center">✓ Thiết lập trong 2 phút</span>
            <span className="inline-flex items-center">✓ Kế hoạch cá nhân hóa 100%</span>
          </div>
        </div>
      </div>
    </section>
  )
}

