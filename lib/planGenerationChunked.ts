/**
 * Chunked Plan Generation
 * Generates plan sections one at a time to work within Vercel's 60s timeout
 * Each call generates 1-2 sections, allowing long plans to be built incrementally
 */

import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { getFinancialPlanSystemPrompt } from './prompts'
import { getSubscriptionLimits } from './supabase'

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

const shouldRetry = (err: any): boolean => {
  try {
    const e = err || {}
    const msg: string = String(e?.message || e?.toString?.() || '')
    const status: number | undefined = e?.status || e?.code
    if (status && [408, 409, 425, 429, 500, 502, 503, 504].includes(Number(status))) return true
    if (/timeout|timed out|ECONNRESET|connection reset/i.test(msg)) return true
  } catch {}
  return false
}

async function aiTextWithFallback(
  system: string | null | undefined,
  user: string,
  maxTokens: number,
  temperature: number
): Promise<string> {
  // Timeout wrapper (55 seconds max per AI call - fits within Vercel's 60s limit)
  // Increased from 25s because plan sections need more time to generate
  const timeoutPromise = new Promise<string>((_, reject) => {
    setTimeout(() => reject(new Error('AI call timeout after 55s')), 55000)
  })

  const aiPromise = (async () => {
    // Try OpenAI first
    const OPENAI_ATTEMPTS = 2
    for (let i = 0; i < OPENAI_ATTEMPTS; i++) {
      try {
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        const messages: any[] = system
          ? [{ role: 'system', content: system }, { role: 'user', content: user }]
          : [{ role: 'user', content: user }]
        const c = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages,
          temperature,
          max_tokens: Math.min(maxTokens, 2000)
        })
        const text = c.choices?.[0]?.message?.content || ''
        if (text && text.trim().length > 0) return text
      } catch (err) {
        if (i < OPENAI_ATTEMPTS - 1 && shouldRetry(err)) {
          await sleep(500 * (i + 1))
          continue
        }
        break
      }
    }

    // Fallback to Claude
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('Anthropic API key missing')
    const CLAUDE_ATTEMPTS = 2
    for (let j = 0; j < CLAUDE_ATTEMPTS; j++) {
      try {
        const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
        const resp = await claude.messages.create({
          model: 'claude-3-5-haiku-20241022',
          system: system || undefined,
          max_tokens: Math.min(maxTokens, 2000),
          temperature,
          messages: [{ role: 'user', content: user }]
        })
        const c0: any = resp.content?.[0]
        const text = c0 && c0.type === 'text' ? String(c0.text || '') : ''
        if (text && text.trim().length > 0) return text
        throw new Error('Empty Claude response')
      } catch (err) {
        if (j < CLAUDE_ATTEMPTS - 1 && shouldRetry(err)) {
          await sleep(500 * (j + 1))
          continue
        }
        throw err
      }
    }
    throw new Error('All model providers failed')
  })()

  return Promise.race([aiPromise, timeoutPromise])
}

// Section definitions
const getBaseSections = () => [
  { key: 'profile', title: '1. Tóm tắt tình hình tài chính của bạn', weight: 3 },
  { key: 'goals', title: '2. Mục tiêu tài chính & động lực', weight: 2 },
  { key: 'current', title: '3. Hiện trạng & khoảng cách mục tiêu', weight: 3 },
  { key: 'models', title: '4. Mô hình tăng thu nhập phù hợp', weight: 3 },
  { key: 'saving', title: '5. Kế hoạch tiết kiệm & đầu tư', weight: 3 },
  { key: 'plan', title: '6. Kế hoạch hành động & timeline', weight: 5 },
  { key: 'learning', title: '7. Tài liệu học tập & nguồn lực', weight: 3 },
  { key: 'mindset', title: '8. Tâm lý & Tư duy thành công', weight: 2 },
  { key: 'conclusion', title: '9. Kết luận & hành động ngay', weight: 1 }
]

