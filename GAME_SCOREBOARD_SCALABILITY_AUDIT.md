# Game Session & Scoreboard — Scalability + Integrity Audit

> **Objective:** assess the game-session / leaderboard architecture for correctness, integrity, and scale (10k → 100k → 1M+ players).
> **Method:** read the client store, the tracked migrations, and — decisively — the **live database** (schema, indexes, RLS, row counts) + the **live Edge Functions** (`game-start`, `game-submit`) source.
> **Scope:** investigation + **P0 fixes implemented** (see §6 below).
>
> **Update — P0 shipped & verified on the live backend:** C1 (anon access), C2 (CORS), C3 (score bounds), C4 (single-use + expiring sessions) are done. `game-start`/`game-submit` redeployed `verify_jwt:false` with CORS + token/score hardening; migration `20260622000002` added `used`/`expires_at` + indexes + a `cleanup_game_sessions()` function; follow-up `20260622000003` revoked anon EXECUTE on that function (advisor-flagged). Verified live: CORS preflight 200; anon start works; valid submit returns ranks; **replay → 401**; negative/overflow score + too-short duration → **422**; forged session → **401**; test rows cleaned; security advisor shows **no new warnings**. Still open (P1/P2): submit rate-limiting, `game_best` upsert + materialized top-N + edge cache, cron wiring for `cleanup_game_sessions`, UI wiring + removing the dead client store.
> **Verdict up front:** the scoreboard is **currently non-functional and not wired**, and the server flow as written has **integrity holes and growth/cost problems** that would bite hard at scale. It needs a deliberate rebuild before it ships. Evidence below.

---

## 0. What exists (ground truth)

| Layer | State (evidence) |
|---|---|
| **Client store** `src/store/games.ts` | A full in-memory leaderboard slice (`startGame/endGame/submitScore/setLeaderboard`) that sorts client-side and is persisted to localStorage. **Dead code** — `grep` finds **zero** usages of `submitScore`/`startGame`/`leaderboards` in any component. The Games app (`EmulatorApp`) only plays ROMs; it never records or shows scores. |
| **Client → server calls** | **None.** No `game-start`/`game-submit`/`leaderboard` fetch anywhere in `src/`. The server flow is unreachable from the app. |
| **DB `game_sessions`** | `(session_id uuid PK, anon_id text, game_id text, seed text, token text, started_at timestamptz)`. **0 rows.** **Only the PK index.** **0 RLS policies** (anon INSERT dropped — writes via service role). **No `expires_at` / `used` / `consumed` column.** |
| **DB `game_scores`** | `(id int PK, session_id uuid, anon_id text, game_id text, score int, duration numeric, created_at timestamptz)`. **0 rows.** **4 indexes** (PK + `(game_id, score desc)` + `(game_id, created_at)` + `(session_id)`) — leaderboard indexing is in place. 1 RLS policy (anon SELECT kept). |
| **Ranking RPCs** | `get_rankings_all/today` (top score per player), `rank_today/rank_alltime` (rank of a given score). Type-fixed (anon_id→text) and made sargable (Phase 5). |
| **Edge Functions** | `game-start` + `game-submit`, both **`verify_jwt: true`**. `game-submit` source reviewed (below). |

So: a half-built server flow + a dead client store + correct-ish indexes, none of it connected. **Nothing records scores today.**

---

## 1. Findings (ranked by severity)

### 🔴 Critical — integrity / "will it even work"

