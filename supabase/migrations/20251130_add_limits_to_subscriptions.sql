-- Add chat_limit, plan_limit, and period columns to subscriptions table
-- This fixes the error: "Could not find the 'chat_limit' column of 'subscriptions' in the schema cache"

-- Add chat_limit column (default to free tier limit: 5)
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS chat_limit INTEGER DEFAULT 5;

-- Add plan_limit column (default to free tier limit: 1)
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS plan_limit INTEGER DEFAULT 1;

-- Add word_limit column (default to free tier limit: 4000)
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS word_limit INTEGER DEFAULT 4000;

-- Add current_period_start column (default to now)
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add current_period_end column (default to 30 days from now)
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days');

-- Create index for faster queries on period columns
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_start ON subscriptions(current_period_start);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);

-- Update existing records to have correct limits based on their tier
UPDATE subscriptions 
SET 
  chat_limit = CASE tier
    WHEN 'free' THEN 5
    WHEN 'basic' THEN 40
    WHEN 'pro' THEN 100
    WHEN 'pro_max' THEN 270
    ELSE 5
  END,
  plan_limit = CASE tier
    WHEN 'free' THEN 1
    WHEN 'basic' THEN 1
    WHEN 'pro' THEN 2
    WHEN 'pro_max' THEN 5
    ELSE 1
  END,
  word_limit = CASE tier
    WHEN 'free' THEN 4000
    WHEN 'basic' THEN 50000
    WHEN 'pro' THEN 50000
    WHEN 'pro_max' THEN 50000
    ELSE 4000
  END
WHERE chat_limit IS NULL OR plan_limit IS NULL OR word_limit IS NULL;
