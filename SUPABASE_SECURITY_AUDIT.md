# JeffOS — Supabase Security Audit

> Live security audit of project `akqqmrqeloasisiybdjx` (**whoisthedev portfolio**), run 2026-06-21 via the Supabase MCP server (catalog reads + `get_advisors`). **Read-only — nothing was modified.**
> Source data: [SUPABASE_DISCOVERY.md](SUPABASE_DISCOVERY.md). Remediation SQL below is **authored but NOT applied**.

---

## 0. Threat model (1 paragraph)

JeffOS is an **anonymous, no-auth** app. Every browser holds the **anon publishable key** and talks to Postgres as the `anon` role. There are no logged-in users and no `authenticated` role in play. That means **the only thing standing between any visitor and your data is RLS + the policies on the `anon`/`public` roles** — and the secrets baked into Edge Functions. The audit therefore focuses on: (1) tables reachable by the anon key, (2) whether server-side validation (Edge Functions) can be bypassed by going straight to the table, and (3) secret/credential handling.

---

## 1. Findings summary

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| **SEC-1** | 🔴 Critical | `public.projects` has **RLS disabled** — anon can read & **write** every row | Open |
| **SEC-2** | 🟠 High | `guestbook` permits **public direct INSERT** — bypasses the profanity/anti-bot Edge Function | Open |
| **SEC-3** | 🟠 High | `game_scores` & `game_sessions` permit **anon direct INSERT** — defeats the anti-cheat token flow | Open |
| **SEC-4** | 🟡 Medium | All `game_scores` / `visits` rows are **anon-SELECTable** (not just counts) — anon_id enumeration | Open |
| **SEC-5** | 🟡 Medium | 5 functions have **mutable `search_path`** (advisor `function_search_path_mutable`) | Open |
| **SEC-6** | 🟡 Medium | Postgres `17.4.1.074` has **outstanding security patches** | Open |
| **SEC-7** | 🟡 Medium | Public buckets `games`/`wallpapers` allow **object listing** (advisor `public_bucket_allows_listing`) | Open |
| **SEC-8** | 🟢 Low | All 5 buckets have **no `file_size_limit` / MIME allow-list** | Open |
| **SEC-9** | 🟢 Low | `guestbook-add` auth check is a **string-prefix check** on a public key, not real auth | Accepted-risk? |
| **SEC-10** | 🟢 Low/Info | Edge Functions depend on `SERVICE_KEY`/Spotify secrets in env — verify Vault/secret hygiene | Verify |
| **SEC-11** | 🟢 Info | No DB migrations tracked — schema changes are unauditable | Open |

> Advisor source: `get_advisors(type:security)` returned 1 ERROR (`rls_disabled_in_public` → projects), 5 `function_search_path_mutable` WARNs, 4 `rls_policy_always_true` WARNs, 2 `public_bucket_allows_listing` WARNs, and 1 `vulnerable_postgres_version` WARN.

---

## 2. Findings in detail

### SEC-1 🔴 `projects` RLS disabled — full anon read/write
**Evidence:** `pg_class.relrowsecurity = false` for `public.projects`; advisor `rls_disabled_in_public` (level ERROR). Other 6 public tables have RLS enabled.
**Impact:** The anon publishable key is in every client bundle. With RLS off, PostgREST exposes `projects` to `anon` with **no row filter for any command**. Anyone can:
```
// read everything (even active=false / unpublished)
supabase.from('projects').select('*')
// insert spam rows that render in your portfolio
supabase.from('projects').insert({ name:'x', live_url:'http://evil', active:true })
// overwrite or delete your real projects
supabase.from('projects').update({ live_url:'http://evil' }).eq('id', 1)
supabase.from('projects').delete().neq('id', 0)
```
The table is currently empty (0 rows), so there's no data loss *yet*, but the moment you populate it, it's defaceable.
**Remediation (authored, not applied):**
```sql
alter table public.projects enable row level security;

-- public read of only the published rows the client actually queries:
create policy "public read active projects"
  on public.projects for select
  to anon, authenticated
  using (active is true);

-- writes: no anon policy = anon writes denied. Manage rows via dashboard/service role.
```
> Per the advisor's own guidance, enabling RLS **without** a SELECT policy will block the client's read — add the SELECT policy in the same migration.

---

