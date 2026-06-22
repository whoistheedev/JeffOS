# JeffOS — Supabase Discovery

> Backend discovery, **now fully live-verified** against the Postgres catalog via the Supabase MCP server. **Nothing was modified** (read-only catalog probes only). Probes run 2026-06-21.
> Companion: [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) · [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md) · [REFACTOR_ROADMAP.md](REFACTOR_ROADMAP.md) · [SUPABASE_SECURITY_AUDIT.md](SUPABASE_SECURITY_AUDIT.md) · [SUPABASE_SCALABILITY_PLAN.md](SUPABASE_SCALABILITY_PLAN.md)

---

## ✅ Source-of-truth status (read first)

The Supabase MCP server (project ref `akqqmrqeloasisiybdjx`, **whoisthedev portfolio**, region `us-east-2`, status `ACTIVE_HEALTHY`, Postgres `17.4.1.074`) is authenticated and was queried directly. **Every section below is now catalog-sourced live data**, not inferred. The previous 🔶 PENDING tiers have been resolved.

> **Headline corrections vs. the code-only draft** (these are real and material):
> 1. There are **8 public tables**, not 5 — the draft missed `game_sessions` and `game_scores` (an entire arcade leaderboard backend) and `projects` has more columns than the client reads.
> 2. **`public.projects` has RLS DISABLED** — anon key can read/write every row. Critical. (§7, [security audit](SUPABASE_SECURITY_AUDIT.md))
> 3. The **`supabase_realtime` publication contains ZERO tables** — so `postgres_changes` realtime **does not actually fire** for `visits`, `guestbook`, or `storage.objects`. The client subscribes but receives nothing. (§10)
> 4. There are **5 Edge Functions**, not 2: `game-start`, `game-submit`, `guestbook-add`, `spotify-token`, `update_holiday_theme`. (§9)
> 5. A **pg_cron job** (`daily_holiday_update`, `0 0 * * *`) drives the holiday theme — but the function it calls is **silently broken** (writes a non-existent `updated_at` column to `defaults`). (§5a)
> 6. **No DB migrations are tracked** (`supabase_migrations` is empty) — the schema was built ad-hoc via the dashboard. (§0)

---

## 0. Project Overview

| | |
|---|---|
| **Project** | `whoisthedev portfolio` |
| **Project ref** | `akqqmrqeloasisiybdjx` |
| **Region / status** | `us-east-2` · `ACTIVE_HEALTHY` |
| **Postgres** | `17.4.1.074` (⚠️ security patches available — see [security audit](SUPABASE_SECURITY_AUDIT.md)) |
| **API URL** | `https://akqqmrqeloasisiybdjx.supabase.co` |
| **Client** | `@supabase/supabase-js` v2.55, single anon client ([src/lib/supabase.ts](src/lib/supabase.ts)), `persistSession`/`autoRefreshToken` on |
| **Auth** | No auth flow — **anonymous access only**; users tracked by a client-generated `anonId` (localStorage). All Postgres access uses the `anon` role. |
| **Services used** | Postgres (8 public tables, 5 functions), Storage (5 buckets), Realtime (broadcast only — postgres_changes is **non-functional**), Edge Functions (5), pg_cron (1 job) |
| **Migrations** | **None tracked** — `supabase_migrations.schema_migrations` is empty; schema is dashboard-authored |
| **Installed extensions** | `pg_net 0.14.0`, `uuid-ossp 1.1`, `pgcrypto 1.3`, `pg_cron 1.6`, `pg_stat_statements 1.11`, `supabase_vault 0.3.1`, `plpgsql 1.0` (all others available but not installed) |

---

## 1. Database Tables ✅ LIVE-VERIFIED

Eight tables in `public`. Full column/type list from `information_schema` + `list_tables`. RLS state per `pg_class.relrowsecurity`.

| Table | Rows (live) | Total size | RLS | PK |
|-------|------------:|-----------:|-----|----|
| `visits` | **7** | 184 kB | ✅ enabled | `id` |
| `guestbook` | 0 | 32 kB | ✅ enabled | `id` |
| `defaults` | 0 | 32 kB | ✅ enabled | `key` |
| `projects` | 0 | 48 kB | 🔴 **DISABLED** | `id` |
| `calendar_holidays` | 0 | 32 kB | ✅ enabled | `id` |
| `game_sessions` | 0 | 16 kB | ✅ enabled | `session_id` |
| `game_scores` | 0 | 16 kB | ✅ enabled | `id` |

