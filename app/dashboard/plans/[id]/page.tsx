'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Download, Edit, Share2, Trash2, FileText, 
  Clock, Sparkles, FileDown, FileSpreadsheet, Globe,
  Star, Moon, Zap, History, Save, Eye, Code
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import PlanRenderer from '@/components/PlanRenderer'

interface Plan {
  id: string
  title: string
  content: string
  collected_info: any
  status: string
  created_at: string
  updated_at: string
  spiritual_enabled: boolean
  spiritual_data: any
}

export default function PlanViewEnhanced() {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showSpiritualMenu, setShowSpiritualMenu] = useState(false)
  const [spiritualEnabled, setSpiritualEnabled] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const planId = params.id as string

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    loadPlan()
  }, [user, planId, router])

  const loadPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single()

      if (error) throw error
      
      setPlan(data)
      setEditedContent(data.content)
      setSpiritualEnabled(data.spiritual_enabled || false)
    } catch (error) {
      console.error('Error loading plan:', error)
      alert('Không thể tải kế hoạch')
      router.push('/dashboard/plans')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!plan) return

    try {
      const { error } = await supabase
        .from('plans')
        .update({ 
          content: editedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId)

      if (error) throw error

      setPlan({ ...plan, content: editedContent })
      setIsEditing(false)
      alert('Đã lưu thay đổi!')
    } catch (error) {
      console.error('Error saving:', error)
      alert('Có lỗi khi lưu')
    }
  }

  const handleExport = async (format: string) => {
    if (!plan) return

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const headers: any = { 'Content-Type': 'application/json' }
      if (sessionData?.session?.access_token) {
        headers['Authorization'] = `Bearer ${sessionData.session.access_token}`
      }

      const res = await fetch('/api/plans/export', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ planId: plan.id, format })
      })

      if (res.status === 403) {
        let msg = 'Tính năng chưa được mở khóa. Vui lòng nâng cấp gói.'
        try {
          const data = await res.json()
          if (data?.message) msg = data.message
        } catch {}
        alert(msg)
        router.push('/pricing')
        return
      }

      if (!res.ok) {
        let errMsg = 'Export failed'
        try {
          const data = await res.json()
          errMsg = data?.error || errMsg
        } catch {}
        throw new Error(errMsg)
      }

      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const data = await res.json()
        if (data?.url) {
          window.open(data.url, '_blank')
        } else if (data?.message) {
          alert(data.message)
        }
      } else {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `plan-${plan.id}.${format}`
        a.click()
      }
      setShowExportMenu(false)
    } catch (error) {
      console.error('Export error:', error)
      alert('Có lỗi khi xuất file')
    }
  }

  const toggleSpiritual = async () => {
    if (!plan) return

    const newValue = !spiritualEnabled

    try {
      // If enabling, generate spiritual analysis
      if (newValue && !plan.spiritual_data) {
        const res = await fetch('/api/spiritual/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: plan.id,
            birthDate: plan.collected_info?.birth_date
          })
        })

        const data = await res.json()
        
        await supabase
          .from('plans')
          .update({
            spiritual_enabled: newValue,
            spiritual_data: data.analysis
          })
          .eq('id', planId)

        setPlan({ ...plan, spiritual_enabled: newValue, spiritual_data: data.analysis })
      } else {
        await supabase
          .from('plans')
          .update({ spiritual_enabled: newValue })
          .eq('id', planId)

        setPlan({ ...plan, spiritual_enabled: newValue })
      }

      setSpiritualEnabled(newValue)
    } catch (error) {
      console.error('Error toggling spiritual:', error)
      alert('Có lỗi xảy ra')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải kế hoạch...</p>
        </div>
      </div>
    )
  }

  if (!plan) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f]">
      {/* Header */}
      <header className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard/plans"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {plan.title}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Tạo lúc {new Date(plan.created_at).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Edit Button */}
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Chỉnh sửa</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setEditedContent(plan.content)
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Lưu</span>
                  </button>
                </>
              )}

              {/* Export Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Xuất file</span>
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl py-2 z-20">
                    <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Xuất file</p>
                    </div>
                    <button
                      onClick={() => handleExport('pdf')}
                      className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <FileDown className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">PDF</span>
                    </button>
                    <button
                      onClick={() => handleExport('docx')}
                      className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Word (DOCX)</span>
                    </button>
                    <button
                      onClick={() => handleExport('gdocs')}
                      className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Google Docs</span>
                    </button>
                    
                    <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-800 mt-2">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Xuất bảng</p>
                    </div>
                    <button
                      onClick={() => handleExport('sheets')}
                      className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Google Sheets</span>
                    </button>
                    <button
                      onClick={() => handleExport('notion')}
                      className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Globe className="w-4 h-4 text-gray-700" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Notion</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Spiritual Toggle */}
              <button
                onClick={toggleSpiritual}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  spiritualEnabled
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Star className="w-4 h-4" />
                <span>Tử vi</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Plan Content */}
          <div className="lg:col-span-2">
            {isEditing ? (
              <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-8">
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-[600px] px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0f0f0f] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-gray-900 dark:text-white font-mono text-sm"
                />
              </div>
            ) : (
              <PlanRenderer 
                content={plan.content} 
                planId={plan.id}
                onExport={handleExport}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Spiritual Analysis */}
            {spiritualEnabled && plan.spiritual_data && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Star className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-bold text-purple-900 dark:text-purple-300">Phân tích Tử vi</h3>
                </div>
                <div className="space-y-3 text-sm text-purple-800 dark:text-purple-300">
                  <p><strong>Cung mệnh:</strong> {plan.spiritual_data.zodiac}</p>
                  <p><strong>Số mệnh:</strong> {plan.spiritual_data.lifePath}</p>
                  <p><strong>Lời khuyên:</strong> {plan.spiritual_data.advice}</p>
                </div>
              </div>
            )}

            {/* Info Card */}
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Thông tin</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Trạng thái</span>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded text-xs font-medium">
                    {plan.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tạo lúc</span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(plan.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Cập nhật</span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(plan.updated_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Hành động</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <History className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Lịch sử phiên bản</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <Share2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Chia sẻ</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors text-red-600 dark:text-red-400">
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">Xóa kế hoạch</span>
                </button>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-6">
              <div className="flex items-start space-x-2">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-900 dark:text-blue-300 font-medium mb-1">
                    Mẹo
                  </p>
                  <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                    <li>• Xuất sang Google Sheets để theo dõi tiến độ</li>
                    <li>• Bật tính năng Tử vi để có thêm động lực</li>
                    <li>• Chỉnh sửa trực tiếp trong plan</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
