import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { getOpenAI, getAnthropic } from './modelSelection'
import { processChatMessage } from './mathFormatter'

/**
 * Generate streaming chat response using GPT-4o mini
 * Streams tokens as they arrive for real-time display
 */
export async function generateStreamingChatResponse(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  onChunk: (chunk: string) => void
): Promise<string> {
  const client = getOpenAI()
  if (!client) {
    throw new Error('OpenAI client not initialized')
  }

  let fullResponse = ''

  try {
    const stream = await client.chat.completions.create({
      model: 'gpt-4o-mini', // Use GPT-4o mini for chat (cost-effective)
      messages,
      temperature: 0.7,
      max_tokens: 2000,
      stream: true
    })

    for await (const event of stream) {
      const chunk = event.choices[0]?.delta?.content || ''
      if (chunk) {
        fullResponse += chunk
        // Process math expressions before sending to client
        const processedChunk = processChatMessage(chunk)
        onChunk(processedChunk) // Send processed chunk to client immediately
      }
    }

    return fullResponse
  } catch (error) {
    // Fallback to Claude 3 Opus if GPT-4o mini fails
    console.error('❌ GPT-4o mini streaming failed:', error)
    return await fallbackToClaudeStreaming(messages, onChunk)
  }
}

/**
 * Fallback streaming to Claude 3 Opus
 */
async function fallbackToClaudeStreaming(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  onChunk: (chunk: string) => void
): Promise<string> {
  const client = getAnthropic()
  if (!client) {
    throw new Error('Claude client not initialized')
  }

  let fullResponse = ''
  const systemMessage = messages.find(m => m.role === 'system')?.content || ''
  const userMessages = messages.filter(m => m.role !== 'system')

  try {
    const stream = await client.messages.stream({
      model: 'claude-3-opus-20240229',
      max_tokens: 2000,
      system: systemMessage,
      messages: userMessages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }))
    })

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        const text = chunk.delta.text
        fullResponse += text
        // Process math expressions before sending to client
        const processedText = processChatMessage(text)
        onChunk(processedText) // Send processed chunk to client immediately
      }
    }

    return fullResponse
  } catch (error) {
    console.error('❌ Claude streaming also failed:', error)
    throw error
  }
}
