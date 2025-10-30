import OpenAI from 'openai'
import { getCachedResponse, saveCachedResponse } from './supabase'

// Initialize OpenAI client (lazy initialization to handle missing API key during build)
let openai: OpenAI | null = null

const getOpenAI = () => {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openai
}

// Model configuration
export const MODELS = {
  CHAT_DEFAULT: 'gpt-4o-mini',  // Upgraded from gpt-3.5-turbo for better quality
  COMPLEX_PLANNING: 'gpt-4o-mini',
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
  // Pure OpenAI only, no external fallback per product requirement
  const client = getOpenAI()
  if (!client) {
    console.error('OpenAI client not initialized')
    return 'Hệ thống AI đang bận. Vui lòng thử lại sau.'
  }
  try {
    const completion = await client.chat.completions.create({
      model: MODELS.CHAT_DEFAULT,
      messages,
      max_tokens: maxTokens,
      temperature,
    })
    return completion.choices[0]?.message?.content || ''
  } catch (error) {
    console.error('OpenAI API Error:', error)
    return 'Hệ thống AI đang bận. Vui lòng thử lại sau.'
  }
}