const getPaidSections = () => [
  { key: 'overview', title: '1. Tổng quan kế hoạch & Hồ sơ cá nhân', weight: 3 },
  { key: 'swot', title: '2. Phân tích SWOT cá nhân', weight: 3 },
  { key: 'smart_goals', title: '3. Mục tiêu SMART', weight: 3 },
  { key: 'financial_strategy', title: '4. Phân tích mục tiêu tài chính & chiến lược tổng quan', weight: 3 },
  { key: 'roadmap_mindmap', title: '5. Lộ trình tổng quan đến mục tiêu', weight: 3 },
  { key: 'core_strategies', title: '6. 10 Chiến lược hành động trọng tâm', weight: 4 },
  { key: 'detailed_actions', title: '7. Danh sách việc cần làm chi tiết', weight: 3 },
  { key: 'factors', title: '8. Yếu tố khách quan & chủ quan ảnh hưởng', weight: 3 },
  { key: 'skills_gap', title: '9. Kỹ năng & kinh nghiệm cần có', weight: 3 },
  { key: 'asset_plan', title: '10. Kế hoạch tích luỹ tài sản', weight: 3 },
  { key: 'invest_risk', title: '11. Kế hoạch đầu tư & quản trị rủi ro', weight: 3 },
  { key: 'business_models', title: '12. 10 Mô hình kinh doanh cá nhân hoá', weight: 4 },
  { key: 'time_roadmap', title: '13. Lộ trình theo thời gian: Năm-Quý-Tháng-Tuần-Ngày', weight: 4 },
  { key: 'checklist', title: '14. Checklist hành động định kỳ', weight: 3 },
  { key: 'sheets_tracking', title: '15. Google Sheets theo dõi & tracking', weight: 3 },
  { key: 'learning_resources', title: '16. Tài liệu học tập & kỹ năng (20+ nguồn)', weight: 4 },
  { key: 'scenarios', title: '17. Dự báo 3 kịch bản: Tệ-Trung bình-Tốt nhất', weight: 3 },
  { key: 'risk_reduction', title: '18. Chiến lược giảm rủi ro & phương án dự phòng', weight: 3 },
  { key: 'kpis', title: '19. KPIs & chỉ số theo dõi tiến độ', weight: 3 },
  { key: 'review', title: '20. Chu kỳ rà soát & tối ưu kế hoạch', weight: 2 },
  { key: 'spiritual', title: '21. Phân tích tử vi, thần số học theo ngày sinh', weight: 3 },
  { key: 'summary_actions', title: '22. Tóm tắt toàn bộ kế hoạch & hành động ưu tiên', weight: 3 },
  { key: 'how_to_use', title: '23. Hướng dẫn sử dụng bản Kế hoạch', weight: 2 },
  { key: 'closing', title: '24. Kết luận & lời động viên', weight: 2 }
]

export interface GenerateSectionResult {
  error?: string
  nextSectionIndex: number
  generatedSections: string[]
  totalSections: number
  isComplete: boolean
  fullPlanContent?: string
}

/**
 * Generate one or more sections of a plan
 * Designed to complete within 60 seconds (Vercel Free limit)
 */