| # | Finding | Evidence | Impact |
|---|---------|----------|--------|
| C1 | **Edge functions require JWT (`verify_jwt: true`) but players are anonymous.** JeffOS has no login — only `anon_id`. A JWT-gated function rejects every anon player. | `list_edge_functions` → `game-start`/`game-submit` `verify_jwt:true`; app uses `anon_id`, no auth. | Scoreboard can never be called by real (anonymous) users as-is. |
| C2 | **`game-submit` does no CORS handling.** No `Access-Control-Allow-Origin`, no `OPTIONS` preflight handler. | `game-submit` source — returns bare `Response` with only `Content-Type`. | Browser `fetch` from `whoisjeff.dev` is blocked by CORS → fails even if C1 were fixed. (guestbook-add has CORS; these don't.) |
| C3 | **Score is taken verbatim — no validation against the session.** `score`/`duration` come straight from the request body and are inserted unchanged. The `seed`/`token` anti-cheat scaffold exists but the score is **never** validated against seed/duration/replay. | `game-submit`: `insert({ score, duration })` directly from `req.json()`. | A valid session lets anyone submit **any** score. The leaderboard is trivially forgeable → at scale it becomes all cheaters. |
| C4 | **Session tokens are infinitely replayable.** No `used`/`consumed` flag and no `expires_at`; `game-submit` validates `(session_id, token)` but never invalidates it. | `game_sessions` has no expiry/used column; submit doesn't update the row. | One `game-start` → unlimited `game-submit`s. Defeats the entire session-token design. |

### 🟠 High — scale / cost / growth

| # | Finding | Evidence | Impact at 100k–1M+ |
|---|---------|----------|--------------------|
| H1 | **`game_sessions` grows unbounded — no TTL/cleanup.** Every `game-start` inserts a row; nothing ever deletes them. | 0 expiry column; no cron/cleanup migration. | Millions of dead session rows; table bloat; vacuum pressure; slower lookups. |
| H2 | **Two ranking RPCs per submit, each aggregating the whole game's scores.** `rank_today` + `rank_alltime` run on every submit; `get_rankings_*` do `max(score) group by anon_id order by score desc` over all rows for a game. | `game-submit` calls both RPCs; RPC bodies group-scan. | At 1M+ scores/game, every submit triggers two full group-bys → high latency + DB CPU. No materialized/top-N cache. |
| H3 | **No write rate-limiting / abuse control on submit.** Nothing throttles submits per `anon_id`/IP; `anon_id` is unindexed on `game_sessions`. | No rate-limit logic; `anon_id` not indexed. | A script can flood `game-start`/`game-submit` → DB write storm, cost spike, leaderboard spam. |
| H4 | **Leaderboard reads aren't cached.** Ranking is computed on demand via RPC; no cache/materialized view/edge cache. | No `leaderboard_cache` table or cached read path. | Popular game → every viewer recomputes the board. Doesn't scale to 1M viewers. |

### 🟡 Medium — correctness / consistency

| # | Finding | Evidence | Impact |
|---|---------|----------|--------|
| M1 | **Two competing leaderboard implementations.** The dead client `store/games.ts` (client-sorted, localStorage) vs the server flow. If the client store is ever wired, it produces a **per-device fake leaderboard** that disagrees with the server. | `store/games.ts` exists + unused; server flow separate. | Architectural ambiguity; risk of shipping the insecure client version. Pick one (server). |
| M2 | **`game_scores` stores every attempt, not best-per-player.** Ranking dedupes with `max(score) group by anon_id` at read time. | `get_rankings_*` group by anon_id. | Read cost grows with *attempts*, not *players*. A "best score per (player,game)" upsert table would bound it. |
| M3 | **`rank_today` uses server "today"; client store uses device-local midnight.** Inconsistent day boundaries. | `get_rankings_today(g,d)` takes a date; client computes local midnight. | Timezone drift in "today" boards if both paths coexist. |

### 🟢 Low

- L1: `anon_id` is spoofable (client-generated) — acceptable for a casual portfolio board, but means "per-player" is really "per-browser".
- L2: `duration` is `numeric` and unvalidated — fine, but unused for anti-cheat (see C3).

---

## 2. Update/flow trace — where it breaks

```
Play game (EmulatorJS)
   ↓   (client never calls the backend — DEAD path: store/games.ts only)
game-start  [verify_jwt:true]      ← C1: anon users have no JWT → 401
   ↓
new game_sessions row (seed, token, NO expiry)   ← C4/H1: replayable + never cleaned
   ↓
game-submit [verify_jwt:true, no CORS]  ← C1 + C2: blocked before logic runs
   ↓
validate (session_id, token) only       ← C3: score itself never validated
   ↓
insert game_scores(score from body)     ← C3: forgeable
   ↓
rank_today + rank_alltime (2 full group-bys) ← H2/H4: cost scales with rows, no cache
   ↓
return {rank_today, rank_all_time}
```

**Today the flow doesn't run at all** (C1+C2 + not wired). When wired, C3/C4 make it cheatable and H1–H4 make it expensive at scale.

---

## 3. Recommended target architecture (for the rebuild — not implemented)

**Principle:** one source of truth (server), anon-friendly, cheap reads, bounded growth, basic anti-cheat.

1. **Make the functions anon-callable.** Set `verify_jwt: false` (like `guestbook-add`) and add **CORS** (allow the site origin + `OPTIONS`). Authenticate by the session token, not a JWT.
2. **Single-use, expiring sessions.** Add `expires_at` (e.g. now()+2h) + `used boolean`. `game-submit` rejects if missing/expired/used and **flips `used=true`** in the same statement (atomic). A nightly **cron** (`pg_cron`) deletes expired/used sessions → bounded table (fixes C4, H1).
3. **Validate the score.** At minimum: reject scores above a per-game ceiling and submits faster than a per-game minimum `duration` (seed→expected-bounds). Even coarse bounds kill trivial forgery (C3).
4. **Best-score-per-player table + cache.** Keep `game_scores` as the raw log, but `upsert` into `game_best (game_id, anon_id, best_score, updated_at)` (PK `(game_id, anon_id)`). Rank reads hit `game_best` (bounded by *players*, not *attempts*) — fixes M2/H2. For hot boards, a **materialized `leaderboard_top` (game_id, top 100)** refreshed on write or on a short cron, served with edge cache → 1M viewers read a cached top-N (H4).
5. **Rate-limit submits** per `anon_id` (index it) + per IP at the edge; cap inserts/min. (H3)
6. **Index `game_sessions(anon_id)`** for rate-limit lookups; PK already covers the token check.
7. **Delete the dead client store** (`store/games.ts`) or repurpose it as a thin read-cache of server data — never as the source of truth (M1).
8. **Wire the UI:** `game-start` on play, `game-submit` on game-over, a leaderboard panel reading the cached top-N (the `L` shortcut already hints at it).

### Scale expectations after the rebuild
| Tier | Key levers |
|---|---|
| 10k | Indexes (done) + single-use sessions + cron cleanup. |
| 100k | `game_best` upsert (reads bounded by players) + submit rate-limit. |
| 1M+ | Materialized `leaderboard_top` + edge-cached reads + (optional) pgmq queue for write spikes. |

---

## 4. Risk / priority

| Priority | Item | Why |
|---|---|---|
| **P0** | C1 (`verify_jwt`) + C2 (CORS) | Without these the feature can't run for anon users at all. |
| **P0** | C4 + C3 (single-use sessions + score bounds) | Don't ship a trivially-forgeable, replayable board. |
| **P1** | H1 (session TTL/cron) + M2/H2 (`game_best`) | Bounded growth + bounded read cost. |
| **P1** | H3 (rate limit) | Abuse/cost protection. |
| **P2** | H4 (materialized top-N + edge cache) | Needed only at very high read volume. |
| **P2** | M1 (remove dead client store) | Architectural hygiene. |

---

## 5. Verification checklist (for when the rebuild lands)

- [ ] Anonymous browser can call `game-start`/`game-submit` (no 401, CORS OK).
- [ ] Replaying the same `(session_id, token)` a second time is **rejected** (`used=true`).
- [ ] A submit with an absurd score / impossibly short duration is **rejected**.
- [ ] Expired sessions are deleted by the cron; `game_sessions` row count stays bounded under load.
- [ ] Leaderboard read is served from `game_best`/cache, not a full `game_scores` group-by, and is fast at 1M rows (EXPLAIN shows index/MV use).
- [ ] Submit rate-limit returns 429 past the cap per `anon_id`.
- [ ] Only ONE leaderboard source (server); `store/games.ts` removed or read-only.
- [ ] `get_advisors` (security + performance) clean for the game tables.

---

*Investigation only. Evidence from `src/store/games.ts`, the tracked migrations, the **live DB** (schema/indexes/RLS/row counts via `execute_sql`), and the **live `game-submit` Edge Function source**. No code, DB, or function changed. Both game tables are currently empty and the flow is unwired, so this is a pre-launch hardening audit, not a production incident.*
