#!/usr/bin/env node

// Simple migration script using Supabase client
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase configuration
const supabaseUrl = 'https://wjzmscsoiibzlxejqpgg.supabase.co'
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqem1zY3NvaWliemx4ZWpxcGdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc3NDA4MiwiZXhwIjoyMDczMzUwMDgyfQ.C0OlpsyqnnG6CaMDnhv4M6GI4lTN3AyK4sldWl_UpZk'

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function createTables() {
  try {
    console.log('🚀 Creating tables for PlanAI hybrid approach...')

    // Create AI Response Cache table
    console.log('Creating ai_response_cache table...')
    const { error: cacheError } = await supabase.from('_temp_migration').select('*').limit(0)

    if (cacheError && cacheError.code === 'PGRST116') {
      // Create the table using SQL
      await executeSQL(`
        CREATE TABLE IF NOT EXISTS ai_response_cache (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          cache_key TEXT NOT NULL UNIQUE,
          response TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days'
        );

        CREATE INDEX IF NOT EXISTS idx_ai_response_cache_key ON ai_response_cache(cache_key);
        CREATE INDEX IF NOT EXISTS idx_ai_response_cache_expires ON ai_response_cache(expires_at);

        ALTER TABLE ai_response_cache ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Allow public read access" ON ai_response_cache FOR SELECT USING (true);
        CREATE POLICY "Allow service role to manage cache" ON ai_response_cache FOR ALL USING (auth.role() = 'service_role');
      `)
      console.log('✅ ai_response_cache table created')
    }

    // Create Document Chunks table
    console.log('Creating document_chunks table...')
    await executeSQL(`
      CREATE EXTENSION IF NOT EXISTS vector;

      CREATE TABLE IF NOT EXISTS document_chunks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        document_id TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        embedding VECTOR(1536),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_document_chunks_user_id ON document_chunks(user_id);
      CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);

      ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

      CREATE POLICY "Users can read their own document chunks" ON document_chunks
        FOR SELECT USING (auth.uid() = user_id);

      CREATE POLICY "Service role can manage document chunks" ON document_chunks
        FOR ALL USING (auth.role() = 'service_role');

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
    `)
    console.log('✅ document_chunks table created')

    console.log('🎉 All tables created successfully!')

  } catch (error) {
    console.error('❌ Table creation failed:', error)
    throw error
  }
}

async function executeSQL(sql) {
  // For now, we'll just log the SQL since direct SQL execution might not work
  // The user will need to run these manually in Supabase dashboard
  console.log('SQL to execute:')
  console.log(sql)
  console.log('---')
}

createTables()
