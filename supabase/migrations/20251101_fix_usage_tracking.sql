-- Fix usage tracking - add source column to chat_messages if missing
-- This ensures we can properly track API-sourced chat messages

-- Add source column if it doesn't exist
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'web';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_type_source 
ON chat_messages(user_id, type, source, created_at);

-- Create index for plans
CREATE INDEX IF NOT EXISTS idx_plans_user_created 
ON plans(user_id, created_at);

-- Verify chat_messages structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'chat_messages' ORDER BY ordinal_position;
