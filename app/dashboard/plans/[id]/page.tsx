'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Download, Edit, Share, Trash2, FileText, Calendar, Target, User } from 'lucide-react'

interface Plan {
  id: string
  title: string
  goal: string
  content: string
  word_count: number
  status: string
  created_at: string
  updated_at: string
}

export default function PlanDetailPage() {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const params = useParams()
  const planId = params.id as string

  useEffect(() => {
    checkAuth()
    loadPlan()
  }, [planId])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    setUser(user)
  }

  const loadPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single()

      if (error) {
        console.error('Error loading plan:', error)
        router.push('/dashboard/plans')
        return
      }

      setPlan(data)
    } catch (error) {
      console.error('Error loading plan:', error)
      router.push('/dashboard/plans')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: 'pdf' | 'docx' | 'txt') => {
    if (!plan) return

    setExporting(format)
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          format
        }),
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `${plan.title}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert('Có lỗi xảy ra khi xuất file. Vui lòng thử lại.')
    } finally {
      setExporting(null)
    }
  }

  const handleDelete = async () => {
    if (!plan || !confirm('Bạn có chắc chắn muốn xóa kế hoạch này? Hành động này không thể hoàn tác.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', plan.id)

      if (error) throw error

      router.push('/dashboard/plans')
    } catch (error) {
      console.error('Error deleting plan:', error)
      alert('Có lỗi xảy ra khi xóa kế hoạch')
    }
  }

  const copyToClipboard = async () => {
    if (!plan) return

    try {
      await navigator.clipboard.writeText(plan.content)
      alert('Đã sao chép nội dung kế hoạch!')
    } catch (error) {
      console.error('Copy error:', error)
      alert('Không thể sao chép. Vui lòng thử lại.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy kế hoạch</h2>
          <Link href="/dashboard/plans" className="text-blue-600 hover:text-blue-700">
            Quay lại danh sách kế hoạch
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard/plans"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Quay lại
            </Link>
            <div className="h-6 border-l border-gray-300"></div>
            <h1 className="text-2xl font-bold text-gray-900">Chi tiết kế hoạch</h1>
          </div>

          <div className="flex items-center space-x-3">
            {/* Export Dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4" />
                <span>Xuất file</span>
              </button>
              
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="py-2">
                  <button
                    onClick={() => handleExport('pdf')}
                    disabled={exporting === 'pdf'}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4" />
                    <span>PDF</span>
                    {exporting === 'pdf' && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 ml-auto"></div>}
                  </button>
                  <button
                    onClick={() => handleExport('docx')}
                    disabled={exporting === 'docx'}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Word (DOCX)</span>
                    {exporting === 'docx' && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 ml-auto"></div>}
                  </button>
                  <button
                    onClick={() => handleExport('txt')}
                    disabled={exporting === 'txt'}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Text (TXT)</span>
                    {exporting === 'txt' && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 ml-auto"></div>}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={copyToClipboard}
              className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Share className="w-4 h-4" />
              <span>Sao chép</span>
            </button>

            <Link
              href={`/dashboard/plans/${plan.id}/edit`}
              className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Chỉnh sửa</span>
            </Link>

            <button
              onClick={handleDelete}
              className="flex items-center space-x-2 border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa</span>
            </button>
          </div>
        </div>

        {/* Plan Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Mục tiêu</p>
                <p className="font-medium text-gray-900">{plan.goal}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Số từ</p>
                <p className="font-medium text-gray-900">{plan.word_count?.toLocaleString()} từ</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Ngày tạo</p>
                <p className="font-medium text-gray-900">
                  {new Date(plan.created_at).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Trạng thái</p>
                <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                  plan.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {plan.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Title */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{plan.title}</h2>
        </div>

        {/* Plan Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="prose prose-gray max-w-none">
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {plan.content}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <Link
            href="/dashboard/plans/create"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
          >
            <Target className="w-5 h-5 mr-2" />
            Tạo kế hoạch mới
          </Link>
          
          <Link
            href="/dashboard/chat"
            className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center"
          >
            <Share className="w-5 h-5 mr-2" />
            Chat với AI
          </Link>
        </div>
      </div>
    </div>
  )
}
