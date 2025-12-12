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
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const planId = params.id as string

  useEffect(() => {
    if (authLoading) {
      return
    }
    if (!user) {
      return
    }
    loadPlan()
    loadSubscription()
  }, [user, planId, router, authLoading])

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
          const json = await res.json().catch(() => ({}));
          throw new Error(json?.error || 'Export failed');
        }
        
        // Check if response is a file (Excel) or JSON
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('spreadsheetml') || contentType.includes('octet-stream')) {
          // Download Excel file
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `ke-hoach-tai-chinh-${plan.id.slice(0, 8)}.xlsx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          alert('✅ File Excel đã được tải xuống! Bạn có thể mở file này trong Google Sheets bằng cách:\n\n1. Vào Google Drive (drive.google.com)\n2. Nhấn "Mới" → "Tải tệp lên"\n3. Chọn file vừa tải\n4. Nhấp chuột phải → "Mở bằng" → "Google Trang tính"');
          return;
        }
        
        // Handle JSON response (legacy)
        const json = await res.json().catch(() => ({}));
        if (json?.url) {
          window.open(json.url, '_blank');
          return;
        }
        alert(json?.message || 'Không thể xuất file. Vui lòng thử lại.');
        return;
      } catch (err: any) {
        console.error('Google Sheets export error:', err);
        alert(err?.message || 'Có lỗi khi xuất file. Vui lòng thử lại.');
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

  const [showBirthDateModal, setShowBirthDateModal] = useState(false)
  const [birthDateInput, setBirthDateInput] = useState('')
  const [birthTimeInput, setBirthTimeInput] = useState('')
  const [spiritualNameInput, setSpiritualNameInput] = useState('')
  const [spiritualLoading, setSpiritualLoading] = useState(false)
  const [showSpiritualPopup, setShowSpiritualPopup] = useState(false)

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

    // If disabling, just toggle off
    if (!newValue) {
      try {
        await supabase
          .from('plans')
          .update({ spiritual_enabled: false })
          .eq('id', planId)
        setPlan({ ...plan, spiritual_enabled: false })
        setSpiritualEnabled(false)
      } catch (error) {
        console.error('Error toggling spiritual:', error)
      }
      return
    }

    // If enabling and already have data, show popup
    if (plan.spiritual_data) {
      setShowSpiritualPopup(true)
      setSpiritualEnabled(true)
      return
    }

    // Need to generate - check if we have birth date
    const existingBirthDate = plan.collected_info?.birth_date || plan.collected_info?.birthDate
    if (!existingBirthDate) {
      // Show modal to input birth date
      setShowBirthDateModal(true)
      return
    }

    // Generate spiritual analysis
    await generateSpiritualAnalysis(existingBirthDate)
  }

  const generateSpiritualAnalysis = async (birthDate: string) => {
    if (!plan) return
    
    setSpiritualLoading(true)
    try {
      // Build full birth info string for better analysis
      const birthInfo = birthTimeInput 
        ? `${birthDate} lúc ${birthTimeInput}` 
        : birthDate

      const res = await fetch('/api/spiritual/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          birthDate: birthInfo,
          birthTime: birthTimeInput,
          fullName: spiritualNameInput
        })
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze')
      }

      // Save all info to collected_info and spiritual data
      const updatedCollectedInfo = {
        ...plan.collected_info,
        birth_date: birthDate,
        birth_time: birthTimeInput,
        spiritual_name: spiritualNameInput || plan.collected_info?.full_name
      }
      
      await supabase
        .from('plans')
        .update({
          spiritual_enabled: true,
          spiritual_data: data.analysis,
          collected_info: updatedCollectedInfo
        })
        .eq('id', planId)

      setPlan({ 
        ...plan, 
        spiritual_enabled: true, 
        spiritual_data: data.analysis,
        collected_info: updatedCollectedInfo
      })
      setSpiritualEnabled(true)
      setShowBirthDateModal(false)
      setShowSpiritualPopup(true) // Show result popup
    } catch (error) {
      console.error('Error generating spiritual analysis:', error)
      alert('Có lỗi khi phân tích tử vi. Vui lòng thử lại.')
    } finally {
      setSpiritualLoading(false)
    }
  }

  const handleBirthDateSubmit = () => {
    if (!birthDateInput) {
      alert('Vui lòng nhập ngày sinh')
      return
    }
    generateSpiritualAnalysis(birthDateInput)
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
                          </div>
                          <div className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              <strong>Xuất file:</strong> PDF, Word, Google Docs để chia sẻ
                            </span>
                          </div>
                          <div className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              <strong>Sử dụng tính năng tử vi, thần số học cá nhân hoá</strong>
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

      {/* Birth Date Modal for Spiritual Analysis - Full Info Input */}
      {showBirthDateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-8 max-w-lg mx-4 border-2 border-transparent bg-clip-padding" style={{backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box'}}>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mx-auto mb-4">
              <Star className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
              ✨ Phân tích Tử vi & Thần số học
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              Nhập thông tin để nhận phân tích chuyên sâu về cung mệnh, số chủ đạo và lời khuyên tài chính cá nhân hoá.
            </p>
            
            <div className="space-y-4 mb-6">
              {/* Họ và tên */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Họ và tên <span className="text-gray-400">(tuỳ chọn)</span>
                </label>
                <input
                  type="text"
                  value={spiritualNameInput}
                  onChange={(e) => setSpiritualNameInput(e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              {/* Ngày tháng năm sinh */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ngày sinh <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={birthDateInput}
                  onChange={(e) => setBirthDateInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              {/* Giờ sinh */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Giờ sinh <span className="text-gray-400">(tuỳ chọn - để phân tích chính xác hơn)</span>
                </label>
                <input
                  type="time"
                  value={birthTimeInput}
                  onChange={(e) => setBirthTimeInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleBirthDateSubmit}
                disabled={spiritualLoading || !birthDateInput}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/30"
              >
                {spiritualLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang phân tích tử vi...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Xem phân tích tử vi</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowBirthDateModal(false)
                  setBirthDateInput('')
                  setBirthTimeInput('')
                  setSpiritualNameInput('')
                }}
                disabled={spiritualLoading}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Huỷ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spiritual Analysis Result Popup - Gradient Border */}
      {showSpiritualPopup && plan?.spiritual_data && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setShowSpiritualPopup(false)}>
          <div 
            className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-1 max-w-2xl mx-4 max-h-[85vh] overflow-hidden"
            style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #667eea 100%)'}}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 overflow-y-auto max-h-[calc(85vh-8px)]">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Phân tích Tử vi & Thần số học</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {plan.collected_info?.spiritual_name || plan.collected_info?.full_name || 'Người dùng'} • {plan.collected_info?.birth_date}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSpiritualPopup(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                >
                  <span className="text-gray-500">✕</span>
                </button>
              </div>

              {/* Content */}
              <div className="space-y-6">
                {/* Cung hoàng đạo */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                  <h4 className="font-bold text-purple-800 dark:text-purple-300 mb-2 flex items-center gap-2">
                    <span>🌟</span> Cung hoàng đạo
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300">{plan.spiritual_data.zodiac || 'Đang phân tích...'}</p>
                </div>

                {/* Số mệnh */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
                  <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                    <span>🔢</span> Số chủ đạo (Life Path)
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300">{plan.spiritual_data.lifePath || 'Đang phân tích...'}</p>
                </div>

                {/* Lời khuyên */}
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl">
                  <h4 className="font-bold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
                    <span>💡</span> Lời khuyên tài chính & sự nghiệp
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{plan.spiritual_data.advice || 'Đang phân tích...'}</p>
                </div>

                {/* Số & màu may mắn */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                    <h4 className="font-bold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                      <span>🍀</span> Số may mắn
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      {Array.isArray(plan.spiritual_data.luckyNumbers) 
                        ? plan.spiritual_data.luckyNumbers.join(', ') 
                        : plan.spiritual_data.luckyNumbers || 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl">
                    <h4 className="font-bold text-rose-800 dark:text-rose-300 mb-2 flex items-center gap-2">
                      <span>🎨</span> Màu may mắn
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      {Array.isArray(plan.spiritual_data.luckyColors) 
                        ? plan.spiritual_data.luckyColors.join(', ') 
                        : plan.spiritual_data.luckyColors || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Thời điểm thuận lợi */}
                {plan.spiritual_data.favorablePeriods && (
                  <div className="p-4 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-xl">
                    <h4 className="font-bold text-indigo-800 dark:text-indigo-300 mb-2 flex items-center gap-2">
                      <span>📅</span> Thời điểm thuận lợi
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      {Array.isArray(plan.spiritual_data.favorablePeriods) 
                        ? plan.spiritual_data.favorablePeriods.join(', ') 
                        : plan.spiritual_data.favorablePeriods}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowSpiritualPopup(false)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold transition-all"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
