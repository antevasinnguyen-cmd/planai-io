import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { getCachedResponse, saveCachedResponse } from './supabase'

// Initialize OpenAI client (lazy initialization to handle missing API key during build)
let openai: OpenAI | null = null
let anthropic: Anthropic | null = null

export const getOpenAI = () => {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openai
}

export const getAnthropic = () => {
  if (!anthropic && process.env.ANTHROPIC_API_KEY) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return anthropic
}

// Model configuration
export const MODELS = {
  CHAT_DEFAULT: 'gpt-4-turbo',  // Upgraded to GPT-4 Turbo for better Vietnamese support
  COMPLEX_PLANNING: 'gpt-4-turbo',
  CHAT_FALLBACK: 'claude-3-opus-20240229',  // Claude 3 Opus as fallback
  EMBEDDING: 'text-embedding-3-small'
}

// Task types
export enum TaskType {
  REGULAR_CHAT = 'regular_chat',
  COMPLEX_PLANNING = 'complex_planning'
}

// Function to determine the appropriate model based on task complexity
export const selectModel = (taskType: TaskType): string => {
  switch (taskType) {
    case TaskType.COMPLEX_PLANNING:
      return MODELS.COMPLEX_PLANNING
    case TaskType.REGULAR_CHAT:
    default:
      return MODELS.CHAT_DEFAULT
  }
}

// Function to generate a cache key from messages
export const generateCacheKey = (messages: any[]): string => {
  // Create a deterministic string from the messages
  // We only use the last few messages to avoid overly specific cache keys
  const relevantMessages = messages.slice(-3) // Last 3 messages
  
  // Create a string representation of the messages
  const messagesString = relevantMessages
    .map(msg => `${msg.role}:${msg.content.substring(0, 100)}`)
    .join('|')
  
  // Create a hash of the string
  return Buffer.from(messagesString).toString('base64')
}

// Function to check cache for existing response
export const checkCache = async (cacheKey: string): Promise<string | null> => {
  try {
    const { data } = await getCachedResponse(cacheKey)
    return data || null
  } catch (error) {
    console.error('Cache check error:', error)
    return null
  }
}

// Function to save response to cache
export const saveToCache = async (cacheKey: string, response: string): Promise<void> => {
  try {
    await saveCachedResponse(cacheKey, response)
  } catch (error) {
    console.error('Cache save error:', error)
  }
}

// Function to chunk text for RAG
export const chunkText = (text: string, maxChunkSize: number = 1000): string[] => {
  const chunks: string[] = []
  
  // Simple chunking by splitting on paragraphs and then combining until we reach max size
  const paragraphs = text.split('\n\n')
  let currentChunk = ''
  
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChunkSize) {
      chunks.push(currentChunk)
      currentChunk = paragraph
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk)
  }
  
  return chunks
}

// Function to generate embeddings for text chunks
export const generateEmbeddings = async (text: string): Promise<number[]> => {
  const client = getOpenAI()
  if (!client) {
    console.error('OpenAI client not initialized')
    return []
  }
  
  try {
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })
    
    return response.data[0].embedding
  } catch (error) {
    console.error('Embedding generation error:', error)
    return []
  }
}

// Function to handle fallback to Claude if OpenAI fails
export const fallbackToClaudeIfNeeded = async (
  messages: any[],
  maxTokens: number = 500,
  temperature: number = 0.7
): Promise<string> => {
  const openaiClient = getOpenAI()
  
  // Try GPT-4 Turbo first
  if (openaiClient) {
    try {
      console.log('🔵 Trying GPT-4 Turbo...')
      const completion = await openaiClient.chat.completions.create({
        model: MODELS.CHAT_DEFAULT,
        messages,
        max_tokens: maxTokens,
        temperature,
      })
      console.log('✅ GPT-4 Turbo succeeded')
      return completion.choices[0]?.message?.content || ''
    } catch (error) {
      console.error('❌ GPT-4 Turbo failed:', error)
    }
  }
  
  // Fallback to Claude 3 Opus
  const claudeClient = getAnthropic()
  if (claudeClient) {
    try {
      console.log('🟣 Fallback to Claude 3 Opus...')
      const systemMessage = messages.find(m => m.role === 'system')?.content || ''
      const userMessages = messages.filter(m => m.role !== 'system')
      
      const completion = await claudeClient.messages.create({
        model: MODELS.CHAT_FALLBACK,
        max_tokens: maxTokens,
        system: systemMessage,
        messages: userMessages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        }))
      })
      console.log('✅ Claude 3 Opus succeeded')
      return completion.content[0]?.type === 'text' ? completion.content[0].text : ''
    } catch (error) {
      console.error('❌ Claude 3 Opus failed:', error)
    }
  }
  
  console.error('⚠️ Both GPT-4 Turbo and Claude 3 Opus failed')
  return 'Hệ thống AI đang bận. Vui lòng thử lại sau.'
}
