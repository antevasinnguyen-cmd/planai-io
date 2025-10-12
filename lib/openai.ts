import OpenAI from 'openai'
import { selectModel, TaskType, generateCacheKey, checkCache, saveToCache, chunkText } from './modelSelection'

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
      content: `Bạn là PlanAI - trợ lý AI tài chính cá nhân cho người Việt (độ tuổi mục tiêu 23-35, ngôn ngữ thân thiện, ngắn gọn, dễ hiểu).

Mục tiêu:
- Hướng dẫn người dùng cung cấp thông tin theo từng bước trong khung chat để tạo kế hoạch tài chính cá nhân hóa chính xác.

Cách tương tác:
- Trả lời ngắn gọn (tối đa 2-3 câu), rõ ràng, tránh liệt kê quá dài.
- Mỗi lượt chỉ hỏi 1-2 thông tin còn thiếu; nếu người dùng đưa nhiều thông tin, hãy xác nhận lại ngắn gọn.
- Nếu thông tin chưa đủ, gợi ý câu hỏi tiếp theo và nhắc người dùng có thể nhấn nút "Plan" để tạo bản kế hoạch sơ bộ khi đã đủ tối thiểu.

Thông tin cần thu thập (ưu tiên theo thứ tự):
1) Mục tiêu tài chính: loại mục tiêu (mua nhà/xe, kinh doanh, tiết kiệm, đầu tư...), số tiền mục tiêu
2) Thu nhập hiện tại (VNĐ/tháng) và nguồn thu
3) Kỹ năng/nghề nghiệp hiện tại
4) Ngày sinh dd/mm/yyyy (để phân tích tử vi/thần số học). Nếu không muốn chia sẻ, hãy tôn trọng và bỏ qua
5) Thời gian mục tiêu (6 tháng/1 năm/3 năm/5 năm...)
6) Tiết kiệm hiện có (nếu có)
7) Khu vực sinh sống (Hà Nội/TP.HCM/tỉnh khác)
8) Mức độ sẵn sàng học hỏi/đầu tư thời gian (thấp/vừa/cao)

Quy tắc phản hồi:
- Luôn xác nhận lại thông tin người dùng vừa cung cấp theo dạng tóm tắt 1 câu.
- Nếu thiếu trường quan trọng, ưu tiên hỏi các trường ở trên theo thứ tự.
- Khi đã có: mục tiêu, thu nhập, nghề/kỹ năng, ngày sinh (nếu được), thời gian; thì gợi ý tạo kế hoạch sơ bộ.
- Tông giọng tích cực: "Đừng lo, tôi sẽ hướng dẫn từng bước!"`
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

    // This is a complex planning task, so use the appropriate model
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
    
    return response
  } catch (error) {
    console.error('OpenAI Plan Generation Error:', error)
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
        content: `Phân tích input của người dùng (tiếng Việt) về tài chính và TRẢ VỀ DUY NHẤT MỘT JSON hợp lệ theo cấu trúc sau, không thêm mô tả hay văn bản khác:
{
  "intent": "thông tin cá nhân" | "mục tiêu tài chính" | "tình hình hiện tại" | "câu hỏi" | "khác",
  "extractedInfo": {
    "goal": string | null,
    "income": number | null, // VNĐ/tháng
    "timeline": string | null,
    "age": number | null,
    "occupation": string | null,
    "skills": string[] | null,
    "birth_date": string | null, // dd/mm/yyyy
    "location": string | null, // Hà Nội/TP.HCM/khác
    "savings": number | null,
    "readiness": string | null // mức độ sẵn sàng học hỏi/đầu tư thời gian
  },
  "suggestedQuestions": ["câu hỏi ngắn gọn 1", "câu hỏi 2", "câu hỏi 3"]
}

Yêu cầu:
- Nếu không chắc, đặt trường là null.
- Hỏi tiếp tối đa 3 câu, tập trung vào các trường còn thiếu theo thứ tự ưu tiên: goal, income, occupation/skills, birth_date, timeline, savings, location, readiness.
- Câu hỏi ngắn gọn, lịch sự, phù hợp người Việt 23-35.`
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