export async function generatePlanSection(
  planName: string,
  goal: string,
  collectedInfo: any,
  currentSectionIndex: number,
  previousSections: string[]
): Promise<GenerateSectionResult> {
  const tier = String(collectedInfo?.tier || 'free')
  const sections = tier === 'free' ? getBaseSections() : getPaidSections()
  const totalSections = sections.length

  // If already completed all sections
  if (currentSectionIndex >= totalSections) {
    const fullContent = assemblePlan(planName, previousSections)
    return {
      nextSectionIndex: totalSections,
      generatedSections: previousSections,
      totalSections,
      isComplete: true,
      fullPlanContent: fullContent
    }
  }

  // Extract user data - comprehensive for personalization
  const chatSummary = String(collectedInfo?.chat_summary || '')
  const income = collectedInfo?.income || '7 – 10 triệu VNĐ/tháng'
  const savings = collectedInfo?.savings || '0'
  const timeline = collectedInfo?.timeline || '2 – 3 năm'
  const skills = Array.isArray(collectedInfo?.skills) ? collectedInfo.skills : []
  const fullName = collectedInfo?.full_name || ''
  const birthDate = collectedInfo?.birth_date || ''
  const age = collectedInfo?.age || ''
  const location = collectedInfo?.location || ''
  const occupation = collectedInfo?.occupation || ''
  const previousOccupation = collectedInfo?.previous_occupation || ''
  const familyStatus = collectedInfo?.family_status || ''
  const riskTolerance = collectedInfo?.risk_tolerance || 'moderate'
  const freeHoursPerWeek = collectedInfo?.free_hours_per_week || ''
  const debts = collectedInfo?.debts || ''
  const assets = collectedInfo?.assets || ''

  const userContext = `🎯 THÔNG TIN NGƯỜI DÙNG (DỮ LIỆU ĐẦU VÀO - CÁ NHÂN HOÁ DỰA TRÊN ĐÂY):

**MỤC TIÊU CHÍNH:** ${goal}

**HỒ SƠ CÁ NHÂN:**
${fullName ? `- Họ tên: ${fullName}` : ''}
${birthDate ? `- Ngày sinh: ${birthDate}` : ''}
${age ? `- Tuổi: ${age}` : ''}
${location ? `- Nơi sinh sống: ${location}` : ''}
${occupation ? `- Nghề nghiệp hiện tại: ${occupation}` : ''}
${previousOccupation ? `- Nghề nghiệp trước đây: ${previousOccupation}` : ''}
- Thu nhập hiện tại: ${income}
- Tiết kiệm hiện có: ${savings}
${debts ? `- Nợ hiện có: ${debts}` : ''}
${assets ? `- Tài sản hiện có: ${assets}` : ''}
- Kỹ năng: ${skills.join(', ') || 'Đang phát triển'}
${familyStatus ? `- Tình trạng gia đình: ${familyStatus}` : ''}
${freeHoursPerWeek ? `- Thời gian rảnh/tuần: ${freeHoursPerWeek} giờ` : ''}
- Mức chịu rủi ro: ${riskTolerance}
- Thời gian mục tiêu: ${timeline}

---
📝 LỊCH SỬ CHAT (NGUỒN DỮ LIỆU CHÍNH - PHẢI SỬ DỤNG):
${chatSummary.slice(0, 6000)}
---

⚠️ LƯU Ý QUAN TRỌNG:
- Tất cả nội dung PHẢI cá nhân hoá dựa trên thông tin trên
- KHÔNG bịa đặt số liệu - chỉ dùng dữ liệu từ user
- Nếu thiếu thông tin, ghi rõ "Cần bổ sung thông tin về..."
- Viết như đang tư vấn 1-1 cho user này`

  const systemPrompt = getFinancialPlanSystemPrompt()
  const generatedSections = [...previousSections]

  // Generate 1-2 sections per call (aim for ~40 seconds of AI work)
  // Free tier: generate 2 sections per call (simpler content)
  // Paid tier: generate 1 section per call (more detailed content)
  const sectionsPerCall = tier === 'free' ? 2 : 1
  const endIndex = Math.min(currentSectionIndex + sectionsPerCall, totalSections)

  try {
    for (let i = currentSectionIndex; i < endIndex; i++) {
      const section = sections[i]
      const targetWords = tier === 'free' ? 400 : 1500

      const prompt = buildSectionPrompt(section, goal, income, savings, timeline, skills, userContext, targetWords)

      console.log(`[CHUNKED] Generating section ${i + 1}/${totalSections}: ${section.title}`)

      // Retry logic for section generation (up to 3 attempts)
      let content = ''
      let lastError: any = null
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          content = await aiTextWithFallback(
            systemPrompt,
            prompt,
            Math.min(2000, targetWords * 2),
            0.7
          )
          if (content && content.trim().length > 50) {
            break // Success
          }
        } catch (err: any) {
          lastError = err
          console.warn(`[CHUNKED] Attempt ${attempt + 1}/3 failed for section ${i + 1}: ${err?.message}`)
          if (attempt < 2) {
            await sleep(1000 * (attempt + 1)) // Wait 1s, 2s before retry
          }
        }
      }

      if (!content || content.trim().length < 50) {
        throw lastError || new Error(`Failed to generate section ${section.title} after 3 attempts`)
      }

      const cleanedContent = cleanSectionContent(content, section.title)
      const sectionMarkdown = `## ${section.title}\n\n${cleanedContent}`
      generatedSections.push(sectionMarkdown)

      console.log(`[CHUNKED] Completed section ${i + 1}/${totalSections}`)
    }

    // Check if all sections are done
    if (endIndex >= totalSections) {
      const fullContent = assemblePlan(planName, generatedSections)
      return {
        nextSectionIndex: totalSections,
        generatedSections,
        totalSections,
        isComplete: true,
        fullPlanContent: fullContent
      }
    }

    return {
      nextSectionIndex: endIndex,
      generatedSections,
      totalSections,
      isComplete: false
    }

  } catch (error: any) {
    console.error('[CHUNKED] Error generating section:', error)
    return {
      error: error?.message || 'Failed to generate section',
      nextSectionIndex: currentSectionIndex,
      generatedSections: previousSections,
      totalSections,
      isComplete: false
    }
  }
}

