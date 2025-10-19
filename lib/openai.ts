import OpenAI from 'openai'
import { selectModel, TaskType, generateCacheKey, checkCache, saveToCache, chunkText } from './modelSelection'
import { getChatSystemPrompt, getFinancialPlanSystemPrompt, getUserInputAnalysisSystemPrompt } from './prompts'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
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

export const generateChatResponse = async (messages: ChatMessage[]): Promise<string> => {
  try {
    console.log('=== OPENAI: Bắt đầu tạo phản hồi chat ===');
    const systemMessage = {
      role: 'system' as const,
      content: getChatSystemPrompt()
    }
    
    const fullMessages = [systemMessage, ...messages]
    
    // Generate cache key for this conversation
    const cacheKey = generateCacheKey(fullMessages)
    
    // Check if we have a cached response
    console.log('=== OPENAI: Kiểm tra cache ===');
    const cachedResponse = await checkCache(cacheKey)
    if (cachedResponse) {
      console.log('=== OPENAI: Sử dụng phản hồi từ cache ===');
      return cachedResponse
    }
    
    // Kiểm tra API key OpenAI
    if (!process.env.OPENAI_API_KEY) {
      console.error('=== OPENAI: Thiếu API key ===');
      throw new Error('OpenAI API key không được cấu hình')
    }
    
    console.log('=== OPENAI: Thử gọi OpenAI API ===');
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
        max_tokens: 500,
        temperature: 0.7,
      })

      const response = completion.choices[0]?.message?.content || 'Xin lỗi, tôi không thể trả lời lúc này. Vui lòng thử lại.'
      
      // Save response to cache
      console.log('=== OPENAI: Lưu phản hồi vào cache ===');
      await saveToCache(cacheKey, response)
      
      return response
    } catch (openaiError) {
      console.error('=== OPENAI: Lỗi khi gọi OpenAI, thử fallback sang Claude ===', openaiError);
      
      // Fallback to Claude
      try {
        console.log('=== OPENAI: Đang gọi Claude fallback ===');
        const { generateClaudeResponse, CLAUDE_MODELS } = await import('./claude')
        
        // Kiểm tra API key Anthropic
        if (!process.env.ANTHROPIC_API_KEY) {
          console.error('=== OPENAI: Thiếu Anthropic API key cho fallback ===');
          throw new Error('Anthropic API key không được cấu hình')
        }
        
        const claudeResponse = await generateClaudeResponse(
          fullMessages,
          CLAUDE_MODELS.DEFAULT,
          500,
          0.7
        )
        
        // Save Claude response to cache
        console.log('=== OPENAI: Lưu phản hồi Claude vào cache ===');
        await saveToCache(cacheKey, claudeResponse)
        
        return claudeResponse
      } catch (claudeError) {
        console.error('=== OPENAI: Lỗi khi gọi Claude fallback ===', claudeError);
        throw new Error('Không thể kết nối với cả OpenAI và Claude')
      }
    }
  } catch (error) {
    console.error('=== OPENAI: Lỗi không xử lý được ===', error);
    return 'Ui, có lỗi xảy ra khi kết nối với AI. Bạn vui lòng thử lại sau ít phút nữa nhé.'
  }
}

