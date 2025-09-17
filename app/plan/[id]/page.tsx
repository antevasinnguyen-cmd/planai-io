'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Edit3, Download, Share2, History, Save, X, FileText, File, Globe } from 'lucide-react'
import { getCurrentUser, getUserProfile, getPlanById, updatePlan } from '@/lib/supabase'

export default function PlanViewPage() {
  const [user, setUser] = useState<any>(null)
  const [plan, setPlan] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    initializePage()
  }, [])

  const initializePage = async () => {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      router.push('/login')
      return
    }

    setUser(currentUser)
    
    // Get plan details
    const planId = params.id as string
    const { data: planData } = await getPlanById(planId)
    if (planData) {
      setPlan(planData)
      setEditedContent(planData.content)
    } else {
      router.push('/dashboard')
      return
    }

    setIsLoading(false)
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!plan || !editedContent.trim()) return

    setIsSaving(true)
    
    const updatedPlan = {
      ...plan,
      content: editedContent,
      word_count: editedContent.split(' ').length,
      updated_at: new Date().toISOString()
    }

    const { error } = await updatePlan(plan.id, {
      content: editedContent,
      word_count: editedContent.split(' ').length
    })

    if (!error) {
      setPlan(updatedPlan)
      setIsEditing(false)
    }

    setIsSaving(false)
  }

  const handleCancel = () => {
    setEditedContent(plan.content)
    setIsEditing(false)
  }

  const handleExport = async (format: string) => {
    if (!plan) return
    
    setIsExporting(true)
    setShowExportMenu(false)

    try {
      const { exportToPDF, exportToWord, exportToText, downloadFile } = await import('@/lib/export')
      
      const options = {
        title: plan.title,
        content: plan.content,
        format: format as any,
        userId: user?.id
      }

      let blob: Blob
      let filename: string

      switch (format) {
        case 'pdf':
          blob = await exportToPDF(options)
          filename = `${plan.title}.pdf`
          break
        case 'docx':
          blob = await exportToWord(options)
          filename = `${plan.title}.docx`
          break
        case 'txt':
          blob = exportToText(options)
          filename = `${plan.title}.txt`
          break
        default:
          throw new Error('Unsupported format')
      }

      downloadFile(blob, filename)
    } catch (error) {
      console.error('Export error:', error)
      alert('Có lỗi xảy ra khi xuất file. Vui lòng thử lại.')
    }

    setIsExporting(false)
  }

  const handleExportToNotion = async () => {
    const notionToken = prompt('Nhập Notion Integration Token:')
    const notionPageId = prompt('Nhập Notion Page ID:')
    
    if (!notionToken || !notionPageId) return

    setIsExporting(true)
    
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          format: 'notion',
          notionToken,
          notionPageId
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('Xuất thành công! Kiểm tra trang Notion của bạn.')
        if (data.notionUrl) {
          window.open(data.notionUrl, '_blank')
        }
      } else {
        alert(`Lỗi: ${data.error}`)
      }
    } catch (error) {
      console.error('Notion export error:', error)
      alert('Có lỗi xảy ra khi xuất sang Notion.')
    }

    setIsExporting(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải kế hoạch...</p>
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy kế hoạch</h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700"
          >
            Quay về Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Quay lại
          </button>
          
          <div className="flex space-x-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-primary-400"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEdit}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Chỉnh sửa
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    disabled={isExporting}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isExporting ? 'Đang xuất...' : 'Xuất file'}
                  </button>
                  
                  {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                      <div className="py-1">
                        <button
                          onClick={() => handleExport('pdf')}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <FileText className="w-4 h-4 mr-2 text-red-500" />
                          Xuất PDF
                        </button>
                        <button
                          onClick={() => handleExport('docx')}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <File className="w-4 h-4 mr-2 text-blue-500" />
                          Xuất Word
                        </button>
                        <button
                          onClick={() => handleExport('txt')}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <FileText className="w-4 h-4 mr-2 text-gray-500" />
                          Xuất Text
                        </button>
                        <hr className="my-1" />
                        <button
                          onClick={handleExportToNotion}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Globe className="w-4 h-4 mr-2 text-gray-800" />
                          Xuất Notion
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Share2 className="w-4 h-4 mr-2" />
                  Chia sẻ
                </button>
              </>
            )}
          </div>
        </div>

        {/* Plan Content */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Plan Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6 text-white">
            <h1 className="text-2xl font-bold mb-2">{plan.title}</h1>
            <div className="flex items-center space-x-6 text-sm opacity-90">
              <div>
                <span className="font-medium">Mục tiêu:</span> {plan.goal}
              </div>
              <div>
                <span className="font-medium">Số từ:</span> {plan.word_count?.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Trạng thái:</span> {
                  plan.status === 'completed' ? 'Hoàn thành' :
                  plan.status === 'draft' ? 'Bản nháp' : 'Đã lưu trữ'
                }
              </div>
              <div>
                <span className="font-medium">Cập nhật:</span> {
                  new Date(plan.updated_at).toLocaleDateString('vi-VN')
                }
              </div>
            </div>
          </div>

          {/* Plan Content */}
          <div className="p-8">
            {isEditing ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nội dung kế hoạch
                </label>
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none font-mono text-sm"
                  placeholder="Nhập nội dung kế hoạch..."
                />
                <p className="text-sm text-gray-500 mt-2">
                  Số từ: {editedContent.split(' ').length.toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="prose prose-lg max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
                  {plan.content}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Version History */}
        {!isEditing && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <History className="w-5 h-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Lịch sử phiên bản</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Phiên bản {plan.version || 1}</p>
                  <p className="text-sm text-gray-600">
                    Cập nhật lần cuối: {new Date(plan.updated_at).toLocaleString('vi-VN')}
                  </p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  Hiện tại
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
