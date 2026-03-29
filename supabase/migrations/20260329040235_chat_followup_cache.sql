-- Add follow-up questions cache to chat_sessions
alter table public.chat_sessions add column follow_up_questions text[] default '{}';
