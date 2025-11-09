import OpenAI from 'openai'
import { selectModel, TaskType, generateCacheKey, checkCache, saveToCache, chunkText } from './modelSelection'
import { getChatSystemPrompt, getFinancialPlanSystemPrompt, getUserInputAnalysisSystemPrompt } from './prompts'
import { cleanAIResponse, enhanceResponseFormatting } from './responseCleaner'
import { logger } from '@/lib/logger'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// Generate 3 strategic assumptions from profile and chat history
export const generateStrategicAssumptions = async (
  profile: any,
  chatHistory: { role: 'user' | 'assistant'; content: string }[],
  tier: string
): Promise<{ markdown: string; json: any } | null> => {
  try {
    const model = selectModel(TaskType.REGULAR_CHAT)
    const client = getOpenAI()
    if (!client) return null
    const system = {
      role: 'system' as const,
      content: `Bạn là chuyên gia lập kế hoạch tài chính. Hãy tạo 3 GIẢ ĐỊNH CHIẾN LƯỢC dựa trên hồ sơ người dùng và lịch sử hội thoại để định hướng trả lời tiếp theo.

YÊU CẦU:
- Trả về JSON hợp lệ với khóa "assumptions": mỗi assumption có: assumption, rationale, risk, kpi, confidence (0-1).
- Không thêm văn bản ngoài JSON ở phản hồi đầu tiên.
`
    }
    const userPayload = {
      role: 'user' as const,
      content: JSON.stringify({ profile, chatHistory: chatHistory.slice(-10) }).slice(0, 12000)
    }
    const completion = await client.chat.completions.create({
      model,
      messages: [system, userPayload],
      max_tokens: 500,
      temperature: 0.2,
    })
    const raw = completion.choices[0]?.message?.content || '{}'
    let parsed: any
    try { parsed = JSON.parse(raw) } catch { return null }
    const arr = Array.isArray(parsed?.assumptions) ? parsed.assumptions.slice(0,3) : []
    if (!arr.length) return null
    const md = [
      '## Giả định chiến lược (tạm thời)',
      ...arr.map((a: any, i: number) => `- **${i+1}. ${a.assumption || 'Giả định'}** — *${Math.round((a.confidence||0)*100)}% tin cậy*\n  - Lý do: ${a.rationale || ''}\n  - Rủi ro: ${a.risk || ''}\n  - KPI: ${a.kpi || ''}`)
    ].join('\n')
    return { markdown: md, json: parsed }
  } catch {
    return null
  }
}

// Variant that accepts a custom system prompt (tier-aware formatting)
export const generateChatResponseWithSystemPrompt = async (
  messages: ChatMessage[],
  systemPrompt: string
): Promise<string> => {
  try {
    logger.info('OPENAI_CHAT_START_CUSTOM', {})
    const systemMessage = {
      role: 'system' as const,
      content: systemPrompt || getChatSystemPrompt()
    }
    const fullMessages = [systemMessage, ...messages]

    const cacheKey = generateCacheKey(fullMessages)
    logger.info('OPENAI_CHAT_CHECK_CACHE', {})
    const cachedResponse = await checkCache(cacheKey)
    if (cachedResponse) {
      logger.info('OPENAI_CHAT_CACHE_HIT', {})
      return cachedResponse
    }

    if (!process.env.OPENAI_API_KEY) {
      logger.error('OPENAI_MISSING_API_KEY', {})
      throw new Error('OpenAI API key không được cấu hình')
    }

    try {
      const model = selectModel(TaskType.REGULAR_CHAT)
      const client = getOpenAI()
      if (!client) throw new Error('OpenAI client không được khởi tạo')

      const completion = await client.chat.completions.create({
        model,
        messages: fullMessages,
        max_tokens: 2200,
        temperature: 0.75,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
      })

      const rawResponse = completion.choices[0]?.message?.content || 'Xin lỗi, tôi không thể trả lời lúc này.'
      const cleanedResponse = cleanAIResponse(rawResponse)
      const enhancedResponse = enhanceResponseFormatting(cleanedResponse.content)
      await saveToCache(cacheKey, enhancedResponse)
      return enhancedResponse
    } catch (openaiError) {
      logger.error('OPENAI_CHAT_ERROR_CUSTOM', { error: String(openaiError) })
      throw new Error('Không thể kết nối OpenAI')
    }
  } catch (error) {
    logger.error('OPENAI_CHAT_UNHANDLED_CUSTOM', { error: String(error) })
    return 'Ui, có lỗi xảy ra khi kết nối với AI. Bạn vui lòng thử lại sau ít phút nữa nhé.'
  }
}

