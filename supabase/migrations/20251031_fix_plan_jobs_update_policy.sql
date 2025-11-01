-- Add UPDATE policy for plan_jobs so user-scoped client can update job status when service role is not available
-- Safe to run multiple times
ALTER TABLE IF EXISTS plan_jobs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'plan_jobs' 
      AND policyname = 'Users can update their own jobs'
  ) THEN
    CREATE POLICY "Users can update their own jobs" ON plan_jobs
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;
