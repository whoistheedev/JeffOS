# JeffOS — Supabase Scalability Plan

> Live scalability assessment of project `akqqmrqeloasisiybdjx` (**whoisthedev portfolio**), 2026-06-21, from catalog reads + `get_advisors(type:performance)`. **Read-only — nothing was modified.**
> Source data: [SUPABASE_DISCOVERY.md](SUPABASE_DISCOVERY.md). Companion: [SUPABASE_SECURITY_AUDIT.md](SUPABASE_SECURITY_AUDIT.md), [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md).

---

## 0. Where the project is today (baseline)

| Signal | Live value |
|--------|-----------|
| Largest table | `visits` — **7 rows / 184 kB** |
| All other app tables | **0 rows** |
| DB total footprint | trivial (<400 kB across app tables) |
| Realtime postgres_changes | **non-functional** — `supabase_realtime` publication is empty |
| Scheduled jobs | 1 (`daily_holiday_update`, daily; **the function it calls is broken** — see discovery §5a) |
| Performance advisor | 1 INFO only: unindexed FK on `game_scores.session_id` |

**Interpretation:** the database itself is nowhere near a load ceiling — it's effectively empty. The scalability risks here are **structural** (designs that scale badly *once traffic/data arrives*) and **architectural** (work pushed to the client that should be precomputed), not current bottlenecks. This plan is about fixing the shape **before** the data grows, plus repairing the realtime regression that's degrading UX now.

---

## 1. Risk register (live-derived)

| ID | Risk | Severity | Triggers at scale |
|----|------|----------|-------------------|
| **S1** | Realtime postgres_changes broken (empty publication) | 🟠 High (UX now) | Already broken — worsens perceived quality immediately |
| **S2** | Games discovery = up to **31 storage `list()` calls/mount** | 🟠 High | Every page load; multiplies with concurrent users |
| **S3** | Theme resolution = up to **32 HEAD requests/boot** | 🟠 High | Every cold load |
| **S4** | `game_scores` leaderboard **full-scans** (no useful index) | 🟠 High | Once scores accumulate (1k+ rows) |
| **S5** | Public buckets, **no CDN cache headers / size limits** | 🟠 High | Bandwidth + egress cost as assets/users grow |
| **S6** | Exact `COUNT(*)` on unbounded `visits` | 🟡 Medium | As `visits` grows to 10⁵–10⁶ |
| **S7** | No connection pooling discipline for Edge Functions | 🟢 Low | High concurrent function invocation |

---

## 2. Detailed plan

### S1 🟠 Fix (or remove) realtime — it currently does nothing
**Live evidence:** `supabase_realtime` publication has **zero member tables** (`pg_publication_tables` empty for that pub). The client subscribes to `visitors` (visits), `guestbook-updates` (guestbook), and `games-realtime` (storage.objects) but receives **no events**. Broadcast channels (`theme-sync`, `holiday_theme`) work — they use a different transport.

**Decision required per feature** — don't blindly re-enable, because re-enabling the `visits` `*` subscription re-introduces the O(N²) "count storm" the original audit feared:

**Option A — make realtime work, with the storm mitigated (recommended for visitor count):**
```sql
-- 1) maintain a single counter row instead of every client COUNT(*)
create table if not exists public.visit_stats (
  id int primary key default 1,
  total bigint not null default 0
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

create trigger trg_bump_visit_stats
  after insert on public.visits
  for each row execute function public.bump_visit_stats();

-- 2) publish ONLY the tiny counter table (1 row) to realtime, not `visits`
alter publication supabase_realtime add table public.visit_stats;
alter table public.visit_stats replica identity full;
```
Client then subscribes to `visit_stats` (one row, one UPDATE per visit) instead of running `COUNT(*)` on every client on every event. This is **O(1) per event**, not O(N²).

For **guestbook** (low write volume, payload-carrying), simply add it to the publication — the client already appends the payload to cache, no COUNT involved:
```sql
alter publication supabase_realtime add table public.guestbook;
alter table public.guestbook replica identity full;
```

