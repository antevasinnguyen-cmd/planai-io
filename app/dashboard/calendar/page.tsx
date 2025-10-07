'use client'

import { useState, useEffect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar as CalendarIcon, Plus } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function CalendarPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Quay lại Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Lịch trình
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Quản lý và theo dõi tiến độ kế hoạch tài chính của bạn
          </p>
        </div>

        {/* Coming Soon */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
          <div className="w-20 h-20 bg-primary-100 dark:bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="w-10 h-10 text-primary-600 dark:text-primary-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Tính năng đang phát triển
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Tính năng lịch trình sẽ giúp bạn theo dõi tiến độ và deadline của các mục tiêu tài chính. Sắp ra mắt!
          </p>
          <Link
            href="/dashboard/create-plan"
            className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Tạo kế hoạch mới</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
