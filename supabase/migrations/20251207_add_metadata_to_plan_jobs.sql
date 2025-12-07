-- Add metadata column to plan_jobs table for chunked generation progress tracking
-- This column stores JSON data including: currentSectionIndex, generatedSections, collectedInfo, tier, totalSections

-- Add metadata column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'plan_jobs' 
      AND column_name = 'metadata'
  ) THEN
    ALTER TABLE plan_jobs ADD COLUMN metadata JSONB DEFAULT NULL;
    COMMENT ON COLUMN plan_jobs.metadata IS 'Stores chunked generation progress: currentSectionIndex, generatedSections, collectedInfo, tier, totalSections';
  END IF;
END $$;