// Initialize OpenAI client (lazy initialization)
let openai: OpenAI | null = null

const getOpenAI = () => {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openai
}

const raceWithAbort = async <T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> => {
  if (!signal) {
    return promise
  }

  if (signal.aborted) {
    const abortError = new Error('AbortError')
    abortError.name = 'AbortError'
    throw abortError
  }

  return new Promise<T>((resolve, reject) => {
    const abortHandler = () => {
      signal.removeEventListener('abort', abortHandler)
      const abortError = new Error('AbortError')
      abortError.name = 'AbortError'
      reject(abortError)
    }

    signal.addEventListener('abort', abortHandler, { once: true })

    promise
      .then(result => {
        signal.removeEventListener('abort', abortHandler)
        resolve(result)
      })
      .catch(error => {
        signal.removeEventListener('abort', abortHandler)
        reject(error)
      })
  })
}

export const generateChatResponse = async (messages: ChatMessage[]): Promise<string> => {
  try {
    logger.info('OPENAI_CHAT_START', {})
    const systemMessage = {
      role: 'system' as const,
      content: getChatSystemPrompt()
    }
    
    const fullMessages = [systemMessage, ...messages]
    
    // Generate cache key for this conversation
    const cacheKey = generateCacheKey(fullMessages)
    
    // Check if we have a cached response
    logger.info('OPENAI_CHAT_CHECK_CACHE', {})
    const cachedResponse = await checkCache(cacheKey)
    if (cachedResponse) {
      logger.info('OPENAI_CHAT_CACHE_HIT', {})
      return cachedResponse
    }
    
    // Kiểm tra API key OpenAI
    if (!process.env.OPENAI_API_KEY) {
      logger.error('OPENAI_MISSING_API_KEY', {})
      throw new Error('OpenAI API key không được cấu hình')
    }
    
    logger.info('OPENAI_CHAT_CALL', {})
    try {
      // Select the appropriate model for regular chat
      const model = selectModel(TaskType.REGULAR_CHAT)
      
      const client = getOpenAI()
      if (!client) {
        throw new Error('OpenAI client không được khởi tạo')
      }
      
      const completion = await client.chat.completions.create({
        model,
        messages: fullMessages,
        max_tokens: 2000, // Increased for ChatGPT Plus quality responses
        temperature: 0.8, // Slightly higher for more creativity and personality
        top_p: 0.9, // Focus on high probability tokens
        frequency_penalty: 0.1, // Reduce repetition
        presence_penalty: 0.1, // Encourage new topics
      })

      const rawResponse = completion.choices[0]?.message?.content || 'Xin lỗi, tôi không thể trả lời lúc này. Vui lòng thử lại.'
      
      // Clean and enhance response formatting
      const cleanedResponse = cleanAIResponse(rawResponse)
      const enhancedResponse = enhanceResponseFormatting(cleanedResponse.content)
      
      // Save enhanced response to cache
      logger.info('OPENAI_CHAT_CACHE_SAVE', {})
      await saveToCache(cacheKey, enhancedResponse)
      
      return enhancedResponse
    } catch (openaiError) {
      logger.error('OPENAI_CHAT_ERROR', { error: String(openaiError) })
      throw new Error('Không thể kết nối OpenAI')
    }
  } catch (error) {
    logger.error('OPENAI_CHAT_UNHANDLED', { error: String(error) })
    return 'Ui, có lỗi xảy ra khi kết nối với AI. Bạn vui lòng thử lại sau ít phút nữa nhé.'
  }
}

