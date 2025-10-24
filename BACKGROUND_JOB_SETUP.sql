-- ============================================
-- BACKGROUND JOB SYSTEM - Supabase SQL Setup
-- ============================================

-- 1. Create plan_jobs table for tracking background jobs
CREATE TABLE IF NOT EXISTS plan_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  goals TEXT,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  error_message TEXT,
  plan_id UUID REFERENCES plans(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Add indexes for faster queries
CREATE INDEX idx_plan_jobs_user_id ON plan_jobs(user_id);
CREATE INDEX idx_plan_jobs_status ON plan_jobs(status);
CREATE INDEX idx_plan_jobs_created_at ON plan_jobs(created_at DESC);

-- 2. Ensure subscriptions table exists with proper structure
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT DEFAULT 'free', -- free, basic, pro, pro_max
  status TEXT DEFAULT 'active', -- active, cancelled, expired
  plan_limit INT DEFAULT 1,
  chat_limit INT DEFAULT 5,
  word_limit INT DEFAULT 1000,
  used_plans INT DEFAULT 0,
  used_chats INT DEFAULT 0,
  used_words INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- 3. Auto-create subscription when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, tier, status, plan_limit, chat_limit, word_limit)
  VALUES (new.id, 'free', 'active', 1, 5, 1000);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Update timestamp on subscription changes
CREATE OR REPLACE FUNCTION update_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subscriptions_timestamp ON subscriptions;

CREATE TRIGGER update_subscriptions_timestamp
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE PROCEDURE update_subscription_timestamp();

-- 5. Update timestamp on plan_jobs changes
CREATE OR REPLACE FUNCTION update_plan_jobs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_plan_jobs_timestamp ON plan_jobs;

CREATE TRIGGER update_plan_jobs_timestamp
  BEFORE UPDATE ON plan_jobs
  FOR EACH ROW EXECUTE PROCEDURE update_plan_jobs_timestamp();

-- 6. Enable RLS (Row Level Security) for security
ALTER TABLE plan_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own jobs
CREATE POLICY "Users can view their own jobs" ON plan_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own jobs" ON plan_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only see their own subscription
CREATE POLICY "Users can view their own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- 7. Grant permissions
GRANT ALL ON plan_jobs TO authenticated;
GRANT ALL ON subscriptions TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
