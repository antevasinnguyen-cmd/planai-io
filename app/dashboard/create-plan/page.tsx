'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Sparkles, CheckCircle, Info, Loader2, FileText, AlertCircle, Crown, Zap, ArrowRight, Moon, ToggleLeft, ToggleRight } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

interface Message {
  role: 'assistant' | 'user'
  content: string
  timestamp: Date
}

// Thông tin cần thu thập - CẢI TIẾN
const requiredInfo = [
  { id: 'goal', label: 'Mục tiêu tài chính', icon: '🎯', required: true, description: 'Mục tiêu chính bạn muốn đạt được' },
  { id: 'income', label: 'Thu nhập hiện tại', icon: '💰', required: true, description: 'Thu nhập hàng tháng của bạn' },
  { id: 'occupation', label: 'Nghề nghiệp/Kỹ năng', icon: '💼', required: true, description: 'Công việc và kỹ năng hiện có' },
  { id: 'timeline', label: 'Thời gian mục tiêu', icon: '⏰', required: true, description: 'Bao lâu để đạt mục tiêu' },
  { id: 'readiness', label: 'Mức độ sẵn sàng', icon: '🚀', required: true, description: 'Sẵn sàng học kiến thức mới, thời gian dành cho kế hoạch' },
  { id: 'description', label: 'Mô tả mong muốn', icon: '✍️', required: false, description: 'Tâm sự, chia sẻ về ước mơ và tương lai bạn mong muốn' },
  { id: 'birth_date', label: 'Ngày sinh', icon: '🎂', required: false, description: 'Để phân tích tử vi (tùy chọn)' },
  { id: 'savings', label: 'Tiết kiệm hiện có', icon: '🏦', required: false, description: 'Số tiền đã tiết kiệm' },
  { id: 'location', label: 'Khu vực sinh sống', icon: '📍', required: false, description: 'Thành phố bạn đang sống' },
]

