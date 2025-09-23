-- Enable the vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a table for document chunks with embeddings
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- Dimension for text-embedding-3-small
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_document_chunks_user_id ON document_chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);

-- Create a function to match document chunks using vector similarity
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  user_id_input UUID
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_chunks.id,
    document_chunks.content,
    1 - (document_chunks.embedding <=> query_embedding) AS similarity
  FROM document_chunks
  WHERE 
    document_chunks.user_id = user_id_input
    AND 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Add RLS policies
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Users can only read their own document chunks
CREATE POLICY "Users can read their own document chunks" ON document_chunks
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert/update document chunks
CREATE POLICY "Service role can manage document chunks" ON document_chunks
  FOR ALL USING (auth.role() = 'service_role');
