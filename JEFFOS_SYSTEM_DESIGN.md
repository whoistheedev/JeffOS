# JeffOS — System Design (Future-State Architecture)

> Staff Software Architect · Principal Frontend · Staff Product Designer · Supabase Architect · Performance Engineer · Infrastructure Engineer.
> **Architecture & design only — no code, no migrations, no infra changes.**
> Authored 2026-06-22. Grounded in the live Supabase project `akqqmrqeloasisiybdjx` and [GAMES_AND_WALLPAPER_PERFORMANCE_AUDIT.md](GAMES_AND_WALLPAPER_PERFORMANCE_AUDIT.md), [HIGH_LEVEL_SYSTEM_DESIGN.md](HIGH_LEVEL_SYSTEM_DESIGN.md), [SUPABASE_DISCOVERY.md](SUPABASE_DISCOVERY.md).
> **Goal:** 100k+ monthly visitors at **<2s perceived load · 95+ Lighthouse · mobile-first**.
> Convention: every recommendation states **Problem · Solution · Tradeoffs · Expected outcome**.

**Verified current-state baseline (live, 2026-06-22):** 9 public tables · realtime publication = 2 tables (`visit_stats`, `guestbook`) · 5 storage buckets / 110 objects · `games_index` = **0 rows (unused)** · `visits` 535 = `visit_stats` counter 535 (counter healthy) · all storage objects served `cache-control: no-cache` at the edge.

---

## Section 1 — Current Architecture Review

### 1.1 Component-by-component

| Layer | Current state | Strength | Weakness / bottleneck |
|-------|---------------|----------|------------------------|
| **Frontend** | React 19 + Vite, lazy app chunks, RootRouter (Recruiter default / JeffOS opt-in), 3 responsive shells | Code-split; Recruiter Mode is a light entry; JeffOS lazy | Vendor chunk had a React init-order crash (fixed); first-visit boot splash gates ~5s |
| **Supabase DB** | 9 public tables; RLS on all app tables; tracked migrations adopted (Phase 4.5/5) | RLS enforced, advisor-mostly-clean, migration history exists | A few residual advisor warns; no read replicas (single primary) |
| **Storage** | 5 public buckets, 110 objects; multi-MB wallpapers (up to 5.3 MB) & ROMs | Simple public URLs; CDN-fronted | **`no-cache` at edge** (every asset re-fetched from origin); no size/MIME limits; no derivatives |
| **Edge Functions** | 5 (guestbook-add, game-start, game-submit, spotify-token, update_holiday_theme) | Service-role writes; secrets server-side | `update_holiday_theme` driven by pg_cron; no per-function rate limiting/observability |
| **PWA** | vite-plugin-pwa + Workbox; CacheFirst assets, NetworkFirst docs; `clientsClaim`+`skipWaiting` (added) | Offline shell; SW updates fast now | SW asset cache undermined by origin `no-cache`; precache grows with assets |
| **State** | Zustand (persisted) + TanStack Query | Clear split: UI/prefs vs server cache | React Query `staleTime` not tuned per-domain; some redundant effects (double `setWallpaper`) |
| **Realtime** | Publication = `visit_stats` (counter) + `guestbook` | Counter pattern avoids COUNT storm (Phase 5) | Connection ceiling at high concurrency unevaluated |
| **Caching** | SW + browser + React Query | 3 tiers exist | **Edge cache effectively disabled** (`no-cache`); no asset versioning/immutability |

### 1.2 Strengths (don't regress)
- Recruiter-first routing with JeffOS as a lazy opt-in (perf budget protected).
- Migration-tracked, RLS-enforced backend; counter-based realtime.
- Three capability-detected shells; PWA offline shell.
- `themes_manifest` already collapses wallpaper *discovery* to one query.

### 1.3 Weaknesses / scaling bottlenecks
1. **Edge caching disabled** (`no-cache` on all storage) — origin fetch every asset, every load. *Scales linearly with traffic = the #1 cost & latency driver.*
2. **Heavy assets** — 2–5 MB wallpapers, 2–4 MB ROMs, no derivatives/responsive images.
3. **Game discovery = ~37 sequential storage `list()`** (32 empty); `games_index` built but empty.
4. **Single Supabase primary** — DB, Storage, Realtime, Functions all one project/region; no replica, one region.
5. **No observability** — near-zero metrics/error tracking/RUM; failures are invisible.
6. **First-visit boot splash** gates ~5s before the (heaviest) wallpaper paints.

