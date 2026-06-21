# JeffOS — Phase 4.5 Security Hotfix

> Pre-Phase-5 emergency security hotfix for Supabase project `akqqmrqeloasisiybdjx` (**whoisthedev portfolio**).
> Authored 2026-06-21. **Migration SQL only — NOT applied. No database changes executed.**
> Source: [SUPABASE_SECURITY_AUDIT.md](SUPABASE_SECURITY_AUDIT.md) (SEC-1, SEC-2, SEC-3) · [SUPABASE_DISCOVERY.md](SUPABASE_DISCOVERY.md).
> This hotfix is **independent of Phase 5** — apply it on its own, ahead of the larger work in [PHASE5_IMPLEMENTATION.md](PHASE5_IMPLEMENTATION.md).

---

## 0. Scope

This hotfix addresses **only** the three highest-severity, lowest-risk RLS issues. Nothing else from the audit/scalability plan is in scope here (no indexes, no realtime, no holiday fix, no asset work).

| # | Action | Audit ref | Risk if delayed |
|---|--------|-----------|-----------------|
| 1 | Enable RLS on `public.projects` (+ public SELECT of active rows) | SEC-1 🔴 | Anon key can read/write/delete every project row |
| 2 | Drop anon/public direct INSERT policy on `guestbook` | SEC-2 🟠 | Profanity/anti-bot Edge Function is bypassable |
| 2 | Drop anon direct INSERT policy on `game_scores` | SEC-3 🟠 | Anti-cheat token flow bypassable; forged scores |
| 2 | Drop anon direct INSERT policy on `game_sessions` | SEC-3 🟠 | Same — session validation bypassable |

**Why these are safe to ship alone:** all four legitimate write paths go through Edge Functions using the **service role key**, which **bypasses RLS entirely**. Removing the anon INSERT policies therefore does not affect any working feature — it only closes the direct-table bypass. The one client *read* path that RLS could break (`projects`) is preserved by an explicit SELECT policy that matches the recruiter app's exact query.

---

## 1. Pre-flight: live state being changed

From the live catalog ([SUPABASE_DISCOVERY.md](SUPABASE_DISCOVERY.md) §7):

| Table | Current RLS | Policy being removed/added |
|-------|-------------|----------------------------|
| `public.projects` | 🔴 **disabled** | **enable RLS** + add `select` policy `public read active projects` |
| `public.guestbook` | enabled | drop `Public insert` (INSERT, role `public`, `WITH CHECK (true)`) |
| `public.game_scores` | enabled | drop `anon insert scores` (INSERT, role `anon`, `WITH CHECK (true)`) |
| `public.game_sessions` | enabled | drop `anon insert sessions` (INSERT, role `anon`, `WITH CHECK (true)`) |

Policies **kept** (do not touch): `guestbook.Public select`, `game_scores.anon select scores`, `visits.*`, `defaults.*`, `calendar_holidays.*`, all `storage.objects` policies.

---

## 2. Migration SQL (authored — DO NOT APPLY YET)

> Single transactional migration. Idempotent guards (`if exists`) so a partial prior run won't error. **Run nothing — this is a proposal for review.**

```sql
-- ============================================================
-- Migration: 2026xxxx_phase_4_5_security_hotfix
-- Project:   akqqmrqeloasisiybdjx (whoisthedev portfolio)
-- Purpose:   Close 3 critical/high RLS gaps before Phase 5.
-- Safety:    All real writes use the service role (bypasses RLS),
--            so dropping anon INSERT policies breaks no feature.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. SEC-1 🔴  Enable RLS on public.projects + restore the read
-- ------------------------------------------------------------
alter table public.projects enable row level security;

-- The recruiter app runs: select * from projects where active = true order by id.
-- This policy preserves exactly that read and nothing more.
-- (No INSERT/UPDATE/DELETE policy => anon writes denied. Manage rows
--  via the dashboard or a service-role path.)
drop policy if exists "public read active projects" on public.projects;
create policy "public read active projects"
  on public.projects
  for select
  to anon, authenticated
  using (active is true);

-- ------------------------------------------------------------
-- 2. SEC-2 🟠  guestbook: remove direct public INSERT bypass
--    (writes funnel through the guestbook-add Edge Function)
-- ------------------------------------------------------------
drop policy if exists "Public insert" on public.guestbook;
-- keep "Public select" so the wall still renders.

-- ------------------------------------------------------------
-- 3. SEC-3 🟠  game_scores / game_sessions: remove anon INSERT
--    (writes funnel through game-start / game-submit Edge Functions)
-- ------------------------------------------------------------
drop policy if exists "anon insert scores"   on public.game_scores;
drop policy if exists "anon insert sessions" on public.game_sessions;
-- keep "anon select scores" for now (no client reads it today; revisit
-- in Phase 5 SEC-4 if leaderboards move client-side).

commit;
```

