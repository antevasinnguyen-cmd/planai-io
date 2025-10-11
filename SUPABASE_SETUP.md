# Cấu hình Supabase cho PlanAI

Tài liệu này hướng dẫn cách cấu hình Supabase để đảm bảo các tính năng AI của PlanAI hoạt động tốt.

## Bảng dữ liệu cần thiết

### 1. Bảng `plans`

Bảng này lưu trữ các kế hoạch tài chính được tạo bởi AI.

```sql
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  collected_info JSONB,
  status TEXT DEFAULT 'active',
  word_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  model_used TEXT,
  rag_processed BOOLEAN DEFAULT FALSE,
  rag_processed_at TIMESTAMP WITH TIME ZONE,
  rag_error TEXT,
  chunk_count INTEGER,
  exported_to_sheets BOOLEAN DEFAULT FALSE,
  sheets_url TEXT,
  sheets_id TEXT,
  last_exported_at TIMESTAMP WITH TIME ZONE
);

-- Thêm index để tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS plans_user_id_idx ON plans(user_id);
CREATE INDEX IF NOT EXISTS plans_status_idx ON plans(status);
```

### 2. Bảng `ai_response_cache`

Bảng này lưu trữ cache của các phản hồi AI để giảm chi phí API và tăng tốc độ phản hồi.

```sql
CREATE TABLE IF NOT EXISTS ai_response_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT UNIQUE NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  access_count INTEGER DEFAULT 1
);

-- Thêm index để tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS ai_response_cache_key_idx ON ai_response_cache(cache_key);
CREATE INDEX IF NOT EXISTS ai_response_cache_expires_idx ON ai_response_cache(expires_at);
```

### 3. Bảng `document_chunks`

Bảng này lưu trữ các phần nhỏ (chunks) của kế hoạch và embeddings tương ứng để hỗ trợ RAG.

```sql
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Thêm index để tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS document_chunks_user_id_idx ON document_chunks(user_id);
CREATE INDEX IF NOT EXISTS document_chunks_document_id_idx ON document_chunks(document_id);
```

### 4. Bảng `usage_limits`

Bảng này theo dõi việc sử dụng tính năng AI của người dùng.

```sql
CREATE TABLE IF NOT EXISTS usage_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_count INTEGER DEFAULT 0,
  plan_count INTEGER DEFAULT 0,
  last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  next_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month')
);

-- Thêm index để tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS usage_limits_user_id_idx ON usage_limits(user_id);
```

## Hàm SQL cần thiết

### 1. Hàm tăng số lần truy cập cache

```sql
CREATE OR REPLACE FUNCTION increment_cache_access(key TEXT)
RETURNS void AS $$
BEGIN
  UPDATE ai_response_cache
  SET access_count = access_count + 1
  WHERE cache_key = key;
END;
$$ LANGUAGE plpgsql;
```

### 2. Hàm tìm kiếm vector similarity cho RAG

```sql
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  user_id_input UUID
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  document_id TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_chunks.id,
    document_chunks.content,
    document_chunks.document_id,
    1 - (document_chunks.embedding <=> query_embedding) AS similarity
  FROM document_chunks
  WHERE 
    document_chunks.user_id = user_id_input AND
    1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
```

### 3. Hàm reset giới hạn sử dụng hàng tháng

```sql
CREATE OR REPLACE FUNCTION reset_monthly_usage_limits()
RETURNS void AS $$
BEGIN
  UPDATE usage_limits
  SET 
    chat_count = 0,
    plan_count = 0,
    last_reset_at = NOW(),
    next_reset_at = NOW() + INTERVAL '1 month'
  WHERE next_reset_at <= NOW();
END;
$$ LANGUAGE plpgsql;
```

## Cấu hình pgvector extension

Để hỗ trợ tìm kiếm vector cho RAG, bạn cần cài đặt pgvector extension:

```sql
-- Kiểm tra và cài đặt pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
```

## Cấu hình Edge Functions

### 1. Hàm xóa cache hết hạn

Tạo một Edge Function để tự động xóa các cache hết hạn:

```js
// /supabase/functions/cleanup-expired-cache/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(supabaseUrl, supabaseKey)

Deno.serve(async (req) => {
  try {
    const now = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('ai_response_cache')
      .delete()
      .lt('expires_at', now)
    
    if (error) {
      throw error
    }
    
    return new Response(
      JSON.stringify({ success: true, message: 'Expired cache entries cleaned up' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

### 2. Hàm reset giới hạn sử dụng hàng tháng

Tạo một Edge Function để tự động reset giới hạn sử dụng hàng tháng:

```js
// /supabase/functions/reset-monthly-limits/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(supabaseUrl, supabaseKey)

Deno.serve(async (req) => {
  try {
    const { data, error } = await supabase.rpc('reset_monthly_usage_limits')
    
    if (error) {
      throw error
    }
    
    return new Response(
      JSON.stringify({ success: true, message: 'Monthly usage limits reset' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

## Cấu hình Cron Jobs

Cấu hình các Cron Jobs để tự động chạy các Edge Functions:

1. Xóa cache hết hạn: Chạy hàng ngày lúc 3 giờ sáng
   ```
   0 3 * * * https://your-project-ref.supabase.co/functions/v1/cleanup-expired-cache
   ```

2. Reset giới hạn sử dụng hàng tháng: Chạy vào ngày đầu tiên của mỗi tháng
   ```
   0 0 1 * * https://your-project-ref.supabase.co/functions/v1/reset-monthly-limits
   ```

## Cấu hình Row Level Security (RLS)

Đảm bảo rằng các bảng có chính sách bảo mật phù hợp:

```sql
-- RLS cho bảng plans
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plans" 
  ON plans FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plans" 
  ON plans FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plans" 
  ON plans FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS cho bảng document_chunks
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own document chunks" 
  ON document_chunks FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own document chunks" 
  ON document_chunks FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- RLS cho bảng usage_limits
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage limits" 
  ON usage_limits FOR SELECT 
  USING (auth.uid() = user_id);

-- Cho phép service role cập nhật usage_limits
CREATE POLICY "Service role can update usage limits" 
  ON usage_limits FOR UPDATE 
  USING (auth.uid() = user_id OR auth.role() = 'service_role');
```

## Kiểm tra cấu hình

Sau khi hoàn thành các bước trên, bạn nên kiểm tra:

1. Tạo một kế hoạch tài chính mới và xác nhận nó được lưu vào bảng `plans`
2. Kiểm tra xem RAG có hoạt động bằng cách xem các chunks trong bảng `document_chunks`
3. Kiểm tra xem cache có hoạt động bằng cách xem các mục trong bảng `ai_response_cache`
4. Kiểm tra xem giới hạn sử dụng có được theo dõi trong bảng `usage_limits`

## Khắc phục sự cố

Nếu bạn gặp vấn đề với tính năng AI:

1. Kiểm tra logs của API routes trong Vercel
2. Kiểm tra logs của Edge Functions trong Supabase
3. Xác nhận rằng các biến môi trường đã được cấu hình chính xác
4. Kiểm tra xem pgvector extension đã được cài đặt và hoạt động