### 1.4 Single points of failure (SPOFs)
| SPOF | Blast radius | Mitigation gap |
|------|--------------|----------------|
| Supabase project (one region) | DB + Storage + Realtime + Functions all down together | No multi-region, no static fallback for dynamic data |
| Storage origin / its CDN | All wallpapers, ROMs, thumbs | No alternate origin; `no-cache` means no edge buffer |
| `update_holiday_theme` cron | Theme staleness | Already failed silently once (Phase 5 fix) — needs monitoring |
| EmulatorJS 3rd-party CDN | Game play | Uncontrolled external dependency |
| Client `anonId`/localStorage | Identity, prefs | Safari private mode throws (guarded in boot fix) |

---

## Section 2 — Target Architecture (10k / 100k / 1M monthly)

The same core scales surprisingly far **if caching and asset shape are fixed**. The differentiator across tiers is *caching depth, observability, and redundancy* — not a rewrite.

```
                         ┌──────────────── CDN (immutable, versioned) ────────────────┐
  Browser / PWA  ───────►│  HTML shell · JS/CSS · wallpapers(derivatives) · ROMs ·     │
   (3 shells)            │  thumbs · manifests   [cache: public, max-age=1y, immutable]│
        │                └─────────────────────────────────────────────────────────────┘
        │ reads (cache-first)                         ▲ writes invalidate by version
        ▼                                             │
  TanStack Query (typed, per-domain staleTime)        │
        │ 1-query manifests (themes/games/projects)   │
        ▼                                             │
  ┌──────────────── Supabase ───────────────────────────────────────────┐
  │ Postgres (RLS) ── manifests + counters + content (read-mostly)       │
  │ Storage (origin) ── immutable assets behind CDN, size/MIME-limited   │
  │ Edge Functions ── validated writes, rate-limited, structured logs    │
  │ Realtime ── curated small tables only (visit_stats, guestbook)       │
  │ pg_cron ── manifest refresh + holiday job (monitored)               │
  └──────────────────────────────────────────────────────────────────────┘
        │ logs/metrics
        ▼
  Observability (RUM web-vitals beacon · log drain · alerts · uptime)
```

| Capability | **10k/mo** | **100k/mo** (target) | **1M/mo** |
|-----------|-----------|----------------------|-----------|
| **Frontend** | Static SPA on CDN (Vercel/Netlify/CF Pages) | + SSG/prerender for SEO routes; route-level prefetch | + edge-rendered shells, A/B at edge |
| **API/writes** | Edge Functions as-is | + per-IP/anon rate limits, structured logs | + queue (pgmq) for spikes, idempotency keys |
| **Database** | Single primary | Single primary + tuned indexes + PITR | **Read replica(s)** for content reads; connection pooling (Supavisor) mandatory |
| **Storage** | Public + **immutable cache headers** + derivatives | + image transformations/CDN tier | + dedicated CDN (Cloudflare) in front, multi-region buckets |
| **CDN** | Default platform CDN | Immutable/versioned everything; long TTL | Multi-PoP, cache reserve, signed long-lived URLs |
| **Caching** | SW + browser + edge (fixed headers) | + manifest versioning, SWR | + edge KV for manifests |
| **Realtime** | Counter + guestbook | Same; monitor connection count | Shard channels; presence sampling; cap subscriptions |
| **Analytics** | Privacy-friendly counter | Funnel events (Edge → table) | Warehouse export, cohorting |
| **Monitoring** | Uptime + web-vitals beacon | + error tracking + function/storage metrics + alerts | + SLOs, on-call, tracing |

**Headline:** to reach **100k/mo at <2s/95+**, you do **not** need new infra — you need (a) immutable edge caching, (b) right-sized assets, (c) `games_index` adoption, (d) observability. 1M/mo is where read replicas + a dedicated CDN + pooling become necessary.

---

## Section 3 — Wallpaper System