function buildPrompts(goal: string, income: string, savings: string, timeline: string, skills: string[]): Record<string, string> {
  const skillsStr = skills.join(', ') || 'Đang phát triển'
  return {
    // FREE TIER sections
    profile: `Viết phần "Tóm tắt tình hình tài chính" dựa trên thông tin user. Bao gồm: thu nhập hiện tại (${income}), tiết kiệm (${savings}), kỹ năng (${skillsStr}), và mục tiêu (${goal}). Trình bày dạng bullet points rõ ràng.`,
    goals: `Phân tích mục tiêu tài chính: ${goal}. Đánh giá tính khả thi với thu nhập ${income} trong ${timeline}. Giải thích lý do và động lực.`,
    current: `Phân tích hiện trạng và khoảng cách mục tiêu. So sánh thu nhập ${income}, tiết kiệm ${savings} với mục tiêu ${goal}. Tính toán cụ thể số tiền cần đạt thêm.`,
    models: `Đề xuất 3-5 mô hình tăng thu nhập phù hợp với kỹ năng ${skillsStr} và mục tiêu ${goal}. Mỗi mô hình giải thích cách thực hiện và thu nhập dự kiến.`,
    saving: `Lập kế hoạch tiết kiệm và đầu tư cụ thể để đạt ${goal} trong ${timeline}. Đề xuất tỷ lệ tiết kiệm, kênh đầu tư phù hợp.`,
    plan: `Viết kế hoạch hành động chi tiết theo timeline ${timeline}. Chia theo mốc: Tháng 1-3, Tháng 4-6, Tháng 7-12, Năm 2-3. Mỗi mốc liệt kê các việc cần làm cụ thể.`,
    learning: `Đề xuất TỐI THIỂU 20 tài liệu học tập phù hợp với kỹ năng ${skillsStr} để đạt ${goal}. Bao gồm: sách (5+), khóa học online (5+), kênh YouTube (5+), podcast (3+), website/blog (2+). Mỗi tài liệu ghi rõ tên, tác giả/nguồn, và lý do nên học.`,
    mindset: `Tư vấn tâm lý và tư duy để đạt ${goal}. Đề xuất 5-7 nguyên tắc tư duy, cách vượt qua khó khăn phổ biến, và phương pháp duy trì động lực dài hạn.`,
    conclusion: `Tóm tắt ngắn gọn 3-5 điểm chính của kế hoạch và liệt kê 5 hành động cần làm NGAY trong tuần đầu tiên.`,
    
    // PAID TIER 24 sections - Personalized & In-depth
    overview: `Viết phần Tổng quan kế hoạch và Hồ sơ cá nhân CHI TIẾT. Bao gồm: Mục tiêu chính (${goal}), Hồ sơ cá nhân (Thu nhập ${income}, Tiết kiệm ${savings}, Kỹ năng ${skillsStr}), Bối cảnh (Timeline ${timeline}), Tóm tắt executive 3-5 câu về chiến lược tổng thể. Trình bày rõ ràng, cá nhân hoá dựa trên dữ liệu thực từ user.`,
    
    swot: `Phân tích SWOT CÁ NHÂN chi tiết dựa trên thông tin user và bối cảnh Việt Nam. ĐIỂM MẠNH (5-7 điểm): Kỹ năng ${skillsStr}, kinh nghiệm, lợi thế. ĐIỂM YẾU (5-7 điểm): Hạn chế về vốn, thời gian, kỹ năng thiếu. CƠ HỘI (5-7 điểm): Xu hướng thị trường VN, ngành tiềm năng. THÁCH THỨC (5-7 điểm): Cạnh tranh, rủi ro kinh tế, thay đổi công nghệ.`,
    
    smart_goals: `Chuyển mục tiêu "${goal}" thành 3-5 mục tiêu SMART chi tiết. Mỗi mục tiêu phải: Specific (cụ thể số tiền/kết quả), Measurable (đo lường được), Achievable (khả thi với ${income}), Relevant (liên quan mục tiêu lớn), Time-bound (deadline rõ ràng trong ${timeline}).`,
    
    financial_strategy: `Phân tích mục tiêu tài chính ${goal} và xây dựng chiến lược tổng quan. Tính toán: Gap = Mục tiêu - Tiết kiệm hiện tại (${savings}). Đề xuất 3-5 trụ cột chiến lược: Tăng thu, Tối ưu chi, Đầu tư, Kinh doanh. Mỗi trụ cột có mục tiêu số cụ thể.`,
    
    roadmap_mindmap: `Viết lộ trình tổng quan đến mục tiêu ${goal} trong ${timeline}. Chia thành 3-4 giai đoạn lớn. Mỗi giai đoạn: Tên giai đoạn, Thời gian, Mục tiêu chính, Trọng tâm hành động, Kết quả mong đợi. Trình bày dạng văn bản rõ ràng, dễ theo dõi.`,
    
    core_strategies: `Đề xuất ĐÚNG 10 CHIẾN LƯỢC HÀNH ĐỘNG TRỌNG TÂM (xương sống) để đạt ${goal}. Mỗi chiến lược: Tên chiến lược, Mô tả ngắn (2-3 câu), Tại sao quan trọng, Kết quả mong đợi, Ưu tiên (Cao/Trung bình). Các chiến lược phải cá nhân hoá theo kỹ năng ${skillsStr} và thu nhập ${income}.`,
    
    detailed_actions: `Liệt kê 15-20 việc cần làm cụ thể để thực hiện 10 chiến lược trọng tâm. Mỗi việc: Tên công việc, Mô tả chi tiết, Kết quả đầu ra, Thời gian hoàn thành, Độ ưu tiên. Sắp xếp theo thứ tự ưu tiên từ cao đến thấp.`,
    
    factors: `Phân tích các yếu tố ảnh hưởng đến mục tiêu ${goal}. YẾU TỐ KHÁCH QUAN (5-7 điểm): Kinh tế vĩ mô VN, ngành nghề, công nghệ, chính sách. YẾU TỐ CHỦ QUAN (5-7 điểm): Kỷ luật, sức khoẻ, gia đình, thời gian. Mỗi yếu tố: Mô tả, Mức độ ảnh hưởng, Cách xử lý.`,
    
    skills_gap: `Phân tích khoảng cách kỹ năng để đạt ${goal}. KỸ NĂNG HIỆN CÓ: ${skillsStr}. KỸ NĂNG CẦN CÓ: Liệt kê 10-15 kỹ năng cần thiết. Mỗi kỹ năng: Tên, Mức độ hiện tại (1-5), Mức độ cần đạt (1-5), Thời gian học, Độ ưu tiên.`,
    
    asset_plan: `Lập kế hoạch tích luỹ tài sản để đạt ${goal}. Tính toán: Tài sản ròng hiện tại, Mục tiêu tài sản ròng, Tốc độ tích luỹ cần thiết/tháng. Đề xuất cơ cấu tài sản: Tiền mặt, Tiết kiệm, Đầu tư, Bất động sản. Lộ trình tích luỹ theo năm.`,
    
    invest_risk: `Lập kế hoạch đầu tư và quản trị rủi ro phù hợp với ${goal} và ${timeline}. Phân bổ đầu tư theo mức rủi ro. Các kênh đầu tư phù hợp tại VN: Tiết kiệm, Chứng chỉ quỹ, Cổ phiếu, Vàng, BĐS. Chiến lược quản trị rủi ro: Đa dạng hoá, Bảo hiểm, Quỹ dự phòng.`,
    
    business_models: `Đề xuất ĐÚNG 10 MÔ HÌNH KINH DOANH CÁ NHÂN HOÁ phù hợp với kỹ năng ${skillsStr} và mục tiêu ${goal}. Mỗi mô hình: Tên mô hình, Mô tả ngắn, Vốn khởi điểm, Thu nhập tiềm năng/tháng, Thời gian có lợi nhuận, 5 bước triển khai cụ thể. Ưu tiên mô hình ít vốn, tận dụng kỹ năng hiện có.`,
    
    time_roadmap: `Xây dựng lộ trình chi tiết theo thời gian ${timeline} để đạt ${goal}. NĂM 1: Mục tiêu năm, chia theo 4 quý. MỖI QUÝ: Mục tiêu quý, chia theo 3 tháng. MỖI THÁNG: 3-5 hành động chính. TUẦN MẪU: Lịch trình tuần điển hình. NGÀY MẪU: Thói quen hàng ngày cần xây dựng.`,
    
    checklist: `Tạo CHECKLIST HÀNH ĐỘNG ĐỊNH KỲ chi tiết để theo dõi tiến độ đạt ${goal}.

TRÌNH BÀY DƯỚI DẠNG BẢNG MARKDOWN với 3 cột:
| Hành động | Thời gian thực hiện | Kết quả mong đợi |

⚠️ QUY TẮC BẮT BUỘC:
- KHÔNG có cột "Ngày/Tháng" hoặc "Trạng thái"
- KHÔNG dùng "---", "- - -", "—" để lấp chỗ trống
- KHÔNG sinh dòng với nội dung trống hoặc "Chưa xác định"
- CHỈ tạo dòng khi có nội dung CỤ THỂ và CHI TIẾT
- Mỗi hành động phải MÔ TẢ RÕ RÀNG việc cần làm

📋 CHECKLIST HÀNG QUÝ (4-6 items):
Các mục tiêu lớn cần đạt được mỗi quý, review tiến độ tổng thể

📋 CHECKLIST HÀNG THÁNG (8-10 items):
Các công việc quan trọng cần hoàn thành trong tháng

📋 CHECKLIST HÀNG TUẦN (10-12 items):
Các nhiệm vụ cụ thể cần thực hiện mỗi tuần

Mỗi bảng phải có TỐI THIỂU số dòng như yêu cầu, nội dung THỰC SỰ CỤ THỂ và ÁP DỤNG ĐƯỢC NGAY.`,
    
    sheets_tracking: `Mô tả cấu trúc Google Sheets theo dõi kế hoạch ${goal}. 7 SHEETS: (1) Dashboard - Biểu đồ thu nhập/chi tiêu/tài sản ròng, (2) Roadmap - Timeline ${timeline} với milestones, (3) Checklist - Checkbox tự động tính % hoàn thành, (4) Tiết kiệm - Theo dõi tiết kiệm hàng tháng, (5) Thu nhập - Các nguồn thu, (6) Business Metrics - MRR/Churn/CAC/LTV, (7) Kỹ năng - Link tài liệu học. Hướng dẫn cách sử dụng từng sheet.`,
    
    learning_resources: `Đề xuất TỐI THIỂU 25 TÀI LIỆU HỌC TẬP phù hợp với kỹ năng ${skillsStr} để đạt ${goal}. SÁCH (7+): Tên, Tác giả, Lý do đọc. KHOÁ HỌC ONLINE (7+): Tên, Nền tảng (Udemy/Coursera/Skillshare), Thời lượng. YOUTUBE (5+): Tên kênh, Nội dung chính. PODCAST (3+): Tên, Nền tảng. WEBSITE/BLOG (3+): Tên, URL mô tả.`,
    
    scenarios: `Dự báo 3 kịch bản cho mục tiêu ${goal} trong ${timeline}. KỊCH BẢN TỆ NHẤT: Kết quả, Nguyên nhân, Xác suất, Tín hiệu nhận biết. KỊCH BẢN TRUNG BÌNH: Kết quả, Điều kiện, Xác suất. KỊCH BẢN TỐT NHẤT: Kết quả, Điều kiện cần, Xác suất. Mỗi kịch bản có số liệu cụ thể.`,
    
    risk_reduction: `Đề xuất chiến lược giảm rủi ro và phương án dự phòng cho ${goal}. 5-7 RỦI RO CHÍNH: Mô tả, Mức độ nghiêm trọng, Xác suất xảy ra. Mỗi rủi ro: 2-3 biện pháp phòng ngừa, 1-2 phương án backup nếu xảy ra.`,
    
    kpis: `Đặt 10 KPIs cụ thể để theo dõi tiến độ đạt ${goal}. Mỗi KPI: Tên chỉ số, Công thức tính, Giá trị hiện tại, Mục tiêu, Deadline, Tần suất đo lường. Chia theo nhóm: Thu nhập (3), Tiết kiệm (2), Đầu tư (2), Kỹ năng (2), Kinh doanh (1).`,
    
    review: `Thiết lập chu kỳ rà soát và tối ưu kế hoạch ${goal}. RÀ SOÁT HÀNG TUẦN (15 phút): Checklist 5 câu hỏi. RÀ SOÁT HÀNG THÁNG (1 giờ): Checklist 10 câu hỏi, so sánh KPIs. RÀ SOÁT HÀNG QUÝ (nửa ngày): Đánh giá toàn diện, điều chỉnh chiến lược. Mẫu câu hỏi tự đánh giá cho mỗi chu kỳ.`,
    
    spiritual: `Phân tích tử vi và thần số học dựa trên thông tin user (nếu có ngày sinh). Nếu KHÔNG có ngày sinh: Giải thích tầm quan trọng của việc hiểu bản thân qua tử vi/thần số học, gợi ý user bổ sung ngày sinh để nhận phân tích chi tiết. Nếu CÓ ngày sinh: Phân tích cung hoàng đạo, số chủ đạo, đặc điểm tính cách liên quan tài chính, thời điểm thuận lợi, lời khuyên sự nghiệp/tài chính phù hợp.`,
    
    summary_actions: `Tóm tắt toàn bộ kế hoạch ${goal} trong 500-700 từ. Liệt kê 7-10 HÀNH ĐỘNG ƯU TIÊN NHẤT trong 30-90 ngày tới. Mỗi hành động: Mô tả cụ thể, Deadline, Kết quả mong đợi. Sắp xếp theo thứ tự ưu tiên.`,
    
    how_to_use: `Hướng dẫn sử dụng bản Kế hoạch này hiệu quả nhất. Cách đọc và hiểu từng phần. Cách cập nhật kế hoạch khi có thay đổi. Cách sử dụng cùng Google Sheets tracking. Tần suất xem lại kế hoạch. Tips để duy trì động lực thực hiện.`,
    
    closing: `Viết phần kết luận và lời động viên cho ${goal}. Tóm tắt 3-5 điểm quan trọng nhất. Lời khuyên tài chính cá nhân hoá. Lời động viên truyền cảm hứng. Kêu gọi hành động: "Bắt tay vào việc NGAY HÔM NAY với hành động đầu tiên là...". Kết thúc tích cực, tạo động lực.`
  }
}

