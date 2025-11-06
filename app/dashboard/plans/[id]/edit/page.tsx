'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Save, X, Send } from 'lucide-react'
import PlanRenderer from '@/components/PlanRenderer'

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

export default function EditPlanPage() {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [title, setTitle] = useState('')
  const [goal, setGoal] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string>('')
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const initialLoadRef = useRef<boolean>(true)

  const [chatMessages, setChatMessages] = useState<{ type: 'user' | 'ai'; message: string }[]>([])
  const [chatInput, setChatInput] = useState('')
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
      router.push('/login')
      return
    }

  // Debounced autosave for title/goal/content
  useEffect(() => {
    if (!plan) return
    if (initialLoadRef.current) {
      initialLoadRef.current = false
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setAutoSaving(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const wordCount = content.split(' ').length
        const { error } = await supabase
          .from('plans')
          .update({
            title: title.trim(),
            goal: goal.trim(),
            content: content.trim(),
            word_count: wordCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', plan!.id)
        if (!error) {
          const now = new Date()
          setLastSavedAt(`${now.toLocaleTimeString('vi-VN')}`)
        }
      } catch {}
      finally {
        setAutoSaving(false)
      }
    }, 1500)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [title, goal, content, plan])

  // Replace or append markdown section by H2 heading
  const applySectionPatch = (sectionTitle: string, newMarkdown: string) => {
    if (!sectionTitle?.trim()) return
    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`(^|\n)##\\s*${escapeRegExp(sectionTitle.trim())}\\s*\n[\\s\\S]*?(?=\n##\\s|$)`, 'i')
    const replacement = `\n## ${sectionTitle.trim()}\n\n${newMarkdown.trim()}\n`
    if (pattern.test(content)) {
      setContent(prev => prev.replace(pattern, (_m) => replacement))
    } else {
      setContent(prev => `${prev.trim()}${replacement}`)
    }
  }

  const handleSendChat = async () => {
    const text = chatInput.trim()
    if (!text) return
    const preview = content.slice(0, 4000)
    const instruction = `Bạn là AI biên tập kế hoạch. CHỈ TRẢ VỀ THEO MẪU DƯỚI ĐÂY, KHÔNG THÊM BẤT KỲ CHỮ NÀO KHÁC:\nSECTION: <tên heading cấp 2 (##) cần thay>\nNEW_CONTENT:\n<nội dung markdown thay thế cho section đó>\n\nNội dung hiện tại (rút gọn nếu dài):\n---\n${preview}\n---\nYêu cầu của tôi: ${text}`
    const newChat = [...chatMessages, { type: 'user' as const, message: text }]
    setChatMessages(newChat)
    setChatInput('')
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: instruction, chatHistory: newChat })
      })
      const data = await res.json()
      const aiText: string = data?.response || 'Không nhận được phản hồi.'
      setChatMessages(prev => [...prev, { type: 'ai', message: aiText }])
      const sectionMatch = aiText.match(/SECTION:\s*(.+)/i)
      const contentIndex = aiText.indexOf('NEW_CONTENT:')
      if (sectionMatch && contentIndex >= 0) {
        const sectionTitle = sectionMatch[1].trim()
        const newBody = aiText.substring(contentIndex + 'NEW_CONTENT:'.length).trim()
        applySectionPatch(sectionTitle, newBody)
      }
    } catch (e) {
      setChatMessages(prev => [...prev, { type: 'ai', message: 'Có lỗi khi gọi AI. Vui lòng thử lại.' }])
    }
  }
    setUser(user)
  }

  const loadPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .maybeSingle()

      if (error || !data) {
        console.error('Error loading plan via client, will try server API fallback:', error)
        try {
          const { data: session } = await supabase.auth.getSession()
          const headers: any = {}
          if (session?.session?.access_token) {
            headers['Authorization'] = `Bearer ${session.session.access_token}`
          }
          const res = await fetch(`/api/plans/get?id=${encodeURIComponent(planId)}`, { credentials: 'include', headers })
          if (res.ok) {
            const json = await res.json()
            if (json?.plan) {
              setPlan(json.plan)
              setTitle(json.plan.title)
              setGoal(json.plan.goal)
              setContent(json.plan.content)
              return
            }
          }
          router.push('/dashboard/plans')
          return
        } catch (e) {
          console.error('Fallback API failed:', e)
          router.push('/dashboard/plans')
          return
        }
      }

      setPlan(data)
      setTitle(data.title)
      setGoal(data.goal)
      setContent(data.content)
    } catch (error) {
      console.error('Error loading plan:', error)
      router.push('/dashboard/plans')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!plan || !title.trim() || !content.trim()) {
      alert('Vui lòng điền đầy đủ tiêu đề và nội dung')
      return
    }

    setSaving(true)
    try {
      const wordCount = content.split(' ').length

      const { error } = await supabase
        .from('plans')
        .update({
          title: title.trim(),
          goal: goal.trim(),
          content: content.trim(),
          word_count: wordCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', plan.id)

      if (error) throw error

      router.push(`/dashboard/plans/${plan.id}`)
    } catch (error) {
      console.error('Error saving plan:', error)
      alert('Có lỗi xảy ra khi lưu kế hoạch. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  const wordCount = content.split(' ').length

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
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link
              href={`/dashboard/plans/${plan.id}`}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Quay lại
            </Link>
            <div className="h-6 border-l border-gray-300"></div>
            <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa kế hoạch</h1>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href={`/dashboard/plans/${plan.id}`}
              className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Hủy</span>
            </Link>

            <button
              onClick={handleSave}
              disabled={saving || !title.trim() || !content.trim()}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Preview */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Bản xem trước</h2>
                <div className="text-xs text-gray-500">{autoSaving ? 'Đang tự động lưu...' : (lastSavedAt ? `Đã lưu lúc ${lastSavedAt}` : ' ')}</div>
              </div>
              <PlanRenderer content={content} planId={plan.id} userTier="free" />
            </div>

            {/* Version Info */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="text-blue-600 mr-3 mt-1">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Thông tin phiên bản</h4>
                  <div className="text-blue-800 text-sm space-y-1">
                    <p>• Kế hoạch được tạo: {new Date(plan.created_at).toLocaleDateString('vi-VN')}</p>
                    <p>• Lần cập nhật cuối: {new Date(plan.updated_at).toLocaleDateString('vi-VN')}</p>
                    <p>• Số từ (hiện tại): {content.split(' ').length.toLocaleString()} từ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Editor + AI tools */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Title */}
            <div className="bg-white rounded-lg shadow-sm p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề kế hoạch *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập tiêu đề kế hoạch..."
                maxLength={200}
              />
              <div className="text-xs text-gray-500 mt-1">{title.length}/200 ký tự</div>
            </div>

            {/* Goal */}
            <div className="bg-white rounded-lg shadow-sm p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mục tiêu tài chính</label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Mô tả ngắn gọn về mục tiêu tài chính..."
                maxLength={500}
              />
              <div className="text-xs text-gray-500 mt-1">{goal.length}/500 ký tự</div>
            </div>

            {/* Content Editor */}
            <div className="bg-white rounded-lg shadow-sm p-5">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Nội dung kế hoạch *</label>
                <div className="text-sm text-gray-500">{wordCount.toLocaleString()} từ</div>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows={12}
                placeholder="Nội dung chi tiết của kế hoạch tài chính..."
              />
              <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                <span>Sử dụng Markdown để định dạng văn bản</span>
                <span>{autoSaving ? 'Đang tự động lưu...' : (lastSavedAt ? `Đã lưu lúc ${lastSavedAt}` : ' ')}</span>
              </div>
            </div>

            {/* AI Edit Assistant */}
            <div className="bg-white rounded-lg shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">AI chỉnh sửa từng mục</h3>
              </div>
              <div className="h-56 overflow-y-auto border border-gray-200 rounded-md p-3 space-y-2 mb-3 bg-gray-50">
                {chatMessages.length === 0 && (
                  <div className="text-xs text-gray-500">Gợi ý: "Cập nhật mục Lộ trình với timeline 12 tháng" hoặc "Viết lại mục Checklist tuần rõ ràng hơn"</div>
                )}
                {chatMessages.map((m, idx) => (
                  <div key={idx} className={`${m.type === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block px-3 py-2 rounded-lg text-sm ${m.type === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                      {m.message}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendChat() }}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Mô tả thay đổi, ví dụ: 'Cập nhật mục Giải pháp chi tiết với 3 bước rõ ràng'"
                />
                <button onClick={handleSendChat} className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg">
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-gray-500 mt-2">AI sẽ trả về SECTION/NEW_CONTENT và tự áp dụng vào nội dung. Bạn luôn có thể chỉnh tay ở ô soạn thảo phía trên.</p>
            </div>
          </div>
        </div>

        {/* Save Button (Mobile) */}
        <div className="mt-8 flex justify-center md:hidden">
          <button
            onClick={handleSave}
            disabled={saving || !title.trim() || !content.trim()}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
