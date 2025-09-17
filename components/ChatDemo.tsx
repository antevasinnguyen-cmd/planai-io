'use client'

import { useState } from 'react'
import { Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ChatDemo() {
  const [messages, setMessages] = useState([
    {
      type: 'ai',
      message: 'Xin chào! Tôi là AI của PlanAI. Hãy chia sẻ mục tiêu tài chính của bạn để tôi có thể tạo kế hoạch phù hợp nhất.',
      timestamp: '10:30'
    }
  ])
  
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const router = useRouter()

  const demoResponses = [
    'Tuyệt vời! Để tạo kế hoạch chi tiết nhất, bạn có thể cho tôi biết thêm về thu nhập hiện tại và thời gian mong muốn đạt được mục tiêu không?',
    'Dựa trên thông tin bạn cung cấp, tôi sẽ phân tích và tạo một kế hoạch tài chính cá nhân hóa. Bạn có muốn tôi tạo kế hoạch chi tiết ngay bây giờ không?',
    'Kế hoạch của bạn đã sẵn sàng! Bạn có thể xem preview và nâng cấp để nhận bản đầy đủ với lộ trình chi tiết, checklist hàng ngày và tài liệu học tập.'
  ]

  const handleSendMessage = () => {
    if (!inputValue.trim()) return
    try {
      // Save pre-chat message and redirect to login/signup
      localStorage.setItem('preChatMessage', inputValue.trim())
      router.push('/login')
    } catch (e) {
      // fallback: still redirect
      router.push('/login')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <section id="demo" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Trải Nghiệm Chat AI Ngay Bây Giờ
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto whitespace-nowrap">
            Thử ngay tính năng chat với AI để cảm nhận cách PlanAI tạo kế hoạch tài chính cho bạn
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">PlanAI Assistant</h3>
                    <p className="text-primary-200 text-sm">Sẵn sàng tạo kế hoạch cho bạn</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-primary-200 text-sm">Online</span>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="h-96 overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        message.type === 'user'
                          ? 'bg-white text-gray-900 border border-gray-200'
                          : 'bg-gray-100 text-gray-900'
                      } chat-message`}
                    >
                      <p className="text-sm leading-relaxed text-gray-900">{message.message}</p>
                    </div>
                    <p className={`text-xs text-gray-500 mt-1 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="border-t border-gray-200 p-6">
              <div className="flex items-end space-x-4">
                <div className="flex-1">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ví dụ: Tôi muốn có 2 tỷ trước 30 tuổi để mua nhà..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-gray-900"
                    rows={2}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white p-3 rounded-xl transition-colors duration-200 flex-shrink-0"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mt-4 text-center">
                <Link href="/start" className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium">
                  Bắt đầu tạo kế hoạch thực tế
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Demo Notice */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              Đây là demo tương tác. Để nhận kế hoạch thực tế, hãy đăng ký miễn phí!
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