export const generateFinancialPlan = async (
  planName: string,
  goals: string,
  collectedInfo: any,
  signal?: AbortSignal
): Promise<string> => {
  try {
    // Generate spiritual insights if profile has birth date
    let spiritualInsights = ''
    if (collectedInfo.birth_date && collectedInfo.full_name) {
      const { generateSpiritualProfile, getSpiritualFinancialInsights } = await import('./spiritual')
      const spiritualProfile = generateSpiritualProfile(collectedInfo.birth_date, collectedInfo.full_name)
      spiritualInsights = getSpiritualFinancialInsights(spiritualProfile)
    }

    // Determine word/token limits based on subscription (P0)
    // GPT-4 Turbo max completion tokens: 4096 (HARD LIMIT)
    const MAX_COMPLETION_TOKENS = 4096
    
    // Tier-based micro-tasks and scenario depth gating (P1)
    const tier = String(collectedInfo.tier || 'free')

    // TIER-SPECIFIC WORD LIMITS
    const tierWordLimits = {
      'free': 5000,      // Free: max 5000 words
      'basic': 50000,    // Gói 1: max 50000 words
      'pro': 50000,      // Gói 2: max 50000 words
      'pro_max': 50000   // Gói 3: max 50000 words
    }
    
    const maxWordLimit = tierWordLimits[tier as keyof typeof tierWordLimits] || 5000
    const maxWordsInput = typeof collectedInfo.maxWords === 'number' ? collectedInfo.maxWords : maxWordLimit
    const maxWords = Math.max(1000, Math.min(maxWordsInput, maxWordLimit))

    const wordRange = tier === 'free'
      ? 'Tối đa 5.000 từ (Gói Free)'
      : 'Tối đa 50.000 từ (Gói trả phí)'

    // Token budget aligned with model capacity (GPT-4 Turbo max: 4096 completion tokens)
    // But respect tier word limits
    const maxTokensForTier = (() => {
      if (tier === 'free') return Math.min(3500, Math.ceil(maxWords * 1.5))  // Free: clamped to 5k words
      if (tier === 'basic') return Math.min(4096, Math.ceil(maxWords * 1.5)) // Basic: up to 50k words
      return Math.min(4096, Math.ceil(maxWords * 1.5))  // Pro/Pro Max: up to 50k words (but clamped to 4096 tokens)
    })()

    // Tier-aware creativity: higher tiers allow slightly higher temperature
    const temperatureForTier = (() => {
      if (tier === 'pro_max') return 0.7
      if (tier === 'pro') return 0.65
      if (tier === 'basic') return 0.6
      return 0.55
    })()
    let dailyTasks = 3
    let weeklyItems = 4
    let monthlyItems = 4
    let scenarioDepth = 'cơ bản'
    if (tier === 'basic') {
      dailyTasks = 5; weeklyItems = 5; monthlyItems = 5; scenarioDepth = 'khá chi tiết'
    } else if (tier === 'pro') {
      dailyTasks = 8; weeklyItems = 7; monthlyItems = 7; scenarioDepth = 'sâu và có ví dụ thực tế'
    } else if (tier === 'pro_max') {
      dailyTasks = 12; weeklyItems = 10; monthlyItems = 10; scenarioDepth = 'rất sâu, nhiều kịch bản và phương án dự phòng'
    }

    // Build full chat context from messages array
    const chatContext = Array.isArray(collectedInfo.messages)
      ? collectedInfo.messages
          .filter((m: any) => m && m.role === 'user')
          .map((m: any) => m.content || m.message)
          .join('\n')
          .slice(0, 5000)
      : (collectedInfo.chat_summary || '')

    // Build user profile summary from collected info
    const prompt = `Tạo một kế hoạch tài chính chi tiết và cá nhân hóa cho người dùng Việt Nam dựa trên thông tin sau:

THÔNG TIN CÁ NHÂN:
- Mục tiêu: ${goals}
- Tên kế hoạch: ${planName}
- Thu nhập: ${collectedInfo.income ? collectedInfo.income.toLocaleString() + ' VNĐ/tháng' : 'Chưa cung cấp'}
- Nghề nghiệp: ${collectedInfo.occupation || 'Chưa cung cấp'}
- Thời gian: ${collectedInfo.timeline || 'Chưa cung cấp'}
- Địa điểm: ${collectedInfo.location || 'Chưa cung cấp'}
- Sẵn sàng: ${collectedInfo.readiness || 'Chưa cung cấp'}
- Tuổi: ${collectedInfo.age || 'Chưa cung cấp'}
- Tiết kiệm hiện có: ${collectedInfo.savings ? collectedInfo.savings.toLocaleString() + ' VNĐ' : 'Chưa cung cấp'}

${chatContext ? `TOÀN BỘ CUỘC TRÒ CHUYỆN VỚI NGƯỜI DÙNG (để giữ bối cảnh và chi tiết):\n${chatContext}\n` : ''}

${spiritualInsights ? `PHÂN TÍCH TỬ VI/THẦN SỐ HỌC:
${spiritualInsights}

Hãy tích hợp những insights này vào kế hoạch tài chính.` : ''}

Yêu cầu tạo kế hoạch:
1. Sử dụng DỮ LIỆU CỤ THỂ từ thông tin trên
2. Cấu trúc rõ ràng: Tóm tắt, Phân tích, Lộ trình, Micro-tasks, Tài liệu học tập
3. Phù hợp với thị trường tài chính Việt Nam
4. Bao gồm lộ trình cụ thể theo tháng/quý/năm
5. Checklist hành động hàng ngày/tuần/tháng
6. Liên kết đến tài nguyên học tập thực tế
7. Tích hợp phân tích tử vi nếu có
8. Giới hạn theo gói (${tier}): số micro-tasks/ngày = ${dailyTasks}; checklist tuần = ${weeklyItems} mục; checklist tháng = ${monthlyItems} mục
9. Mức độ kịch bản/giải pháp: ${scenarioDepth}

QUAN TRỌNG: 
- Giới hạn tối đa ${maxWords} từ
- KHÔNG bao gồm số từ hoặc thống kê từ trong nội dung
- Hãy tạo một kế hoạch toàn diện, thực tế, CÁ NHÂN HÓA và có thể thực hiện được

YÊU CẦU BỔ SUNG DÀNH RIÊNG CHO GÓI FREE (nếu tier = "free"):
- BẮT BUỘC đủ 14 mục: Tiêu đề, Tóm tắt, SWOT, Phân tích mục tiêu, Phân tích yếu tố, Kỹ năng, Mindmap, Lộ trình, Đề xuất hành động, Checklist Tuần, Checklist Tháng, Kế hoạch tiết kiệm, Kế hoạch đầu tư, Tài liệu học tập (11+).
- Mindmap lộ trình: dùng Mermaid (mindmap) rõ ràng, root = mục tiêu cuối, branch = milestone quý/năm.
- Checklist Tuần: Bảng Markdown hợp lệ với cột | Tuần | Hành động cụ thể | Mục tiêu | Link học | và PHẢI có 12 hàng (Tuần 1 → Tuần 12). Hành động tuần phải bám sát hành động chia nhỏ từ checklist tháng.
- Checklist Tháng: Bảng Markdown hợp lệ với cột | Tháng | Hành động cụ thể | Mục tiêu | Link học | và PHẢI có 12 hàng (Tháng 1 → Tháng 12).
- Kế hoạch tiết kiệm: Bảng Markdown hợp lệ với cột | Tháng | Số tiền tiết kiệm | Đơn vị | Nguồn tiền | Công cụ |, đủ 12 hàng. "Đơn vị" = "tháng"; Số tiền = (Tổng mục tiêu VNĐ) ÷ 12.
- Kế hoạch đầu tư: Tối thiểu 3-5 hàng với cột | Hạng mục đầu tư | Số tiền/tháng | Mục đích | Rủi ro | Kỳ vọng lợi nhuận | (ví dụ: Đầu tư kiến thức, Quỹ trái phiếu, Kinh doanh).
- Tài liệu học tập: Ít nhất 11 tài liệu, bảng có cột | Tên tài liệu | Loại | Link | Ngôn ngữ | Mô tả chi tiết kiến thức & lợi ích |. Link phải dẫn thẳng tới khoá/video quốc tế uy tín (ưu tiên Coursera, Khan Academy, edX, Roadmap.sh, YouTube >50k views, LinkedIn Learning, Skillshare, Google Books, TED, HubSpot, Ahrefs).
- TUYỆT ĐỐI KHÔNG dùng "---", "...", "TBD", "N/A" trong bất kỳ ô nào. Mỗi ô phải có dữ liệu thực.`

    // Generate a cache key based on inputs
    const cacheKey = generateCacheKey([
      { role: 'system', content: 'Financial Plan Generation' },
      { role: 'user', content: JSON.stringify({ planName, goals, collectedInfo }) }
    ])

    // Check if we have a cached response
    const cachedResponse = await checkCache(cacheKey)
    if (cachedResponse) {
      logger.info('OPENAI_PLAN_CACHE_HIT', {})
      return cachedResponse
    }

    // This is a complex planning task, use GPT-4 Turbo for best quality
    try {
      logger.info('OPENAI_PLAN_CALL_OPENAI', {})
      const model = selectModel(TaskType.COMPLEX_PLANNING)

      // Import FINANCIAL_PLAN system prompt
      const { getFinancialPlanSystemPrompt } = await import('./prompts')

      const messages = [
        {
          role: 'system' as const,
          content: getFinancialPlanSystemPrompt()
        },
        {
          role: 'user' as const,
          content: prompt
        }
      ]

      // For large responses, we'll use chunking to handle the response better
      const client = getOpenAI()
      if (!client) {
        throw new Error('OpenAI client not initialized')
      }

      const completion = await raceWithAbort(
        client.chat.completions.create({
          model,
          messages,
          max_tokens: maxTokensForTier,
          temperature: temperatureForTier
        }),
        signal
      )

      const response = completion.choices[0]?.message?.content || 'Không thể tạo kế hoạch lúc này. Vui lòng thử lại.'

      // Save response to cache
      await saveToCache(cacheKey, response)
      logger.info('OPENAI_PLAN_OPENAI_DONE', {})
      return response

    } catch (gptError) {
      logger.error('OPENAI_PLAN_OPENAI_ERROR', { error: String(gptError) })
      throw gptError
    }
  } catch (error) {
    logger.error('OPENAI_PLAN_UNHANDLED', { error: String(error) })
    throw (error instanceof Error ? error : new Error(String(error)))
  }
}

