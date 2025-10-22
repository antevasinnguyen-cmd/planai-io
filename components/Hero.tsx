'use client'

import { useState, KeyboardEvent } from 'react'
import { ArrowRight, MessageCircle, Sparkles, Send } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Hero() {
  const router = useRouter()
  const [inputMessage, setInputMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
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

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return
    
    // Lưu tin nhắn của người dùng
    const userMessage = inputMessage.trim()
    setChatMessages(prev => [...prev, { type: 'user', message: userMessage }])
    setInputMessage('')
    setIsSending(true)
    
    try {
      // Lưu tin nhắn vào localStorage để sử dụng sau khi đăng nhập
      localStorage.setItem('preChatMessage', userMessage)
      
      // Chuyển hướng đến trang đăng nhập
      router.push('/login')
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error)
      // Fallback: vẫn chuyển hướng đến trang đăng nhập
      router.push('/login')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <section className="pt-20 pb-16 sm:pt-24 sm:pb-20 bg-gradient-to-br from-gray-50 to-white overflow-x-hidden">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          {/* Left side - Giới thiệu/Slogan */}
          <div className="space-y-6 sm:space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-xs sm:text-sm font-medium">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                AI Financial Planning
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight break-words">
                Biến dữ liệu thô thành{' '}
                <span className="gradient-text">bản kế hoạch đáng mơ ước</span>
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed break-words">
                Ứng dụng công nghệ giúp người dùng lập kế hoạch / xây dựng chiến lược cá nhân hoá cho mục tiêu tài chính, kiếm tiền, tăng thu nhập. AI tạo plan độc quyền như 1 cuốn Ebook cho mục tiêu của bạn.
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
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  </div>
                ))}
                {isSending && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-2xl">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Chat Input */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Nhập câu hỏi của bạn..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-gray-900 text-sm"
                      style={{ minHeight: '44px', maxHeight: '120px' }}
                      rows={1}
                      disabled={isSending}
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isSending}
                    className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white p-2 rounded-xl transition-colors duration-200 flex-shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">Nhấn Enter để gửi, Shift + Enter để xuống dòng</p>
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
