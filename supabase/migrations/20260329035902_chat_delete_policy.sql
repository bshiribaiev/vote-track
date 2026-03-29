create policy "Users can delete their own sessions"
  on public.chat_sessions for delete
  using (auth.uid() = user_id);
