import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

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

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Function to chunk text into smaller pieces
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
export const generateEmbedding = async (text: string): Promise<number[]> => {
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

// Function to store chunks and embeddings in Supabase
export const storeChunksWithEmbeddings = async (
  userId: string,
  documentId: string,
  chunks: string[]
): Promise<void> => {
  try {
    // First delete any existing chunks for this document
    await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId)
    
    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const embedding = await generateEmbedding(chunk)
      
      // Store chunk and embedding
      await supabase
        .from('document_chunks')
        .insert([
          {
            user_id: userId,
            document_id: documentId,
            chunk_index: i,
            content: chunk,
            embedding,
            created_at: new Date().toISOString()
          }
        ])
    }
  } catch (error) {
    console.error('Error storing chunks with embeddings:', error)
  }
}

// Function to retrieve relevant chunks based on a query
export const retrieveRelevantChunks = async (
  userId: string,
  query: string,
  limit: number = 5
): Promise<string[]> => {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query)
    
    // Search for similar chunks using vector similarity
    const { data, error } = await supabase.rpc(
      'match_document_chunks',
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: limit,
        user_id_input: userId
      }
    )
    
    if (error) {
      console.error('Error retrieving relevant chunks:', error)
      return []
    }
    
    // Return the content of the matched chunks
    return data.map((item: any) => item.content)
  } catch (error) {
    console.error('Error in retrieveRelevantChunks:', error)
    return []
  }
}

// Function to process a financial plan with RAG
export const processFinancialPlanWithRAG = async (
  userId: string,
  planId: string,
  planContent: string
): Promise<void> => {
  try {
    console.log(`Processing plan ${planId} with RAG for user ${userId}`)
    
    // Chunk the plan content
    const chunks = chunkText(planContent)
    console.log(`Created ${chunks.length} chunks from plan content`)
    
    // Store chunks with embeddings
    await storeChunksWithEmbeddings(userId, `plan_${planId}`, chunks)
    console.log(`Successfully stored chunks with embeddings for plan ${planId}`)
    
    // Update plan metadata to indicate RAG processing is complete
    await supabase
      .from('plans')
      .update({
        rag_processed: true,
        rag_processed_at: new Date().toISOString(),
        chunk_count: chunks.length
      })
      .eq('id', planId)
    
  } catch (error) {
    console.error('Error processing financial plan with RAG:', error)
    // Update plan metadata to indicate RAG processing failed
    await supabase
      .from('plans')
      .update({
        rag_processed: false,
        rag_error: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('id', planId)
  }
}

// Function to enhance a query with relevant context from stored chunks
export const enhanceQueryWithRAG = async (
  userId: string,
  query: string
): Promise<string> => {
  try {
    // Retrieve relevant chunks
    const relevantChunks = await retrieveRelevantChunks(userId, query)
    
    if (relevantChunks.length === 0) {
      return query
    }
    
    // Combine the query with relevant context
    const enhancedQuery = `
Query: ${query}

Relevant context from your financial plan:
${relevantChunks.join('\n\n')}

Based on the above context and the query, please provide a detailed response.
`
    
    return enhancedQuery
  } catch (error) {
    console.error('Error enhancing query with RAG:', error)
    return query
  }
}
