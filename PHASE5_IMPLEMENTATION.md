# JeffOS — Phase 5 Implementation Plan (Backend Hardening & Scale)

> Implementation plan for Supabase project `akqqmrqeloasisiybdjx` (**whoisthedev portfolio**).
> Authored 2026-06-21 from live findings in [SUPABASE_DISCOVERY.md](SUPABASE_DISCOVERY.md), [SUPABASE_SECURITY_AUDIT.md](SUPABASE_SECURITY_AUDIT.md), [SUPABASE_SCALABILITY_PLAN.md](SUPABASE_SCALABILITY_PLAN.md).
> **All SQL is authored — NOTHING is applied. No database changes are executed automatically.** Prerequisite: ship [PHASE_4_5_SECURITY_HOTFIX.md](PHASE_4_5_SECURITY_HOTFIX.md) first.

---

## 0. How to use this plan
- Each work item is self-contained: **goal → live evidence → migration SQL (proposed) → client change → verification.**
- Items are ordered by the mandated priority: **Security → Realtime correctness → Leaderboard indexing → Holiday cron repair → Asset delivery.**
- Every schema change is intended to land as a **tracked migration** (none exist today — discovery §0 / SEC-11), so the DB becomes reproducible.
- Apply deliberately, one item at a time, running the verification before moving on. Re-run `get_advisors` after each schema item.

> **Assumes the Phase 4.5 hotfix is already applied** (RLS on `projects`; anon INSERT dropped from `guestbook`/`game_scores`/`game_sessions`). Items below build on that state.

---

## Priority 1 — Security (finish what the hotfix started)

The hotfix closed the 3 critical/high RLS gaps. These items clear the **remaining** security advisor findings.

### P1.1 — Pin `search_path` on all functions (SEC-5)
**Evidence:** advisor `function_search_path_mutable` ×5 (`get_rankings_all`, `get_rankings_today`, `rank_alltime`, `rank_today`, `update_updated_at_column`).
```sql
begin;
alter function public.get_rankings_all(text)          set search_path = public;
alter function public.get_rankings_today(text, date)  set search_path = public;
alter function public.rank_alltime(text, integer)     set search_path = public;
alter function public.rank_today(text, integer)       set search_path = public;
alter function public.update_updated_at_column()       set search_path = public;
commit;
```
**Verify:** `get_advisors(security)` no longer lists `function_search_path_mutable`.

### P1.2 — Stop exposing raw rows; serve aggregates (SEC-4)
**Evidence:** `visits` / `game_scores` have `SELECT USING (true)` for anon → anon can enumerate every `anon_id`.
- `visits`: superseded by the **visit_stats counter** (P3-realtime / P2.1) — once the client reads the counter, drop the raw SELECT:
  ```sql
  drop policy if exists "anon can select visits" on public.visits;
  ```
- `game_scores`: today nothing reads it client-side. Keep server-side ranking via `get_rankings_*`. If/when a client leaderboard is built, expose it through a `security definer` function returning only `(anon_id, score)`, not raw SELECT. Until then, optionally:
  ```sql
  drop policy if exists "anon select scores" on public.game_scores;  -- only if no client reads it
  ```
**Verify:** anon `select * from visits` / `game_scores` returns RLS error; counter read + ranking RPCs still work.

### P1.3 — `visits` permissive INSERT (residual advisor WARN)
**Evidence:** `anon can insert visits WITH CHECK (true)` still flagged. Unlike guestbook/games, the client legitimately upserts `visits` directly with the anon key, so we **keep** insert but constrain it:
```sql
-- replace blanket insert with a check that ties the row to its own anon_id shape
drop policy if exists "anon can insert visits" on public.visits;
create policy "anon insert own visit"
  on public.visits for insert to anon
  with check (anon_id is not null and char_length(anon_id) between 8 and 64);
```
> This is a soft guard (anon_id is client-supplied), but it stops empty/garbage floods. The unique index on `anon_id` already prevents duplicate rows. Accept the residual WARN if you'd rather not constrain.

