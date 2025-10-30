import React from 'react'
import { Clock } from 'lucide-react'

interface Props {
  goal: string
  timeline: string
  completion: number
}

export default function GoalSummary({ goal, timeline, completion }: Props) {
  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-6 flex flex-col space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mục tiêu chính</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{goal || 'Chưa xác định mục tiêu'}</p>
      <div className="flex items-center text-sm text-gray-500 dark:text-gray-500 space-x-2">
        <Clock className="w-4 h-4" />
        <span>Thời hạn: {timeline || 'Chưa đặt'}</span>
      </div>
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span>Tiến độ</span>
          <span className="font-medium">{Math.round(completion * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${Math.min(completion * 100, 100)}%` }} />
        </div>
      </div>
    </div>
  )
}
