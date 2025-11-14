-- Fix schema constraints for plans table
-- Run this in Supabase SQL Editor

-- 1. Check current constraints
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'plans'::regclass AND contype = 'c';

-- 2. Drop existing CHECK constraints that might cause issues
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_status_check;
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_content_check;
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_word_count_check;

-- 3. Allow NULL for content temporarily (for partial plans)
ALTER TABLE plans ALTER COLUMN content DROP NOT NULL;

-- 4. Set default for word_count
ALTER TABLE plans ALTER COLUMN word_count SET DEFAULT 0;

-- 5. Add new flexible CHECK constraints
ALTER TABLE plans ADD CONSTRAINT plans_status_check 
CHECK (status IN ('draft', 'completed', 'failed'));

ALTER TABLE plans ADD CONSTRAINT plans_word_count_check 
CHECK (word_count >= 0);

-- 6. Verify the changes
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'plans'::regclass AND contype = 'c';

-- 7. Test insert (should work now)
-- INSERT INTO plans (user_id, title, goal, content, status, word_count, collected_info, metadata, created_at, updated_at)
-- VALUES ('test-user-id', 'Test Plan', 'Test Goal', 'Test content', 'draft', 0, '{}', '{"progress": 0}', NOW(), NOW());