export const generateFinancialPlan = async (userProfile: any): Promise<string> => {
  try {
    // Generate spiritual insights if profile has birth date
    let spiritualInsights = ''
    if (userProfile.birth_date && userProfile.full_name) {
      const { generateSpiritualProfile, getSpiritualFinancialInsights } = await import('./spiritual')
      const spiritualProfile = generateSpiritualProfile(userProfile.birth_date, userProfile.full_name)
      spiritualInsights = getSpiritualFinancialInsights(spiritualProfile)
    }

    // Determine word limit based on subscription
    const maxWords = userProfile.maxWords || 5000
    let wordRange = '5,000-8,000 từ'
    
    if (maxWords <= 1000) {
      wordRange = '800-1,000 từ (Gói Free)'
    } else if (maxWords <= 6500) {
      wordRange = '5,000-8,000 từ (Gói Basic)'
    } else if (maxWords <= 10500) {
      wordRange = '9,000-12,000 từ (Gói Pro)'
    } else if (maxWords <= 17500) {
      wordRange = '15,000-20,000 từ (Gói Pro Max)'
    }

    const prompt = `Tạo một kế hoạch tài chính chi tiết cho người dùng Việt Nam với thông tin sau:

Thông tin cá nhân:
- Họ tên: ${userProfile.full_name}
- Tuổi: ${userProfile.age}
- Nghề nghiệp: ${userProfile.occupation}
- Thu nhập: ${userProfile.current_income?.toLocaleString()} VNĐ/tháng
- Mục tiêu: ${userProfile.financial_goal}
- Thời gian: ${userProfile.timeline}
- Mức độ rủi ro: ${userProfile.risk_tolerance}

${spiritualInsights ? `Phân tích tâm linh và số học:
${spiritualInsights}

Hãy tích hợp những insights này vào kế hoạch tài chính.` : ''}

Yêu cầu tạo kế hoạch:
1. Độ dài: ${wordRange}
2. Cấu trúc rõ ràng với các phần: Tóm tắt, Phân tích, Lộ trình, Micro-tasks, Tài liệu học tập
3. Phù hợp với thị trường tài chính Việt Nam
4. Bao gồm lộ trình cụ thể theo tháng/quý/năm
5. Checklist hành động hàng ngày/tuần/tháng
6. Liên kết đến tài nguyên học tập thực tế
7. Tích hợp phân tích tâm linh nếu có

QUAN TRỌNG: Giới hạn tối đa ${maxWords} từ. Hãy tạo một kế hoạch toàn diện, thực tế và có thể thực hiện được trong giới hạn này.`

    // Generate a cache key based on user profile and prompt
    const cacheKey = generateCacheKey([
      { role: 'system', content: 'Financial Plan Generation' },
      { role: 'user', content: JSON.stringify(userProfile) }
    ])
    
    // Check if we have a cached response
    const cachedResponse = await checkCache(cacheKey)
    if (cachedResponse) {
      console.log('Using cached financial plan')
      return cachedResponse
    }

    // This is a complex planning task, prioritize GPT-4o-mini for better cost-efficiency
    try {
      console.log('=== FINANCIAL PLAN: Trying GPT-4o-mini first ===');
      const model = selectModel(TaskType.COMPLEX_PLANNING)
    
      const messages = [
        {
          role: 'system' as const,
          content: 'Bạn là chuyên gia tài chính hàng đầu Việt Nam, chuyên tạo kế hoạch tài chính cá nhân hóa chi tiết.'
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
      
      const completion = await client.chat.completions.create({
        model,
        messages,
        max_tokens: 4000,
        temperature: 0.3,
      })

      const response = completion.choices[0]?.message?.content || 'Không thể tạo kế hoạch lúc này. Vui lòng thử lại.'
      
      // Save response to cache
      await saveToCache(cacheKey, response)
      console.log('=== FINANCIAL PLAN: GPT-4o-mini completed successfully ===');
      return response
      
    } catch (gptError) {
      console.error('=== FINANCIAL PLAN: GPT-4o-mini failed, falling back to Claude-3.5-Sonnet ===', gptError);
      
      // Fallback to Claude-3.5-Sonnet
      try {
        console.log('=== FINANCIAL PLAN: Trying Claude-3.5-Sonnet ===');
        const { generateFinancialPlanWithClaude } = await import('./claude')
        
        if (!process.env.ANTHROPIC_API_KEY) {
          throw new Error('Anthropic API key not configured')
        }
        
        const claudeResponse = await generateFinancialPlanWithClaude(
          `Bạn là chuyên gia tài chính hàng đầu Việt Nam, chuyên tạo kế hoạch tài chính cá nhân hóa chi tiết.

Yêu cầu tạo kế hoạch:
1. Độ dài: ${wordRange}
2. Cấu trúc rõ ràng với các phần: Tóm tắt, Phân tích, Lộ trình, Micro-tasks, Tài liệu học tập
3. Phù hợp với thị trường tài chính Việt Nam
4. Bao gồm lộ trình cụ thể theo tháng/quý/năm
5. Checklist hành động hàng ngày/tuần/tháng
6. Liên kết đến tài nguyên học tập thực tế
7. Tích hợp phân tích tâm linh nếu có

QUAN TRỌNG: Giới hạn tối đa ${maxWords} từ. Hãy tạo một kế hoạch toàn diện, thực tế và có thể thực hiện được trong giới hạn này.

${spiritualInsights ? `Phân tích tâm linh và số học:
${spiritualInsights}

Hãy tích hợp những insights này vào kế hoạch tài chính.` : ''}`,
          `Tạo kế hoạch tài chính cho: ${userProfile.full_name}

Thông tin cá nhân:
- Tuổi: ${userProfile.age}
- Nghề nghiệp: ${userProfile.occupation}
- Thu nhập: ${userProfile.current_income?.toLocaleString()} VNĐ/tháng
- Mục tiêu: ${userProfile.financial_goal}
- Thời gian: ${userProfile.timeline}
- Mức độ rủi ro: ${userProfile.risk_tolerance}
- Tiết kiệm hiện có: ${userProfile.savings || 'Chưa có thông tin'}`,
          maxWords > 5000 ? 4000 : 3000,
          0.3
        )
        
        // Save Claude response to cache
        await saveToCache(cacheKey, claudeResponse)
        console.log('=== FINANCIAL PLAN: Claude-3.5-Sonnet completed successfully ===');
        return claudeResponse
        
      } catch (claudeError) {
        console.error('=== FINANCIAL PLAN: Claude fallback also failed ===', claudeError);
        throw new Error('Không thể tạo kế hoạch với cả GPT-4o-mini và Claude')
      }
    }
  } catch (error) {
    console.error('Financial Plan Generation Error:', error)
    return 'Có lỗi xảy ra khi tạo kế hoạch. Vui lòng thử lại sau.'
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
    console.error('OpenAI Analysis Error:', error)
    return {
      intent: 'khác',
      extractedInfo: {},
      suggestedQuestions: []
    }
  }
}