> The "0 rows" for most tables reflects this snapshot (`pg_stat_user_tables.n_live_tup`); only `visits` has data (7 anon visitors). `projects` is empty **and** unprotected.

### 1.1 `visits`
- `id` int4 PK (`nextval('visits_id_seq')`), `anon_id` text **UNIQUE** (`visits_anon_id_key`), `visited_at` timestamptz default `now()`.
- Client: `upsert({ anon_id })` on `anon_id` conflict; `select("*", {count:"exact", head:true})`.
- The unique index on `anon_id` makes the upsert correct (one row per visitor). ✅

### 1.2 `guestbook`
- `id` uuid PK (`gen_random_uuid()`), `anon_id` text NOT NULL, `handle` text NULL, `message` text NOT NULL, `created_at` timestamptz default `now()`.
- Client SELECTs; **inserts go through the `guestbook-add` Edge Function** (service role) which masks profanity + enforces a 2s anti-bot delay and length limits. RLS *also* permits public direct insert (see §7 — a redundancy/risk).

### 1.3 `defaults`
- `key` text PK, `value` text. **Only two columns** — no `updated_at`. (Relevant to the broken edge function in §5a.)
- Client: `select("value").eq("key","global_wallpaper").single()`. Also stores `active_holiday_theme` (intended; see §5a).

### 1.4 `projects` 🔴
- `id` int8 identity PK (ALWAYS), `name` text NOT NULL, `description` text NULL, `slug` text NULL **UNIQUE** (`projects_slug_unique`), `thumbnail_url` text NULL, `live_url` text NULL, `active` bool default `true`, `created_at`/`updated_at` timestamptz default `now()`.
- Client: `select("*").eq("active",true).order("id")`.
- **RLS is DISABLED.** With the anon key, anyone can `INSERT/UPDATE/DELETE` rows. The draft only suspected this; it is confirmed. See [security audit](SUPABASE_SECURITY_AUDIT.md) S1.
- The client reads more columns than the draft listed (`name`, `slug`, `thumbnail_url`, `live_url`, `description`).

### 1.5 `calendar_holidays`
- `id` uuid PK (`extensions.uuid_generate_v4()`), `name` text NOT NULL, `theme_id` text NOT NULL, `rule` text NOT NULL, `description` text NULL, `created_at` timestamptz default `now()`.
- `rule` encodes the holiday matcher used by `update_holiday_theme`: `fixed:MM-DD`, `range:MM-DD,MM-DD`, `thanksgiving`, `eid`, `cny`.

### 1.6 `game_sessions` 🆕 (missed by the code-only draft)
- `session_id` uuid PK, `anon_id` text NOT NULL, `game_id` text NOT NULL, `seed` text NOT NULL, `token` text NOT NULL, `started_at` timestamptz default `now()`.
- Written **only** by the `game-start` Edge Function (service role). Issues a `{session_id, token, seed}` to start an anti-cheat game session.

### 1.7 `game_scores` 🆕 (missed by the code-only draft)
- `id` int4 PK (`nextval`), `session_id` uuid **FK → game_sessions** (`game_scores_session_id_fkey`, NULLable), `anon_id` text NOT NULL, `game_id` text NOT NULL, `score` int4 NOT NULL, `duration` numeric NULL, `created_at` timestamptz default `now()`.
- Inserted by `game-submit` (service role) after validating the session token. RLS *also* allows anon direct insert/select (§7 — leaderboard tamper risk).

---

## 2. Views ✅ LIVE-VERIFIED
**No views exist** in `public` (`information_schema.views` → empty). The app queries base tables and SQL functions directly.

---

## 3. Functions ✅ LIVE-VERIFIED

Five `public` functions (from `pg_proc` + `pg_get_functiondef`). All are leaderboard/utility helpers. **None are `SECURITY DEFINER`** (all run as the calling role); **none set `search_path`** (a security-lint warning — §7).

