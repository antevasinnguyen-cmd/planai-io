-- Fix Plan Retrieval Issues - Comprehensive Database Schema & RLS Fix
-- Date: 2025-11-02
-- Purpose: Ensure plans table has correct schema and RLS policies for plan retrieval

-- 1. Verify/Create plans table with all required columns
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  goal TEXT,
  content TEXT,
  collected_info JSONB,
  status TEXT DEFAULT 'active',
  word_count INTEGER DEFAULT 0,
  model_used TEXT,
  rag_processed BOOLEAN DEFAULT FALSE,
  spiritual_enabled BOOLEAN DEFAULT FALSE,
  spiritual_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT plans_user_id_fk FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_plans_user_id ON plans(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_created_at ON plans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plans_user_created ON plans(user_id, created_at DESC);

-- 3. Enable RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Users can view own plans" ON plans;
DROP POLICY IF EXISTS "Users can insert own plans" ON plans;
DROP POLICY IF EXISTS "Users can update own plans" ON plans;
DROP POLICY IF EXISTS "Users can delete own plans" ON plans;

-- 5. Create new RLS policies - CRITICAL FIX
-- SELECT policy: Users can view their own plans
CREATE POLICY "Users can view own plans" ON plans
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT policy: Users can create plans for themselves
CREATE POLICY "Users can insert own plans" ON plans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE policy: Users can update their own plans
CREATE POLICY "Users can update own plans" ON plans
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE policy: Users can delete their own plans
CREATE POLICY "Users can delete own plans" ON plans
  FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Verify profiles table exists (for FK reference)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 8. Drop existing profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 9. Create profiles RLS policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 10. Verify the schema
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'plans'
ORDER BY ordinal_position;