**Problem:** the visible asset is a 2–5 MB original fetched `no-cache` from origin, set twice, with no placeholder → 3.3s fast / 60–100s on 3G to first paint (measured).

**Solution — a manifest + derivative pipeline:**
- **Manifest** (`themes_manifest` exists ✅) extended to carry, per theme: `{ lqip, w640, w1280, w1920, avif, webp, jpeg }` URLs + intrinsic dimensions. One query, already cached.
- **Derivatives generated on upload** (Edge Function or build step / Supabase image transformations): AVIF → WebP → JPEG fallback; widths 640/1280/1920; a tiny inline **LQIP** (base64, ~1 KB) embedded in the manifest for instant blur-up.
- **Responsive selection**: client picks the right width by viewport/DPR; serves `<img srcset>`/`image-set()` for the background.
- **CDN strategy**: versioned immutable paths (`/themes/v3/cny.avif`) with `cache-control: public, max-age=31536000, immutable`.
- **Cache strategy**: SW CacheFirst the chosen derivative; browser keeps it forever (immutable); manifest is SWR.
- **Offline**: LQIP + last-used wallpaper cached by SW; desktop paints the cached/LQIP instantly, swaps to full when available.
- **Mobile**: serve ≤640/1280 webp/avif (≈30–80 KB vs 5 MB) — the single biggest mobile win.

**Tradeoffs:** derivative generation adds upload-time work + storage (multiple sizes); LQIP adds ~1 KB to the manifest. Worth it many times over.

**Expected outcome:** wallpaper time-to-visible **3.3s → ~0.3–0.5s** (fast), **60s → ~3–6s** (3G), **~0s repeat** (immutable). Perceived-instant via LQIP.

**Edge cases:**
| Case | Behavior (target) |
|------|-------------------|
| Slow network | LQIP paints instantly; full image streams in; never blank |
| Large libraries | WallpapersApp reads a paginated manifest, not `list()`; thumbnails are real thumbnails |
| Missing image | Manifest omits the entry; client falls back to default wallpaper |
| Broken URL | `onerror` → default; SW serves last-good if cached |
| Storage outage | SW-cached wallpaper + LQIP keep the desktop usable; Recruiter Mode is theme-independent for the CTA |
| Theme change | Swap to the (cached) target derivative; no flash (de-dupe the double `setWallpaper`) |
| Holiday override | `update_holiday_theme` writes the manifest key; client reads one row; broadcast updates live |
| Cold cache | One right-sized derivative (not 5 MB) + LQIP |
| Warm cache | Immutable hit, ~0s |

---

## Section 4 — Game System

**Problem:** discovery = ~37 sequential `list()` (32 empty); `games_index` empty/unused; ROMs 2–4 MB `no-cache`; EmulatorJS from 3rd-party CDN.

**Solution:**
- **`games_index` becomes the source of truth** (table already exists): `{ game_id, system, title, rom_url, thumb_url, rom_bytes, rom_format, region, added_at }`. Client reads **1 indexed query** (paginated/searchable), never lists buckets.
- **Population**: an Edge Function (or pg_cron) lists the bucket **server-side once on upload** and upserts rows. Discovery cost becomes O(1) regardless of catalog size.
- **Metadata**: sizes/format in the index → client can warn before a large ROM, show accurate cards.
- **ROM delivery**: immutable cache headers + versioned paths; SW caches a ROM after first play (instant replay). Range requests for large ROMs.
- **Thumbnail delivery**: real thumbnails (webp ~20 KB) via manifest, immutable-cached, lazy-loaded.
- **Emulator loading**: self-host or SW-precache the EmulatorJS loader+core (remove the 3rd-party gate); show a determinate progress bar.

**Tradeoffs:** `games_index` must stay in sync with the bucket (upload trigger). Self-hosting EmulatorJS adds ~MBs to your origin but removes an external SPOF.

**Expected outcome:** game list **6–11s → ~60ms** (1 query); time-to-playable **9–17s → ~3–5s** first play, **~1–2s** replay.