### P1.4 — Postgres upgrade (SEC-6) & bucket limits (SEC-8)
- Schedule PG upgrade from dashboard (test on a branch). https://supabase.com/docs/guides/platform/upgrading
- Set bucket guardrails:
  ```sql
  update storage.buckets set file_size_limit = 52428800,
    allowed_mime_types = array['image/png','image/jpeg','image/webp','image/avif']
    where id in ('wallpapers','themes','portfolio_thumb');
  update storage.buckets set file_size_limit = 209715200 where id = 'games';
  update storage.buckets set file_size_limit = 26214400, allowed_mime_types = array['application/pdf'] where id = 'portfolio';
  ```

**Exit criteria for Priority 1:** `get_advisors(security)` shows only intentional/accepted items (e.g. PG version if upgrade is scheduled later).

---

## Priority 2 — Realtime correctness (it's currently broken)

**Evidence (discovery §10):** `supabase_realtime` publication has **zero tables** → `postgres_changes` never fires. The `visitors`, `guestbook-updates`, and `games-realtime` client subscriptions are silently dead. Broadcast (`theme-sync`/`holiday_theme`) works.

> ⚠️ Do **not** simply add `public.visits` with `event:*` to the publication — that reintroduces the O(N²) COUNT storm. Use the counter pattern.

### P2.1 — Visitor count: counter table + trigger, publish the counter (S1 + S6 + SEC-4)
```sql
begin;
create table if not exists public.visit_stats (
  id    int    primary key default 1,
  total bigint not null    default 0
);
insert into public.visit_stats (id, total)
  values (1, (select count(*) from public.visits))
  on conflict (id) do nothing;

create or replace function public.bump_visit_stats()
  returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.visit_stats set total = total + 1 where id = 1;
  return new;
end $$;

drop trigger if exists trg_bump_visit_stats on public.visits;
create trigger trg_bump_visit_stats
  after insert on public.visits
  for each row execute function public.bump_visit_stats();

-- read access to the 1-row counter:
alter table public.visit_stats enable row level security;
drop policy if exists "public read visit_stats" on public.visit_stats;
create policy "public read visit_stats" on public.visit_stats
  for select to anon, authenticated using (true);

-- publish ONLY the tiny counter to realtime:
alter publication supabase_realtime add table public.visit_stats;
alter table public.visit_stats replica identity full;
commit;
```
**Client change** ([useVisitors.ts](src/hooks/useVisitors.ts) / [VisitorsWidget.tsx](src/components/VisitorsWidget.tsx)): replace `select(count: exact, head: true)` on `visits` with `select('total').eq('id',1).single()` on `visit_stats`, and subscribe to `postgres_changes` UPDATE on `visit_stats` (1 row, 1 event per visit) instead of `*` on `visits`.
**Verify:** new visit → `visit_stats.total` increments → connected clients receive one UPDATE and the widget ticks up. No per-client COUNT.