**Option B — drop the dead subscriptions** (recommended for `games-realtime`): ROM uploads are rare and admin-driven; live-refreshing the games list isn't worth a `storage.objects` realtime subscription. Remove the client subscription and rely on the `games_index` (S2) + manual refresh.

> **Do not** add raw `public.visits` with `event:*` back to the publication without the counter mitigation — that's the original storm.

---

### S2 🟠 `games_index` — collapse 31 `list()` calls into 1 read
**Live evidence:** no `games_index` table/view exists; the games UI enumerates the bucket at runtime (up to 31 `storage.list()` calls per mount). Bucket listing is also a security surface (audit SEC-7).

**Plan:** precompute a single manifest. Two implementation choices:

**B1 — a table refreshed on upload (richest):**
```sql
create table if not exists public.games_index (
  game_id    text primary key,
  system     text not null,
  title      text not null,
  rom_path   text not null,
  thumb_path text,
  updated_at timestamptz not null default now()
);
-- public read:
alter table public.games_index enable row level security;
create policy "public read games_index" on public.games_index
  for select to anon, authenticated using (true);
```
Populate it from an Edge Function triggered after ROM uploads (or a cron that lists the bucket *server-side* once and writes the manifest). The client fetches **1 row set** instead of 31 list calls, and you can then remove the broad bucket-listing policy (SEC-7).

**B2 — a static JSON manifest in the `games` bucket** (`games/index.json`), regenerated on upload. Client fetches one cached object. Cheapest; no DB involved.

Either way: **1 request replaces ≤31**, and it's cacheable.

---

### S3 🟠 Themes manifest — kill the 32 HEAD probes
**Live evidence:** `themes.ts` HEAD-probes up to 4 extensions × N themes (~32 requests) every cold boot to guess wallpaper URLs. No manifest exists.

**Plan:** store one manifest mapping `themeId → wallpaperUrl`. Reuse the existing `defaults` key/value table (it already serves config) or a static JSON in the `themes` bucket:
```sql
-- option: single defaults row holding the JSON manifest
insert into public.defaults (key, value)
values ('themes_manifest', '{"win98":"https://…/win98.png","macos":"https://…/macos.webp"}')
on conflict (key) do update set value = excluded.value;
```
Client reads one value (already an indexed PK lookup on `defaults.key`) and skips all HEAD probing. **≤32 speculative requests → 0.**

> Note: this is also where the **broken holiday flow** should be reconciled — `update_holiday_theme` writes `defaults.active_holiday_theme` but currently crashes on a non-existent `updated_at` column (discovery §5a). Fix that (`alter table public.defaults add column updated_at timestamptz default now();` **or** remove `updated_at` from the upsert) so holiday + theme config share one clean store.

---

### S4 🟠 Index `game_scores` before leaderboards grow
**Live evidence:** `game_scores` has only `game_scores_pkey` on `id`. **Every** ranking path filters by `game_id` and compares `score`/`created_at`:
- `get_rankings_all`: `where game_id = $1 group by anon_id order by score desc`
- `get_rankings_today`: `where game_id = $1 and created_at::date = $2`
- `rank_alltime`: `where game_id = $1 and score > $2`
- `rank_today`: `where game_id = $1 and created_at::date = today and score > $2`

Plus the **unindexed FK** `session_id` (performance advisor `unindexed_foreign_keys`, INFO). At 0 rows these are free; at 10⁴–10⁶ score rows each `game-submit` does **two full table scans** (rank_today + rank_alltime).

**Remediation (authored, not applied):**
```sql
-- composite for both all-time rank/ranking queries:
create index if not exists game_scores_game_score_idx
  on public.game_scores (game_id, score desc);

-- for the "today" variants (date-bounded). Use a plain btree on (game_id, created_at):
create index if not exists game_scores_game_created_idx
  on public.game_scores (game_id, created_at);

-- cover the foreign key (fixes the perf advisor):
create index if not exists game_scores_session_id_idx
  on public.game_scores (session_id);
```
> Caveat: `created_at::date = $d` is **not sargable** against `(game_id, created_at)` — the planner can still range-scan if you rewrite the function to `created_at >= $d::timestamptz and created_at < ($d + 1)::timestamptz`. Recommend refactoring `get_rankings_today`/`rank_today` to a half-open range so the index is actually used.

