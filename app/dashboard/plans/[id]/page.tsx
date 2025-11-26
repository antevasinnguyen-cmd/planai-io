'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Download, Edit, Share2, Trash2, FileText, 
  Clock, Sparkles, FileDown, FileSpreadsheet, Globe,
  Star, Moon, Zap, History, Save, Eye, Code, Lock, Crown
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase, getUserSubscription } from '@/lib/supabase'
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
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showSpiritualMenu, setShowSpiritualMenu] = useState(false)
  const [spiritualEnabled, setSpiritualEnabled] = useState(false)
  const [subscription, setSubscription] = useState<any>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState<'spiritual' | 'export' | null>(null)
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
    loadSubscription()
  }, [user, planId, router])

  const loadSubscription = async () => {
    try {
      const { data } = await getUserSubscription(user!.id)
      setSubscription(data)
    } catch (error) {
      console.error('Error loading subscription:', error)
    }
  }

  const loadPlan = async () => {
    try {
      // CRITICAL: Must include user_id for RLS
      console.log('=== PLAN_LOAD: Starting to load plan', { planId, userId: user?.id })
      
      // Try direct query first (without user_id filter to bypass RLS issues)
      const { data: planData, error } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .maybeSingle()

      if (error) {
        console.error('=== PLAN_LOAD: Supabase error', { error: error.message, code: error.code })
        throw error
      }

      if (!planData) {
        console.error('=== PLAN_LOAD: Plan not found via client query')
        throw new Error('Plan not found in client query')
      }

      // Verify user has access to this plan (security check)
      if (planData.user_id !== user?.id) {
        console.error('=== PLAN_LOAD: Access denied - plan belongs to different user', { 
          planUserId: planData.user_id, 
          currentUserId: user?.id 
        })
        throw new Error('Access denied - plan belongs to different user')
      }

      console.log('=== PLAN_LOAD: Plan loaded successfully via client', { planId })
      setPlan(planData)
      setEditedContent(planData.content)
      setSpiritualEnabled(planData.spiritual_enabled || false)
    } catch (error) {
      console.error('=== PLAN_LOAD: Error loading plan via client, trying server API fallback:', error)
      try {
        const { supabase: supabaseClient } = await import('@/lib/supabase')
        const { data: sessionData } = await supabaseClient.auth.getSession()
        const headers: any = { 'Content-Type': 'application/json' }
        if (sessionData?.session?.access_token) {
          headers['Authorization'] = `Bearer ${sessionData.session.access_token}`
        }
        
        console.log('=== PLAN_LOAD: Attempting server API fallback', { planId, hasToken: !!sessionData?.session?.access_token })
        
        const res = await fetch(`/api/plans/get?id=${encodeURIComponent(planId)}`, {
          method: 'GET',
          credentials: 'include',
          headers
        })
        
        console.log('=== PLAN_LOAD: Server API response status:', res.status)
        
        if (res.ok) {
          const json = await res.json()
          if (json?.plan) {
            console.log('=== PLAN_LOAD: Plan loaded successfully via server API', { planId })
            setPlan(json.plan)
            setEditedContent(json.plan.content)
            setSpiritualEnabled(json.plan.spiritual_enabled || false)
            return
          }
        }
        
        // Fallback failed
        const errorData = await res.json().catch(() => ({}))
        console.error('=== PLAN_LOAD: Server API returned no plan data', { status: res.status, errorData })
        
        // Show error message but don't redirect immediately
        setError(`Không thể tải kế hoạch (${res.status}). ${errorData.error || 'Vui lòng thử lại sau.'}`)
      } catch (e) {
        console.error('=== PLAN_LOAD: Fallback API failed:', e)
        alert('Không thể tải kế hoạch. Vui lòng thử lại sau.')
        router.push('/dashboard/plans')
      }
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
    if (!plan) return;

    if (format === 'sheets') {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const headers: any = { 'Content-Type': 'application/json' };
        if (sessionData?.session?.access_token) {
          headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
        }
        const res = await fetch('/api/export/google-sheets', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ planId: plan.id })
        });
        if (!res.ok) {
          let errMsg = 'Export failed';
          try { errMsg = (await res.json())?.error || errMsg; } catch {}
          throw new Error(errMsg);
        }
        const json = await res.json();
        if (json?.url) {
          window.open(json.url, '_blank');
          return;
        }
        alert(json?.message || 'Không thể xuất sang Google Sheets');
        return;
      } catch (err) {
        alert('Có lỗi khi xuất sang Google Sheets');
        return;
      }
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const headers: any = { 'Content-Type': 'application/json' };
      if (sessionData?.session?.access_token) {
        headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
      }
      const res = await fetch('/api/plans/export', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ planId: plan.id, format })
      });
      if (res.status === 403) {
        let msg = 'Tính năng chưa được mở khóa. Vui lòng nâng cấp gói.';
        try {
          const data = await res.json();
          if (data?.message) msg = data.message;
        } catch {}
        alert(msg);
        router.push('/pricing');
        return;
      }
      if (!res.ok) {
        let errMsg = 'Export failed';
        try {
          const data = await res.json();
          errMsg = data?.error || errMsg;
        } catch {}
        throw new Error(errMsg);
      }
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data?.url) {
          window.open(data.url, '_blank');
        } else if (data?.message) {
          alert(data.message);
        }
      } else {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `plan-${plan.id}.${format}`;
        a.click();
      }
      setShowExportMenu(false);
    } catch (error) {
      console.error('Export error:', error);
      alert('Có lỗi khi xuất file');
    }
  }

  const handleExportClick = () => {
    // Check subscription tier - only allow for paid tiers
    const tier = subscription?.tier || 'free'
    if (tier === 'free') {
      setUpgradeReason('export')
      setShowUpgradeModal(true)
      return
    }
    // If paid tier, show export menu
    setShowExportMenu(!showExportMenu)
  }

  const handleShareEmail = () => {
    if (!plan) return
    
    const subject = encodeURIComponent(`Kế hoạch tài chính: ${plan.title}`)
    const body = encodeURIComponent(`Xin chào,\n\nTôi muốn chia sẻ kế hoạch tài chính với bạn:\n\nTiêu đề: ${plan.title}\nLink: ${window.location.href}\n\nTrân trọng!`)
    const mailtoLink = `mailto:?subject=${subject}&body=${body}`
    
    window.open(mailtoLink, '_blank')
  }

  const handleShareLink = () => {
    if (!plan) return
    
    const planUrl = `${window.location.origin}/dashboard/plans/${plan.id}`
    
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: `Kế hoạch tài chính: ${plan.title}`,
        text: `Xem kế hoạch tài chính của tôi tại PlanAI`,
        url: planUrl,
      }).catch((err) => console.log('Share failed:', err))
    } else {
      // Fallback: copy link
      navigator.clipboard.writeText(planUrl).then(() => {
        alert('Link đã copy vào clipboard!')
      }).catch(() => {
        alert(`Link: ${planUrl}`)
      })
    }
  }

  const toggleSpiritual = async () => {
    if (!plan) return

    // Check subscription tier - only allow for paid tiers
    const tier = subscription?.tier || 'free'
    if (tier === 'free') {
      setUpgradeReason('spiritual')
      setShowUpgradeModal(true)
      return
    }

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
                  onClick={handleExportClick}
                  disabled={subscription?.tier === 'free'}
                  title={subscription?.tier === 'free' ? 'Tính năng này chỉ có sẵn cho gói trả phí' : 'Xuất file'}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    subscription?.tier === 'free'
                      ? 'bg-gray-400 text-white cursor-not-allowed opacity-50'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
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
                  </div>
                )}
              </div>

              {/* Spiritual Toggle - Only for paid tiers */}
              <button
                onClick={toggleSpiritual}
                disabled={subscription?.tier === 'free'}
                title={subscription?.tier === 'free' ? 'Tính năng này chỉ có sẵn cho gói trả phí' : 'Phân tích tử vi'}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  subscription?.tier === 'free'
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
                    : spiritualEnabled
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {subscription?.tier === 'free' ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <Star className="w-4 h-4" />
                )}
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
              <>
                <PlanRenderer 
                  content={plan.content} 
                  planId={plan.id}
                  onExport={handleExport}
                  userTier={subscription?.tier || 'free'}
                />
                
                {/* Bottom CTA for Free tier users */}
                {subscription?.tier === 'free' && (
                  <div className="mt-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-purple-800 rounded-xl p-8 text-center">
                    <div className="max-w-2xl mx-auto">
                      <div className="flex justify-center mb-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-500/20 rounded-full">
                          <Crown className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                        🎉 Đây mới chỉ là bản kế hoạch cơ bản!
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                        Bạn đã thấy sức mạnh của PlanAI với gói Free. Hãy tưởng tượng bạn sẽ có được gì với <strong>bản kế hoạch chuyên sâu gấp 10 lần</strong> trong các gói trả phí:
                      </p>
                      
                      <div className="grid md:grid-cols-2 gap-4 mb-6 text-left">
                        <div className="space-y-2">
                          <div className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              <strong>Phân tích sâu hơn:</strong> Đi vào từng chi tiết về tài chính, tâm lý, và chiến lược
                            </span>
                          </div>
                          <div className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              <strong>Nhiều từ hơn:</strong> Lên tới 50.000 từ cho gói trả phí
                            </span>
                          </div>
                          <div className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              <strong>Checklist chi tiết:</strong> Theo dõi hàng tuần, tháng, năm
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              <strong>Phân tích tử vi:</strong> Kết hợp số học và tử vi vào kế hoạch
                            </span>
                          </div>
                          <div className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              <strong>40+ tài liệu:</strong> Tài liệu học tập, tài liệu kinh doanh và tất cả các tài liệu liên quan với mục tiêu duy nhất giúp bạn đạt được kế hoạch
                            </span>
                            <span className="text-sm text-gray-700 dark:text-gray-300 block mt-1">
                              <strong>Sử dụng tính năng tử vi, thần số học cá nhân hoá</strong>
                            </span>
                          </div>
                          <div className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              <strong>Xuất file:</strong> PDF, Word, Google Docs để chia sẻ
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                          href="/pricing"
                          className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
                        >
                          <Crown className="w-5 h-5" />
                          <span>Xem Gói Nâng Cấp</span>
                        </Link>
                        <Link
                          href="/dashboard/create-plan"
                          className="inline-flex items-center justify-center space-x-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                          <span>Tạo Kế Hoạch Mới</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </>
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
                <Link
                  href="/dashboard/plans"
                  className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Quay lại danh sách kế hoạch</span>
                </Link>
              </div>
            </div>

            {/* Premium CTA for FREE tier */}
            {(!subscription || subscription?.tier === 'free') && (
              <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 p-[2px] rounded-xl">
                <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6">
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-3xl animate-pulse">
                      🚀
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Nâng cấp Premium
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Mở khóa 100% sức mạnh của PlanAI với:
                    </p>
                    <ul className="text-left text-xs space-y-2">
                      <li className="flex items-start gap-1">
                        <span className="text-green-500">✓</span>
                        <span className="text-gray-700 dark:text-gray-300">Kế hoạch chi tiết gấp 10 lần</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="text-green-500">✓</span>
                        <span className="text-gray-700 dark:text-gray-300">Google Sheets tự động</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="text-green-500">✓</span>
                        <span className="text-gray-700 dark:text-gray-300">Phân tích tử vi & thần số học</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="text-green-500">✓</span>
                        <span className="text-gray-700 dark:text-gray-300">50+ tài liệu premium</span>
                      </li>
                    </ul>
                    <Link
                      href="/pricing"
                      className="block w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-xl hover:shadow-purple-500/30 transition-all hover:scale-105"
                    >
                      Nâng cấp ngay →
                    </Link>
                    <Link
                      href="/dashboard/subscription"
                      className="block w-full py-2 text-sm text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      Xem chi tiết các gói
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Share Options */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Share2 className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
                Chia sẻ
              </h3>
              <div className="space-y-2">
                <button
                  onClick={handleShareEmail}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                >
                  Gửi qua Email
                </button>
                <button
                  onClick={handleShareLink}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                >
                  Sao chép liên kết
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
                    <li>• Chỉnh sửa trực tiếp trong plan</li>
                    <li>• Nâng cấp gói để có thêm tính năng</li>
                    <li>• Chia sẻ kế hoạch với gia đình</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Upgrade CTA - Show for Free tier users */}
            {subscription?.tier === 'free' && (
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-start space-x-3">
                  <Crown className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">
                      Nâng cấp để có kế hoạch hoàn chỉnh hơn
                    </h3>
                    <p className="text-purple-100 text-sm mb-4 leading-relaxed">
                      Gói trả phí có bản kế hoạch chi tiết gấp <strong>nhiều lần</strong> với:
                    </p>
                    <ul className="text-sm text-purple-100 space-y-1 mb-4">
                      <li>• Phân tích sâu hơn và chi tiết hơn</li>
                      <li>• Nhiều checklist (tuần/tháng/năm)</li>
                      <li>• Phân tích tử vi kết hợp</li>
                      <li>• 40+ tài liệu chuyên sâu</li>
                      <li>• Xuất file PDF, Word, Google Docs</li>
                      <li>• Và nhiều tính năng khác...</li>
                    </ul>
                    <Link
                      href="/pricing"
                      className="inline-flex items-center space-x-2 bg-white text-purple-600 hover:bg-purple-50 px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Nâng cấp ngay</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-8 max-w-md mx-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-500/20 mx-auto mb-4">
              <Lock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
              {upgradeReason === 'export' ? 'Xuất file' : 'Tính năng Tử vi'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              {upgradeReason === 'export' 
                ? 'Tính năng xuất file chỉ có sẵn cho các gói trả phí (Gói 1, Gói 2, Gói 3). Hãy nâng cấp để truy cập tính năng này.'
                : 'Tính năng phân tích Tử vi chỉ có sẵn cho các gói trả phí (Gói 1, Gói 2, Gói 3). Hãy nâng cấp để truy cập tính năng này.'}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/pricing')}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Xem các gói nâng cấp
              </button>
              <button
                onClick={() => {
                  setShowUpgradeModal(false)
                  setUpgradeReason(null)
                }}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
