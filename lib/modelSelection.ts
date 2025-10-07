import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { generateClaudeResponse, CLAUDE_MODELS } from './claude'

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

// Initialize Supabase client for caching
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Model configuration
export const MODELS = {
  CHAT_DEFAULT: 'gpt-4o-mini', // For regular chat (70% cost savings)
  COMPLEX_PLANNING: 'gpt-4o', // For complex planning tasks
  FALLBACK: 'claude-3-5-haiku', // Cheaper fallback option
}

// Task types
export enum TaskType {
  REGULAR_CHAT = 'regular_chat',
  COMPLEX_PLANNING = 'complex_planning',
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
    const { data, error } = await supabase
      .from('ai_response_cache')
      .select('response')
      .eq('cache_key', cacheKey)
      .single()
    
    if (error || !data) {
      return null
    }
    
    return data.response
  } catch (error) {
    console.error('Cache check error:', error)
    return null
  }
}

// Function to save response to cache
export const saveToCache = async (cacheKey: string, response: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('ai_response_cache')
      .insert([
        {
          cache_key: cacheKey,
          response,
          created_at: new Date().toISOString(),
        }
      ])
    
    if (error) {
      console.error('Cache save error:', error)
    }
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
  const client = getOpenAI()
  
  try {
    // First try with OpenAI if available
    if (client) {
      const completion = await client.chat.completions.create({
        model: MODELS.CHAT_DEFAULT,
        messages,
        max_tokens: maxTokens,
        temperature,
      })
      
      return completion.choices[0]?.message?.content || ''
    } else {
      throw new Error('OpenAI client not initialized')
    }
  } catch (error) {
    console.error('OpenAI API Error, falling back to Claude:', error)
    
    try {
      // Fall back to Claude
      return await generateClaudeResponse(
        messages,
        CLAUDE_MODELS.DEFAULT,
        maxTokens,
        temperature
      )
    } catch (claudeError) {
      console.error('Claude API Error after fallback:', claudeError)
      return 'Có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại sau.'
    }
  }
}
