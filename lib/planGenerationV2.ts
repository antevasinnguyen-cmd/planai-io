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
  
  // Build user context with FULL chat history
  const userContext = `
🎯 NHIỆM VỤ:
Tạo kế hoạch tài chính chi tiết dựa trên cuộc trò chuyện dưới đây.

📋 LỊCH SỬ TRÒ CHUYỆN ĐẦY ĐỦ:
${chatSummary}

---

⚠️⚠️⚠️ CRITICAL INSTRUCTIONS - YOU MUST FOLLOW EXACTLY ⚠️⚠️⚠️

1. **TITLE (FIXED):**
   Output EXACTLY: # Kế hoạch chi tiết cho mục tiêu của bạn
   DO NOT use any other title. DO NOT use dynamic title from user input.

2. **NO OPENING PARAGRAPH:**
   After the title, go DIRECTLY to "## 1. Tóm tắt tình hình tài chính của bạn"
   NO introduction text between title and Section 1.

3. **SECTION 1 FORMAT (CRITICAL - MUST MATCH EXACTLY):**
   
   Start with this EXACT opening:
   "Cảm ơn bạn đã chia sẻ thông tin chi tiết về tình hình tài chính của mình. Dưới đây là tóm tắt các mục tiêu tài chính và tình hình hiện tại của bạn:"
   
   Then include ALL these subsections in this EXACT order:
   
   **Tình Hình Hiện Tại**
   • Thu nhập hàng tháng: [extract from chat - e.g., "8 - 10 triệu VNĐ"]
   • Tài khoản tiết kiệm hiện tại: [extract from chat - e.g., "280 triệu VNĐ"]
   
   **Mục Tiêu Tài Chính**
   • [List each goal from chat with amounts/details]
   
   **Tổng Mục Tiêu**
   • Để có thể tính toán tổng mục tiêu, tôi cần biết chính xác số tiền bạn dự định dành cho việc [goals].
   
   Giả sử:
   • [Goal 1]: [assumed amount] VNĐ
   • [Goal 2]: [assumed amount] VNĐ
   
   **Tính Toán Tổng Mục Tiêu**
   • Tổng mục tiêu:
   - [Goal 1]: [amount] VNĐ
   - [Goal 2]: [amount] VNĐ
   - [Goal 3]: [amount] VNĐ
   Tổng mục tiêu: [calculation] = [total] VNĐ
   
   **Tình Hình Tài Chính**
   • Tiết kiệm hiện tại: [current] VNĐ
   • Cần đạt thêm: [total] - [current] = [gap] VNĐ
   
   **Kế Hoạch Tiết Kiệm**
   Nếu bạn muốn đạt được mục tiêu này trong vòng [timeline from chat], bạn cần tiết kiệm khoảng:
   • [gap] VNĐ / [months] tháng ≈ [monthly] VNĐ/tháng
   
   Điều này có vẻ khá thách thức với thu nhập hiện tại của bạn. Tuy nhiên, với [mention their projects/skills from chat], nếu thành công, có thể tạo ra thu nhập lớn hơn.
   
   **Một Số Gợi Ý**
   1. [Specific suggestion based on their situation]
   2. [Specific suggestion based on their projects]
   3. [Specific suggestion based on their goals]

4. **DATA EXTRACTION:**
   - Extract ALL data from the chat history above
   - Use REAL numbers, NOT placeholders like [AMOUNT]
   - If data is missing, make reasonable assumptions based on Vietnam context
   - Format numbers in Vietnamese style (e.g., "280 triệu VNĐ", "2 tỷ VNĐ")

5. **REMAINING SECTIONS:**
   After Section 1, continue with other sections from the template in system prompt.

TARGET LENGTH: ${tier === 'free' ? '3000-5000 words' : '20000-50000 words'}

NOW GENERATE THE COMPLETE FINANCIAL PLAN FOLLOWING ALL INSTRUCTIONS ABOVE.
`

  // Get system prompt (includes MANDATORY OUTPUT INSTRUCTION)
  const systemPrompt = getFinancialPlanSystemPrompt()
  
  // Generate plan
  const maxTokens = tier === 'free' ? 8000 : 16000
  const plan = await callAI(systemPrompt, userContext, maxTokens, 0.7)
  
  return plan
}