### Optional defense-in-depth (separate, also not applied)
Add only if you want column-level guards independent of the Edge Function. Not required for the hotfix.
```sql
-- guestbook length guards (mirrors the Edge Function's checks)
alter table public.guestbook
  add constraint guestbook_msg_len    check (char_length(message) between 1 and 280),
  add constraint guestbook_handle_len check (char_length(coalesce(handle,'')) between 2 and 16);
```

---

## 3. Verification plan — Edge Functions still work

The four DB-writing Edge Functions all instantiate `createClient(SUPABASE_URL, SERVICE_KEY)`. The **service role bypasses RLS**, so none of the dropped policies affect them. Verify post-apply:

| Function | Write it performs | Expected after hotfix | How to verify (read-only) |
|----------|-------------------|-----------------------|---------------------------|
| `guestbook-add` | `insert into guestbook` (service role) | ✅ still inserts | POST a test entry from the Guestbook app; confirm row appears (`select * from guestbook order by created_at desc limit 1`) and profanity/length checks still run. |
| `game-start` | `insert into game_sessions` (service role) | ✅ still inserts | Start a game; confirm a new `game_sessions` row (`select count(*) from game_sessions`). |
| `game-submit` | `insert into game_scores` (service role) + `rank_*` RPCs | ✅ still inserts & ranks | Submit a score; confirm `game_scores` row + a `{rank_today, rank_all_time}` response. |
| `update_holiday_theme` | `upsert defaults` (service role) | ⚠️ unaffected by hotfix (still broken for the *separate* `updated_at` reason — out of scope here, fixed in Phase 5) | n/a for this hotfix |

**Negative verification (the bypass is now closed)** — these should now FAIL with an RLS error using the anon key:
```js
// all three should be rejected (new row violates RLS / no policy):
await supabase.from('guestbook').insert({ anon_id:'t', handle:'t', message:'x' })       // expect error
await supabase.from('game_scores').insert({ anon_id:'t', game_id:'snake', score:999 })  // expect error
await supabase.from('game_sessions').insert({ session_id: crypto.randomUUID(), anon_id:'t', game_id:'snake', seed:'s', token:'t' }) // expect error
```

---

## 4. Verification plan — Recruiter app still reads projects

**Confirmed against source:** [Recruiter.tsx:41-45](src/apps/recruiter/Recruiter.tsx#L41-L45) runs:
```js
supabase.from("projects").select("*").eq("active", true).order("id", { ascending: true })
```
The new policy `using (active is true)` permits exactly this for `anon`. Verify post-apply:
- Open the Recruiter app → project list renders as before.
- Sanity SQL with the anon role: `select id, name, active from projects where active = true` returns the active rows; `select * from projects where active = false` returns **0 rows** to anon (correctly filtered).
- Inserting a project as anon (`supabase.from('projects').insert(...)`) now **fails** (no INSERT policy) — confirms SEC-1 closed.

> ⚠️ Edge case: any client code that expected to read `active = false` projects with the anon key will now get empty results. Source grep shows the **only** `projects` read is the recruiter's `active = true` query, so there is no such consumer. If an admin view is added later, give it a service-role path, not a broader anon policy.

---

## 5. Rollback

```sql
begin;
-- restore projects open state (NOT recommended — re-opens SEC-1):
-- drop policy if exists "public read active projects" on public.projects;
-- alter table public.projects disable row level security;

-- restore the removed INSERT bypasses (NOT recommended — re-opens SEC-2/3):
-- create policy "Public insert" on public.guestbook for insert to public with check (true);
-- create policy "anon insert scores"   on public.game_scores   for insert to anon with check (true);
-- create policy "anon insert sessions" on public.game_sessions for insert to anon with check (true);
commit;
```
Rollback is commented intentionally — reverting reintroduces the vulnerabilities. Prefer fixing forward.

---

## 6. Post-apply check

After applying (in a separate, deliberate step), re-run:
```
get_advisors(type: security)
```
**Expected deltas:** the `rls_disabled_in_public` ERROR (projects) clears, and the three `rls_policy_always_true` WARNs for `guestbook` / `game_scores` / `game_sessions` clear. The remaining warnings (`visits` permissive insert, function search_path, PG version, bucket listing) are intentionally **out of scope** for this hotfix and handled in Phase 5.

---

## 7. Status
**Authored, not applied.** No migrations executed. Apply this hotfix as one transaction, run §3–§4 verification, then proceed to [PHASE5_IMPLEMENTATION.md](PHASE5_IMPLEMENTATION.md).
