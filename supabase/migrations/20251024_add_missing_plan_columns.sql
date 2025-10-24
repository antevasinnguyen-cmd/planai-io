-- Fix plans table - Add missing columns
-- Date: 2025-10-24
-- Issue: API trying to insert into columns that don't exist

-- Add missing columns to plans table
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS collected_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS model_used TEXT DEFAULT 'gpt-4o-mini',
ADD COLUMN IF NOT EXISTS rag_processed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS spiritual_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS spiritual_data JSONB DEFAULT '{}'::jsonb;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_plans_user_id ON plans(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_status ON plans(status);
CREATE INDEX IF NOT EXISTS idx_plans_created_at ON plans(created_at DESC);

-- Add comments for documentation
COMMENT ON COLUMN plans.collected_info IS 'JSON data collected from user chat';
COMMENT ON COLUMN plans.model_used IS 'AI model used (gpt-4o-mini, claude-3.5-sonnet)';
COMMENT ON COLUMN plans.rag_processed IS 'Whether processed with RAG embeddings';
COMMENT ON COLUMN plans.spiritual_enabled IS 'Whether spiritual analysis enabled';
COMMENT ON COLUMN plans.spiritual_data IS 'Spiritual analysis data (zodiac, numerology)';
