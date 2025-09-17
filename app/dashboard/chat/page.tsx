'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  message: string
  type: 'user' | 'ai'
  created_at: string
}

interface UsageInfo {
  current: number
  limit: number
  tier: string
  remaining: number
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [usage, setUsage] = useState<UsageInfo | null>(null)
  const [user, setUser] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    loadChatHistory()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    setUser(user)
  }

  const loadChatHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error loading chat history:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setIsLoading(true)

    // Add user message to UI immediately
    const tempUserMessage: Message = {
      id: 'temp-' + Date.now(),
      message: userMessage,
      type: 'user',
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempUserMessage])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          chatHistory: messages
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          // Usage limit reached
          setMessages(prev => prev.slice(0, -1)) // Remove temp message
          alert(data.message || 'Đã đạt giới hạn chat trong tháng này')
          return
        }
        throw new Error(data.error || 'Failed to send message')
      }

      // Update usage info
      if (data.usage) {
        setUsage(data.usage)
      }

      // Add AI response to UI
      const aiMessage: Message = {
        id: 'ai-' + Date.now(),
        message: data.response,
        type: 'ai',
        created_at: new Date().toISOString()
      }

      setMessages(prev => {
        // Remove temp message and add both real user message and AI response
        const withoutTemp = prev.slice(0, -1)
        const realUserMessage: Message = {
          ...tempUserMessage,
          id: 'user-' + Date.now()
        }
        return [...withoutTemp, realUserMessage, aiMessage]
      })

    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => prev.slice(0, -1)) // Remove temp message
      alert('Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'text-gray-600'
      case 'basic': return 'text-blue-600'
      case 'pro': return 'text-purple-600'
      case 'pro_max': return 'text-gold-600'
      default: return 'text-gray-600'
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chat AI Tư Vấn Tài Chính</h1>
              <p className="text-gray-600 mt-1">Trò chuyện với AI để nhận tư vấn tài chính cá nhân hóa</p>
            </div>
            {usage && (
              <div className="text-right">
                <div className={`text-sm font-medium ${getTierColor(usage.tier)}`}>
                  {getTierName(usage.tier)}
                </div>
                <div className="text-xs text-gray-500">
                  {usage.current}/{usage.limit} chat sử dụng
                </div>
                <div className="text-xs text-gray-400">
                  Còn lại: {usage.remaining}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-lg shadow-sm flex flex-col h-[600px]">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-lg font-medium mb-2">Chào mừng đến với PlanAI Chat!</h3>
                <p>Hãy bắt đầu cuộc trò chuyện bằng cách hỏi về tình hình tài chính của bạn.</p>
                <div className="mt-4 text-sm text-gray-400">
                  Ví dụ: "Tôi 28 tuổi, thu nhập 15 triệu/tháng, muốn mua nhà trong 3 năm"
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={message.id || index}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.message}</div>
                    <div
                      className={`text-xs mt-2 ${
                        message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {new Date(message.created_at).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-3 max-w-[80%]">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">AI đang suy nghĩ...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex space-x-4">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập câu hỏi về tài chính của bạn..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'Gửi'
                )}
              </button>
            </div>
            {usage && usage.remaining <= 3 && (
              <div className="mt-2 text-sm text-orange-600">
                ⚠️ Bạn còn {usage.remaining} chat trong tháng này. 
                <button 
                  onClick={() => router.push('/pricing')}
                  className="ml-1 underline hover:text-orange-800"
                >
                  Nâng cấp ngay
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setInputMessage('Tôi muốn lập kế hoạch tiết kiệm để mua nhà')}
            className="p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow text-left"
          >
            <div className="text-lg mb-1">🏠</div>
            <div className="font-medium text-gray-900">Mua nhà</div>
            <div className="text-sm text-gray-600">Lập kế hoạch mua nhà</div>
          </button>
          
          <button
            onClick={() => setInputMessage('Tôi muốn tìm hiểu về đầu tư chứng khoán')}
            className="p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow text-left"
          >
            <div className="text-lg mb-1">📈</div>
            <div className="font-medium text-gray-900">Đầu tư</div>
            <div className="text-sm text-gray-600">Học về đầu tư chứng khoán</div>
          </button>
          
          <button
            onClick={() => setInputMessage('Tôi muốn lập kế hoạch nghỉ hưu sớm')}
            className="p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow text-left"
          >
            <div className="text-lg mb-1">🏖️</div>
            <div className="font-medium text-gray-900">Nghỉ hưu sớm</div>
            <div className="text-sm text-gray-600">Kế hoạch FIRE</div>
          </button>
        </div>
      </div>
    </div>
  )
}
