/**
 * Response Cleaner & Formatter
 * Cleans and formats AI responses for better display
 */

export interface CleanedResponse {
  content: string
  hasMarkdown: boolean
  wordCount: number
}

/**
 * Clean and format AI response
 * - Remove unwanted characters like ** at end of lines
 * - Ensure proper markdown formatting
 * - Add structure if missing
 */
export const cleanAIResponse = (rawResponse: string): CleanedResponse => {
  let cleaned = rawResponse.trim()
  
  // Fix common markdown issues
  cleaned = cleaned.replace(/\*\*$/gm, '') // Remove trailing **
  cleaned = cleaned.replace(/\*\*\s*\n/g, '**\n\n') // Fix ** spacing
  cleaned = cleaned.replace(/\*\*\s+/g, '** ') // Fix ** spacing
  cleaned = cleaned.replace(/\s+\*\*/g, ' **') // Fix ** spacing
  
  // Ensure proper spacing around bullet points
  cleaned = cleaned.replace(/•\s*/g, '• ') // Normalize bullet points
  cleaned = cleaned.replace(/\n•/g, '\n\n•') // Add spacing before bullets
  
  // Fix emoji spacing
  cleaned = cleaned.replace(/🎯/g, '\n\n🎯 ') // Proper emoji spacing
  
  // Ensure proper paragraph breaks
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
  cleaned = cleaned.replace(/([.!?])\n([A-Z])/g, '$1\n\n$2') // Add paragraph breaks
  
  // Add structure if response is too short
  const wordCount = cleaned.split(/\s+/).length
  if (wordCount < 100) {
    cleaned = `**Tôi hiểu câu hỏi của bạn.**\n\n${cleaned}\n\n*Để tư vấn chi tiết hơn, bạn có thể chia sẻ thêm về tình hình tài chính hiện tại của mình.*`
  }
  
  // Check if has markdown formatting
  const hasMarkdown = /\*\*|__|_|\*|`|#{1,6}|\[.*\]\(.*\)|^\s*[-*+]\s|^\s*\d+\.\s/m.test(cleaned)
  
  return {
    content: cleaned,
    hasMarkdown,
    wordCount
  }
}

/**
 * Enhance response with better formatting if needed
 */
export const enhanceResponseFormatting = (response: string): string => {
  // If no markdown, add basic formatting
  if (!/\*\*|__|_|\*|`/.test(response)) {
    // Bold important financial terms
    let enhanced = response
      .replace(/\b(tiền|tiết kiệm|đầu tư|thu nhập|chi phí|lợi nhuận|rủi ro|kế hoạch|mục tiêu)\b/gi, '**$1**')
      .replace(/\b(\d+%|\d+\s*(triệu|tỷ|năm|tháng|ngày))\b/g, '**$1**')
    
    return enhanced
  }
  
  return response
}

/**
 * Validate response quality
 */
export const validateResponseQuality = (response: string): {
  isValid: boolean
  issues: string[]
  suggestions: string[]
} => {
  const issues: string[] = []
  const suggestions: string[] = []
  
  // Check length
  const wordCount = response.split(/\s+/).length
  if (wordCount < 50) {
    issues.push('Response too short')
    suggestions.push('Provide more detailed explanation')
  }
  
  // Check for unwanted characters
  if (response.includes('**') && response.match(/\*\*$/gm)) {
    issues.push('Trailing ** characters')
    suggestions.push('Clean up markdown formatting')
  }
  
  // Check for structure
  if (!response.includes('\n\n') && wordCount > 100) {
    issues.push('No paragraph structure')
    suggestions.push('Add paragraph breaks for readability')
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  }
}