| Function | Args | Lang | Returns | Purpose |
|----------|------|------|---------|---------|
| `get_rankings_all(g_id text)` | game id | sql STABLE | `TABLE(anon_id uuid, score int)` | Top score per player, all-time, for a game. |
| `get_rankings_today(g_id text, d date)` | game id, date | sql STABLE | `TABLE(anon_id uuid, score int)` | Top score per player on a given date. |
| `rank_alltime(gameid text, score_input int)` | game, score | sql STABLE | `int` | `count(*)+1` where `score > input` (your rank). |
| `rank_today(gameid text, score_input int)` | game, score | sql STABLE | `int` | Same, scoped to today via `created_at::date`. |
| `update_updated_at_column()` | — | plpgsql | trigger | Sets `new.updated_at = now()`. **Defined but NOT attached to any public trigger** (see §5). |

> ⚠️ Type bug latent in rankings: `get_rankings_*` declare `anon_id uuid`, but `game_scores.anon_id` is **text**. With real data this raises a cast error unless every `anon_id` is a valid UUID string. The client generates `anonId` from localStorage — confirm it is UUID-shaped, or these RPCs will fail at runtime.
> `rank_today`/`rank_alltime` are called by the `game-submit` edge function via `supabase.rpc(...)`.

---

## 4. RPCs called from client ✅
- **None directly from the browser** (`grep .rpc(` in `src/` → none). The ranking RPCs are called **server-side** inside `game-submit`. So the client never touches the leaderboard functions directly.

---

## 5. Triggers ✅ LIVE-VERIFIED
**Zero triggers exist in `public`.** (`pg_trigger` filtered to `public`, non-internal → empty.)
- The `update_updated_at_column()` function exists but is **not wired to any trigger** — so `projects.updated_at` (and any other `updated_at`) is **only** set on INSERT default and never auto-bumped on UPDATE. If `updated_at` freshness matters, the trigger is missing.
- The only triggers in the DB are Supabase-managed ones in `storage` (`enforce_bucket_name_length`, `protect_buckets_delete`, `protect_objects_delete`, `update_objects_updated_at`).

### 5a. Scheduled job (pg_cron) ✅ LIVE-VERIFIED 🆕
| Job | Schedule | Action | Status |
|-----|----------|--------|--------|
| `daily_holiday_update` (jobid 1) | `0 0 * * *` (daily 00:00 UTC) | `net.http_post` → `/functions/v1/update_holiday_theme` (1000 ms timeout) | active; **246 runs, all "succeeded"** (last `2026-06-21 00:00`) |

> 🐛 **Latent bug:** the cron "succeeds" because it only measures whether the HTTP POST *fired* (and with a 1000 ms timeout it returns before the function finishes). Inside `update_holiday_theme`, the code does `defaults.upsert({ key, value, updated_at })` — but `defaults` has **no `updated_at` column** (§1.3). PostgREST will reject the upsert, the function throws, and because the broadcast `.send()` runs *after* the upsert, **the holiday theme is never persisted and likely never broadcast**. The daily job is effectively a no-op. Confirm via edge-function logs before relying on holiday theming.

---

## 6. Indexes ✅ LIVE-VERIFIED

From `pg_indexes`. Every table has its PK index. Notable extras:

| Table | Index | Definition |
|-------|-------|-----------|
| `visits` | `visits_pkey` | UNIQUE btree (`id`) |
| `visits` | `visits_anon_id_key` | UNIQUE btree (`anon_id`) — makes upsert correct ✅ |
| `defaults` | `defaults_pkey` | UNIQUE btree (`key`) ✅ |
| `projects` | `projects_pkey` | UNIQUE btree (`id`) |
| `projects` | `projects_slug_unique` | UNIQUE btree (`slug`) ✅ |
| `guestbook` | `guestbook_pkey` | UNIQUE btree (`id`) |
| `calendar_holidays` | `calendar_holidays_pkey` | UNIQUE btree (`id`) |
| `game_sessions` | `game_sessions_pkey` | UNIQUE btree (`session_id`) |
| `game_scores` | `game_scores_pkey` | UNIQUE btree (`id`) |

