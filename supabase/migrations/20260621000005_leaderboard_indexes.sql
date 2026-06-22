-- ============================================================================
-- Migration: 20260621000005_leaderboard_indexes
-- Phase:     5 — Priority 3 (Leaderboard indexing): P3.1, S4
-- Source of truth: PHASE5_IMPLEMENTATION.md §P3.1
-- ----------------------------------------------------------------------------
-- WHAT:  Add the indexes every ranking query needs, plus the guestbook sort
--        index and the unindexed-FK fix.
--
-- WHY:   game_scores has only its PK today. Every ranking path filters game_id
--        and compares score/created_at; the FK session_id is unindexed (perf
--        advisor `unindexed_foreign_keys`). Cheap now (≈0 rows), painful later.
--
-- SAFETY: Pure additive indexes. No data/behavior change. Reversible (drop).
--         IF NOT EXISTS makes re-runs safe.
-- ============================================================================

begin;

-- all-time rank/ranking: where game_id = ? ... order by score desc
create index if not exists game_scores_game_score_idx
  on public.game_scores (game_id, score desc);

-- "today" variants: where game_id = ? and created_at in [day) ...
create index if not exists game_scores_game_created_idx
  on public.game_scores (game_id, created_at);

-- cover the foreign key (clears the performance advisor)
create index if not exists game_scores_session_id_idx
  on public.game_scores (session_id);

-- guestbook's only ORDER BY is created_at
create index if not exists guestbook_created_at_idx
  on public.guestbook (created_at desc);

commit;
