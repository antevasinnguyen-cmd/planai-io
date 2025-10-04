'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, X } from 'lucide-react'

interface SuccessAlertProps {
  message: string
  duration?: number
}

export default function SuccessAlert({ message, duration = 5000 }: SuccessAlertProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 flex items-start">
        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
        <div className="flex-grow">
          <p className="text-green-800 font-medium">{message}</p>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-green-500 hover:text-green-700 ml-4"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