**Missing indexes that matter** (see [scalability plan](SUPABASE_SCALABILITY_PLAN.md)):
- `guestbook` — **no index on `created_at`**, yet the only query is `order("created_at")`. Fine at 0 rows; a sort cost as it grows.
- `game_scores` — **no index on `(game_id, score)`** or `(game_id, created_at)`, yet **every** ranking function and RPC filters by `game_id` and compares `score`/`created_at`. Leaderboards will full-scan.
- `game_scores.session_id` (FK) — **unindexed foreign key** (confirmed by the performance advisor). 
- `projects.active` — filter column, low cardinality; acceptable to skip.

---

## 7. RLS Policies ✅ LIVE-VERIFIED

RLS enabled on all public tables **except `projects`**. Policies from `pg_policies`:

| Table | Policy | Cmd | Roles | USING | WITH CHECK |
|-------|--------|-----|-------|-------|-----------|
| `calendar_holidays` | Allow read to all users | SELECT | public | `true` | — |
| `defaults` | anon can read defaults | SELECT | anon | `true` | — |
| `guestbook` | Public select | SELECT | public | `true` | — |
| `guestbook` | Public insert | INSERT | public | — | `true` ⚠️ |
| `visits` | anon can select visits | SELECT | anon | `true` | — |
| `visits` | anon can insert visits | INSERT | anon | — | `true` ⚠️ |
| `game_scores` | anon select scores | SELECT | anon | `true` | — |
| `game_scores` | anon insert scores | INSERT | anon | — | `true` ⚠️ |
| `game_sessions` | anon insert sessions | INSERT | anon | — | `true` ⚠️ |
| `projects` | — (RLS disabled) | — | — | — | 🔴 fully exposed |
| `storage.objects` | Public Read Access | SELECT | public | `bucket_id='games'` | — |
| `storage.objects` | Public read access | SELECT | public | `bucket_id='wallpapers'` | — |

**Security implications** (full treatment in [SUPABASE_SECURITY_AUDIT.md](SUPABASE_SECURITY_AUDIT.md)):
- 🔴 **`projects` RLS disabled** — anon read **and write** of all rows.
- ⚠️ **`guestbook` allows public direct INSERT** — the `guestbook-add` Edge Function's profanity filter / rate limit is **bypassable**: anyone can `supabase.from('guestbook').insert(...)` directly with raw, unfiltered content.
- ⚠️ **`game_scores` / `game_sessions` allow anon direct INSERT** — the `game-start`/`game-submit` anti-cheat token flow is **bypassable**: a client can insert arbitrary scores directly, defeating the server-validated session.
- ⚠️ No UPDATE/DELETE policies anywhere — anon cannot update/delete (good), but also note no SELECT restriction means **anon can read every visitor's `anon_id` and every score row**, not just counts.
- ⚠️ `storage.objects` SELECT policies on `games`/`wallpapers` allow **listing** all files (advisor `public_bucket_allows_listing`) — public buckets don't need this for URL access.

---

## 8. Storage Buckets ✅ LIVE-VERIFIED

Five buckets (from `storage.buckets`). The draft listed 4 and missed `portfolio_thumb`. **All public; none have size limits or MIME restrictions.**

| Bucket | Public | Size limit | MIME allow-list | Created | Used by |
|--------|--------|-----------|-----------------|---------|---------|
| `games` | ✅ | none | none | 2025-10-07 | ROMs + `thumbs/` — [EmulatorApp.tsx](src/apps/games/EmulatorApp.tsx), [GameLibrary.tsx](src/apps/games/components/GameLibrary.tsx) |
| `wallpapers` | ✅ | none | none | 2025-10-06 | [WallpapersApp.tsx](src/apps/wallpapers/WallpapersApp.tsx) |
| `themes` | ✅ | none | none | 2025-10-15 | [themes.ts](src/config/themes.ts) |
| `portfolio` | ✅ | none | none | 2025-10-21 | résumé PDF — [Recruiter.tsx](src/apps/recruiter/Recruiter.tsx) |
| `portfolio_thumb` 🆕 | ✅ | none | none | 2025-10-21 | project thumbnails (referenced via `projects.thumbnail_url`) |

