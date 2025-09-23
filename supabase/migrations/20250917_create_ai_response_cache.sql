-- Create a table for caching AI responses
CREATE TABLE IF NOT EXISTS ai_response_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT NOT NULL UNIQUE,
  response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Add an expiration time for cache entries (default 7 days)
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days'
);

-- Create an index on the cache_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_response_cache_key ON ai_response_cache(cache_key);

-- Create a function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM ai_response_cache WHERE expires_at < NOW();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to run the cleanup function periodically
DROP TRIGGER IF EXISTS trigger_cleanup_expired_cache ON ai_response_cache;
CREATE TRIGGER trigger_cleanup_expired_cache
AFTER INSERT ON ai_response_cache
EXECUTE PROCEDURE cleanup_expired_cache();

-- Add RLS policies
ALTER TABLE ai_response_cache ENABLE ROW LEVEL SECURITY;

-- Allow public access for reading cache (no authentication required)
CREATE POLICY "Allow public read access" ON ai_response_cache
  FOR SELECT USING (true);

-- Only allow service role to insert/update/delete
CREATE POLICY "Allow service role to manage cache" ON ai_response_cache
  FOR ALL USING (auth.role() = 'service_role');
