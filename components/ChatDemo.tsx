'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, ArrowRight, HelpCircle, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ChatDemo() {
  const [messages, setMessages] = useState([
    {
      type: 'ai',
      message:
        'Chào bạn! Để tạo kế hoạch tài chính cá nhân hóa chính xác nhất, hãy cung cấp thông tin chi tiết về mục tiêu tài chính, kỹ năng/nghề nghiệp, thu nhập, ngày sinh và thời gian mục tiêu. Càng chi tiết, kế hoạch càng thực tiễn và phù hợp! Tôi sẽ hướng dẫn từng bước.',
      timestamp: '10:30',
    },
  ])

  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showInfoList, setShowInfoList] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Auto focus textarea when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (textareaRef.current) {
        try {
          textareaRef.current.focus({ preventScroll: true });
        } catch (error) {
          console.error('Lỗi khi focus textarea:', error);
        }
      }
    }, 100); // Thêm delay để đảm bảo component đã render xong
    
    return () => clearTimeout(timer);
  }, [])

  const demoResponses = [
    'Tuyệt vời! Để tạo kế hoạch chi tiết nhất, bạn có thể cho tôi biết thêm về thu nhập hiện tại và thời gian mong muốn đạt được mục tiêu không?',
    'Dựa trên thông tin bạn cung cấp, tôi sẽ phân tích và tạo một kế hoạch tài chính cá nhân hóa. Bạn có muốn tôi tạo kế hoạch chi tiết ngay bây giờ không?',
    'Kế hoạch của bạn đã sẵn sàng! Bạn có thể xem preview và nâng cấp để nhận bản đầy đủ với lộ trình chi tiết, checklist hàng ngày và tài liệu học tập.',
  ]

  const quickSuggestions = [
    'Mục tiêu: mua nhà 3 tỷ',
    'Thu nhập: 5 triệu/tháng',
    'Kỹ năng: marketing',
    'Sinh: 14/07/1996',
    'Thời gian: 5 năm',
    'Khu vực: Hà Nội',
    'Tiết kiệm: chưa có',
    'Mức độ sẵn sàng: sẵn sàng học kỹ năng mới',
  ]

  const handleSendMessage = () => {
    const message = inputValue.trim()
    if (!message) return
    
    // Add user message to chat
    setMessages(prev => [...prev, {
      type: 'user',
      message: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }])
    
    // Clear input
    setInputValue('')
    
    // Show typing indicator
    setIsTyping(true)
    
    // Simulate AI response after a delay
    setTimeout(() => {
      const randomResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)]
      setMessages(prev => [...prev, {
        type: 'ai',
        message: randomResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
      setIsTyping(false)
    }, 1000)
    
    // Save message to localStorage for login redirect
    try {
      localStorage.setItem('preChatMessage', message)
    } catch (e) {
      console.error('Lỗi khi lưu tin nhắn:', e)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSendMessage()
    }
  }
  
  const handleCompositionStart = () => {
    setIsComposing(true)
  }
  
  const handleCompositionEnd = () => {
    setIsComposing(false)
  }

  const insertSuggestion = (text: string) => {
    setInputValue((prev) => (prev ? `${prev}\n${text}` : text))
  }

  return (
    <section id="demo" className="py-16 sm:py-20 bg-gray-50 overflow-x-hidden">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 break-words">Trải Ngh iệm Chat AI Ngay Bây Giờ</h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-3xl mx-auto break-words">
            Thử ngay tính năng chat với AI để cảm nhận cách PlanAI tạo kế hoạch tài chính cho bạn
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-semibold text-sm sm:text-lg truncate">PlanAI Assistant</h3>
                    <p className="text-primary-100 text-xs sm:text-sm font-medium truncate">Sẵn sàng tạo kế hoạch cho bạn</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                  <button
                    onClick={() => setShowInfoList((v) => !v)}
                    className="hidden md:inline-flex items-center text-primary-100 hover:text-white text-xs sm:text-sm bg-white/10 hover:bg-white/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Xem danh sách
                  </button>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full flex-shrink-0"></div>
                    <span className="text-primary-100 text-xs sm:text-sm whitespace-nowrap">Online</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Welcome banner */}
            <div className="px-6 py-4 bg-primary-50 border-b border-gray-100 text-sm text-gray-700">
              <span className="font-medium">Mẹo:</span> Bạn có thể cung cấp thông tin theo từng bước hoặc dùng gợi ý nhanh phía dưới.
            </div>

            {/* Info popover */}
            {showInfoList && (
              <div className="px-6 py-4 bg-white border-b border-gray-200 text-gray-800 text-sm">
                <div className="grid gap-2">
                  <p className="font-semibold">Danh sách thông tin nên cung cấp</p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>
                      <span className="font-medium">Mục tiêu tài chính</span>: Số tiền và loại mục tiêu (nhà, xe, kinh doanh...)
                    </li>
                    <li>
                      <span className="font-medium">Thông tin cá nhân</span>: Độ tuổi, ngày sinh, giới tính, khu vực sinh sống
                    </li>
                    <li>
                      <span className="font-medium">Tài chính hiện tại</span>: Thu nhập/tháng, chi phí cố định, khoản tiết kiệm
                    </li>
                    <li>
                      <span className="font-medium">Kỹ năng/nghề nghiệp</span>: Kỹ năng hiện tại (ví dụ: marketing), kinh nghiệm
                    </li>
                    <li>
                      <span className="font-medium">Mức độ sẵn sàng</span>: Sẵn sàng học kiến thức mới, thời gian dành cho kế hoạch
                    </li>
                    <li>
                      <span className="font-medium">Thời gian mục tiêu</span>: 6 tháng, 1 năm, 5 năm, v.v.
                    </li>
                  </ul>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border text-gray-700">
                    <p className="text-sm">
                      Mẹo: Cung cấp <span className="font-medium">ngày sinh</span> giúp AI phân tích tử vi/thần số học để đề xuất kế hoạch phù hợp.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Chat Messages */}
            <div className="h-96 overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
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

            {/* Quick suggestions */}
            <div className="px-6 pb-2">
              <div className="flex flex-wrap gap-2">
                {quickSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => insertSuggestion(s)}
                    className="text-sm px-3 py-1.5 rounded-full border border-gray-300 text-gray-800 bg-white hover:bg-primary-50 hover:border-primary-400 hover:text-primary-700 transition-colors duration-200"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input */}
            <div className="border-t border-gray-200 p-6">
              <div className="flex items-end space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <div className="relative">
                      <div 
                        className="absolute inset-0 bg-transparent"
                        style={{ zIndex: 5 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          textareaRef.current?.focus();
                        }}
                      />
                      <textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyPress}
                        onCompositionStart={handleCompositionStart}
                        onCompositionEnd={handleCompositionEnd}
                        placeholder="Ví dụ: Tôi muốn có 2 tỷ trước 30 tuổi để mua nhà..."
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-gray-900 bg-white relative z-10"
                        style={{ 
                          minHeight: '48px', 
                          maxHeight: '200px',
                          position: 'relative',
                          backgroundColor: 'white'
                        }}
                        rows={1}
                      />
                    </div>
                    {inputValue.trim() && (
                      <button
                        onClick={handleSendMessage}
                        className="absolute right-3 bottom-3 text-primary-600 hover:text-primary-700 transition-colors"
                        type="button"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    )}
                  </div>
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