export const analyzeUserInput = async (input: string): Promise<{
  intent: string
  extractedInfo: any
  suggestedQuestions: string[]
}> => {
  try {
    // Generate cache key for this analysis
    const cacheKey = generateCacheKey([
      { role: 'system', content: 'User Input Analysis' },
      { role: 'user', content: input }
    ])
    
    // Check if we have a cached response
    const cachedResponse = await checkCache(cacheKey)
    if (cachedResponse) {
      try {
        return JSON.parse(cachedResponse)
      } catch {
        // If cached response can't be parsed, continue with new request
      }
    }
    
    // This is a simple analysis, use the default chat model
    const model = selectModel(TaskType.REGULAR_CHAT)
    
    const messages = [
      {
        role: 'system' as const,
        content: getUserInputAnalysisSystemPrompt()
      },
      {
        role: 'user' as const,
        content: input
      }
    ]
    
    const client = getOpenAI()
    if (!client) {
      throw new Error('OpenAI client not initialized')
    }
    
    const completion = await client.chat.completions.create({
      model,
      messages,
      max_tokens: 300,
      temperature: 0.1,
    })

    const response = completion.choices[0]?.message?.content
    try {
      const parsedResponse = JSON.parse(response || '{}')
      
      // Save response to cache
      await saveToCache(cacheKey, response || '{}')
      
      return parsedResponse
    } catch {
      return {
        intent: 'khác',
        extractedInfo: {},
        suggestedQuestions: []
      }
    }
  } catch (error) {
    logger.error('OPENAI_ANALYSIS_ERROR', { error: String(error) })
    return {
      intent: 'khác',
      extractedInfo: {},
      suggestedQuestions: []
    }
  }
}
