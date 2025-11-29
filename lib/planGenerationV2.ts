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
  
  // CRITICAL: Build FULL chat history from messages array (user + AI)
  // This ensures AI sees the entire conversation context, not just user messages
  const messages = Array.isArray(collectedInfo?.messages) ? collectedInfo.messages : []
  const fullChatHistory = messages.length > 0
    ? messages
        .map((m: any) => {
          const role = m.role === 'user' ? '👤 User' : '🤖 AI'
          return `${role}: ${m.content || m.message || ''}`
        })
        .join('\n\n')
        .slice(0, 10000)  // Increased limit to capture full context
    : String(collectedInfo?.chat_summary || '')
  
  // Build user context with FULL chat history
  const userContext = `
🎯 NHIỆM VỤ:
Tạo kế hoạch tài chính chi tiết dựa trên cuộc trò chuyện dưới đây.

📋 LỊCH SỬ TRÒ CHUYỆN ĐẦY ĐỦ (User + AI responses):
${fullChatHistory}

---

⚠️⚠️⚠️ CRITICAL INSTRUCTIONS - YOU MUST FOLLOW EXACTLY ⚠️⚠️⚠️

1. **TITLE (FIXED):**
   Output EXACTLY: # Kế hoạch chi tiết cho mục tiêu của bạn
   DO NOT use any other title. DO NOT use dynamic title from user input.

2. **NO OPENING PARAGRAPH:**
   After the title, go DIRECTLY to "## 1. Tóm tắt tình hình tài chính của bạn"
   NO introduction text between title and Section 1.

3. **SECTION 1 FORMAT (CRITICAL - MUST BE EXACT AI CHAT RESPONSE, NOT SUMMARY):**
   
   This section is NOT a summary - it is the FULL AI response from the chat.
   
   Start with this EXACT opening:
   "Cảm ơn bạn đã chia sẻ thông tin chi tiết về tình hình tài chính của mình. Dưới đây là tóm tắt các mục tiêu tài chính và tình hình hiện tại của bạn:"
   
   Then include ALL these subsections in this EXACT order with REAL DATA from chat:
   
   **Tình Hình Hiện Tại**
   • Thu nhập hàng tháng: 8 - 10 triệu VNĐ
   • Tài khoản tiết kiệm hiện tại: 280 triệu VNĐ
   
   **Mục Tiêu Tài Chính**
   • Mua nhà: Số tiền chưa xác định cụ thể nhưng thường nằm trong khoảng 2 - 3 tỷ VNĐ (cần xác nhận từ bạn).
   • Mua ô tô: Số tiền chưa xác định cụ thể nhưng thường nằm trong khoảng 700 triệu VNĐ - 1 tỷ VNĐ (cần xác nhận từ bạn).
   • Tài khoản ngân hàng: 10 tỷ VNĐ để nghỉ hưu sớm.
   
   **Tổng Mục Tiêu**
   • Để có thể tính toán tổng mục tiêu, tôi cần biết chính xác số tiền bạn dự định dành cho việc mua nhà và ô tô.
   
   Giả sử:
   • Mua nhà: 2 tỷ VNĐ
   • Mua ô tô: 700 triệu VNĐ
   
   **Tính Toán Tổng Mục Tiêu**
   • Tổng mục tiêu:
   - Mua nhà: 2 tỷ VNĐ
   - Mua ô tô: 700 triệu VNĐ
   - Tài khoản ngân hàng: 10 tỷ VNĐ
   Tổng mục tiêu: 2 + 0.7 + 10 = 12.7 tỷ VNĐ
   
   **Tình Hình Tài Chính**
   • Tiết kiệm hiện tại: 280 triệu VNĐ
   • Cần đạt thêm: 12.7 tỷ - 0.28 tỷ = 12.42 tỷ VNĐ
   
   **Kế Hoạch Tiết Kiệm**
   Nếu bạn muốn đạt được mục tiêu này trong vòng 3 năm (36 tháng), bạn cần tiết kiệm khoảng:
   • 12.42 tỷ VNĐ / 36 tháng ≈ 345 triệu VNĐ/tháng
   
   Điều này có vẻ khá thách thức với thu nhập hiện tại của bạn. Tuy nhiên, với dự án webapp saas AI mà bạn đang phát triển, nếu thành công, có thể tạo ra thu nhập lớn hơn.
   
   **Một Số Gợi Ý**
   1. Tăng thu nhập từ kinh doanh online: Hãy xem xét các kênh tiếp thị mới hoặc sản phẩm mới để gia tăng doanh thu.
   2. Theo dõi tiến trình dự án webapp saas AI: Nếu có thể, hãy tìm kiếm các nhà đầu tư hoặc hợp tác để đẩy nhanh quá trình phát triển.
   3. Xem xét các khoản đầu tư: Nghiên cứu các hình thức đầu tư an toàn để gia tăng tài sản hiện có.

4. **DATA EXTRACTION INSTRUCTION:**
   - Extract ALL data from the chat history above
   - Replace ALL numbers, amounts, goals, timelines with ACTUAL data from chat
   - Use REAL numbers, NOT placeholders like [AMOUNT]
   - If data is missing, make reasonable assumptions based on Vietnam context
   - Format numbers in Vietnamese style (e.g., "280 triệu VNĐ", "2 tỷ VNĐ")
   - CRITICAL: This is the FULL AI response, not a shortened version

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
