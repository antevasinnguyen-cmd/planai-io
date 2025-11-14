-- Fix schema constraints for plans table to allow direct auth.users reference
-- Run this in Supabase SQL Editor

-- 1. Drop existing problematic constraints
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_status_check;
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_content_check;
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_word_count_check;
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_user_id_fkey;

-- 2. Allow NULL for content (for partial plans)
ALTER TABLE plans ALTER COLUMN content DROP NOT NULL;
ALTER TABLE plans ALTER COLUMN word_count SET DEFAULT 0;

-- 3. Add flexible CHECK constraints
ALTER TABLE plans ADD CONSTRAINT plans_status_check 
CHECK (status IN ('draft', 'generating', 'completed', 'failed'));

ALTER TABLE plans ADD CONSTRAINT plans_word_count_check 
CHECK (word_count >= 0);

-- 4. Add FK constraint: plans.user_id → auth.users(id) directly
ALTER TABLE plans ADD CONSTRAINT plans_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Verify the changes
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'plans'::regclass AND contype = 'c';
