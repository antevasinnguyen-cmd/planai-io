'use client'

import { useState } from 'react'
import { ArrowRight, MessageCircle, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function Hero() {
  const [chatMessages, setChatMessages] = useState([
    {
      type: 'ai',
      message: 'Xin chào! Tôi là AI của PlanAI. Tôi sẽ giúp bạn tạo kế hoạch tài chính cá nhân hóa. Bạn có mục tiêu tài chính gì muốn đạt được?'
    },
    {
      type: 'user', 
      message: 'Tôi muốn có 2 tỷ trước 30 tuổi để mua nhà và kinh doanh'
    },
    {
      type: 'ai',
      message: 'Tuyệt vời! Để tạo kế hoạch phù hợp nhất, cho tôi biết thêm: Bạn bao nhiêu tuổi và thu nhập hiện tại là bao nhiêu?'
    }
  ])

  return (
    <section className="pt-24 pb-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Giới thiệu/Slogan */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                <Sparkles className="w-4 h-4 mr-2" />
                AI Financial Planning
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Biến dữ liệu thô thành{' '}
                <span className="gradient-text">bản kế hoạch đáng mơ ước</span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Webapp SaaS áp dụng AI giúp người dùng lập kế hoạch / xây dựng chiến lược cá nhân hoá cho mục tiêu tài chính, kiếm tiền, tăng thu nhập. AI tạo plan độc quyền như 1 cuốn Ebook cho mục tiêu của bạn.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/start" className="btn-primary inline-flex items-center justify-center">
                Bắt đầu miễn phí
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              
              <Link href="#demo" className="btn-secondary inline-flex items-center justify-center">
                <MessageCircle className="mr-2 w-5 h-5" />
                Xem Demo
              </Link>
            </div>

            <div className="flex items-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                5,000+ người dùng
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                17.000+ kế hoạch được tạo
              </div>
            </div>
          </div>

          {/* Right side - Minh hoạ khung chat AI */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">PlanAI Assistant</h3>
                    <p className="text-primary-200 text-sm">Đang online</p>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="p-6 space-y-4 h-80 overflow-y-auto">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                        msg.type === 'user'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      } chat-message`}
                    >
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  </div>
                ))}
                
                {/* Typing indicator */}
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Input */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    placeholder="Nhập câu hỏi của bạn..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled
                  />
                  <button className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 transition-colors">
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-20 animate-bounce-slow"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-20 animate-bounce-slow" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
      </div>
    </section>
  )
}
