'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  BarChart3,
  LucideIcon,
  Calendar,
  Target,
  CheckCircle2,
  StickyNote,
  Flame,
  Zap,
  Sparkles
} from 'lucide-react'
import { getTierName, getSubscriptionLimits, getPlanById, supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import GoalSummary from '@/components/analytics/GoalSummary'

interface AnalyticsSummary {
  total: number
  completed: number
  active: number
  failed: number
  totalWords: number
  heatmap: Record<string, number>
  averageDuration: number | null
  plans: Array<{ id: string; title: string; goal: string; status: string; created_at: string; word_count?: number }>
}

interface ChecklistItem {
  id: string
  plan_id: string
  title: string
  due_date: string | null
  status: 'pending' | 'in_progress' | 'completed'
  created_at: string
}

interface UserNote {
  id: string
  plan_id: string
  content: string
  created_at: string
}

interface ActivitySummary {
  label: string
  value: number
  limit: number
  icon: LucideIcon
  color: string
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)
  const [usage, setUsage] = useState<{ plans: number; chats: number; words: number } | null>(null)
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [notes, setNotes] = useState<UserNote[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [reloadToken, setReloadToken] = useState(0)
  const [newNote, setNewNote] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteContent, setEditingNoteContent] = useState('')
  const [planMetrics, setPlanMetrics] = useState<{ roadmap: number; actions: number; budgetTotal: number; resources: number; checklist: number } | null>(null)

  const emptySummary = useMemo<AnalyticsSummary>(
    () => ({
      total: 0,
      completed: 0,
      active: 0,
      failed: 0,
      totalWords: 0,
      heatmap: {},
      averageDuration: null,
      plans: []
    }),
    []
  )

  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      router.push('/login')
      return
    }
    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      const newErrors: string[] = []

      try {
        // Fetch subscription tier via API endpoint (server-side admin client)
        const fetchWithFallback = async <T,>(url: string, fallbackValue: T): Promise<T> => {
          try {
            const { data: { session } } = await supabase.auth.getSession()
            const headers: Record<string, string> = {}
            if (session?.access_token) {
              headers['Authorization'] = `Bearer ${session.access_token}`
            }
            const res = await fetch(url, { credentials: 'include', headers })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
              console.error(`API ${url} failed:`, data?.error || res.status)
              return fallbackValue
            }
            return data as T
          } catch (err) {
            console.error(`Fetch ${url} error:`, err)
            return fallbackValue
          }
        }

        const [tierData, usageData] = await Promise.all([
          fetchWithFallback<{ tier: string }>('/api/user/tier', { tier: 'free' }),
          fetchWithFallback<{ usage?: { plans: number; chats: number; words: number } }>('/api/usage/stats', { usage: { plans: 0, chats: 0, words: 0 } })
        ])

        if (!cancelled) {
          // Set subscription from tier endpoint
          setSubscription({ tier: tierData.tier || 'free' })

          // Set usage from stats endpoint
          setUsage({
            plans: usageData.usage?.plans || 0,
            chats: usageData.usage?.chats || 0,
            words: usageData.usage?.words || 0
          })
        }

        const loadJson = async <T,>(url: string, errorMessage: string): Promise<T | null> => {
          try {
            const { data: { session } } = await supabase.auth.getSession()
            const headers: Record<string, string> = {}
            if (session?.access_token) {
              headers['Authorization'] = `Bearer ${session.access_token}`
            }
            const res = await fetch(url, { credentials: 'include', headers })
            const data = await res.json().catch(() => ({}))
            if (!res.ok || data?.error) {
              throw new Error(data?.error || `Request failed with status ${res.status}`)
            }
            return data as T
          } catch (err) {
            console.error(`Failed to load ${url}:`, err)
            if (!cancelled) newErrors.push(errorMessage)
            return null
          }
        }

        const [summaryData, checklistData, notesData] = await Promise.all([
          loadJson<AnalyticsSummary>('/api/analytics/summary', 'Không thể tải thống kê tổng quan. Dữ liệu đang hiển thị trống.'),
          loadJson<{ items: ChecklistItem[] }>('/api/analytics/checklist', 'Không thể tải checklist. Danh sách nhiệm vụ sẽ để trống.'),
          loadJson<{ notes: UserNote[] }>('/api/analytics/notes', 'Không thể tải ghi chú chiến lược. Danh sách ghi chú sẽ để trống.')
        ])

        if (!cancelled) {
          setSummary(summaryData || emptySummary)
          setChecklist(checklistData?.items || [])
          setNotes(notesData?.notes || [])
        }
      } catch (err) {
        console.error('Unexpected analytics load error:', err)
        if (!cancelled) {
          newErrors.push('Đã xảy ra lỗi không xác định. Một số dữ liệu có thể chưa hiển thị đầy đủ.')
          setSummary(emptySummary)
          setChecklist([])
          setNotes([])
          setUsage(prev => prev || { plans: 0, chats: 0, words: 0 })
        }
      } finally {
        if (!cancelled) {
          setErrors(newErrors)
          setIsLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user, router, emptySummary, reloadToken])

  const tier = subscription?.tier || 'free'
  const limits = useMemo(() => getSubscriptionLimits(tier), [tier])

  const activitySummary: ActivitySummary[] = useMemo(() => {
    return []
  }, [])

  const primaryPlan = useMemo(() => {
    if (!summary?.plans?.length) return null
    return summary.plans.find(plan => plan.status === 'active') || summary.plans[0]
  }, [summary])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!primaryPlan) { setPlanMetrics(null); return }
      try {
        const { data } = await getPlanById(primaryPlan.id)
        let metrics = { roadmap: 0, actions: 0, budgetTotal: 0, resources: 0, checklist: 0 }
        if (data?.content) {
          const m = /```json\s*\{[\s\S]*?\}\s*```\s*$/m.exec(data.content)
          if (m) {
            const jsonText = m[0].replace(/```json|```/g, '').trim()
            try {
              const parsed = JSON.parse(jsonText)
              metrics.roadmap = Array.isArray(parsed.roadmap) ? parsed.roadmap.length : 0
              metrics.actions = Array.isArray(parsed.actions) ? parsed.actions.length : 0
              metrics.budgetTotal = Array.isArray(parsed.budget) ? parsed.budget.reduce((s: number, it: any) => s + (Number(it.amount) || 0), 0) : 0
              metrics.resources = Array.isArray(parsed.resources) ? parsed.resources.length : 0
              metrics.checklist = Array.isArray(parsed.checklist_data) ? Math.max((parsed.checklist_data.length - 1), 0) : 0
            } catch {}
          }
        }
        if (!cancelled) setPlanMetrics(metrics)
      } catch {}
    })()
    return () => { cancelled = true }
  }, [primaryPlan])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Đang tải phân tích...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {errors.length > 0 && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">Một số dữ liệu chưa thể tải. Dữ liệu còn lại đang hiển thị với giá trị trống.</p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  {errors.map((message, index) => (
                    <li key={index}>{message}</li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => setReloadToken(token => token + 1)}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
              >
                Thử tải lại
              </button>
            </div>
          </div>
        )}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Quay lại Dashboard</span>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Phân tích & Báo cáo</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Theo dõi hiệu suất, tiến độ và insight quan trọng trong hành trình tài chính của bạn.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="px-4 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-300">
              <span className="font-semibold text-primary-600 dark:text-primary-400 mr-1">{getTierName(tier)}</span>
              • Giới hạn kế hoạch: {limits.plans} • Chat: {limits.chats}
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-purple-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all"
            >
              <Zap className="w-4 h-4" />
              <span>Nâng cấp năng lực phân tích</span>
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            {/* Chỉ số từ kế hoạch (JSON Data Layer) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Mốc lộ trình</h3>
                <p className="text-2xl font-semibold">{planMetrics?.roadmap ?? 0}</p>
              </div>
              <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Hành động ưu tiên</h3>
                <p className="text-2xl font-semibold">{planMetrics?.actions ?? 0}</p>
              </div>
              <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Tổng ngân sách (ước tính)</h3>
                <p className="text-2xl font-semibold">{(planMetrics?.budgetTotal ?? 0).toLocaleString('vi-VN')} đ</p>
              </div>
              <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Tài nguyên học tập</h3>
                <p className="text-2xl font-semibold">{planMetrics?.resources ?? 0}</p>
              </div>
              <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Checklist mục tiêu</h3>
                <p className="text-2xl font-semibold">{planMetrics?.checklist ?? 0}</p>
              </div>
            </div>

            {/* Hoạt động gần đây */}
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hoạt động gần đây</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Các cột mốc quan trọng trong 30 ngày qua</p>
                </div>
                <Calendar className="w-5 h-5 text-primary-500" />
              </div>
              <div className="space-y-3">
                {summary?.plans.slice(0, 4).map(plan => (
                  <div key={plan.id} className="flex items-start justify-between border border-gray-200 dark:border-gray-800 rounded-lg p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{plan.title || 'Kế hoạch tài chính'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Tạo {new Date(plan.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      plan.status === 'completed'
                        ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                        : plan.status === 'failed'
                          ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}>
                      {plan.status === 'completed' ? 'Hoàn tất' : plan.status === 'failed' ? 'Thất bại' : 'Đang thực hiện'}
                    </span>
                  </div>
                ))}
                {!summary?.plans?.length && (
                  <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-500 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                    Chưa có kế hoạch nào được tạo.
                  </div>
                )}
              </div>
            </div>

            {/* Đã bỏ Phân tích sử dụng theo yêu cầu */}

            {/* Checklist hành động */}
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Checklist hành động</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Theo sát các nhiệm vụ quan trọng trong kế hoạch của bạn</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div className="space-y-3">
                {checklist.slice(0, 6).map(item => (
                  <div key={item.id} className="flex items-start justify-between border border-gray-200 dark:border-gray-800 rounded-lg p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {item.due_date ? `Hạn: ${new Date(item.due_date).toLocaleDateString('vi-VN')}` : 'Không có hạn cụ thể'}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      item.status === 'completed'
                        ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                        : item.status === 'in_progress'
                          ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      {item.status === 'completed' ? 'Hoàn thành' : item.status === 'in_progress' ? 'Đang thực hiện' : 'Chưa bắt đầu'}
                    </span>
                  </div>
                ))}
                {!checklist.length && (
                  <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-500 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                    Chưa có checklist nào. Hãy bắt đầu bằng việc tạo các nhiệm vụ cụ thể cho kế hoạch.
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <GoalSummary
              goal={primaryPlan?.goal || ''}
              timeline={primaryPlan ? new Date(primaryPlan.created_at).toLocaleDateString('vi-VN') : ''}
              completion={summary ? (summary.completed / Math.max(summary.total, 1)) : 0}
            />

            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ghi chú chiến lược</h3>
                <StickyNote className="w-5 h-5 text-amber-500" />
              </div>
              
              {/* Thêm ghi chú mới */}
              <div className="mb-4 space-y-2">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Ghi lại insight, chiến lược hoặc ghi chú quan trọng..."
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
                <button
                  onClick={() => {
                    if (newNote.trim()) {
                      setNotes([{
                        id: Date.now().toString(),
                        plan_id: '',
                        content: newNote,
                        created_at: new Date().toISOString()
                      }, ...notes])
                      setNewNote('')
                    }
                  }}
                  className="w-full px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Lưu ghi chú
                </button>
              </div>

              {/* Danh sách ghi chú */}
              <div className="space-y-3">
                {notes.slice(0, 5).map(note => (
                  <div key={note.id} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-800 group">
                    {editingNoteId === note.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingNoteContent}
                          onChange={(e) => setEditingNoteContent(e.target.value)}
                          className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setNotes(notes.map(n => n.id === note.id ? {...n, content: editingNoteContent} : n))
                              setEditingNoteId(null)
                            }}
                            className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => setEditingNoteId(null)}
                            className="flex-1 px-2 py-1 bg-gray-400 hover:bg-gray-500 text-white text-xs font-medium rounded transition-colors"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{note.content}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-xs text-gray-500 dark:text-gray-500">{new Date(note.created_at).toLocaleString('vi-VN')}</p>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingNoteId(note.id)
                                setEditingNoteContent(note.content)
                              }}
                              className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-colors"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => setNotes(notes.filter(n => n.id !== note.id))}
                              className="text-xs px-2 py-1 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {!notes.length && (
                  <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-500 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                    Bạn chưa có ghi chú nào. Hãy ghi lại insight quan trọng từ kế hoạch hoặc buổi coaching.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Timeline kế hoạch</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Các mốc quan trọng và bước tiếp theo</p>
                </div>
                <Calendar className="w-5 h-5 text-primary-500" />
              </div>
              <div className="space-y-3">
                {summary?.plans.slice(0, 4).map(plan => (
                  <div key={plan.id} className="flex items-start space-x-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{plan.title || 'Kế hoạch tài chính'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(plan.created_at).toLocaleDateString('vi-VN')} • {plan.status === 'completed' ? 'Đã hoàn thành' : plan.status === 'failed' ? 'Thất bại' : 'Đang triển khai'}
                      </p>
                    </div>
                  </div>
                ))}
                {!summary?.plans?.length && (
                  <p className="text-sm text-gray-500 dark:text-gray-500">Bạn chưa có kế hoạch nào. Bắt đầu tạo kế hoạch để xem timeline của bạn ở đây.</p>
                )}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}