export default function CreatePlanV2() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [collectedInfo, setCollectedInfo] = useState<Record<string, boolean>>({})
  const [subscription, setSubscription] = useState<any>(null)
  const [spiritualEnabled, setSpiritualEnabled] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Kiểm tra phiên trực tiếp từ supabase
        const { supabase } = await import('@/lib/supabase')
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth session error:', error)
          router.push('/login')
          return
        }
        
        if (!data.session) {
          console.log('No active session found')
          router.push('/login')
          return
        }
        
        // Phiên hợp lệ, tiếp tục tải dữ liệu
        loadSubscription()
        
        // Lấy tin nhắn đã lưu từ localStorage hoặc tạo tin nhắn chào mới
        const savedMessages = localStorage.getItem('planai_chat_messages')
        
        if (savedMessages) {
          try {
            const parsedMessages = JSON.parse(savedMessages)
            // Chuyển đổi timestamp từ string sang Date
            const messagesWithDateObjects = parsedMessages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
            setMessages(messagesWithDateObjects)
            console.log('Lấy tin nhắn đã lưu:', messagesWithDateObjects.length)
          } catch (parseError) {
            console.error('Lỗi khi phân tích tin nhắn đã lưu:', parseError)
            initializeNewChat()
          }
        } else {
          initializeNewChat()
        }
      } catch (error) {
        console.error('Authentication check failed:', error)
        router.push('/login')
      }
    }
    
    const initializeNewChat = () => {
      // Auto-start conversation with sequential messages
      const welcomeMessage1: Message = {
        role: 'assistant',
        content: `Xin chào! Tôi là AI của PlanAI. Tôi sẽ giúp bạn tạo kế hoạch tài chính cá nhân hóa một cách đầy đủ và chi tiết nhất. :D 
Để làm được điều này, hãy giúp tôi hiểu hơn về bạn và nhu cầu của bạn.`,
        timestamp: new Date()
      }
      
      const welcomeMessage2: Message = {
        role: 'assistant',
        content: `Bắt đầu chia sẻ với tôi các thông tin cần thiết như: 
Mục tiêu tài chính: Số tiền và loại mục tiêu (nhà, xe, kinh doanh...)
Thông tin cá nhân: Độ tuổi, ngày sinh, giới tính, khu vực sinh sống
Tài chính hiện tại: Thu nhập/tháng, chi phí cố định, khoản tiết kiệm
Kỹ năng/nghề nghiệp: Kỹ năng hiện tại (ví dụ: marketing), kinh nghiệm, nghề nghiệp hiện tại
Mức độ sẵn sàng: Sẵn sàng học kiến thức mới, thời gian dành cho kế hoạch
Thời gian mục tiêu: 3 tháng, 6 tháng, 1 năm, 2 năm, 5 năm, v.v.

Ngoài ra, bạn có thể mô tả kỹ hơn, hoặc tâm sự với tôi về mọi thứ liên quan như: Một tương lai bạn mong muốn, nỗi sợ/lo lắng, thói quen, ước mơ của bạn,…`,
        timestamp: new Date(new Date().getTime() + 1000) // 1 second later
      }
      
      const welcomeMessage3: Message = {
        role: 'assistant',
        content: `Tôi ở đây để lắng nghe và giúp bạn đạt được mọi thứ bạn cần. 

Thông tin đưa càng chi tiết, kế hoạch được tạo ra càng chính xác, thực tiễn và phù hợp nhất cho bạn.`,
        timestamp: new Date(new Date().getTime() + 2000) // 2 seconds later
      }
      
      setMessages([welcomeMessage1, welcomeMessage2, welcomeMessage3])
    }
    
    checkAuth()
  }, [router])
  
  // Lưu tin nhắn vào localStorage khi messages thay đổi
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('planai_chat_messages', JSON.stringify(messages))
      console.log('Lưu tin nhắn vào localStorage:', messages.length)
    }
  }, [messages])

  // Cuộn xuống dưới khi có tin nhắn mới
  useEffect(() => {
    // Thêm timeout để tránh cuộn liên tục
    const timer = setTimeout(() => {
      scrollToBottom()
    }, 100)
    return () => clearTimeout(timer)
  }, [messages])

  const loadSubscription = async () => {
    // Load subscription info
    try {
      const { getUserSubscription, getCurrentUser } = await import('@/lib/supabase')
      const currentUser = await getCurrentUser()
      
      if (!currentUser) {
        console.error('No user found when loading subscription')
        return
      }
      
      const { data } = await getUserSubscription(currentUser.id)
      setSubscription(data)
    } catch (error) {
      console.error('Error loading subscription:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    const currentInput = input // Store input before clearing
    
    // Chỉ cập nhật state, không lưu vào localStorage ở đây
    // useEffect sẽ tự động lưu khi messages thay đổi
    setMessages([...messages, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Ensure we have a valid session before sending request
      const { supabase } = await import('@/lib/supabase')
      const { data: sessionData } = await supabase.auth.getSession()
      
      if (!sessionData.session) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
      }
      
      const chatHistory = messages.map(m => ({
        type: m.role === 'user' ? 'user' : 'ai',
        message: m.content
      }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify({
          message: currentInput,
          chatHistory
        })
      })

      const data = await res.json()

      if (!res.ok) {
        console.error('API Error:', data)
        
        // Use the improved error message from API
        let errorContent = data.message || 'Có lỗi xảy ra khi kết nối với AI'
        if (data.suggestion) {
          errorContent += `\n\n${data.suggestion}`
        }
        
        const errorMessage: Message = {
          role: 'assistant',
          content: errorContent,
          timestamp: new Date()
        }
        setMessages([...messages, userMessage, errorMessage])
        return
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      // Chỉ cập nhật state, không lưu vào localStorage ở đây
      setMessages([...messages, userMessage, assistantMessage])
      updateCollectedInfo(currentInput)
    } catch (error) {
      console.error('Chat Error:', error)
      
      const errorContent = `🔌 Không thể kết nối với hệ thống AI. Vui lòng kiểm tra kết nối mạng và thử lại.

💡 **Gợi ý khắc phục:**
- Kiểm tra kết nối internet
- Tải lại trang và thử lại
- Liên hệ support nếu vấn đề tiếp tục`
      
      const errorMessage: Message = {
        role: 'assistant',
        content: errorContent,
        timestamp: new Date()
      }
      // Chỉ cập nhật state, không lưu vào localStorage ở đây
      setMessages([...messages, userMessage, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const updateCollectedInfo = (userInput: string) => {
    const input = userInput.toLowerCase()
    const newInfo = { ...collectedInfo }

    if (input.includes('mục tiêu') || input.includes('muốn') || input.includes('cần')) {
      newInfo['goal'] = true
    }
    if (input.includes('thu nhập') || input.includes('lương') || input.includes('triệu')) {
      newInfo['income'] = true
    }
    if (input.includes('nghề') || input.includes('làm') || input.includes('công việc')) {
      newInfo['occupation'] = true
    }
    if (input.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
      newInfo['birth_date'] = true
    }
    if (input.includes('tháng') || input.includes('năm') || input.includes('thời gian')) {
      newInfo['timeline'] = true
    }
    if (input.includes('tiết kiệm') || input.includes('có')) {
      newInfo['savings'] = true
    }
    if (input.includes('hà nội') || input.includes('hcm') || input.includes('sài gòn')) {
      newInfo['location'] = true
    }
    if (input.includes('sẵn sàng') || input.includes('học hỏi') || input.includes('thời gian dành')) {
      newInfo['readiness'] = true
    }
    if (input.length > 100) {
      newInfo['description'] = true
    }

    setCollectedInfo(newInfo)
  }

  const getProgress = () => {
    const required = requiredInfo.filter(i => i.required)
    const collected = required.filter(i => collectedInfo[i.id])
    return Math.round((collected.length / required.length) * 100)
  }

  const canCreatePlan = () => {
    const required = requiredInfo.filter(i => i.required)
    return required.every(i => collectedInfo[i.id])
  }

  const getTierName = (tier: string) => {
    switch (tier) {
      case 'free': return 'Free'
      case 'basic': return 'Gói 1'
      case 'pro': return 'Gói 2'
      case 'pro_max': return 'Gói 3'
      default: return 'Free'
    }
  }

  const getPlanLimit = (tier: string) => {
    switch (tier) {
      case 'free': return 1
      case 'basic': return 5
      case 'pro': return 20
      case 'pro_max': return 999
      default: return 1
    }
  }

  const handleCreatePlan = async () => {
    if (!canCreatePlan()) return
    
    // Collect all chat data and create plan
    const planData = {
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      collectedInfo,
      spiritualEnabled // Include spiritual toggle state
    }
    
    // Save to localStorage temporarily
    localStorage.setItem('pending_plan', JSON.stringify(planData))
    
    // Navigate to plan generation
    router.push('/dashboard/plans/generate')
  }

  const tier = subscription?.tier || 'free'
  const planLimit = getPlanLimit(tier)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] flex">
      {/* Sidebar - Info Checklist */}
      <aside className="w-80 bg-white dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-gray-800 p-6 overflow-y-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4">
            <span>←</span>
            <span className="text-sm">Quay lại Dashboard</span>
          </Link>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Thông tin cần cung cấp
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Bạn có thể cung cấp thông tin theo gợi ý ở cột bên trái, bằng cách nhấn chọn từng mục.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">Tiến độ</span>
            <span className="text-primary-600 dark:text-primary-400 font-semibold">{getProgress()}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary-500 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
        </div>

        {/* Info Checklist */}
        <div className="space-y-3 mb-6">
          {requiredInfo.map((info) => (
            <div
              key={info.id}
              className={`p-3 rounded-lg transition-colors cursor-pointer hover:shadow-md ${
                collectedInfo[info.id]
                  ? 'bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20'
                  : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
              }`}
              onClick={() => {
                // Add the info label to input
                const newInput = input ? `${input}\n${info.label}` : info.label
                setInput(newInput)
                // Focus the textarea
                document.querySelector('textarea')?.focus()
              }}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl flex-shrink-0">{info.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className={`text-sm font-medium ${
                      collectedInfo[info.id]
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {info.label}
                    </p>
                    {info.required && !collectedInfo[info.id] && (
                      <span className="text-xs text-red-500">*</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500">{info.description}</p>
                  {collectedInfo[info.id] && (
                    <div className="flex items-center space-x-1 mt-1">
                      <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                      <span className="text-xs text-green-600 dark:text-green-400">Đã thu thập</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Plan Limit Info */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-900 dark:text-blue-300 font-medium mb-1">
                Gói {getTierName(tier)}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Bạn có thể tạo tối đa <strong>{planLimit}</strong> kế hoạch{planLimit > 1 ? '' : ''}.
              </p>
              {tier === 'free' && (
                <Link 
                  href="/pricing" 
                  className="inline-flex items-center space-x-1 mt-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xs font-semibold rounded-lg transition-all transform hover:scale-105 shadow-md"
                >
                  <Crown className="w-3 h-3" />
                  <span>Nâng cấp để tạo nhiều hơn</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
        
        {/* Spiritual Add-on Toggle */}
        <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-lg">
          <div className="flex items-start space-x-2">
            <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-indigo-900 dark:text-indigo-300 font-medium mb-1">
                Tính năng Spiritual Add-on
              </p>
              <p className="text-xs text-indigo-700 dark:text-indigo-400 mb-2">
                Kết hợp yếu tố tử vi, thần số học vào kế hoạch tài chính
              </p>
              <button 
                onClick={() => setSpiritualEnabled(!spiritualEnabled)}
                className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-indigo-200 dark:border-indigo-600 shadow-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
              >
                {spiritualEnabled ? (
                  <>
                    <ToggleRight className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Đã bật tính năng</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Bật tính năng</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="p-4 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-lg">
          <div className="flex items-start space-x-2">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-purple-900 dark:text-purple-300 font-medium mb-1">
                Mẹo nhỏ
              </p>
              <ul className="text-xs text-purple-700 dark:text-purple-400 space-y-1">
                <li>• Nhấn vào các mục bên trái để thêm thông tin nhanh chóng</li>
                <li>• Tâm sự về ước mơ và mong muốn của bạn</li>
                <li>• Thông tin chi tiết giúp tạo kế hoạch chính xác hơn</li>
              </ul>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">PlanAI</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sẵn sàng tạo kế hoạch cho bạn</p>
              </div>
            </div>
            
            {/* Progress Badge */}
            <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {getProgress()}% hoàn thành
              </span>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl ${
                  message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800'
                } rounded-2xl px-6 py-4 shadow-sm`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                <p className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-white/70' : 'text-gray-500 dark:text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl px-6 py-4 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                  <span className="text-gray-600 dark:text-gray-400">AI đang suy nghĩ...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input + Create Button */}
        <div className="bg-white dark:bg-[#1a1a1a] border-t border-gray-200 dark:border-gray-800 p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Chat Input */}
            <div className="flex items-start space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      // Enter là xuống dòng bình thường, không gửi tin nhắn
                      if (e.key === 'Enter' && e.ctrlKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    placeholder="Chia sẻ với AI về mục tiêu, ước mơ, tình hình tài chính của bạn..."
                    className="w-full px-4 py-3 pr-14 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0f0f0f] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    rows={5}
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 bottom-2 p-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Nhấn Enter để xuống dòng, Ctrl+Enter để gửi tin nhắn
                </p>
              </div>
            </div>

            {/* Create Plan Button - NỔI BẬT */}
            {canCreatePlan() && (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-purple-600 rounded-xl blur-xl opacity-50 animate-pulse"></div>
                <button
                  onClick={handleCreatePlan}
                  className="relative w-full bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 hover:from-primary-700 hover:via-purple-700 hover:to-blue-700 text-white px-8 py-5 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] shadow-2xl flex items-center justify-center space-x-3"
                >
                  <Zap className="w-6 h-6" />
                  <span>Tạo Kế Hoạch Hoàn Chỉnh</span>
                  <Sparkles className="w-6 h-6" />
                </button>
              </div>
            )}

            {!canCreatePlan() && (
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-500">
                <AlertCircle className="w-4 h-4" />
                <span>Vui lòng cung cấp đầy đủ thông tin bắt buộc (*) để tạo kế hoạch</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
