'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Plus, FileText, Download, Settings, LogOut, MessageCircle, Sparkles, User, CreditCard, BarChart3, Target } from 'lucide-react'
import { getCurrentUser, getUserProfile, saveChatMessage, getChatHistory, signOut, getUserPlans } from '@/lib/supabase'
import { ChatMessage, UserProfile } from '@/types'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [showPlanButton, setShowPlanButton] = useState(false)
  const [plans, setPlans] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('chat')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    initializeDashboard()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const initializeDashboard = async () => {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      router.push('/login')
      return
    }

    setUser(currentUser)
    
    // Get user profile
    const { data: profileData } = await getUserProfile(currentUser.id)
    if (profileData) {
      setProfile(profileData)
    }

    // Get chat history
    const { data: chatData } = await getChatHistory(currentUser.id)
    if (chatData) {
      setMessages(chatData)
      // Show plan button if there are enough messages
      if (chatData.length >= 4) {
        setShowPlanButton(true)
      }
    }

    // Get user plans
    const { data: plansData } = await getUserPlans(currentUser.id)
    if (plansData) {
      setPlans(plansData)
    }

    // Add welcome message if no chat history
    if (!chatData || chatData.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        user_id: currentUser.id,
        message: 'Chào bạn! Tôi là PlanAI - trợ lý AI chuyên về tài chính cá nhân. Hãy chia sẻ với tôi về mục tiêu tài chính mà bạn muốn đạt được nhé!',
        type: 'ai',
        created_at: new Date().toISOString()
      }
      setMessages([welcomeMessage])
    }

    setIsLoading(false)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return

    const userMessage = newMessage.trim()
    setNewMessage('')
    setIsSending(true)

    // Add user message to chat
    const userChatMessage: ChatMessage = {
      id: Date.now().toString(),
      user_id: user?.id || '',
      message: userMessage,
      type: 'user',
      created_at: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, userChatMessage])

    try {
      // Call real AI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          chatHistory: messages
        })
      })

      const data = await response.json()

      if (data.success) {
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          user_id: user?.id || '',
          message: data.response,
          type: 'ai',
          created_at: new Date().toISOString()
        }
        
        setMessages(prev => [...prev, aiResponse])
      } else {
        // Fallback response
        const fallbackResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          user_id: user?.id || '',
          message: "Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau.",
          type: 'ai',
          created_at: new Date().toISOString()
        }
        setMessages(prev => [...prev, fallbackResponse])
      }
    } catch (error) {
      console.error('Chat error:', error)
      // Fallback response
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        user_id: user?.id || '',
        message: "Có lỗi xảy ra khi kết nối. Vui lòng kiểm tra kết nối mạng và thử lại.",
        type: 'ai',
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorResponse])
    }

    setIsSending(false)
  }

  const handleCreatePlan = () => {
    router.push('/plan/create')
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">PlanAI</h1>
              <p className="text-sm text-gray-500">AI Financial Planner</p>
            </div>
          </div>
          
          {/* User Info */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              <p className="text-xs text-gray-500 capitalize">
                {profile?.subscription_tier === 'free' ? 'Miễn phí' :
                 profile?.subscription_tier === 'basic' ? 'Gói cơ bản' :
                 profile?.subscription_tier === 'pro' ? 'Gói chuyên nghiệp' : 'Gói cao cấp'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-6">
          <div className="space-y-2 mb-6">
            <button
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === 'chat' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">Chat AI</span>
            </button>
            
            <button
              onClick={handleCreatePlan}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Tạo kế hoạch mới</span>
            </button>
            
            <button
              onClick={() => router.push('/plans')}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium">Kế hoạch của tôi</span>
            </button>
          </div>

          {/* Usage Stats */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Thống kê sử dụng</h3>
              {profile?.subscription_tier !== 'pro_max' && (
                <button
                  onClick={() => router.push('/pricing')}
                  className="text-sm bg-gradient-to-r from-primary-600 to-primary-700 text-white px-3 py-1 rounded-full hover:from-primary-700 hover:to-primary-800 transition-all"
                >
                  Nâng cấp
                </button>
              )}
            </div>
            
            {profile && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Chat đã sử dụng:</span>
                  <span className="font-semibold text-primary-600">
                    {profile.chat_count || 0}/{
                      profile.subscription_tier === 'free' ? '5' :
                      profile.subscription_tier === 'basic' ? '30' :
                      profile.subscription_tier === 'pro' ? '70' : '150'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, ((profile.chat_count || 0) / (
                        profile.subscription_tier === 'free' ? 5 :
                        profile.subscription_tier === 'basic' ? 30 :
                        profile.subscription_tier === 'pro' ? 70 : 150
                      )) * 100)}%`
                    }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Kế hoạch đã tạo:</span>
                  <span className="font-semibold text-primary-600">
                    {profile.plan_count || 0}/{
                      profile.subscription_tier === 'free' ? '1' :
                      profile.subscription_tier === 'basic' ? '1' :
                      profile.subscription_tier === 'pro' ? '3' : '6'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, ((profile.plan_count || 0) / (
                        profile.subscription_tier === 'free' ? 1 :
                        profile.subscription_tier === 'basic' ? 1 :
                        profile.subscription_tier === 'pro' ? 3 : 6
                      )) * 100)}%`
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Plans */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Kế hoạch gần đây</h3>
            {plans.length > 0 ? (
              <div className="space-y-3">
                {plans.slice(0, 3).map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => router.push(`/plan/${plan.id}`)}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <h4 className="font-medium text-gray-900 text-sm truncate">{plan.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(plan.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Chưa có kế hoạch nào</p>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-3xl px-6 py-4 rounded-2xl ${
                message.type === 'user' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white border border-gray-200'
              }`}>
                <p className="whitespace-pre-wrap">{message.message}</p>
                <p className="text-xs mt-2 opacity-70">
                  {new Date(message.created_at).toLocaleTimeString('vi-VN')}
                </p>
              </div>
            </div>
          ))}

        {/* Typing indicator */}
        {isSending && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl px-6 py-4">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-6">
          {showPlanButton && (
            <div className="mb-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-primary-900">Sẵn sàng tạo kế hoạch?</h4>
                  <p className="text-sm text-primary-700">Bạn đã chat đủ để AI hiểu rõ mục tiêu của mình!</p>
                </div>
                <button
                  onClick={handleCreatePlan}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Tạo kế hoạch
                </button>
              </div>
            </div>
          )}
          
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn của bạn..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={3}
                disabled={isSending}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isSending}
              className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Send className="w-5 h-5" />
              <span>Gửi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
