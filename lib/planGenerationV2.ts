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
   
   ⚠️ CRITICAL: Use REAL DATA from the chat history above, NOT the example data shown below!
   
   STEP 1: Extract REAL data from chat history:
   - Scan the chat history for ALL numbers, amounts, goals, timelines
   - Example: If chat says "8-10 triệu/tháng", use "8 - 10 triệu VNĐ" (NOT "8 - 10 triệu VNĐ" from example)
   - Example: If chat says "280 triệu tiết kiệm", use "280 triệu VNĐ" (NOT from example)
   - Example: If chat says "mua nhà 2 tỷ", use "2 tỷ VNĐ" (NOT from example)
   
   STEP 2: Map chat data to Section 1 fields:
   - Thu nhập hàng tháng: [Extract from chat - user's income]
   - Tài khoản tiết kiệm: [Extract from chat - current savings]
   - Mục tiêu: [Extract from chat - all goals mentioned]
   - Timeline: [Extract from chat - when they want to achieve]
   
   STEP 3: Generate Section 1 with REAL data (not example):
   
   Start with this EXACT opening:
   "Cảm ơn bạn đã chia sẻ thông tin chi tiết về tình hình tài chính của mình. Dưới đây là tóm tắt các mục tiêu tài chính và tình hình hiện tại của bạn:"
   
   Then include ALL these subsections in this EXACT order with REAL DATA from chat (NOT example data):
   
   ⚠️⚠️⚠️ EXAMPLE FORMAT BELOW - DO NOT COPY NUMBERS, ONLY USE AS FORMAT REFERENCE ⚠️⚠️⚠️
   Replace all numbers and text with REAL data from chat history above!
   
   **Tình Hình Hiện Tại**
   • Thu nhập hàng tháng: [REAL income from chat, e.g., "8 - 10 triệu VNĐ"]
   • Tài khoản tiết kiệm hiện tại: [REAL savings from chat, e.g., "280 triệu VNĐ"]
   
   **Mục Tiêu Tài Chính**
   • [REAL goal 1 from chat, e.g., "Mua nhà: Số tiền chưa xác định..."]
   • [REAL goal 2 from chat, e.g., "Mua ô tô: Số tiền chưa xác định..."]
   • [REAL goal 3 from chat, e.g., "Tài khoản ngân hàng: 10 tỷ VNĐ..."]
   
   **Tổng Mục Tiêu**
   • [REAL summary from chat]
   
   Giả sử:
   • [REAL assumption 1 from chat]
   • [REAL assumption 2 from chat]
   
   **Tính Toán Tổng Mục Tiêu**
   • Tổng mục tiêu:
   - [REAL goal 1 with amount]
   - [REAL goal 2 with amount]
   - [REAL goal 3 with amount]
   Tổng mục tiêu: [REAL calculation from chat]
   
   **Tình Hình Tài Chính**
   • Tiết kiệm hiện tại: [REAL current savings from chat]
   • Cần đạt thêm: [REAL gap calculation from chat]
   
   **Kế Hoạch Tiết Kiệm**
   Nếu bạn muốn đạt được mục tiêu này trong vòng [REAL timeline from chat], bạn cần tiết kiệm khoảng:
   • [REAL monthly savings calculation from chat]
   
   [REAL context from chat about their situation and projects]
   
   **Một Số Gợi Ý**
   1. [REAL suggestion 1 based on their situation from chat]
   2. [REAL suggestion 2 based on their projects from chat]
   3. [REAL suggestion 3 based on their goals from chat]

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
  let plan = await callAI(systemPrompt, userContext, maxTokens, 0.7)
  
  // CRITICAL: Validate plan meets all requirements
  const validationErrors: string[] = []
  
  // 1. Title check
  if (!plan.includes('# Kế hoạch chi tiết cho mục tiêu của bạn')) {
    validationErrors.push('❌ Title is not fixed "# Kế hoạch chi tiết cho mục tiêu của bạn"')
  }
  
  // 2. Opening paragraph check
  const titleIndex = plan.indexOf('# Kế hoạch chi tiết cho mục tiêu của bạn')
  const section1Index = plan.indexOf('## 1. Tóm tắt tình hình tài chính của bạn')
  if (titleIndex !== -1 && section1Index !== -1) {
    const textBetween = plan.substring(titleIndex + 50, section1Index).trim()
    if (textBetween.length > 0 && !textBetween.startsWith('##')) {
      validationErrors.push(`❌ Found opening paragraph between title and Section 1: "${textBetween.substring(0, 50)}..."`)
    }
  }
  
  // 3. Section 1 opening check
  if (!plan.includes('Cảm ơn bạn đã chia sẻ thông tin chi tiết về tình hình tài chính của mình')) {
    validationErrors.push('❌ Section 1 does not start with required opening text')
  }
  
  // 4. Check for generic text
  if (plan.includes('Chân dung tài chính cá nhân')) {
    validationErrors.push('❌ Found generic text "Chân dung tài chính cá nhân" - should be exact AI response')
  }
  
  // 5. Check for all 7 subsections
  const requiredSubsections = [
    'Tình Hình Hiện Tại',
    'Mục Tiêu Tài Chính',
    'Tổng Mục Tiêu',
    'Tính Toán Tổng Mục Tiêu',
    'Tình Hình Tài Chính',
    'Kế Hoạch Tiết Kiệm',
    'Một Số Gợi Ý'
  ]
  
  for (const subsection of requiredSubsections) {
    if (!plan.includes(`**${subsection}**`)) {
      validationErrors.push(`❌ Missing subsection: **${subsection}**`)
    }
  }
  
  // 6. Check for unwanted section 9 or 10
  if (plan.includes('## 9. Kết luận') || 
      plan.includes('## 9. Kết luận & hành động ngay') ||
      plan.includes('## 9. Kết luận và hành động tiếp theo') ||
      plan.includes('## 10. Kết luận và hành động tiếp theo') || 
      plan.includes('## 10. Kết luận và Hành động Tiếp theo')) {
    validationErrors.push('❌ Found unwanted section 9 or 10 - removing it')
    // Remove section 9 or 10 and everything after it
    const section9Index = plan.indexOf('## 9.')
    const section10Index = plan.indexOf('## 10.')
    const removeIndex = section9Index !== -1 ? section9Index : section10Index
    if (removeIndex !== -1) {
      plan = plan.substring(0, removeIndex).trim()
    }
  }
  
  // If validation fails, log errors but still return plan (AI tried its best)
  if (validationErrors.length > 0) {
    console.warn('⚠️ PLAN VALIDATION WARNINGS:', validationErrors)
  }
  
  return plan
}
