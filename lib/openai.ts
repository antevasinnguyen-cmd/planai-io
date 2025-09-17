import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export const generateChatResponse = async (messages: ChatMessage[]): Promise<string> => {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Bạn là PlanAI - trợ lý AI chuyên về tài chính cá nhân cho người Việt Nam. 

Nhiệm vụ của bạn:
1. Thu thập thông tin tài chính cá nhân từ người dùng một cách tự nhiên
2. Đưa ra lời khuyên tài chính phù hợp với văn hóa và thị trường Việt Nam
3. Hướng dẫn người dùng về đầu tư, tiết kiệm, và lập kế hoạch tài chính
4. Sử dụng tiếng Việt thân thiện, dễ hiểu

Thông tin cần thu thập:
- Mục tiêu tài chính cụ thể
- Thu nhập hiện tại và nguồn thu
- Chi tiêu hàng tháng
- Khoản tiết kiệm hiện có
- Kinh nghiệm đầu tư
- Thời gian thực hiện mục tiêu
- Mức độ chấp nhận rủi ro
- Tình hình gia đình và công việc

Hãy trả lời ngắn gọn (2-3 câu), thân thiện và hỏi từng thông tin một cách tự nhiên.`
        },
        ...messages
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    return completion.choices[0]?.message?.content || 'Xin lỗi, tôi không thể trả lời lúc này. Vui lòng thử lại.'
  } catch (error) {
    console.error('OpenAI API Error:', error)
    return 'Có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại sau.'
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

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Bạn là chuyên gia tài chính hàng đầu Việt Nam, chuyên tạo kế hoạch tài chính cá nhân hóa chi tiết.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.3,
    })

    return completion.choices[0]?.message?.content || 'Không thể tạo kế hoạch lúc này. Vui lòng thử lại.'
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
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Phân tích input của người dùng về tài chính và trả về JSON với:
{
  "intent": "thông tin cá nhân" | "mục tiêu tài chính" | "tình hình hiện tại" | "câu hỏi" | "khác",
  "extractedInfo": {
    "income": số_thu_nhập_nếu_có,
    "goal": "mục_tiêu_nếu_có",
    "timeline": "thời_gian_nếu_có",
    "age": số_tuổi_nếu_có,
    "occupation": "nghề_nghiệp_nếu_có"
  },
  "suggestedQuestions": ["câu hỏi tiếp theo 1", "câu hỏi 2", "câu hỏi 3"]
}`
        },
        {
          role: 'user',
          content: input
        }
      ],
      max_tokens: 300,
      temperature: 0.1,
    })

    const response = completion.choices[0]?.message?.content
    try {
      return JSON.parse(response || '{}')
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
