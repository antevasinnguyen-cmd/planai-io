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
  ...getBaseSections(),
  { key: 'budget', title: '10. Ngân sách và phân bổ chi tiêu', weight: 2 },
  { key: 'expenses', title: '11. Phân tích chi phí cố định & biến đổi', weight: 2 },
  { key: 'cashflow', title: '12. Dòng tiền cá nhân & tối ưu hoá', weight: 2 },
  { key: 'income_streams', title: '13. Chiến lược đa nguồn thu', weight: 3 },
  { key: 'pricing_strategy', title: '14. Chiến lược định giá & gói dịch vụ', weight: 2 },
  { key: 'client_acquisition', title: '15. Kênh tìm kiếm & chuyển đổi khách hàng', weight: 3 },
  { key: 'risk_mgmt', title: '16. Quản trị rủi ro & bảo vệ tài chính', weight: 2 },
  { key: 'emergency_fund', title: '17. Quỹ dự phòng & quy tắc an toàn', weight: 2 },
  { key: 'debt_strategy', title: '18. Chiến lược xử lý nợ', weight: 2 },
  { key: 'asset_allocation', title: '19. Phân bổ tài sản theo mức rủi ro', weight: 3 },
  { key: 'tax_planning', title: '20. Thuế & tuân thủ pháp lý cơ bản', weight: 2 },
  { key: 'performance_kpis', title: '21. KPIs & thước đo hiệu suất', weight: 2 },
  { key: 'review_cadence', title: '22. Chu kỳ rà soát & tối ưu kế hoạch', weight: 2 },
  { key: 'contingency_plans', title: '23. Kế hoạch dự phòng khi biến động', weight: 2 },
  { key: 'investment_roadmap', title: '24. Lộ trình đầu tư theo giai đoạn', weight: 3 }
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

  // Extract user data
  const chatSummary = String(collectedInfo?.chat_summary || '')
  const income = collectedInfo?.income || '7 – 10 triệu VNĐ/tháng'
  const savings = collectedInfo?.savings || '0'
  const timeline = collectedInfo?.timeline || '2 – 3 năm'
  const skills = Array.isArray(collectedInfo?.skills) ? collectedInfo.skills : []

  const userContext = `Thông tin người dùng:
- Mục tiêu: ${goal}
- Thu nhập hiện tại: ${income}
- Tiết kiệm hiện có: ${savings}
- Thời gian mục tiêu: ${timeline}
- Kỹ năng: ${skills.join(', ') || 'Đang phát triển'}

---
LỊCH SỬ CHAT:
${chatSummary.slice(0, 4000)}
---`

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
  const prompts: Record<string, string> = {
    profile: `Viết phần "Tóm tắt tình hình tài chính" dựa trên thông tin user. Bao gồm: thu nhập hiện tại (${income}), tiết kiệm (${savings}), kỹ năng (${skills.join(', ')}), và mục tiêu (${goal}). Trình bày dạng bullet points rõ ràng.`,
    goals: `Phân tích mục tiêu tài chính: ${goal}. Đánh giá tính khả thi với thu nhập ${income} trong ${timeline}. Giải thích lý do và động lực.`,
    current: `Phân tích hiện trạng và khoảng cách mục tiêu. So sánh thu nhập ${income}, tiết kiệm ${savings} với mục tiêu ${goal}. Tính toán cụ thể số tiền cần đạt thêm.`,
    models: `Đề xuất 3-5 mô hình tăng thu nhập phù hợp với kỹ năng ${skills.join(', ')} và mục tiêu ${goal}. Mỗi mô hình giải thích cách thực hiện và thu nhập dự kiến.`,
    saving: `Lập kế hoạch tiết kiệm và đầu tư cụ thể để đạt ${goal} trong ${timeline}. Đề xuất tỷ lệ tiết kiệm, kênh đầu tư phù hợp.`,
    plan: `Viết kế hoạch hành động chi tiết theo timeline ${timeline}. Chia theo mốc: Tháng 1-3, Tháng 4-6, Tháng 7-12, Năm 2-3. Mỗi mốc liệt kê các việc cần làm cụ thể.`,
    learning: `Đề xuất TỐI THIỂU 20 tài liệu học tập và nguồn lực phù hợp với kỹ năng ${skills.join(', ')} để đạt ${goal}. Bao gồm: sách (5+), khóa học online (5+), kênh YouTube (5+), podcast (3+), website/blog (2+). Mỗi tài liệu ghi rõ tên, tác giả/nguồn, và lý do nên học.`,
    mindset: `Tư vấn tâm lý và tư duy để đạt ${goal}. Đề xuất 5-7 nguyên tắc tư duy, cách vượt qua khó khăn phổ biến, và phương pháp duy trì động lực dài hạn.`,
    conclusion: `Tóm tắt ngắn gọn 3-5 điểm chính của kế hoạch và liệt kê 5 hành động cần làm NGAY trong tuần đầu tiên.`,
    // Paid tier sections
    budget: `Xây dựng ngân sách cá nhân chi tiết với thu nhập ${income}. Phân bổ theo danh mục: chi phí cố định, chi phí sinh hoạt, tiết kiệm, đầu tư, giải trí.`,
    expenses: `Phân tích chi phí cố định và biến đổi điển hình. Đề xuất cụ thể cách cắt giảm 10-20% chi phí không cần thiết.`,
    cashflow: `Mô tả dòng tiền vào/ra hàng tháng. Đề xuất cơ chế "pay-yourself-first" và cách tự động hóa tiết kiệm.`,
    income_streams: `Đề xuất 5-7 nguồn thu nhập thụ động và chủ động phù hợp kỹ năng ${skills.join(', ')}. Mỗi nguồn giải thích cách bắt đầu và thu nhập tiềm năng.`,
    pricing_strategy: `Chiến lược định giá dịch vụ/sản phẩm. Đề xuất các mức giá, gói dịch vụ, và cách tăng giá theo thời gian.`,
    client_acquisition: `Xây dựng kênh tìm kiếm và chuyển đổi khách hàng. Đề xuất 5-7 kênh marketing phù hợp và cách đo lường hiệu quả.`,
    risk_mgmt: `Lập danh mục 5-7 rủi ro tài chính phổ biến và cách phòng ngừa cho từng loại.`,
    emergency_fund: `Thiết kế quỹ dự phòng 3-6 tháng chi phí. Tính toán số tiền cần có và cách tích lũy.`,
    debt_strategy: `Chiến lược xử lý nợ (nếu có). Phương pháp snowball vs avalanche, cách ưu tiên trả nợ.`,
    asset_allocation: `Phân bổ tài sản theo mức rủi ro phù hợp với mục tiêu ${goal}. Đề xuất tỷ lệ cổ phiếu/trái phiếu/tiền mặt/bất động sản.`,
    tax_planning: `Tổng quan thuế cơ bản cho cá nhân/kinh doanh nhỏ tại Việt Nam. Các khoản được khấu trừ và cách tối ưu thuế hợp pháp.`,
    performance_kpis: `Đặt 5-7 KPIs cụ thể cho thu nhập, tiết kiệm, đầu tư. Mỗi KPI có mục tiêu số và thời hạn rõ ràng.`,
    review_cadence: `Thiết lập chu kỳ rà soát: hàng tuần (15 phút), hàng tháng (1 giờ), hàng quý (nửa ngày). Checklist cần kiểm tra mỗi lần.`,
    contingency_plans: `Kế hoạch dự phòng cho 3-5 tình huống biến động: mất việc, bệnh tật, suy thoái kinh tế, chi phí đột xuất.`,
    investment_roadmap: `Lộ trình đầu tư theo 3 giai đoạn: Giai đoạn 1 (0-6 tháng), Giai đoạn 2 (6-18 tháng), Giai đoạn 3 (18-36 tháng). Mỗi giai đoạn có mục tiêu và hành động cụ thể.`
  }

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

  // Remove Mermaid blocks and code blocks
  cleaned = cleaned.replace(/```mermaid[\s\S]*?```/gi, '')
  cleaned = cleaned.replace(/```json[\s\S]*?```/gi, '')
  cleaned = cleaned.replace(/```[\s\S]*?```/gi, '')
  
  // Remove raw JSON objects
  cleaned = cleaned.replace(/\{[\s\S]*?"roadmap"[\s\S]*?\}/gi, '')
  cleaned = cleaned.replace(/\{[\s\S]*?"actions"[\s\S]*?\}/gi, '')
  cleaned = cleaned.replace(/\[\s*\{[\s\S]*?\}\s*\]/gi, '')
  
  // Remove markdown tables
  cleaned = cleaned.replace(/^\|.*$/gm, '')
  cleaned = cleaned.replace(/^[-|:]+$/gm, '')

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
