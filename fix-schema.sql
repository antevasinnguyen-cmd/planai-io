-- Fix schema constraints for plans table
-- IMPORTANT: Run this in Supabase SQL Editor to fix FK constraint
-- The issue: FK was pointing to public.users instead of auth.users

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

-- 4. CRITICAL: Add FK constraint pointing to auth.users (NOT public.users)
-- This is the fix for: "Key (user_id)=(78e3cd9a-...) is not present in table 'users'"
ALTER TABLE plans ADD CONSTRAINT plans_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Verify the changes
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'plans'::regclass AND contype = 'c';

-- 6. If you still get FK error, it means there are orphaned user_ids in plans table
-- Run this to check:
-- SELECT DISTINCT user_id FROM plans WHERE user_id NOT IN (SELECT id FROM auth.users);
-- If results found, delete those rows:
-- DELETE FROM plans WHERE user_id NOT IN (SELECT id FROM auth.users);