### SEC-2 🟠 `guestbook` public direct INSERT bypasses the Edge Function
**Evidence:** policy `Public insert` — `INSERT`, role `public`, `WITH CHECK (true)` (advisor `rls_policy_always_true`).
**Impact:** `guestbook-add` exists specifically to mask profanity, enforce a 2-second anti-bot delay, and cap handle/message length. But because the table itself allows **anyone** to insert directly:
```
supabase.from('guestbook').insert({ anon_id:'x', handle:'spam', message:'<unfiltered, any length>' })
```
…the entire server-side filter is **optional and trivially skipped**. Spam, profanity, and oversized payloads land directly. This negates the Edge Function's purpose.
**Remediation:** funnel all writes through the Edge Function (service role bypasses RLS), and remove the public INSERT policy:
```sql
drop policy "Public insert" on public.guestbook;
-- keep "Public select" so the wall still renders.
-- guestbook-add uses SERVICE_KEY → still inserts fine.
```
Optionally also add column constraints as defense-in-depth:
```sql
alter table public.guestbook
  add constraint guestbook_msg_len check (char_length(message) between 1 and 280),
  add constraint guestbook_handle_len check (char_length(coalesce(handle,'')) between 2 and 16);
```

---

### SEC-3 🟠 `game_scores` / `game_sessions` anon INSERT defeats anti-cheat
**Evidence:** policies `anon insert scores` and `anon insert sessions`, both `WITH CHECK (true)` for role `anon` (advisor `rls_policy_always_true`).
**Impact:** The `game-start` → `game-submit` flow issues a session `token` and validates it server-side precisely to stop fake scores. With direct anon INSERT allowed, a player can skip the whole flow:
```
// forge a perfect leaderboard entry, no session, no token check:
supabase.from('game_scores').insert({ anon_id:'me', game_id:'snake', score:999999 })
```
Leaderboards become meaningless. (Currently 0 rows, so no tampering yet.)
**Remediation:** force scores through `game-submit` (service role) and drop the permissive policies:
```sql
drop policy "anon insert scores"   on public.game_scores;
drop policy "anon insert sessions" on public.game_sessions;
-- game-start / game-submit use SERVICE_KEY → unaffected.
```
Keep `anon select scores` **only if** the client renders leaderboards client-side (see SEC-4). Today nothing reads it from the browser, so you could drop SELECT too and serve rankings via an Edge Function/RPC.

---

### SEC-4 🟡 Anon can read all rows (not just aggregates)
**Evidence:** `anon can select visits USING (true)`, `anon select scores USING (true)`, `Public select` on guestbook `USING (true)`.
**Impact:** The visitor *count* is the only thing the UI needs from `visits`, but the policy lets anon `select *` and **enumerate every `anon_id`** (a pseudo-identifier you generate per browser). Same for `game_scores.anon_id`. This is a privacy/PII-adjacent leak (anon_ids correlate sessions/devices) rather than a credential leak.
**Remediation options:**
- Replace per-row SELECT with an **aggregate** the client reads (a counter row or a `SECURITY DEFINER` count function), then drop the row-level SELECT on `visits`.
- For `game_scores`, expose only the leaderboard shape (anon_id + max score) via the existing `get_rankings_*` functions instead of raw SELECT.
```sql
-- example: stop exposing raw visit rows; serve a count instead
drop policy "anon can select visits" on public.visits;
-- (then read count via a counter row or definer function — see scalability plan S6)
```

---