function buildSectionPrompt(
  section: any,
  goal: string,
  income: string,
  savings: string,
  timeline: string,
  skills: string[],
  userContext: string,
  targetWords: number
): string {
  const prompts: Record<string, string> = buildPrompts(goal, income, savings, timeline, skills)

  const basePrompt = prompts[section.key] || `Phân tích chi tiết về ${section.title}`

  return `${userContext}

Viết phần: ${section.title}

${basePrompt}

QUY TẮC BẮT BUỘC:
- CHỈ viết nội dung cho phần này, KHÔNG lặp lại thông tin từ các phần khác.
- KHÔNG viết tiêu đề section (đã có sẵn).
- KHÔNG viết "Kết luận" ở cuối phần - nội dung phải liền mạch để nối với phần tiếp theo.
- KHÔNG viết "Cảm ơn bạn đã chia sẻ" hay lời chào.
- KHÔNG lặp lại mục tiêu/tóm tắt tình hình tài chính (đã có ở phần 1).
- KHÔNG đánh số lại từ 1, 2, 3 bên trong phần - dùng bullet points (•) hoặc gạch đầu dòng (-).
- KHÔNG xuất JSON, code, hoặc dữ liệu raw.
- Viết văn xuôi mạch lạc, dễ đọc, có tính ứng dụng cao.
- Độ dài: khoảng ${targetWords} từ.`
}