### P2.2 — Guestbook live-append (S1)
```sql
alter publication supabase_realtime add table public.guestbook;
alter table public.guestbook replica identity full;
```
**Client:** [Guestbook.tsx:76-82](src/apps/guestbook/Guestbook.tsx#L76-L82) already subscribes to INSERT and appends the payload — it will start working once the table is published. No client change required.
**Verify:** post via `guestbook-add` from one tab → a second tab sees the new entry appear live.

### P2.3 — Games list: drop the dead subscription (S1 / S2)
ROM uploads are rare/admin-driven; a `storage.objects` realtime subscription isn't worth it.
**Client:** remove the `games-realtime` subscription in [EmulatorApp.tsx](src/apps/games/EmulatorApp.tsx); rely on the `games_index` (P5/S2) + manual refresh.
**Verify:** games app still loads; no console subscription to `storage.objects`.

**Exit criteria for Priority 2:** visitor count and guestbook update live across tabs; `games-realtime` removed; `pg_publication_tables` for `supabase_realtime` lists `visit_stats` (+ `guestbook`).

---

## Priority 3 — Leaderboard indexing (before scores accumulate)

**Evidence (discovery §6, S4):** `game_scores` has only the PK on `id`. Every ranking path filters `game_id` + compares `score`/`created_at`; FK `session_id` is unindexed (perf advisor `unindexed_foreign_keys`).

### P3.1 — Indexes
```sql
begin;
create index if not exists game_scores_game_score_idx
  on public.game_scores (game_id, score desc);
create index if not exists game_scores_game_created_idx
  on public.game_scores (game_id, created_at);
create index if not exists game_scores_session_id_idx
  on public.game_scores (session_id);   -- clears the perf advisor
create index if not exists guestbook_created_at_idx
  on public.guestbook (created_at desc); -- the only ORDER BY on guestbook
commit;
```

### P3.2 — Make the "today" rankings sargable
**Evidence:** `get_rankings_today` / `rank_today` use `created_at::date = $d`, which **cannot** use `game_scores_game_created_idx`. Refactor to a half-open range:
```sql
create or replace function public.rank_today(gameid text, score_input integer)
  returns integer language sql stable set search_path = public as $$
  select count(*) + 1 from public.game_scores
  where game_id = gameid
    and created_at >= date_trunc('day', now())
    and created_at <  date_trunc('day', now()) + interval '1 day'
    and score > score_input;
$$;

create or replace function public.get_rankings_today(g_id text, d date)
  returns table(anon_id text, score integer) language sql stable set search_path = public as $$
  select anon_id, max(score) as score from public.game_scores
  where game_id = g_id
    and created_at >= d::timestamptz
    and created_at <  (d + 1)::timestamptz
  group by anon_id order by score desc;
$$;
```
> Note: also fixes the **type bug** (discovery §3) — `anon_id` is declared `text` here to match the actual column type (was `uuid`, which would error on real data). Apply the same `text` correction to `get_rankings_all`.
```sql
create or replace function public.get_rankings_all(g_id text)
  returns table(anon_id text, score integer) language sql stable set search_path = public as $$
  select anon_id, max(score) as score from public.game_scores
  where game_id = g_id group by anon_id order by score desc;
$$;
```
**Verify:** `explain` on a populated `game_scores` shows index scans (not seq scans) for the ranking queries; `game-submit` still returns correct `rank_today`/`rank_all_time`; perf advisor no longer flags the FK.

---

## Priority 4 — Holiday cron repair (a live no-op)

**Evidence (discovery §5a):** `daily_holiday_update` cron fires daily and reports "success" (246 runs) but the `update_holiday_theme` Edge Function upserts a non-existent `defaults.updated_at` column → the upsert throws, the theme is never persisted, and the subsequent broadcast (which runs *after* the upsert) likely never fires.

### P4.1 — Choose ONE fix
**Option A (recommended) — add the column** so `defaults` carries freshness and the existing function works unchanged:
```sql
alter table public.defaults add column if not exists updated_at timestamptz not null default now();
```
**Option B — edit the Edge Function** to drop `updated_at` from the upsert (redeploy `update_holiday_theme`). Use this if you don't want a freshness column.

> Pick A if you also want the themes manifest (P5/S3) to live in `defaults` with an `updated_at`; it pairs cleanly.

### P4.2 — Verify the function actually runs end-to-end
- Manually invoke the function (dashboard "Invoke" or the cron's `net.http_post`) and read **edge-function logs** (`get_logs(service: 'edge-function')`): expect a `🎉 Active Holiday` or `💤 No holiday active` log line, **no** error.
- Confirm `select * from defaults where key = 'active_holiday_theme'` now has a value.
- Confirm the `holiday_changed` broadcast is received by a connected client ([HolidayCalendar.tsx](src/apps/calendar/HolidayCalendar.tsx) listens on the broadcast channel).
- Increase the cron timeout (`timeout_milliseconds:=1000` is too short for the function's DB+broadcast work — it returns before completion, which is why "success" was misleading):
  ```sql
  -- re-author the cron command with a larger timeout (e.g. 10s)
  -- via cron.alter_job / re-schedule; keep schedule '0 0 * * *'.
  ```
**Verify:** next scheduled run leaves a fresh `defaults.active_holiday_theme` and a clean log.

---

## Priority 5 — Asset delivery optimization

**Evidence:** 5 public buckets, `file_size_limit=null`, no MIME allow-list, no manifest; client does ≤31 `list()`/mount (games) and ≤32 HEAD/boot (themes).

### P5.1 — `games_index` (S2)
```sql
begin;
create table if not exists public.games_index (
  game_id    text primary key,
  system     text not null,
  title      text not null,
  rom_path   text not null,
  thumb_path text,
  updated_at timestamptz not null default now()
);
alter table public.games_index enable row level security;
drop policy if exists "public read games_index" on public.games_index;
create policy "public read games_index" on public.games_index
  for select to anon, authenticated using (true);
commit;
```
**Populate:** an Edge Function (triggered after ROM uploads) or a cron that lists the `games` bucket **server-side once** and writes the manifest. Client fetches one row set instead of 31 `list()` calls.
**Then (SEC-7):** drop the broad bucket-listing policy now that the client no longer enumerates:
```sql
drop policy if exists "Public Read Access" on storage.objects;   -- games listing
drop policy if exists "Public read access" on storage.objects;    -- wallpapers listing
```
**Verify:** games app loads from `games_index` (1 read); object URLs still resolve; anon `storage.from('games').list()` no longer returns the full file list.

### P5.2 — Themes manifest (S3)
```sql
insert into public.defaults (key, value)
values ('themes_manifest', '{"<themeId>":"<wallpaperUrl>", "...":"..."}')
on conflict (key) do update set value = excluded.value;
```
**Client:** [themes.ts](src/config/themes.ts) reads `defaults.themes_manifest` (one PK lookup) and stops HEAD-probing.
**Verify:** zero HEAD requests on boot; themes resolve from the manifest.

### P5.3 — Cache headers / CDN (S5)
- Upload assets with `Cache-Control: public, max-age=31536000, immutable` and versioned paths so repeat egress is served from CDN.
- Track Storage egress in the dashboard — the most likely cost ceiling.
**Verify:** repeat asset loads return from cache (304 / CDN hit); egress curve flattens.

---

## 6. Sequenced checklist

| # | Item | Priority | Schema change? | Client change? | Effort |
|---|------|:--------:|:--------------:|:--------------:|:------:|
| P1.1 | search_path on functions | Security | ✅ | — | S |
| P1.2 | drop raw-row SELECT (visits/scores) | Security | ✅ | small (uses counter) | S |
| P1.3 | constrain visits INSERT | Security | ✅ | — | S |
| P1.4 | PG upgrade + bucket limits | Security | ✅ (buckets) | — | M |
| P2.1 | visit_stats counter + publish | Realtime | ✅ | ✅ useVisitors | M |
| P2.2 | publish guestbook | Realtime | ✅ | — | S |
| P2.3 | remove games-realtime sub | Realtime | — | ✅ EmulatorApp | S |
| P3.1 | game_scores + guestbook indexes | Leaderboard | ✅ | — | S |
| P3.2 | sargable rankings + anon_id type fix | Leaderboard | ✅ | — | S |
| P4.1 | fix defaults.updated_at (or edge fn) | Holiday | ✅ or redeploy | — | S |
| P4.2 | verify cron + raise timeout | Holiday | ✅ (cron) | — | S |
| P5.1 | games_index + drop listing policy | Assets | ✅ | ✅ Emulator | M |
| P5.2 | themes manifest | Assets | ✅ | ✅ themes.ts | S |
| P5.3 | cache headers / egress | Assets | upload config | — | M |

---

## 7. Cross-cutting: track migrations (SEC-11)
Apply **every** item above as a tracked migration (`supabase db diff` / versioned SQL in git), not via the dashboard. `list_migrations` is currently empty; from Phase 5 onward the schema must be reproducible and reviewable. After each schema item, re-run `get_advisors(security)` and `get_advisors(performance)` and record the deltas.

---

## 8. Status
**Authored, not applied. No database changes executed automatically.** This plan consumes the live findings from [SUPABASE_DISCOVERY.md](SUPABASE_DISCOVERY.md), [SUPABASE_SECURITY_AUDIT.md](SUPABASE_SECURITY_AUDIT.md), and [SUPABASE_SCALABILITY_PLAN.md](SUPABASE_SCALABILITY_PLAN.md). Ship [PHASE_4_5_SECURITY_HOTFIX.md](PHASE_4_5_SECURITY_HOTFIX.md) first, then work Priorities 1→5 as tracked migrations with verification at each step.
