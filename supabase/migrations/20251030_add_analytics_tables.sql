-- Analytics tables for checklist & notes

-- Checklist items linked to plans
create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete cascade,
  title text not null,
  due_date date,
  status text default 'pending', -- pending | in_progress | completed
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists checklist_items_user_idx on public.checklist_items(user_id);

-- Notes that user writes along the journey
create table if not exists public.user_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);
create index if not exists user_notes_user_idx on public.user_notes(user_id);