**Bucket permissions:** only `games` and `wallpapers` have explicit `storage.objects` SELECT policies (both `USING (bucket_id = ...)`, public). `themes`, `portfolio`, `portfolio_thumb` are public buckets served via signed public object URLs but have **no listing policy** (so they can't be enumerated — actually the safer config). No INSERT/UPDATE/DELETE policies exist on `storage.objects` for any bucket, so uploads must go through the dashboard/service role. ✅

> ⚠️ `file_size_limit = null` + `allowed_mime_types = null` on every bucket = **no upload guardrails** at the storage layer. Since there are no anon INSERT policies this isn't directly exploitable by the anon key, but any service-role/dashboard upload path is unconstrained. See [security audit](SUPABASE_SECURITY_AUDIT.md).

---

## 9. Edge Functions ✅ LIVE-VERIFIED (bodies retrieved)

Five functions (`list_edge_functions` + `get_edge_function` bodies). All use `SERVICE_KEY` internally where they write.

| Function | `verify_jwt` | Version | Invoked from | Behavior (from source) |
|----------|:-----------:|:-------:|--------------|------------------------|
| `guestbook-add` | **false** | 33 | [Guestbook.tsx](src/apps/guestbook/Guestbook.tsx) | Checks `Authorization: Bearer sb_publishable_…` header; profanity-masks; enforces `Date.now()-startedAt ≥ 2000ms`, handle 2–16 chars, message 1–280; inserts via service role. |
| `game-start` | **true** | 22 | games | Creates a `game_sessions` row with random `session_id`/`token`/`seed`; returns them. |
| `game-submit` | **true** | 22 | games | Validates `(session_id, token)`; inserts `game_scores`; calls `rank_today`/`rank_alltime` RPCs; returns ranks. |
| `spotify-token` | **false** | 15 | [iTunesApp.tsx](src/apps/music/iTunesApp.tsx) | Refreshes a personal Spotify token; falls back to `client_credentials`. Secrets stay server-side. |
| `update_holiday_theme` | **false** | 3 | cron `daily_holiday_update` | Matches today against `calendar_holidays.rule`; upserts `defaults.active_holiday_theme`; broadcasts `holiday_changed` on channel `holiday_theme`. **🐛 broken — see §5a.** |

> `game-start`/`game-submit` require a JWT (`verify_jwt:true`). Since the app has no auth, confirm the client passes the anon publishable key as the bearer (Supabase treats the anon key as a valid JWT) — otherwise these 401. `guestbook-add` and `spotify-token` are `verify_jwt:false` and self-check (or don't check) auth.

---

## 10. Realtime ✅ LIVE-VERIFIED — **postgres_changes is NON-FUNCTIONAL**

| Publication | All tables? | Tables | Events |
|-------------|:-----------:|--------|--------|
| `supabase_realtime` | no | **NONE** | insert/update/delete/truncate |
| `supabase_realtime_messages_publication` | no | partitioned `realtime.messages_*` (broadcast transport) | all |

🔴 **The `supabase_realtime` publication has zero member tables.** Therefore **no `postgres_changes` events fire** for `visits`, `guestbook`, or `storage.objects`. The client subscribes to these channels but **receives nothing**:

| Client channel | Type | Target | Actually works? |
|----------------|------|--------|:---------------:|
| `visitors` | postgres_changes `*` | `public.visits` | ❌ table not in publication → silent |
| `guestbook-updates` | postgres_changes `INSERT` | `public.guestbook` | ❌ table not in publication → silent |
| `games-realtime` | postgres_changes `*` | `storage.objects` (bucket=games) | ❌ not in publication → silent |
| `theme-sync` / `holiday_theme` | **broadcast** | events `theme_change` / `holiday_changed` | ✅ broadcast works (different transport) |

**Net effect:** the visitor count does NOT live-update, the guestbook does NOT live-append, and the games list does NOT live-refresh — they only update on the next manual fetch/remount. This *masks* the "S1 query storm" the draft feared (it can't storm if it never fires), but it's a **functional regression**: the realtime UX is broken. Decide per-feature whether to (a) add the tables to the publication and *then* mitigate the storm, or (b) drop the dead subscriptions. See [scalability plan](SUPABASE_SCALABILITY_PLAN.md) S1.

---

## 11. Current Query Patterns ✅
- **Visitor count** via `select("*",{count:"exact",head:true})` on `visits` (7 rows). The realtime re-trigger is **dead** (§10), so it currently runs once per mount only. Exact COUNT is cheap now; grows with the table.
- **Storage listing as discovery** — games (≤31 `list()` calls/mount) and wallpapers (1 + N folders). No DB index of assets. The `games-realtime` re-list trigger is **dead** (§10), so re-lists only happen on remount.
- **HEAD-probe theme resolution** — up to 32 `fetch(HEAD)` per boot to guess wallpaper extensions ([themes.ts](src/config/themes.ts)).
- **Leaderboards** — server-side only (`game-submit` → RPCs). No client reads of `game_scores` today despite the anon SELECT policy.
- **Writes** — `visits.upsert` (anon), `guestbook` (via edge fn **and** anon-direct, both allowed), `game_*` (via edge fn **and** anon-direct, both allowed).

---

## 12. Scalability Risks ✅ (re-derived from live data; see [SUPABASE_SCALABILITY_PLAN.md](SUPABASE_SCALABILITY_PLAN.md))

| # | Risk | Severity | Live root cause |
|---|------|----------|-----------------|
| S1 | Realtime postgres_changes **broken** (publication empty) | 🟠 High (functional, not load) | `supabase_realtime` has no tables → visitor/guestbook/games live-update silently dead. |
| S2 | Games discovery = up to 31 storage `list()`/mount | 🟠 High | No `games_index`; client enumerates buckets at runtime. |
| S3 | Theme HEAD-probing (≤32 req/boot) | 🟠 High | No themes manifest. |
| S4 | `game_scores` leaderboard full-scans | 🟠 High | No `(game_id, score)` / `(game_id, created_at)` index; FK `session_id` unindexed. Cheap at 0 rows, O(N) per ranking as it grows. |
| S5 | Public buckets, no cache/CDN/size limits | 🟠 High | All 5 buckets public, `file_size_limit=null`, no MIME allow-list. |
| S6 | Exact COUNT on unbounded `visits` | 🟡 Medium | One row per anon; exact COUNT grows. (No longer storms — realtime is dead.) |

---

## 13. Recommended Migrations (Phase 5 targets) ✅

> SQL is **authored but NOT applied** (per "do not modify"). See [SUPABASE_SECURITY_AUDIT.md](SUPABASE_SECURITY_AUDIT.md) and [SUPABASE_SCALABILITY_PLAN.md](SUPABASE_SCALABILITY_PLAN.md) for full, ordered remediation with exact SQL.

1. **Enable RLS on `projects`** + add a public SELECT policy (security S1).
2. **Decide realtime strategy** — either add tables to `supabase_realtime` and add the aggregate-counter mitigation, or delete the dead subscriptions (S1).
3. **Lock down `guestbook` / `game_*` direct inserts** — drop the permissive anon INSERT policies so writes are forced through the Edge Functions (security S2/S3).
4. **Index `game_scores (game_id, score)`, `(game_id, created_at)`, and `session_id`** (S4).
5. **Index `guestbook (created_at)`** (S4).
6. **Fix `update_holiday_theme`** — either add `updated_at` to `defaults` or remove it from the upsert (§5a bug).
7. **Bucket hardening** — drop broad listing policies on `games`/`wallpapers`; set `file_size_limit` + `allowed_mime_types` (S5).
8. **Set `search_path` on all 5 functions**; mark ranking helpers appropriately (security lint).
9. **Track migrations** going forward (the schema is currently untracked).
10. **Reconcile `game_scores.anon_id` type** with the `uuid` return type of `get_rankings_*` (§3 type bug).

---

## 14. SQL Probe Pack (executed 2026-06-21)
The probes from the prior draft were run via MCP `execute_sql`/`list_*`/`get_advisors`/`get_edge_function`. Re-run any of them read-only to refresh. Probe set covered: tables+columns+types, views, functions (with bodies), triggers, indexes, RLS enabled+policies, storage buckets, realtime publications, row counts/sizes, extensions, edge function bodies, pg_cron jobs + run history, and both advisor reports (security + performance).

---

## 15. Status: LIVE ✅
This document is now fully catalog-sourced. The two follow-on deliverables — [SUPABASE_SECURITY_AUDIT.md](SUPABASE_SECURITY_AUDIT.md) and [SUPABASE_SCALABILITY_PLAN.md](SUPABASE_SCALABILITY_PLAN.md) — build on this data. **No database changes were made.**
