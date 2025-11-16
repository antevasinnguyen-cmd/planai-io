-- Fix foreign key constraint on payments table
-- The constraint prevents payments from being created if user profile doesn't exist
-- This can happen if user hasn't completed signup or profile creation is delayed

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_user_id_fkey;

-- Step 2: Add back the constraint but with ON DELETE SET NULL
-- This allows payments to exist even if user profile is deleted
ALTER TABLE payments ADD CONSTRAINT payments_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Step 3: Verify the constraint was updated
-- SELECT constraint_name, table_name, column_name 
-- FROM information_schema.key_column_usage 
-- WHERE table_name = 'payments' AND column_name = 'user_id';