Also index `guestbook.created_at` (its only ORDER BY):
```sql
create index if not exists guestbook_created_at_idx on public.guestbook (created_at desc);
```

---

### S5 🟠 Asset delivery: caching, limits, egress
**Live evidence:** all 5 buckets are public with `file_size_limit = null` and no MIME allow-list. ROMs/wallpapers/thumbs are large public blobs served from Storage.

**Plan:**
- Serve via the Supabase CDN (public buckets already are) but ensure long-lived immutable cache headers on object URLs (`getPublicUrl` with versioned paths, or set `Cache-Control` on upload, e.g. `public, max-age=31536000, immutable`). This cuts repeat egress dramatically.
- Set per-bucket `file_size_limit` + MIME allow-lists (audit SEC-8) — also prevents accidental huge uploads inflating egress.
- For ROMs specifically (largest assets), consider lazy/on-demand fetch (already the pattern) and a thumbnail-first UI so the 50–200 MB blobs only download on play.
- Track Storage egress in the dashboard; it's the most likely *cost* ceiling well before any DB limit.

---

### S6 🟡 Visitor count: stop exact COUNT on an unbounded table
**Live evidence:** `visits` is 7 rows today; the client does `count: exact, head: true`. The realtime re-trigger is currently dead (S1), so it runs once per mount — cheap now, but exact COUNT is O(rows) and `visits` only grows.

**Plan:** the **same `visit_stats` counter** from S1 solves this — the client reads one integer (`select total from visit_stats where id=1`, a PK lookup) instead of `COUNT(*)`. Pairs perfectly with the S1 realtime mitigation. Also satisfies security SEC-4 (no need to expose raw visit rows).

---

### S7 🟢 Edge Function DB connections
**Observation:** each Edge Function does `createClient(url, SERVICE_KEY)` per invocation. At low volume this is fine. At high concurrent invocation, prefer the **pooled** connection (Supavisor / `?pgbouncer=true` / transaction pooler) for any function doing direct DB work (`game-start`, `game-submit`, `guestbook-add`, `update_holiday_theme`). Verify the functions reuse the client across the module scope (they create it inside the handler — moving it to module scope, as `guestbook-add` does, is better) and that the project's pooler is used for the connection string. No action needed until function concurrency climbs.

---

## 3. Sequenced roadmap (Phase 5)

| Order | Item | Why first | Effort |
|------:|------|-----------|--------|
| 1 | **S1 visit_stats counter + trigger** | Unblocks both realtime UX *and* S6; one migration | S |
| 2 | **S4 indexes** (`game_scores` ×3, `guestbook` ×1) | Cheap now, painful later; clears perf advisor | S |
| 3 | **S3 themes manifest** + fix broken holiday upsert | Removes 32 req/boot; fixes a live bug | S |
| 4 | **S2 games_index** | Removes ≤31 req/mount; enables SEC-7 cleanup | M |
| 5 | **S5 cache headers + bucket limits** | Controls egress cost as users grow | M |
| 6 | **Decide guestbook/games realtime** (add to pub or drop) | After counter pattern proven | S |
| 7 | **S7 pooling** | Only when function concurrency warrants | S |

> All of the above should land as **tracked migrations** (none exist today — discovery §0 / security SEC-11), so the schema becomes reproducible and reviewable.

---

## 4. Capacity headroom (honest read)

The database is **empty** and will comfortably handle current traffic indefinitely — there is **no urgent load problem**. The value of this plan is in the *order-of-magnitude* fixes that prevent self-inflicted slowness once the portfolio gets real traffic or the arcade collects scores: replacing per-client COUNTs with a counter, replacing dozens of speculative storage/HEAD requests with single cached reads, and indexing the leaderboard before it's populated. Do S1–S4 now (they're tiny and forward-looking); S5–S7 are cost/scale hygiene you can stage as usage grows.

---

*No database changes were made. All SQL above is a proposal for review before Phase 5 implementation.*