function cleanSectionContent(text: string, sectionTitle: string): string {
  let cleaned = text

  // Remove section title if AI repeats it
  const titleRe = new RegExp(`^(?:#{1,3}\\s*)?${sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, 'gim')
  cleaned = cleaned.replace(titleRe, '')

  // Remove "Cảm ơn bạn đã chia sẻ"
  cleaned = cleaned.replace(/Cảm ơn bạn đã chia sẻ[^.]*\./gi, '')

  // Remove validation text
  cleaned = cleaned.replace(/VALIDATION[^\n]*/gi, '')
  cleaned = cleaned.replace(/Kiểm tra lần[^\n]*/gi, '')

  // Remove Mermaid blocks and code blocks (keep markdown tables for display)
  cleaned = cleaned.replace(/```mermaid[\s\S]*?```/gi, '')
  cleaned = cleaned.replace(/```json[\s\S]*?```/gi, '')
  cleaned = cleaned.replace(/```(?:javascript|typescript|python|bash|sh|sql)[\s\S]*?```/gi, '')
  
  // Remove raw JSON objects (but keep markdown tables)
  cleaned = cleaned.replace(/\{[\s\S]*?"roadmap"[\s\S]*?\}/gi, '')
  cleaned = cleaned.replace(/\{[\s\S]*?"actions"[\s\S]*?\}/gi, '')
  cleaned = cleaned.replace(/\[\s*\{[\s\S]*?"[a-zA-Z_]+"[\s\S]*?\}\s*\]/gi, '')
  
  // NOTE: Keep markdown tables - they are useful for display
  // Tables are rendered properly by PlanRenderer component

  // Remove "Kết luận" sections at end of each part
  cleaned = cleaned.replace(/\n+(?:#{1,4}\s*)?Kết luận\s*\n[\s\S]*$/gi, '')
  cleaned = cleaned.replace(/\n+\*\*Kết luận\*\*[\s\S]*$/gi, '')
  
  // Remove repeated plan title/summary
  cleaned = cleaned.replace(/Kế hoạch chi tiết cho mục tiêu của bạn[\s\S]*?(?=\n\n|$)/gi, '')
  
  // Remove numbered lists that restart from 1 (keep bullet points)
  // This is tricky - we'll convert "1. " to "• " to avoid confusion with section numbers
  cleaned = cleaned.replace(/^(\d+)\.\s+/gm, '• ')

  // Remove empty lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')

  return cleaned.trim()
}

function assemblePlan(planName: string, sections: string[]): string {
  let plan = `# ${planName}\n\n${sections.join('\n\n')}`

  // Final cleanup
  plan = plan.replace(/\n{3,}/g, '\n\n')

  return plan
}
