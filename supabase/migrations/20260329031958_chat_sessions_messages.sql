-- Chat sessions
create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  page_context jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_chat_sessions_user on public.chat_sessions(user_id, updated_at desc);

-- Chat messages (belong to a session)
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

create index idx_chat_messages_session on public.chat_messages(session_id, created_at);

-- RLS
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

create policy "Users can view their own sessions"
  on public.chat_sessions for select
  using (auth.uid() = user_id);

create policy "Users can create their own sessions"
  on public.chat_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own sessions"
  on public.chat_sessions for update
  using (auth.uid() = user_id);

create policy "Users can view messages in their sessions"
  on public.chat_messages for select
  using (
    exists (select 1 from public.chat_sessions where id = session_id and user_id = auth.uid())
  );

create policy "Users can insert messages in their sessions"
  on public.chat_messages for insert
  with check (
    exists (select 1 from public.chat_sessions where id = session_id and user_id = auth.uid())
  );
