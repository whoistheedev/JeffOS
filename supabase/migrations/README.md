# Supabase Migrations — JeffOS

Tracked migrations for project `akqqmrqeloasisiybdjx` (whoisthedev portfolio).

> **Status: AUTHORED, NOT APPLIED.** Nothing in this folder has been run against
> the database. Apply manually, after review, one migration at a time. This
> establishes the migration tracking the audits flagged as missing
> (`supabase_migrations.schema_migrations` is currently empty).

## Phase 4.5 — Security Hotfix

Source of truth: [`../../PHASE_4_5_SECURITY_HOTFIX.md`](../../PHASE_4_5_SECURITY_HOTFIX.md).
Each migration is **small and independently reversible** (rollback companions in `rollback/`).

| Order | File | Concern | Effect |
|------:|------|---------|--------|
| 1 | `20260621000001_enable_rls_projects.sql` | SEC-1 🔴 | Enable RLS on `projects` + recruiter-safe read policy (`active is true`) |
| 2 | `20260621000002_drop_guestbook_public_insert.sql` | SEC-2 🟠 | Drop `Public insert` (force writes through `guestbook-add`) |
| 3 | `20260621000003_drop_game_anon_insert.sql` | SEC-3 🟠 | Drop anon INSERT on `game_scores` / `game_sessions` (force writes through `game-*`) |

Policies intentionally **kept**: `projects` read (new), `guestbook` `Public select`,
`game_scores` `anon select scores`. All Edge Functions use the **service role**,
which bypasses RLS, so none of these changes affect them.

## Apply procedure (manual — DO NOT automate)

> Run only after explicit review/approval. Recommended: apply on a Supabase
> **branch** first, verify, then promote.

```sh
# from repo root, one-time link (prompts for the project):
supabase link --project-ref akqqmrqeloasisiybdjx

# review what would run:
supabase db push --dry-run

# apply (only after approval):
supabase db push
```

Alternatively, paste each `*.sql` file (in order 1→2→3) into the Supabase SQL
Editor and run individually, verifying after each.

## Verification after apply

```sql
-- RLS now on for projects; others already on:
select c.relname, c.relrowsecurity
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public'
  and c.relname in ('projects','guestbook','game_scores','game_sessions');

-- permissive INSERT policies gone; reads kept:
select tablename, policyname, cmd
from pg_policies
where schemaname='public'
  and tablename in ('projects','guestbook','game_scores','game_sessions')
order by tablename, policyname;
```

Expected after apply:
- `projects.relrowsecurity = true`; policy `public read active projects` (SELECT) present.
- `guestbook`: only `Public select` remains.
- `game_scores`: only `anon select scores` remains.
- `game_sessions`: no policies remain (anon INSERT removed).

Then re-run the security advisor — the `rls_disabled_in_public` ERROR and the
three `rls_policy_always_true` WARNs (guestbook/game_scores/game_sessions)
should clear.

### Edge Function smoke tests (service role — should still work)
- **guestbook-add**: post a guestbook entry → row appears; profanity/length checks run.
- **game-start**: start a game → new `game_sessions` row.
- **game-submit**: submit a score → new `game_scores` row + `{rank_today, rank_all_time}`.

### Negative tests (anon — should now FAIL with RLS error)
- `supabase.from('guestbook').insert(...)`
- `supabase.from('game_scores').insert(...)`
- `supabase.from('game_sessions').insert(...)`
- `supabase.from('projects').insert(...)`  (no anon INSERT policy)

### Recruiter read (should still SUCCEED)
- `supabase.from('projects').select('*').eq('active', true).order('id')`
  returns active rows; inactive rows return 0 to anon.

## Rollback

Companion files in `rollback/` (`*.down.sql`). ⚠️ Reverting re-opens the
vulnerabilities — prefer fixing forward. Apply a rollback only in emergency,
matched to its migration number.
