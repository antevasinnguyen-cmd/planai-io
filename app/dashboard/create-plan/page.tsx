'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Sparkles, CheckCircle, Info, Loader2, FileText } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { generateChatResponse } from '@/lib/openai'
import Link from 'next/link'

interface Message {
  role: 'assistant' | 'user'
  content: string
  timestamp: Date
}

// Thông tin cần thu thập
const requiredInfo = [
  { id: 'goal', label: 'Mục tiêu tài chính', icon: '🎯', required: true },
  { id: 'income', label: 'Thu nhập hiện tại', icon: '💰', required: true },
  { id: 'occupation', label: 'Nghề nghiệp/Kỹ năng', icon: '💼', required: true },
  { id: 'birth_date', label: 'Ngày sinh (dd/mm/yyyy)', icon: '🎂', required: false },
  { id: 'timeline', label: 'Thời gian mục tiêu', icon: '⏰', required: true },
  { id: 'savings', label: 'Tiết kiệm hiện có', icon: '🏦', required: false },
  { id: 'location', label: 'Khu vực sinh sống', icon: '📍', required: false },
  { id: 'readiness', label: 'Mức độ sẵn sàng', icon: '⚡', required: false }
]

export default function CreatePlanPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [collectedInfo, setCollectedInfo] = useState<Record<string, boolean>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Auto-start conversation
    const welcomeMessage: Message = {
      role: 'assistant',
      content: `Xin chào! 👋 Tôi là PlanAI Assistant, trợ lý AI tài chính của bạn.

Tôi sẽ giúp bạn tạo một kế hoạch tài chính cá nhân hóa hoàn hảo. Để làm điều này, tôi cần thu thập một số thông tin về bạn.

Hãy bắt đầu với câu hỏi đầu tiên nhé! 

**Mục tiêu tài chính của bạn là gì?** 
Ví dụ: Mua nhà, kinh doanh, tiết kiệm, đầu tư, tăng thu nhập...`,
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Call AI
      const chatHistory = [...messages, userMessage].map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }))

      const response = await generateChatResponse(chatHistory as any)

      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      // Update collected info (simple detection)
      updateCollectedInfo(input)
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const updateCollectedInfo = (userInput: string) => {
    const input = userInput.toLowerCase()
    const newInfo = { ...collectedInfo }

    // Simple keyword detection
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

  const handleCreatePlan = () => {
    // Navigate to plan creation with collected info
    router.push('/dashboard/plans/create')
  }

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
            AI sẽ hỏi từng thông tin qua chat. Bạn có thể tham khảo danh sách bên dưới.
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
        <div className="space-y-3">
          {requiredInfo.map((info) => (
            <div
              key={info.id}
              className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                collectedInfo[info.id]
                  ? 'bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20'
                  : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="text-2xl">{info.icon}</div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
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
                {collectedInfo[info.id] && (
                  <div className="flex items-center space-x-1 mt-1">
                    <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                    <span className="text-xs text-green-600 dark:text-green-400">Đã thu thập</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Create Plan Button */}
        {canCreatePlan() && (
          <button
            onClick={handleCreatePlan}
            className="w-full mt-6 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
          >
            <FileText className="w-5 h-5" />
            <span>Tạo kế hoạch ngay</span>
          </button>
        )}

        {/* Info Note */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-900 dark:text-blue-300 font-medium mb-1">
                Mẹo nhỏ
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Cung cấp thông tin càng chi tiết, kế hoạch AI tạo ra càng chính xác và phù hợp với bạn.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-purple-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">PlanAI Assistant</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Trợ lý AI tài chính của bạn</p>
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

        {/* Input */}
        <div className="bg-white dark:bg-[#1a1a1a] border-t border-gray-200 dark:border-gray-800 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder="Nhập câu trả lời của bạn..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0f0f0f] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  rows={3}
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Nhấn Enter để gửi, Shift + Enter để xuống dòng
                </p>
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white p-4 rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