### SEC-5 🟡 Mutable `search_path` on all 5 functions
**Evidence:** advisor `function_search_path_mutable` for `get_rankings_today`, `get_rankings_all`, `rank_today`, `rank_alltime`, `update_updated_at_column`. None set `search_path`; none are `SECURITY DEFINER` (which limits the blast radius, but it's still best practice).
**Impact:** A function without a pinned `search_path` can resolve object names against a caller-controlled path. Low risk here because they're `SECURITY INVOKER`, but trivial to fix and required for a clean audit.
**Remediation:**
```sql
alter function public.get_rankings_all(text)            set search_path = public;
alter function public.get_rankings_today(text, date)    set search_path = public;
alter function public.rank_alltime(text, integer)       set search_path = public;
alter function public.rank_today(text, integer)         set search_path = public;
alter function public.update_updated_at_column()         set search_path = public;
```

---

### SEC-6 🟡 Postgres version has security patches available
**Evidence:** advisor `vulnerable_postgres_version` — `supabase-postgres-17.4.1.074` has outstanding patches.
**Remediation:** schedule a Postgres upgrade from the Supabase dashboard → Settings → Infrastructure. https://supabase.com/docs/guides/platform/upgrading (test on a branch first; minor-version upgrade, low risk).

---

### SEC-7 🟡 Public buckets allow object listing
**Evidence:** advisor `public_bucket_allows_listing` for `games` (policy `Public Read Access`) and `wallpapers` (policy `Public read access`). Both are broad `SELECT USING (bucket_id = '…')` policies on `storage.objects`.
**Impact:** Public object **URLs** don't require a SELECT policy — these broad policies additionally let anyone **enumerate the full file list** (`storage.from('games').list()`), exposing every ROM/asset path. For `games` this is arguably intended (the app lists ROMs), but it also reveals everything you've ever uploaded there.
**Remediation:** if listing isn't required for a bucket, drop the policy (object URLs keep working). If the games UI *needs* listing, prefer a precomputed `games_index` (see scalability plan S2) and then remove the broad listing policy:
```sql
-- only if the app no longer needs to enumerate the bucket at runtime:
drop policy "Public Read Access" on storage.objects;   -- games
drop policy "Public read access" on storage.objects;    -- wallpapers
```

---

### SEC-8 🟢 No upload guardrails on buckets
**Evidence:** all 5 buckets have `file_size_limit = null` and `allowed_mime_types = null`.
**Impact:** No anon INSERT policy exists on `storage.objects`, so the anon key **cannot** upload — the immediate risk is low. But any service-role/dashboard upload path is unconstrained (no size cap, any MIME).
**Remediation (defense-in-depth):**
```sql
update storage.buckets set file_size_limit = 52428800,  -- 50 MB
  allowed_mime_types = array['image/png','image/jpeg','image/webp','image/avif']
  where id in ('wallpapers','themes','portfolio_thumb');
update storage.buckets set file_size_limit = 209715200 where id = 'games';  -- ROMs are larger
update storage.buckets set allowed_mime_types = array['application/pdf'] where id = 'portfolio';
```

---

### SEC-9 🟢 `guestbook-add` "auth" is a public-key prefix check
**Evidence:** `verifyAuth()` only checks the header starts with `Bearer sb_publishable_`. The publishable key is **public** (it ships in the client bundle), so this gate stops nothing motivated.
**Impact:** It's a speed bump, not auth. Combined with SEC-2 (direct insert allowed anyway), the function provides no real access control — only content filtering for clients that choose to use it.
**Remediation:** acceptable *if* SEC-2 is fixed (then the only insert path is the function and the filter is mandatory). The prefix check can stay as a cheap bot deterrent. Do **not** treat it as authentication.

---

### SEC-10 🟢 Secret handling — verify
**Evidence:** Edge Functions read `SERVICE_KEY`, `SUPABASE_URL`, `SPOTIFY_CLIENT_ID/SECRET/REFRESH_TOKEN`, `SPOTIFY_PLAYLIST_URI` from env. `supabase_vault` extension is installed.
**Checklist:**
- Confirm `SERVICE_KEY` is the **service-role** key and is set **only** as an Edge Function secret (never `VITE_`-prefixed, never in the client bundle). Grep the repo for any service key leakage.
- Confirm Spotify secrets are Edge-only (the function correctly keeps them server-side ✅).
- Rotate any secret that has ever been committed. Consider Supabase Vault for secret storage.
- `corsHeaders` use `Access-Control-Allow-Origin: *` on all functions — acceptable for public read endpoints, but tighten to your domain for write endpoints if feasible.

---

### SEC-11 🟢 No migration history
**Evidence:** `list_migrations` → empty; `supabase_migrations.schema_migrations` has no rows.
**Impact:** Schema/RLS/policy changes are **unauditable and unreproducible** — a security regression (e.g. someone disabling RLS again) leaves no trail. SEC-1 likely originated this way.
**Remediation:** adopt `supabase db diff` / tracked migrations so every RLS/policy change is reviewed in git. Apply all of the above fixes **as a migration**, not via the dashboard.

---

## 3. Prioritized remediation order

1. **SEC-1** — enable RLS on `projects` (+ SELECT policy). *Critical, one statement pair.*
2. **SEC-2 / SEC-3** — drop permissive anon INSERT policies on `guestbook`, `game_scores`, `game_sessions`; verify Edge Functions still work (they use the service key, so they will).
3. **SEC-7** — remove broad bucket listing policies (after `games_index` lands, per scalability plan).
4. **SEC-4** — replace raw-row SELECT with aggregates/definer functions.
5. **SEC-5 / SEC-8 / SEC-6** — pin `search_path`, set bucket limits, schedule the PG upgrade.
6. **SEC-11** — move everything to tracked migrations; re-run `get_advisors` after.

> After applying, re-run `get_advisors(type:security)` — the expectation is the `rls_disabled_in_public` ERROR and all four `rls_policy_always_true` WARNs clear.

---

## 4. What is already good ✅
- RLS enabled on 6 of 7 application tables.
- No anon UPDATE/DELETE policies anywhere — anon can't mutate existing rows (except via the RLS-off `projects`).
- Secrets (`SERVICE_KEY`, Spotify) are server-side in Edge Functions, not in the client.
- `visits.anon_id` unique + upsert prevents trivial row flooding by a single browser.
- `themes` / `portfolio` / `portfolio_thumb` buckets are **not** enumerable (no listing policy) — the safer config.

---

*No database changes were made during this audit. All SQL above is a proposal for review.*
