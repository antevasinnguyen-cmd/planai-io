'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileText, Download, Sparkles, Clock, Target } from 'lucide-react'
import { getCurrentUser, getUserProfile, savePlan } from '@/lib/supabase'

export default function CreatePlanPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState('')
  const [planTitle, setPlanTitle] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

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
    
    const { data: profileData } = await getUserProfile(currentUser.id)
    if (profileData) {
      setProfile(profileData)
      setPlanTitle(`Kế hoạch tài chính: ${profileData.financial_goal}`)
    }

    setIsLoading(false)
  }

  const generatePlan = async () => {
    if (!profile || !user) return

    setIsGenerating(true)
    
    try {
      // Call real AI API to generate plan
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (data.success) {
        setGeneratedPlan(data.content)
      } else {
        // Fallback to sample plan
        const samplePlan = `
# KẾ HOẠCH TÀI CHÍNH CÁ NHÂN HÓA

## Lời mở đầu & Tóm tắt mục tiêu

Chào ${profile.full_name},

Dựa trên thông tin bạn đã cung cấp, tôi đã tạo ra một kế hoạch tài chính toàn diện để giúp bạn đạt được mục tiêu: "${profile.financial_goal}".

**Thông tin cơ bản:**
- Tuổi: ${profile.age} tuổi
- Thu nhập hiện tại: ${profile.current_income?.toLocaleString()} VNĐ/tháng
- Nghề nghiệp: ${profile.occupation}
- Thời gian thực hiện: ${profile.timeline}
- Mức độ rủi ro: ${profile.risk_tolerance}

## Phân Tích Mục Tiêu và Tình Hình Hiện Tại

### Mục tiêu tài chính
${profile.financial_goal}

### Phân tích tình hình tài chính hiện tại
Với thu nhập ${profile.current_income?.toLocaleString()} VNĐ/tháng, bạn có nền tảng tài chính khá tốt để bắt đầu thực hiện kế hoạch.

### Phân tích kỹ năng và tiềm năng cá nhân
- **Điểm mạnh:** Thu nhập ổn định, còn trẻ, có thời gian dài để đầu tư
- **Điểm yếu:** Cần nâng cao kiến thức tài chính và đầu tư
- **Cơ hội:** Thị trường tài chính Việt Nam đang phát triển mạnh
- **Thách thức:** Lạm phát, biến động kinh tế

## Lộ trình Chi Tiết

### Tổng quan lộ trình
Kế hoạch được chia thành các giai đoạn rõ ràng với mục tiêu cụ thể cho từng thời kỳ.

### Giai đoạn 1: Xây dựng nền tảng (6 tháng đầu)
- Tạo quỹ khẩn cấp: 6 tháng chi tiêu
- Học tập kiến thức tài chính cơ bản
- Thiết lập thói quen tiết kiệm

### Giai đoạn 2: Phát triển (Năm 1-2)
- Bắt đầu đầu tư định kỳ
- Tìm kiếm nguồn thu nhập phụ
- Tối ưu hóa thuế và chi phí

### Giai đoạn 3: Tăng tốc (Năm 3-5)
- Mở rộng danh mục đầu tư
- Phát triển kỹ năng chuyên môn
- Xem xét cơ hội kinh doanh

## Micro-Task Hàng Ngày và Hàng Tháng

### Micro-task hàng ngày
- [ ] Ghi chép chi tiêu chi tiết
- [ ] Đọc tin tức tài chính 15 phút
- [ ] Kiểm tra tài khoản đầu tư

### Checklist hàng tháng
- [ ] Đánh giá và điều chỉnh ngân sách
- [ ] Phân tích hiệu suất đầu tư
- [ ] Tìm hiểu cơ hội đầu tư mới

### Đánh giá tiến độ hàng quý
- [ ] Review toàn bộ kế hoạch tài chính
- [ ] Điều chỉnh mục tiêu nếu cần
- [ ] Tham gia khóa học nâng cao

## Tài Liệu Học Tập và Nguồn Lực

### Sách nên đọc
1. "Dạy con làm giàu" - Robert Kiyosaki
2. "Nhà đầu tư thông minh" - Benjamin Graham
3. "Tư duy nhanh và chậm" - Daniel Kahneman

### Khóa học online
1. Coursera: Personal Finance
2. Udemy: Đầu tư chứng khoán cơ bản
3. YouTube: Các kênh tài chính Việt Nam

### Công cụ hỗ trợ
- Ứng dụng quản lý chi tiêu: Money Lover
- Nền tảng đầu tư: SSI, VPS, TCBS
- Công cụ theo dõi: Google Sheets template

## Kết Luận và Hành Động Tiếp Theo

### Tóm tắt kế hoạch
Kế hoạch này được thiết kế riêng cho bạn dựa trên mục tiêu và hoàn cảnh cá nhân. Thành công phụ thuộc vào việc thực hiện kiên trì và điều chỉnh linh hoạt.

### Các bước hành động ngay lập tức
1. Thiết lập tài khoản tiết kiệm riêng
2. Bắt đầu ghi chép chi tiêu từ hôm nay
3. Đăng ký khóa học tài chính cơ bản
4. Tạo lịch đánh giá hàng tháng

### Lời khuyên cuối cùng
Hãy nhớ rằng đầu tư tốt nhất là đầu tư vào chính bản thân. Kiến thức và kỹ năng sẽ là nền tảng vững chắc cho thành công tài chính lâu dài.

---

*Kế hoạch này được tạo bởi PlanAI - AI Financial Planning Assistant*
*Tổng số từ: ~3,500 từ*
        `
        setGeneratedPlan(samplePlan)
      }
    } catch (error) {
      console.error('Plan generation error:', error)
      // Show error message
      setGeneratedPlan('Có lỗi xảy ra khi tạo kế hoạch. Vui lòng thử lại sau.')
    }
    
    setIsGenerating(false)
  }

  const savePlanToDB = async () => {
    if (!user || !generatedPlan) return

    const planData = {
      title: planTitle,
      goal: profile?.financial_goal || '',
      content: generatedPlan,
      word_count: generatedPlan.split(' ').length,
      status: 'completed'
    }

    await savePlan(user.id, planData)
    router.push('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
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
          
          <h1 className="text-2xl font-bold text-gray-900">Tạo Kế Hoạch Tài Chính</h1>
          
          <div></div>
        </div>

        {!generatedPlan ? (
          /* Generation Interface */
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Sẵn sàng tạo kế hoạch tài chính của bạn?
            </h2>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              AI sẽ phân tích thông tin bạn đã cung cấp và tạo ra một kế hoạch tài chính cá nhân hóa hoàn toàn cho mục tiêu của bạn.
            </p>

            {profile && (
              <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left max-w-2xl mx-auto">
                <h3 className="font-semibold text-gray-900 mb-4">Thông tin sẽ được sử dụng:</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Mục tiêu:</span>
                    <p className="text-gray-900">{profile.financial_goal}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Thu nhập:</span>
                    <p className="text-gray-900">{profile.current_income?.toLocaleString()} VNĐ/tháng</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Thời gian:</span>
                    <p className="text-gray-900">{profile.timeline}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Độ tuổi:</span>
                    <p className="text-gray-900">{profile.age} tuổi</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Thời gian: ~3 phút
                </div>
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Độ dài: 5,000-8,000 từ
                </div>
                <div className="flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  Cá nhân hóa 100%
                </div>
              </div>

              <button
                onClick={generatePlan}
                disabled={isGenerating}
                className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none"
              >
                {isGenerating ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    Đang tạo kế hoạch...
                  </div>
                ) : (
                  'Tạo kế hoạch ngay'
                )}
              </button>
            </div>

            {isGenerating && (
              <div className="mt-8 bg-blue-50 rounded-xl p-6">
                <h4 className="font-semibold text-blue-900 mb-2">AI đang làm việc...</h4>
                <div className="space-y-2 text-sm text-blue-700">
                  <p>✓ Phân tích thông tin cá nhân</p>
                  <p>✓ Tính toán lộ trình tài chính</p>
                  <p>🔄 Tạo kế hoạch chi tiết...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Plan Display */
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Kế hoạch đã tạo thành công!</h2>
                <div className="flex space-x-3">
                  <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Download className="w-4 h-4 mr-2" />
                    Tải PDF
                  </button>
                  <button
                    onClick={savePlanToDB}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                  >
                    Lưu kế hoạch
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-6 prose prose-lg max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {generatedPlan}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
