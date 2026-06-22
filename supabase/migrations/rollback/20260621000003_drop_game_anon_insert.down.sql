-- ROLLBACK for 20260621000003_drop_game_anon_insert
-- ⚠️ NOT RECOMMENDED: reverting re-opens SEC-3 (leaderboard cheating).
-- Provided only for emergency reversibility. Prefer fixing forward.
begin;
create policy "anon insert scores"
  on public.game_scores for insert
  to anon
  with check (true);
create policy "anon insert sessions"
  on public.game_sessions for insert
  to anon
  with check (true);
commit;
