-- Fix schema constraints for plans and profiles tables
-- Run this in Supabase SQL Editor

-- 1. Check current constraints and foreign keys
SELECT conname, pg_get_constraintdef(oid), contype
FROM pg_constraint 
WHERE conrelid IN ('plans'::regclass, 'profiles'::regclass);

-- 2. Check if user exists in auth.users (replace with actual user ID from logs)
SELECT id, email, created_at FROM auth.users WHERE id = 'c6d488f0-caa4-4c7b-9cc5-e1564a85b4aa';

-- 3. Drop existing problematic constraints
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_status_check;
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_content_check;
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_word_count_check;
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_user_id_fkey;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- 4. Allow NULL for content temporarily (for partial plans)
ALTER TABLE plans ALTER COLUMN content DROP NOT NULL;
ALTER TABLE plans ALTER COLUMN word_count SET DEFAULT 0;

-- 5. Add flexible CHECK constraints
ALTER TABLE plans ADD CONSTRAINT plans_status_check 
CHECK (status IN ('draft', 'generating', 'completed', 'failed'));

ALTER TABLE plans ADD CONSTRAINT plans_word_count_check 
CHECK (word_count >= 0);

-- 6. Add proper foreign key constraints
-- profiles.id should reference auth.users(id)
ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- plans.user_id should reference profiles(id) (based on error message)
ALTER TABLE plans ADD CONSTRAINT plans_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 7. Make email nullable in profiles (in case we can't get it from auth)
ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;

-- 6. Verify the changes
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'plans'::regclass AND contype = 'c';

-- 7. Test insert (should work now)
-- INSERT INTO plans (user_id, title, goal, content, status, word_count, collected_info, metadata, created_at, updated_at)
-- VALUES ('test-user-id', 'Test Plan', 'Test Goal', 'Test content', 'draft', 0, '{}', '{"progress": 0}', NOW(), NOW());