**Edge cases:**
| Case | Behavior (target) |
|------|-------------------|
| Missing ROM | index row flagged/absent → card hidden or "unavailable" |
| Corrupt ROM | emulator error surfaced; report event; offer reselect |
| Large ROM | size shown pre-play; range requests + progress bar; warn on cellular |
| Storage outage | SW-cached ROMs still play; list shows cached catalog |
| Slow network | progress UI; thumbnails first; ROM streamed |
| Offline | SW-cached ROMs + emulator core playable; rest greyed |
| Mobile/tablet | touch controls; landscape prompt; cap one emulator instance (memory) |
| Concurrent users | reads are CDN/manifest — concurrency-independent; no per-user listing |

---

## Section 5 — Recruiter Mode

**Problem:** the highest-value user (recruiter/CTO on mobile) must convert in <10s; today the path is good but un-instrumented and the scheduler is a mailto fallback.

**Solution — fastest path to conversion:**
- **Default first paint = Recruiter Mode** (shipped), text+CTA above the fold, **no heavy asset gates** it (JeffOS lazy).
- **Conversion funnel**: Hero → Stat band (proof) → Current Impact → Featured Work → Why Hire → Contact, with a persistent **Schedule a Conversation** (replace mailto with Cal.com/Calendly), **View Projects**, and résumé removed from primary IA (per product decision).
- **Case studies**: backed by content (and optionally `projects` table) — Problem→Outcome, not screenshots.
- **Analytics / lead tracking**: privacy-friendly event beacon (schedule clicks, project views, contact, referrer, funnel completion, JeffOS launches) → Supabase `events` (insert via Edge Function) or Plausible/Umami.
- **Mobile optimization**: bottom-tab app, sticky CTA, ≤640 images, instant text paint.

**Tradeoffs:** a scheduler is a 3rd-party dependency; mitigate with mailto fallback (already the default). Analytics adds a write path (rate-limited, fire-and-forget).

**Expected outcome:** measurable funnel; sub-2s recruiter first paint; conversion path that survives a résumé cross-check (CV-true positioning).

---

## Section 6 — Supabase Architecture

**Current:** 9 tables, RLS on all app tables, 5 functions, 5 buckets, realtime = 2 curated tables, tracked migrations.

**Future state:**
- **Tables**: add `games_index` population, `events` (analytics, insert-only RLS), optional `projects` case-study columns; keep manifests (`defaults` k/v) for themes/games. Index hot paths (game_scores already indexed in Phase 5).
- **Storage**: immutable cache headers; `file_size_limit` + `allowed_mime_types` per bucket; derivative folders; drop broad listing policies once manifests are the read path (SEC-7).
- **Functions**: add rate limiting + structured logs; idempotency on writes; a manifest-refresh function triggered on upload.
- **Policies**: keep write-through-Edge (service role) model; lock anon to reads + manifest-gated writes; re-run advisors after changes.
- **Indexes**: maintain advisor-clean; FK + ranking indexes (done Phase 5); add `events(created_at, type)`.
- **Realtime**: keep curated (counter + guestbook); monitor connection count toward plan limits.

**Migration strategy:** continue tracked migrations (git); apply on a Supabase **branch** → verify → promote; never dashboard-edit. Each change re-runs `get_advisors`.

**Operational model:** PITR enabled; weekly bucket backups for irreplaceable assets; staging branch; runbooks.

**Monitoring:** advisor cron, cron `job_run_details` checks (catches the "succeeds-but-no-op" class), function error rates, storage egress, realtime connections.

**Disaster recovery:** see §13; PITR restore, bucket re-upload from source, migration replay, key rotation.

---

## Section 7 — Cache Architecture (the highest-leverage section)

**Problem:** every storage asset returns `cache-control: no-cache` + `cf-cache-status: MISS` → no edge, no browser cache. This is the dominant scaling cost: at 100k/mo every visitor re-downloads multi-MB assets from origin.

**Solution — layered, versioned, immutable:**
| Layer | Strategy |
|-------|----------|
| **Browser cache** | Immutable assets `max-age=31536000, immutable`; HTML `no-cache` (always revalidate the shell) |
| **Service worker** | Precache app shell; runtime CacheFirst for versioned assets; SWR for manifests; `skipWaiting`+`clientsClaim` (done) |
| **CDN / edge** | Long TTL on immutable paths; HTML short TTL; (1M tier) Cloudflare in front of Storage with cache reserve |
| **Supabase Storage** | Set proper `cacheControl` on upload; **versioned paths** so new content = new URL (no invalidation needed) |
| **Edge caching** | Cache manifests at edge (KV) for 1M tier |

