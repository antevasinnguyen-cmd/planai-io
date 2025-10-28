-- Add 'source' column to distinguish how chat messages were persisted
-- Values: 'api' (server-side via route handler), 'client' (legacy), NULL (unknown/legacy)

alter table if exists public.chat_messages
  add column if not exists source text;

-- Helpful index for monthly usage queries
create index if not exists chat_messages_user_created_source_idx
  on public.chat_messages (user_id, created_at, source);
