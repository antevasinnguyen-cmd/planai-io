'use client'

import { TrendingUp, AlertTriangle } from 'lucide-react'

interface UsageProgressBarProps {
  current: number
  limit: number
  label: string
  color?: 'blue' | 'green' | 'purple' | 'orange'
  showUpgradePrompt?: boolean
  onUpgradeClick?: () => void
}

export default function UsageProgressBar({
  current,
  limit,
  label,
  color = 'blue',
  showUpgradePrompt = false,
  onUpgradeClick
}: UsageProgressBarProps) {
  const percentage = Math.min((current / limit) * 100, 100)
  const remaining = Math.max(0, limit - current)
  
  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-600',
          text: 'text-blue-600',
          bgLight: 'bg-blue-100'
        }
      case 'green':
        return {
          bg: 'bg-green-600',
          text: 'text-green-600',
          bgLight: 'bg-green-100'
        }
      case 'purple':
        return {
          bg: 'bg-purple-600',
          text: 'text-purple-600',
          bgLight: 'bg-purple-100'
        }
      case 'orange':
        return {
          bg: 'bg-orange-600',
          text: 'text-orange-600',
          bgLight: 'bg-orange-100'
        }
      default:
        return {
          bg: 'bg-blue-600',
          text: 'text-blue-600',
          bgLight: 'bg-blue-100'
        }
    }
  }

  const colors = getColorClasses()
  const isNearLimit = percentage >= 80
  const isAtLimit = percentage >= 100

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <span className={`text-lg font-bold ${colors.text}`}>
          {current.toLocaleString()}/{limit.toLocaleString()}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              isAtLimit ? 'bg-red-500' : 
              isNearLimit ? 'bg-orange-500' : 
              colors.bg
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {/* Percentage indicator */}
        {percentage > 10 && (
          <div 
            className="absolute top-0 h-3 flex items-center justify-center text-xs font-medium text-white"
            style={{ 
              left: `${Math.min(percentage - 5, 85)}%`,
              width: '10%'
            }}
          >
            {Math.round(percentage)}%
          </div>
        )}
      </div>

      {/* Status and Actions */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2">
          {isAtLimit ? (
            <>
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-red-600 font-medium">Đã đạt giới hạn</span>
            </>
          ) : isNearLimit ? (
            <>
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="text-orange-600">Sắp đạt giới hạn</span>
            </>
          ) : (
            <span className="text-gray-500">
              Còn lại: {remaining.toLocaleString()}
            </span>
          )}
        </div>

        {(showUpgradePrompt && (isNearLimit || isAtLimit)) && (
          <button
            onClick={onUpgradeClick}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Nâng cấp
          </button>
        )}
      </div>

      {/* Warning message for near/at limit */}
      {isAtLimit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-red-800 text-sm font-medium mb-1">
            Bạn đã sử dụng hết {label.toLowerCase()}
          </div>
          <div className="text-red-700 text-xs">
            Nâng cấp gói để tiếp tục sử dụng tính năng này
          </div>
        </div>
      )}
    </div>
  )
}
