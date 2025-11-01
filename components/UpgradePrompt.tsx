'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, Zap, Star, ArrowRight, Clock, TrendingUp } from 'lucide-react'

interface UpgradePromptProps {
  variant?: 'banner' | 'modal' | 'card'
  trigger?: 'quota_warning' | 'feature_limit' | 'general'
  currentUsage?: {
    chats: number
    plans: number
    words?: number
  }
  limits?: {
    chats: number
    plans: number
    words?: number
  }
  onClose?: () => void
  className?: string
}

export default function UpgradePrompt({ 
  variant = 'card',
  trigger = 'general',
  currentUsage,
  limits,
  onClose,
  className = ''
}: UpgradePromptProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  const getUrgencyLevel = () => {
    if (!currentUsage || !limits) return 'low'
    
    const chatUsage = (currentUsage.chats / limits.chats) * 100
    const planUsage = (currentUsage.plans / limits.plans) * 100
    
    if (chatUsage >= 90 || planUsage >= 90) return 'high'
    if (chatUsage >= 70 || planUsage >= 70) return 'medium'
    return 'low'
  }

  const urgency = getUrgencyLevel()

  const getPromptContent = () => {
    switch (trigger) {
      case 'quota_warning':
        return {
          title: '⚠️ Sắp hết quota rồi!',
          description: `Bạn đã sử dụng ${currentUsage?.chats}/${limits?.chats} chat và ${currentUsage?.plans}/${limits?.plans} kế hoạch. Nâng cấp ngay để không bị gián đoạn!`,
          urgencyText: 'Chỉ còn vài lượt sử dụng',
          buttonText: 'Nâng cấp ngay',
          color: 'red'
        }
      case 'feature_limit':
        return {
          title: '🚀 Mở khóa tính năng cao cấp',
          description: 'Tính năng này chỉ dành cho người dùng trả phí. Nâng cấp để trải nghiệm đầy đủ sức mạnh của PlanAI!',
          urgencyText: 'Tính năng Premium',
          buttonText: 'Xem gói nâng cấp',
          color: 'blue'
        }
      default:
        return {
          title: '💎 Nâng cấp để mở khóa toàn bộ tiềm năng',
          description: 'Tạo nhiều kế hoạch hơn, chat không giới hạn và nhận phân tích chuyên sâu với AI.',
          urgencyText: 'Ưu đãi có hạn',
          buttonText: 'Khám phá gói Pro',
          color: 'purple'
        }
    }
  }

  const content = getPromptContent()

  // Banner variant
  if (variant === 'banner') {
    const bgColorClass = content.color === 'red' 
      ? 'bg-gradient-to-r from-red-600 to-red-700' 
      : content.color === 'blue'
      ? 'bg-gradient-to-r from-blue-600 to-blue-700'
      : 'bg-gradient-to-r from-purple-600 to-purple-700'
    
    return (
      <div className={`relative ${bgColorClass} text-white p-4 ${className}`}>
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {urgency === 'high' ? (
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                  <Clock className="w-4 h-4" />
                </div>
              ) : (
                <Zap className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="font-semibold">{content.title}</div>
              <div className="text-sm opacity-90">{content.description}</div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href="/pricing"
              className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors inline-flex items-center"
            >
              {content.buttonText}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            {onClose && (
              <button
                onClick={handleClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Modal variant
  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
          {onClose && (
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-white" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">{content.title}</h3>
            <p className="text-gray-600 mb-6">{content.description}</p>
            
            {urgency === 'high' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="text-red-700 text-sm font-medium">{content.urgencyText}</div>
              </div>
            )}
            
            <div className="space-y-3">
              <Link
                href="/pricing"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all inline-flex items-center justify-center"
              >
                {content.buttonText}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              
              {onClose && (
                <button
                  onClick={handleClose}
                  className="w-full text-gray-600 py-2 text-sm hover:text-gray-800 transition-colors"
                >
                  Để sau
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Card variant (default)
  return (
    <div className={`bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">{content.urgencyText}</span>
          </div>
          
          <h3 className="font-semibold text-gray-900 mb-1">{content.title}</h3>
          <p className="text-gray-600 text-sm mb-4">{content.description}</p>
          
          {currentUsage && limits && (
            <div className="flex space-x-4 mb-4">
              <div className="text-xs">
                <span className="text-gray-500">Chat: </span>
                <span className="font-medium">{currentUsage.chats}/{limits.chats}</span>
              </div>
              <div className="text-xs">
                <span className="text-gray-500">Kế hoạch: </span>
                <span className="font-medium">{currentUsage.plans}/{limits.plans}</span>
              </div>
            </div>
          )}
          
          <Link
            href="/pricing"
            className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            {content.buttonText}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
        
        {onClose && (
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-4"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}
