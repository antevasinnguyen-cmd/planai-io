/**
 * Plan Generation V2 - Uses FINANCIAL_PLAN prompt template correctly
 * Generates plan in ONE call following the exact template structure
 */

import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { getFinancialPlanSystemPrompt } from './prompts'

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

async function callAI(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  temperature: number
): Promise<string> {
  // Try OpenAI first
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature,
      max_tokens: maxTokens
    })
    const text = response.choices?.[0]?.message?.content || ''
    if (text && text.trim().length > 0) return text
  } catch (err) {
    console.error('OpenAI error:', err)
  }

  // Fallback to Claude
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
    const text = response.content?.[0]?.type === 'text' ? response.content[0].text : ''
    if (text && text.trim().length > 0) return text
  } catch (err) {
    console.error('Claude error:', err)
  }

  throw new Error('Both OpenAI and Claude failed')
}

export async function generatePlanWithTemplate(
  planName: string,
  goal: string,
  collectedInfo: any
): Promise<string> {
  const tier = String(collectedInfo?.tier || 'free')
  const chatSummary = String(collectedInfo?.chat_summary || '')
  
  // Extract data
  const income = collectedInfo?.income || '8 - 10 triệu VNĐ/tháng'
  const savings = collectedInfo?.current_savings || '0'
  const timeline = collectedInfo?.timeline || '2 - 3 năm'
  const skills = Array.isArray(collectedInfo?.skills) ? collectedInfo.skills.join(', ') : 'kinh doanh online'
  const age = collectedInfo?.age || ''
  const familyStatus = collectedInfo?.family_status || ''
  
  // Build user context
  const userContext = `
THÔNG TIN NGƯỜI DÙNG:
- Mục tiêu: ${goal}
- Thu nhập hiện tại: ${income}
- Tiết kiệm hiện có: ${savings}
- Thời gian mục tiêu: ${timeline}
- Kỹ năng: ${skills}
${age ? `- Tuổi: ${age}` : ''}
${familyStatus ? `- Tình trạng gia đình: ${familyStatus}` : ''}

LỊCH SỬ CHAT:
${chatSummary}

---

YÊU CẦU:
Tạo kế hoạch tài chính chi tiết theo ĐÚNG template trong system prompt.

⚠️ CRITICAL - BẮT BUỘC:
1. Title PHẢI là: "Kế hoạch chi tiết cho mục tiêu của bạn" (KHÔNG dynamic)
2. KHÔNG có đoạn mở đầu sau title
3. Section 1 PHẢI bắt đầu bằng: "Cảm ơn bạn đã chia sẻ thông tin chi tiết về tình hình tài chính của mình..."
4. Section 1 PHẢI có đầy đủ các phần:
   - Tình Hình Hiện Tại
   - Mục Tiêu Tài Chính
   - Tổng Mục Tiêu
   - Tính Toán Tổng Mục Tiêu
   - Tình Hình Tài Chính
   - Kế Hoạch Tiết Kiệm
   - Một Số Gợi Ý

Độ dài: ${tier === 'free' ? '3000-5000 từ' : '20000-50000 từ'}
`

  // Get system prompt (includes MANDATORY OUTPUT INSTRUCTION)
  const systemPrompt = getFinancialPlanSystemPrompt()
  
  // Generate plan
  const maxTokens = tier === 'free' ? 8000 : 16000
  const plan = await callAI(systemPrompt, userContext, maxTokens, 0.7)
  
  return plan
}
