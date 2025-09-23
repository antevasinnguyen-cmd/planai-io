import Anthropic from '@anthropic-ai/sdk'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

// Claude models
export const CLAUDE_MODELS = {
  DEFAULT: 'claude-3-5-haiku-20240307',
  SONNET: 'claude-3-5-sonnet-20240620',
}

// Function to generate a response from Claude
export const generateClaudeResponse = async (
  messages: Array<{ role: string; content: string }>,
  model: string = CLAUDE_MODELS.DEFAULT,
  maxTokens: number = 1024,
  temperature: number = 0.7
): Promise<string> => {
  try {
    // Convert OpenAI message format to Claude format
    const claudeMessages = messages.map(msg => {
      // Claude uses 'user' and 'assistant' roles
      const role = msg.role === 'system' ? 'user' : msg.role
      return { role, content: msg.content }
    })

    // If the first message is a system message, we need to handle it differently
    // Claude doesn't have a system role, so we'll use a special format
    if (messages[0]?.role === 'system') {
      const systemContent = messages[0].content
      
      // If there's a user message after the system message, prepend the system content
      if (messages[1]?.role === 'user') {
        claudeMessages[1].content = `<instructions>${systemContent}</instructions>\n\n${messages[1].content}`
      }
      
      // Remove the system message
      claudeMessages.shift()
    }

    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      messages: claudeMessages as any,
    })

    // Handle different content block types
    if (response.content[0].type === 'text') {
      return response.content[0].text
    }
    return 'Không nhận được phản hồi từ AI.'
  } catch (error) {
    console.error('Claude API Error:', error)
    return 'Có lỗi xảy ra khi kết nối với Claude AI. Vui lòng thử lại sau.'
  }
}

// Function to generate a financial plan using Claude
export const generateFinancialPlanWithClaude = async (
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 4000,
  temperature: number = 0.3
): Promise<string> => {
  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODELS.SONNET, // Use Sonnet for complex planning
      max_tokens: maxTokens,
      temperature,
      messages: [
        {
          role: 'user',
          content: `<instructions>${systemPrompt}</instructions>\n\n${userPrompt}`,
        },
      ],
    })

    // Handle different content block types
    if (response.content[0].type === 'text') {
      return response.content[0].text
    }
    return 'Không nhận được phản hồi từ AI.'
  } catch (error) {
    console.error('Claude Financial Plan Generation Error:', error)
    return 'Có lỗi xảy ra khi tạo kế hoạch với Claude. Vui lòng thử lại sau.'
  }
}

// Function to analyze user input using Claude
export const analyzeUserInputWithClaude = async (
  input: string
): Promise<{
  intent: string
  extractedInfo: any
  suggestedQuestions: string[]
}> => {
  try {
    const systemPrompt = `Phân tích input của người dùng về tài chính và trả về JSON với:
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

    const response = await anthropic.messages.create({
      model: CLAUDE_MODELS.DEFAULT,
      max_tokens: 300,
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: `<instructions>${systemPrompt}</instructions>\n\n${input}`,
        },
      ],
    })

    try {
      // Handle different content block types
      const responseText = response.content[0].type === 'text' ? response.content[0].text : '{}'
      return JSON.parse(responseText)
    } catch {
      return {
        intent: 'khác',
        extractedInfo: {},
        suggestedQuestions: []
      }
    }
  } catch (error) {
    console.error('Claude Analysis Error:', error)
    return {
      intent: 'khác',
      extractedInfo: {},
      suggestedQuestions: []
    }
  }
}