**Cache invalidation / versioning:**
- **Asset versioning**: content-hashed or version-folder paths (`/themes/v3/…`). New version = new URL = automatic cache bust; old stays cached for in-flight clients.
- **Manifest versioning**: manifest carries a `version`; client compares and refetches derivatives only when it changes (SWR).

**Tradeoffs:** versioned paths require updating the manifest on asset change (an upload step). That's the cost of never needing manual cache purges.

**Expected outcome:** repeat asset loads **→ ~0s**; origin egress drops ~10×+ at scale; the single change (immutable headers) is the biggest perf + cost win in this document.

---

## Section 8 — Performance Architecture (budgets)

Target: **LCP <2s · INP <200ms · TTI <3s** on mid-range Android / 4G; **95+ Lighthouse**.

| Asset/metric | Budget | Enforcement |
|--------------|--------|-------------|
| **Initial JS (Recruiter entry)** | < 170 KB gz | rollup-visualizer in CI; JeffOS stays a separate lazy chunk |
| **Per-app chunk** | < 150 KB gz | code-split per app (done) |
| **CSS** | < 30 KB gz critical | Tailwind purge |
| **Images (wallpaper, mobile)** | ≤ 80 KB (webp/avif, ≤1280) | derivative pipeline + bucket MIME/size limits |
| **Fonts** | 0 blocking (system stack) | already system-ui |
| **Storage requests (game discovery)** | 1 (manifest) | `games_index` adoption |
| **DB queries (first paint)** | ≤ 2 | manifests; tuned `staleTime` |
| **Realtime subscriptions** | ≤ 2 curated | counter + guestbook only |
| **LCP** | < 2s | LQIP + right-sized hero/wallpaper |
| **INP** | < 200ms | GPU-only animations; avoid main-thread blocking |
| **TTI** | < 3s | lazy heavy apps; defer non-critical |

**Enforcement:** Lighthouse CI on the Recruiter mobile path; bundle-size budget gate; fail builds on regression.

---

## Section 9 — Observability

**Problem:** near-zero visibility today (a cron silently no-op'd for weeks — Phase 5). At 100k/mo, blind operation is untenable.

**Design:**
| Pillar | Design |
|--------|--------|
| **Logging** | Structured logs in every Edge Function (request id, anon hash, outcome) → log drain (Logflare) |
| **Metrics** | RUM web-vitals beacon (LCP/INP/CLS) from the client; function latency/error rate; storage egress; DB size; realtime connections |
| **Error tracking** | Client error boundaries → Sentry-style beacon (shell/app/anon context); function errors captured |
| **Performance monitoring** | Lighthouse CI + RUM dashboards; budget alerts |
| **Storage monitoring** | Egress threshold alerts; cache-hit ratio (after header fix); object growth |
| **Function monitoring** | Per-function success/latency; cron `job_run_details` + semantic health check (catches "succeeds-but-broken") |
| **Realtime monitoring** | Connection count vs plan limit; "events received = 0" anomaly |
| **User analytics** | Privacy-friendly funnel (recruiter conversion), referrer, anon only, DNT-respecting |

**Tradeoffs:** a beacon adds a tiny write path (sampled, fire-and-forget). Cost is minimal; the blind-spot risk it removes is large.

---

## Section 10 — Security

**Current:** RLS on all app tables; write-through-Edge (service role); secrets server-side; counter realtime. Residual advisor warns (bucket listing, PG version) and scheduler/analytics not yet built.

| Area | Problem | Solution | Outcome |
|------|---------|----------|---------|
| **RLS** | A couple of permissive/legacy policies remain | Keep anon read-only + manifest-gated; re-run advisors after each change | Advisor-clean |
| **Storage** | Public buckets, no size/MIME limits, broad listing policies | Size/MIME limits; drop listing once manifests are the read path; keep public-read for served URLs | Smaller attack/abuse surface |
| **Functions** | No rate limiting/abuse controls | Per-IP/anon rate limits; time-trap (guestbook has one); idempotency | Spam/bot resistant |
| **Secrets** | Service key, Spotify keys in env | Vault; never client-exposed; rotation schedule | No leakage |
| **Client exposure** | Anon publishable key is public (by design) | Treat anon as hostile; all privileged work via Edge | Correct trust model |
| **Rate limiting / abuse / spam / bots** | Writes funnel through Edge but limits not enforced | Edge rate limits + captcha-on-abuse + honeypot; analytics writes sampled | Resilient at 100k/mo |

**Tradeoffs:** rate limits can false-positive legit bursts; tune thresholds + allow retry.

---

## Section 11 — PWA Architecture

| Aspect | Design |
|--------|--------|
| **Offline behavior** | App shell precached; Recruiter Mode (text/CTA) works offline; last wallpaper + LQIP cached; SW-cached ROMs playable |
| **Sync strategy** | Writes (guestbook/contact) queued offline, replayed on reconnect (Background Sync where supported); reads reconcile from server |
| **Caching strategy** | Immutable assets CacheFirst; manifests SWR; HTML NetworkFirst; storage assets cache-keyed by versioned URL |
| **Update strategy** | `autoUpdate` + `skipWaiting`+`clientsClaim` (done) → new build claims on next load; HTML never long-cached so updates propagate |
| **Install experience** | `standalone` manifest; install prompt on engagement; (revisit `orientation` lock for desktop installs) |
| **Storage limits** | Cap SW cache (Workbox expiration: maxEntries/maxAge); evict oldest; don't precache multi-MB ROMs — runtime-cache on play only |

**Tradeoffs:** caching ROMs eats device quota; cap and evict. `skipWaiting` can swap assets mid-session — safe because assets are immutable/versioned.

---

## Section 12 — Mobile Architecture

| Device class | Strategy |
|--------------|----------|
| **Phones** | Recruiter bottom-tab app; ≤640/1280 webp/avif; sticky CTA; text-first paint |
| **Tablets** | Hybrid: rail + focused content (planned 6B); larger touch targets |
| **Foldables** | `useFormFactor` re-evaluates on resize/orientation; folded=phone, unfolded=tablet |
| **Touch devices** | 44px targets; no hover-only affordances; bottom sheets (vaul) |
| **Low-memory** | One emulator instance; unmount backgrounded heavy apps; avoid 5 MB images; LQIP |
| **Low-bandwidth** | Smallest derivative by Network Information API; defer ROMs to explicit tap; progress UI; never auto-load heavy apps |

**Mobile is where the asset-size + caching fixes matter most** — a 5 MB → 60 KB wallpaper is the difference between unusable and instant on cellular.

---

## Section 13 — Edge Cases (failure matrix)

| Scenario | Detection | Mitigation | Recovery |
|----------|-----------|------------|----------|
| **Supabase down** | read errors / 5xx | Recruiter Mode is static-renderable (text/CTA not DB-gated); SW-cached content | retry w/ backoff; static fallback keeps hire path alive |
| **Storage down** | asset 5xx | SW-cached wallpapers/ROMs/thumbs; LQIP | re-fetch on recovery |
| **Realtime down** | subscribe error / 0 events | fall back to one-shot fetch (counter/guestbook); never sole path | refetch on reconnect |
| **Function timeout** | non-2xx/latency | mailto fallback (schedule); analytics fire-and-forget; retry | queue (1M tier) |
| **CDN failure** | edge 5xx | versioned immutable assets cacheable elsewhere; SW serves cached | platform failover |
| **Corrupt assets** | hash mismatch / decode error | versioned paths; `onerror`→default; SW last-good | re-upload new version |
| **Missing data / empty tables** | `[]` | empty states (no broken grids); `games_index` empty → "coming soon" | populate |
| **Network interruption** | offline event | SW shell + cached content; queue writes | replay on reconnect |
| **Slow 3G** | Network Info / long LCP | smallest derivative; LQIP; defer ROMs | progressive load |
| **Offline** | SW | shell + cached assets usable | sync on reconnect |
| **Mobile Safari** | — | guarded localStorage (private mode), boot timing decoupled from fetch (fixed), `skipWaiting` for stale SW | hard-reload self-heals |
| **Low-memory** | OOM heuristics | single emulator; unmount bg apps; small images | reload restores shell |
| **Cache corruption** | SW errors | `cleanupOutdatedCaches`; versioned keys; cache reset path | clear + re-cache |
| **Version mismatch** | manifest `version` diff | SWR refetch; immutable old assets stay valid | new version claims |
| **Failed deployments** | uptime/error spike | atomic deploys; SW guards; canary | roll back; HTML short-TTL propagates |

---

## Section 14 — Scaling Roadmap

Prioritized by impact ÷ effort, with the perf/scale/UX gains each unlocks.

### Phase 1 — Caching & assets (the unlock) — *highest impact, low risk*
- Immutable cache headers on all storage; right-size wallpapers (webp/avif derivatives + LQIP); adopt `games_index` (parallel/manifest discovery); de-dupe double `setWallpaper`.
- **Impact:** 🔴 max · **Risk:** low (storage + content; reversible) · **Complexity:** low-med.
- **Perf gain:** wallpaper 3.3s→~0.4s, game list 6–11s→~60ms, repeat→~0s. **Scale gain:** ~10× less origin egress. **UX gain:** "sluggish"→"instant"; mobile usable on cellular.

### Phase 2 — Observability & conversion — *high impact, low risk*
- RUM web-vitals beacon; error tracking; function/cron/storage/realtime monitoring + alerts; recruiter funnel analytics; scheduler integration (replace mailto).
- **Impact:** high · **Risk:** low · **Complexity:** med.
- **Perf gain:** indirect (you can now *see* regressions). **Scale gain:** safe operation at 100k/mo. **UX gain:** measured + optimized conversion; faster incident response.

### Phase 3 — Resilience & governance — *medium, prepares for 1M*
- PITR + bucket backups + DR runbooks; PG upgrade; advisor-clean; bucket size/MIME limits; Edge rate limiting; SSG/prerender for SEO routes.
- **Impact:** med-high · **Risk:** low-med · **Complexity:** med.
- **Perf gain:** SEO/SSR first paint. **Scale gain:** abuse-resistant, recoverable. **UX gain:** discoverable (SEO), trustworthy.

### Phase 4 — Horizontal scale (1M/mo) — *do only when traffic demands*
- Read replica(s) for content; Supavisor pooling; dedicated CDN (Cloudflare) + edge KV manifests; queue (pgmq) for write spikes; realtime channel sharding; self-host EmulatorJS.
- **Impact:** high at scale · **Risk:** med · **Complexity:** high.
- **Perf gain:** flat latency under load. **Scale gain:** 1M/mo headroom. **UX gain:** consistent speed at peak.

> **Sequencing logic:** Phase 1 alone gets you to **100k/mo at <2s/95+** — it's caching + bytes, not capacity. Phases 2–3 make that *operable and safe*. Phase 4 is the true horizontal-scale tier, deferred until the numbers require it.

---

## Appendix — Recommendation ledger (Problem · Solution · Tradeoff · Outcome)

| Rec | Problem | Solution | Tradeoff | Outcome |
|-----|---------|----------|----------|---------|
| Immutable caching | `no-cache` everywhere | versioned paths + `max-age=1y immutable` | upload step updates manifest | repeat ~0s; ~10× less egress |
| Wallpaper derivatives | 2–5 MB originals | AVIF/WebP, 640/1280/1920 + LQIP | gen cost + storage | 3.3s→0.4s; mobile 5MB→60KB |
| `games_index` adoption | 37 list calls, empty table | 1 indexed read, populate on upload | sync trigger needed | 6–11s→60ms |
| Observability | blind ops | RUM + logs + alerts | small write path | safe at 100k; fast incidents |
| Scheduler | mailto fallback | Cal.com/Calendly | 3rd-party dep (mailto fallback) | higher conversion |
| Read replica (1M) | single primary | content reads on replica | cost + complexity | flat latency at peak |
| Self-host EmulatorJS | 3rd-party SPOF | host loader+core, SW-cache | origin MBs | controlled, faster play |

---

*Architecture & design only. No code, migrations, or database/storage/infrastructure changes were made. The roadmap in §14 is a proposal; nothing has been applied.*
