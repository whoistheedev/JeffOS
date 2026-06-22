# JeffOS — High-Level System Design

> CTO-level architecture review document. **Design only — no code, no implementation.**
> Authored 2026-06-21. Source of truth: this repository (`src/`, `vite.config.ts`, Zustand store) + the live Supabase project `akqqmrqeloasisiybdjx`.
> Builds on: [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) · [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md) · [UI_UX_ARCHITECTURE.md](UI_UX_ARCHITECTURE.md) · [MOBILE_STRATEGY.md](MOBILE_STRATEGY.md) · [SUPABASE_DISCOVERY.md](SUPABASE_DISCOVERY.md) · [SUPABASE_SECURITY_AUDIT.md](SUPABASE_SECURITY_AUDIT.md) · [SUPABASE_SCALABILITY_PLAN.md](SUPABASE_SCALABILITY_PLAN.md) · [PHASE_4_5_SECURITY_HOTFIX.md](PHASE_4_5_SECURITY_HOTFIX.md) · [PHASE5_IMPLEMENTATION.md](PHASE5_IMPLEMENTATION.md)

---

## Table of contents
1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Domain Model](#3-domain-model)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Mobile-First Redesign](#5-mobile-first-redesign)
6. [Windowing System Architecture](#6-windowing-system-architecture)
7. [Data Architecture](#7-data-architecture)
8. [Realtime Architecture](#8-realtime-architecture)
9. [Security Architecture](#9-security-architecture)
10. [Scalability Architecture](#10-scalability-architecture)
11. [Performance Architecture](#11-performance-architecture)
12. [Observability](#12-observability)
13. [Disaster Recovery](#13-disaster-recovery)
14. [Product Roadmap](#14-product-roadmap)
15. [Technical Debt Register](#15-technical-debt-register)
16. [Architecture Decision Records](#16-architecture-decision-records)
17. [Edge Cases Checklist](#17-edge-cases-checklist)

---

## 1. Executive Summary

### 1.1 What JeffOS is today
JeffOS is a **macOS/classic-Mac-inspired "desktop OS in the browser"** that serves as Jeffrey Idodo's portfolio. It is a single-page React 19 + TypeScript + Vite app with:
- A **windowing desktop metaphor** — draggable/resizable windows (`react-rnd`), a dock, a menu bar, genie minimize animations, focus stack, and per-window state in a Zustand store (`src/store/ui.ts`).
- **~11 "apps"** lazy-loaded as separate chunks (`src/apps/registry/registry.tsx`): Finder, Recruiter (`iprojects`), Guestbook (`iguest`), Games (EmulatorJS), Wallpapers, Explorer (`iweb`), Synth, Calendar (holiday themes), iTunes (Spotify), Terminal, Buy-Me-Coffee.
- A **responsive shell router** (`src/shells/ResponsiveShellRouter.tsx`) that switches between Desktop / Tablet / Mobile shells by **capability-based form-factor detection** (`useFormFactor.ts`).
- A **Supabase backend**: 8 Postgres tables, 5 SQL functions, 5 Edge Functions, 5 public Storage buckets, a pg_cron holiday job, and broadcast realtime.
- **No authentication** — every user is anonymous, tracked by a client-generated `anonId` in localStorage; all DB access uses the `anon` role.
- A **PWA** (vite-plugin-pwa / Workbox) with `CacheFirst` for assets and `NetworkFirst` for documents.

**Honest current-state assessment** (from the audits): the product *looks* finished but has three classes of latent issues — (a) **security gaps** (`projects` has RLS disabled; anon can bypass the guestbook/anti-cheat Edge Functions), (b) **a broken realtime layer** (the `supabase_realtime` publication is empty, so live visitor count / guestbook / games never fire), and (c) **scale-naïve client patterns** (≤31 storage `list()` per games mount, ≤32 HEAD probes per theme boot, exact `COUNT(*)` for visitors). None bite at today's traffic (largest table = 7 rows) but all are load-bearing for growth.

### 1.2 What JeffOS should become in 12 months
A **flagship interactive portfolio platform** that doubles as a reusable "web-OS" product:
- **Recruiter-grade**: a recruiter on a phone can find the resume, projects, and "Hire Me" path in <10s, fully offline-capable, Lighthouse 95+.
- **Trustworthy backend**: RLS-enforced, migration-tracked, observable, with working realtime and a tamper-proof leaderboard.
- **Genuinely native-feeling on mobile** — not a shrunk desktop, but a purpose-built mobile shell (app-grid home, full-screen apps, bottom-sheet interactions via `vaul`).
- **Extensible**: adding a new "app" is a registry entry + a lazy chunk; the windowing/realtime/security substrate is generic enough to be extracted.

### 1.3 Technical vision
- **Capability-driven, three-shell frontend** sharing one domain/state core; each shell renders the same domains with a device-appropriate interaction model.
- **Server-authoritative writes**: all mutations funnel through Edge Functions (service role); the anon client is read-mostly. RLS is the backstop, Edge Functions are the gate.
- **Precomputed reads over runtime discovery**: manifests (games index, themes manifest, visitor counter) replace per-mount fan-out queries.
- **Migration-tracked, advisor-clean database**: zero security/perf advisor errors, all changes in git.
- **Observable by default**: structured logs, cron/edge/realtime health surfaced, error reporting wired to the client.

### 1.4 Product vision
JeffOS is the *demo of the developer*: the medium is the message. Every app is both a portfolio artifact and a working feature. The 12-month product is **delightful, fast, accessible, and credible** — a recruiter trusts it because it works flawlessly on their device, and a peer engineer respects it because the architecture underneath is sound.

### 1.5 User experience vision
- **Desktop**: the full nostalgic OS — windows, dock, easter eggs, games, synth.
- **Tablet**: a hybrid — larger touch targets, optional single-window focus, drawer navigation.
- **Mobile**: a native-app feel — home app grid, full-screen apps, bottom sheets, gestures, instant offline.
- **Across all**: WCAG 2.1 AA (the viewport meta already deliberately preserves pinch-zoom — see `App.tsx`), keyboard navigability on desktop, reduced-motion respect, and graceful degradation on slow/offline networks.

---

## 2. System Architecture

### 2.1 Boundaries (the contract between layers)
| Boundary | Owns | Must not |
|----------|------|----------|
| **Frontend (browser)** | Rendering, window mgmt, local state, anon identity, read queries, optimistic UI | Hold secrets; be trusted for writes; assume realtime delivery |
| **Edge Functions** | All privileged writes, validation, anti-abuse, secret-holding (service role, Spotify) | Long-running work; be the only abuse defense (RLS must back them) |
| **Postgres + RLS** | Source of truth, authorization (RLS), aggregates, ranking functions | Run business logic the client should own; expose raw rows unnecessarily |
| **Storage + CDN** | Public assets (ROMs, wallpapers, themes, resume, thumbs) | Be the asset *index* (use a manifest); accept unbounded uploads |
| **Realtime** | Broadcast + (target) curated postgres_changes on small tables | Carry high-cardinality `*` subscriptions that trigger client re-queries |
| **Observability** | Logs/metrics/traces/alerts across all of the above | (n/a — currently largely absent) |

### 2.2 Current architecture
```
┌─────────────────────────── Browser (SPA, PWA) ───────────────────────────┐
│  ResponsiveShellRouter → {DesktopShell | TabletShell | MobileShell}       │
│  Zustand store (ui/apps/games/prefs/metrics) — persisted to localStorage  │
│  React Query (server cache)   Framer Motion   react-rnd windows           │
│  Lazy app chunks (registry.tsx)   Workbox SW (CacheFirst assets)          │
└───────┬───────────────────────────────────────────────────┬──────────────┘
        │ anon publishable key (read-mostly)                 │ HTTPS fetch
        ▼                                                     ▼
┌───────────────── Supabase (akqqmrqeloasisiybdjx) ───────────────────────┐
│  Postgres 17.4 ── 8 tables, 5 SQL fns, RLS (projects=OFF ⚠)              │
│  Edge Functions ── guestbook-add, game-start, game-submit,              │
│                    spotify-token, update_holiday_theme (broken ⚠)       │
│  Storage ── games, wallpapers, themes, portfolio, portfolio_thumb (public)│
│  Realtime ── broadcast OK; postgres_changes pub EMPTY ⚠ (dead)          │
│  pg_cron ── daily_holiday_update (no-op ⚠)                              │
└─────────────────────────────────────────────────────────────────────────┘
        (Spotify API via spotify-token; no analytics/observability today)
```

### 2.3 Target architecture (12-month)
```
┌─────────────────────────── Browser (SPA, PWA) ───────────────────────────┐
│  3 shells over a shared domain core                                       │
│  React Query (typed) + Zustand; SW with stale-while-revalidate manifests  │
│  Error boundaries per app + per shell; web-vitals + error reporting beacon│
└───────┬───────────────────────────────────────────────┬──────────────────┘
        │ read: manifests + aggregates (1 query each)     │ write: Edge fns only
        ▼                                                 ▼
┌───────────────── Supabase ──────────────────────────────────────────────┐
│  Postgres ── RLS on ALL tables; tracked migrations; advisor-clean        │
│             visit_stats counter; games_index; indexed game_scores        │
│  Edge Functions ── validated, rate-limited (Vault secrets), structured logs│
│  Storage ── size/MIME-limited; immutable cache headers; manifest-indexed │
│  Realtime ── visit_stats + guestbook published (curated); broadcast      │
│  pg_cron ── holiday job fixed + monitored (run-history alerting)         │
│  Observability ── log drains → dashboard; alerts on cron/edge/realtime   │
└─────────────────────────────────────────────────────────────────────────┘
        (Optional: Sentry/Logflare; analytics via privacy-friendly counter)
```

### 2.4 Migration architecture (how we get from current → target)
The migration is **strangler-style and reversible**, gated so each step is independently shippable:
1. **Phase 4.5 hotfix** — RLS on `projects`; remove anon INSERT bypasses ([PHASE_4_5_SECURITY_HOTFIX.md](PHASE_4_5_SECURITY_HOTFIX.md)). *No client change.*
2. **Phase 5** — finish security, repair realtime via counters, index leaderboards, fix holiday cron, optimize assets ([PHASE5_IMPLEMENTATION.md](PHASE5_IMPLEMENTATION.md)). *Each item: schema migration + targeted client change + verification.*
3. **Adopt tracked migrations** (none exist today) — every change from here lands in git.
4. **Frontend hardening** — error boundaries, observability beacon, mobile shell completion — layered on without backend coupling.

**Layer-by-layer boundary explanations:**
- **Frontend ↔ Backend**: the only trust boundary is "reads can use anon; writes must go through an Edge Function." This is the invariant that makes the whole security model tractable.
- **Backend ↔ Storage**: Storage is a dumb blob store; the *catalog* of what's in it lives in Postgres (target: `games_index`, `themes_manifest`). This decouples UI from bucket layout.
- **Realtime ↔ Data**: realtime publishes only **small, curated** tables (counter, guestbook), never high-write or `*`-subscribed tables, so a write never fans out into N client queries.
- **PWA ↔ Network**: the SW is the offline boundary — assets are CacheFirst, documents NetworkFirst, and (target) manifests stale-while-revalidate.
- **CDN ↔ Storage**: public buckets are CDN-fronted; the boundary is cache-control headers (target: immutable + versioned paths).

---

## 3. Domain Model

Each domain = a bounded context with an owner (where its truth lives) and a primary surface (the app that presents it).

| Domain | Truth owner | Surface(s) | Key data | Writes via |
|--------|-------------|-----------|----------|-----------|
| **Portfolio** (meta) | static/code | whole OS | theme, identity, copy | n/a |
| **Recruiter** | `projects` table | Recruiter app | project cards | dashboard/service role |
| **Projects** | `projects` + `portfolio_thumb` bucket | Recruiter | name, slug, urls, thumb, `active` | service role |
| **Guestbook** | `guestbook` table | Guestbook app | handle, message, anon_id | `guestbook-add` Edge fn |
| **Themes** | `themes` bucket + `defaults` (manifest) | Calendar, global | themeId → wallpaper | `update_holiday_theme` / dashboard |
| **Wallpapers** | `wallpapers` bucket | Wallpapers app | folder-grouped images | dashboard |
| **Games** | `games` bucket + (target) `games_index` | Games (EmulatorJS) | ROMs, thumbs | dashboard |
| **Leaderboards** | `game_scores` + ranking fns | Games | score, rank | `game-submit` Edge fn |
| **Visits** | `visits` + (target) `visit_stats` | Visitors widget | count, anon_id | anon upsert |
| **Terminal** | client-only | Terminal app | command state | n/a (local) |
| **Calendar** | `calendar_holidays` table | Calendar app | holiday rules → themes | dashboard/cron |
| **Settings/Prefs** | client (`prefs` slice, localStorage) | Control Panel | theme override, sound, layout | local |
| **Notifications** | (target) client + broadcast | toasts (`sonner`) | transient events | broadcast/local |

### 3.1 Relationships & ownership
```
Identity (anonId, localStorage)
  ├── Visits            (1 anon : 1 visit row, unique anon_id)
  ├── Guestbook         (1 anon : N messages)
  └── Game sessions     (1 anon : N sessions) ──< Game scores (1 session : N scores)
                                                     └── Leaderboards (ranking fns over scores)

Themes domain
  ├── calendar_holidays (rule) ──> update_holiday_theme (cron) ──> defaults.active_holiday_theme
  └── themes bucket ──> (target) defaults.themes_manifest ──> client theme apply

Projects domain
  └── projects (active) ──< portfolio_thumb (thumbnail_url) ; portfolio bucket (resume PDF)

Windowing (client-only, cross-cutting)
  └── ui.windows {id → WindowState} + focusStack + dock  (orchestrates all app surfaces)
```
**Ownership rule:** a domain's mutating logic lives in exactly one place — an Edge Function (server domains) or a Zustand slice (client domains). The Recruiter/Projects split: Recruiter *reads* Projects; it never owns project mutation.

---

## 4. Frontend Architecture

Shared core (all shells): Zustand bound store (`src/store/index.ts`, persisted via `persist`/`partialize`), React Query for server cache, the lazy `AppRegistry`, Framer Motion, Radix primitives, `vaul` (sheets), `fuse.js` (search). `ResponsiveShellRouter` selects the shell from `useFormFactor()`.

### 4.1 Desktop Shell (`src/shells/DesktopShell`)
- **Navigation**: dock + menu bar + desktop icons; multi-window, free-form drag/resize (`react-rnd`); keyboard shortcuts (`useKeyboardShortcuts`).
- **State**: full `ui` slice (windows, focusStack, dock, zoom/minimize), persisted windows so the desktop restores.
- **Rendering**: each open window renders `AppRegistry[appKey].component` inside `<Suspense>`; absolutely-positioned layers; z-index from focus stack.
- **Performance**: lazy app chunks; vendor chunk split (`vite.config.ts` manualChunks: react/motion/supabase/dnd/radix); only open windows mount.
- **Accessibility**: focus management on window focus; ARIA roles for window chrome; pinch-zoom preserved; reduced-motion gating on genie/Framer animations (target).

### 4.2 Tablet Shell (`src/shells/TabletShell`)
- **Navigation**: drawer/dock hybrid; larger hit targets; optional single-active-window "focus mode" to reduce overlap on mid screens.
- **State**: same `ui` slice but with a **windowing policy** capping concurrent free windows (e.g. maximize-on-open), reducing overlap chaos on touch.
- **Rendering**: windows render maximized-by-default; tab/drawer switch between them.
- **Performance**: same code-split; aggressively unmount background apps on memory pressure (target).
- **Accessibility**: touch target ≥44px; swipe + button parity; focus trap inside the active app.

### 4.3 Mobile Shell (`src/shells/MobileShell`)
- **Navigation**: **app-grid home** (no free windows); apps open **full-screen**; back gesture/button; bottom sheets (`vaul`) for secondary actions. This is the native-feel shell, not a window manager.
- **State**: a **single "active app"** (not a window map) + a navigation stack; the `ui` window model is bypassed/adapted.
- **Rendering**: one app mounted at a time; route-like transitions (Framer); Suspense fallback = skeleton.
- **Performance**: only the active app's chunk is loaded; prefetch likely-next app on idle; image lazy-load; avoid heavy apps (Synth/EmulatorJS) auto-launch.
- **Accessibility**: full-screen apps = simpler focus model; large targets; respects safe-area insets and landscape.

### 4.4 Cross-cutting frontend concerns
- **Code splitting**: per-app `React.lazy` chunks + named vendor chunks. Heavy apps (Games/EmulatorJS, Synth, Explorer, Terminal, iTunes) never enter the initial bundle (verified in `registry.tsx`/`vite.config.ts`).
- **Lazy loading**: app chunks on first window open; images lazy; (target) idle-prefetch of probable next app per shell.
- **Suspense**: every lazy app must render inside `<Suspense>` (currently in `Window.tsx`); target adds shell-level Suspense for the mobile active-app swap.
- **Error boundaries**: **GAP today** — add (a) a **per-app error boundary** so one app crash doesn't take down the desktop, and (b) a **shell-level boundary** with a recovery UI. Report to the observability beacon.
- **Offline mode**: SW caches assets (CacheFirst) + documents (NetworkFirst); React Query persists/serves cached reads; writes queue (target) and replay on reconnect; clear offline banner.
- **Caching**: three layers — Workbox (network), React Query (server data, with per-domain `staleTime`), Zustand+localStorage (UI/prefs/anonId). Target: long `staleTime` on read-mostly domains (projects, defaults, holidays), manifests cached stale-while-revalidate.

---

## 5. Mobile-First Redesign

Goal: a recruiter on a mid-range phone, possibly on a flaky connection, completes "see resume → see projects → contact/hire" effortlessly. The mobile shell is **purpose-built**, not a scaled desktop.

### 5.1 Surfaces
| Surface | Mobile design | Native-feel devices |
|---------|---------------|---------------------|
| **Home** | App-grid (iOS-like) with the OS wallpaper; primary CTAs (Resume, Projects, Hire Me) pinned top | Tap → full-screen app with shared-element transition |
| **Resume** | Full-screen PDF viewer (portfolio bucket) with a "Download" and "Share" sheet; inline fallback to image pages if PDF embed fails | Native share sheet via Web Share API |
| **Projects** | Vertical card feed from `projects` (active); thumb from `portfolio_thumb`; tap → detail sheet with live/source links | Pull-to-refresh; skeleton while loading |
| **Contact** | Bottom sheet (`vaul`) with email/socials; copy-to-clipboard with toast | Tap-to-call/mail intents |
| **Hire Me** | Prominent persistent CTA → contact sheet + resume; the "conversion" path | Sticky bottom bar |
| **Games** | Full-screen EmulatorJS; **explicit opt-in load** (don't auto-download ROMs on mobile); leaderboard tab | Landscape lock prompt for play |
| **Guestbook** | Full-screen list (virtualized) + compose sheet; posts via `guestbook-add`; live-append once realtime fixed | Optimistic insert + reconcile |

### 5.2 Mobile edge cases
| Edge case | Failure mode | Mitigation |
|-----------|-------------|------------|
| **Slow networks** | Big ROM/wallpaper stalls UI | Skeletons; defer heavy assets; ROMs load on explicit tap only; timeouts with retry |
| **Offline** | Reads fail, writes lost | SW-cached shell + last reads; queue guestbook post and replay; offline banner |
| **Low-memory devices** | EmulatorJS/Synth OOM; tab killed | One app mounted at a time; unmount on background; cap emulator memory; warn before launching heavy apps |
| **Small screens** | Overlap, clipped chrome | Full-screen apps, bottom sheets, safe-area insets, no free windows |
| **Landscape mode** | Layout breaks; phone treated as tablet | `useFormFactor` already special-cases coarse+short→mobile; lock games to landscape, others to portrait-friendly layouts |

---

## 6. Windowing System Architecture

Current state (`src/store/ui.ts`): windows are a `Record<id, WindowState>`; `focusStack: string[]` is the ordering; `dock` holds minimized windows; genie minimize uses a 500ms transient `minimizing` flag + `setTimeout`. Windows persist to localStorage (`partialize` includes `windows`).

### 6.1 Window manager (target)
- Keep the `Record + focusStack` model (it's sound) but formalize a **WindowManager policy object per shell**: desktop = free windows; tablet = maximized/limited; mobile = single active (no window map).
- Replace the `setTimeout`-driven minimize with **animation-event-driven** state transitions (avoids races if the user re-clicks mid-animation).
- Add **window lifecycle hooks** (onOpen/onFocus/onBackground/onClose) so apps can pause work (e.g. Synth audio, EmulatorJS) when backgrounded.

### 6.2 Focus management
- `focusStack` last element = focused; focus also moves DOM focus into the window for a11y/keyboard.
- Target: **focus trap** within the active window on tablet/mobile; `Esc` cycles/closes; `Cmd+`` cycles windows on desktop.

### 6.3 Z-index strategy
- Derive z-index from `focusStack` index (already implicit). Formalize a **z-index scale**: wallpaper(0) < icons(10) < windows(100 + stackIndex) < dock(1000) < menus/popovers(2000, Radix) < toasts(3000) < modals(4000). Prevents the "Radix popover behind a window" class of bug.

### 6.4 Virtualization strategy
- **Window virtualization**: only render windows that are open AND not minimized; minimized windows render nothing (dock chip only). Target: cap **simultaneously-mounted heavy apps** (e.g. only one EmulatorJS instance) and lazily remount on focus.
- **Content virtualization**: long lists (guestbook, leaderboards, wallpaper grids) use list virtualization to bound DOM nodes.

### 6.5 Windowing edge cases
| Edge case | Failure mode | Detection | Mitigation | Recovery |
|-----------|-------------|-----------|------------|----------|
| **50+ windows** | DOM/memory blowup; z-index churn | window count threshold | Cap concurrent windows (e.g. 12 on desktop); "too many windows" prompt; tablet/mobile already limit | Auto-minimize oldest; user closes |
| **Memory pressure** | Tab crash | `performance.memory` (where available) / OOM heuristics | Unmount backgrounded heavy apps; single emulator; pause audio | Restore from persisted window list on reload |
| **Background tabs** | Animations/timers keep running; battery drain | `document.visibilitychange` | Pause Framer loops, EmulatorJS, Synth, realtime heartbeats when hidden | Resume on visible |
| **Browser throttling** | `setTimeout` (minimize/midnight holiday) fires late | timer drift detection | Move timer-critical logic off `setTimeout` to event/`requestAnimationFrame`; server cron is the real holiday source | Recompute on focus/visible |

---

## 7. Data Architecture

### 7.1 Tables (live, see [SUPABASE_DISCOVERY.md](SUPABASE_DISCOVERY.md))
8 tables: `visits` (7 rows, unique `anon_id`), `guestbook`, `defaults` (k/v), `projects` (RLS off ⚠), `calendar_holidays`, `game_sessions`, `game_scores`. Target adds `visit_stats` (counter) and `games_index` (manifest).

### 7.2 Views
None today; none required. If client-side leaderboards arrive, expose them via `SECURITY DEFINER` functions returning `(anon_id, score)` rather than views over raw rows (privacy).

### 7.3 Functions
5 SQL/plpgsql fns: `get_rankings_all/today`, `rank_alltime/today`, `update_updated_at_column` (orphaned — not attached to a trigger). Target: pin `search_path`, fix `anon_id` return type (`uuid`→`text`), make "today" queries sargable (half-open ranges).

### 7.4 Indexes
PK on every table; `visits.anon_id` unique; `projects.slug` unique. **Missing & needed**: `game_scores (game_id, score desc)`, `(game_id, created_at)`, FK `session_id`; `guestbook (created_at)`.

### 7.5 Storage
5 public buckets, no size/MIME limits today. Target: per-bucket `file_size_limit` + `allowed_mime_types`, immutable cache headers, manifest-indexed (games/themes), listing policies removed once manifests exist.

### 7.6 Read / Write / Cache patterns
- **Reads** (anon): projects (`active=true`), defaults (`.eq(key)`), holidays, guestbook list, visitor count. Target: counter read replaces COUNT; manifests replace storage `list()`/HEAD fan-out. All read-mostly domains get long React Query `staleTime` + SW caching.
- **Writes**: `visits.upsert` (anon, unique-keyed); everything else via Edge Functions (service role). No anon write path survives Phase 4.5.
- **Caching**: React Query (server data) + Workbox (assets/docs) + Zustand/localStorage (UI/anonId). Manifests are stale-while-revalidate.

### 7.7 Data growth scenarios
| Users | `visits` | `game_scores` | Bottleneck | Solution |
|-------|----------|---------------|-----------|----------|
| **10** | ~10 rows | ~100s | none | as-is |
| **100** | ~100 | ~1k | none | indexes (already cheap) |
| **1,000** | ~1k | ~10k | exact COUNT; ranking seq-scans | `visit_stats` counter; `game_scores` indexes + sargable rankings |
| **10,000** | ~10k | ~100k–1M | ranking fns; guestbook sort; storage egress | composite indexes mandatory; consider materialized leaderboard refreshed on submit; CDN cache |
| **100,000** | ~100k | 1M–10M+ | write contention on counter; leaderboard recompute; egress cost | counter via batched/`pg_cron` rollup or approximate count; precomputed top-N leaderboard table; aggressive CDN + signed-URL strategy; partition `game_scores` by month |

---

## 8. Realtime Architecture

**Current reality**: broadcast works; `postgres_changes` is **dead** (empty `supabase_realtime` publication) — the `visitors`, `guestbook-updates`, and `games-realtime` subscriptions receive nothing (`useVisitors.ts` subscribes but never gets events).

### 8.1 Target per channel
| Channel | Mechanism | Why |
|---------|-----------|-----|
| **Visitor count** | Publish only `visit_stats` (1 row); client subscribes to its UPDATE | O(1) per visit; **never** re-publish raw `visits` with `*` (that's the O(N²) storm) |
| **Guestbook** | Publish `guestbook`; client appends payload | Low write volume; payload-carrying; no re-query |
| **Games** | **Drop** the storage.objects subscription | Uploads are rare/admin; use `games_index` + manual refresh |
| **Notifications/Themes** | Broadcast (already works) | Server pushes `holiday_changed`/`theme_change` payloads |

### 8.2 Reliability concerns
| Concern | Strategy |
|---------|----------|
| **Failure recovery** | On subscribe error/`CHANNEL_ERROR`, fall back to a one-shot fetch (counter read / guestbook refetch); never assume realtime is the only path |
| **Reconnect logic** | Supabase client auto-reconnects; on `SUBSCRIBED` after a drop, **refetch the source of truth** to heal missed events; exponential backoff for manual channels |
| **Offline sync** | While offline, queue writes (guestbook) locally; on reconnect replay + refetch; counter/guestbook reconcile from server, not from queued deltas |
| **Duplicate events** | Idempotent application: guestbook keyed by row `id` (dedupe in cache); counter is absolute (`total`), so duplicate UPDATEs are harmless |
| **Out-of-order events** | Counter uses absolute value (last-writer-wins is correct); guestbook sorts by `created_at` on apply, so order is derived not assumed |

### 8.3 Realtime edge cases (failure mode → detection → mitigation → recovery)
- **Publication empty (current bug)** → no live updates → detect via "events received = 0 over session" metric → add curated tables to publication → refetch on subscribe.
- **Counter trigger fails** → count stalls → detect via cron sanity (`visit_stats.total` vs `count(visits)` drift) → reconcile job → recompute counter.
- **Storm reintroduced** (someone adds `visits *` back) → CPU spike → advisor/load alert → revert publication → enforce via migration review.
- **Broadcast lost** (holiday theme) → theme doesn't change client-side → no live theme → client also reads `defaults.active_holiday_theme` on load as fallback → next load corrects.

---

## 9. Security Architecture

Posture: **anonymous app, anon role is hostile-by-default.** RLS + Edge Functions are the only controls. Full findings in [SUPABASE_SECURITY_AUDIT.md](SUPABASE_SECURITY_AUDIT.md).

### 9.1 RLS
- Enable on **all** tables (close `projects` — SEC-1). Public SELECT only where intended and only the needed shape (`projects` where `active`, guestbook select, counter). No anon INSERT except constrained `visits`.
- Re-run `get_advisors(security)` until the `rls_disabled_in_public` ERROR and `rls_policy_always_true` WARNs clear.

### 9.2 Authentication
- None today (by design). 12-month: **keep anonymous** as the default; if admin features arrive (project CRUD UI), add a **separate authenticated admin role** with its own RLS policies — never widen anon.

### 9.3 Authorization
- Authorization = RLS for reads + Edge Function validation for writes. The `anonId` is an *identifier, not a credential* — never authorize on it server-side without a server-issued token (the games `token` flow is the right pattern; extend it where needed).

### 9.4 Storage access
- Public read via object URLs; **remove broad listing policies** once manifests exist (SEC-7). Set size/MIME limits (SEC-8). No anon write (uploads via dashboard/service role).

### 9.5 Edge Functions
- All privileged writes here, service role server-side only. `guestbook-add`'s publishable-key prefix check is a speed bump, **not auth** — make the Edge Function the *only* write path (Phase 4.5) so its validation is mandatory. Move secrets to Vault; tighten CORS on write endpoints.

### 9.6 Threat model
| Threat | Vector today | Mitigation |
|--------|-------------|------------|
| **Spam** | Direct `guestbook` insert (bypasses filter) | Remove anon INSERT → force `guestbook-add` (profanity + 2s delay + length) |
| **Bot attacks** | Scripted inserts/visits | Edge-function rate limiting (per anonId/IP), honeypot/time-trap (already in guestbook), optional captcha on abuse |
| **Mass inserts** | Anon INSERT on game/guestbook/visits | Drop permissive policies; constrain `visits`; per-IP rate limits at Edge |
| **Leaderboard cheating** | Direct `game_scores` insert; forged scores | Remove anon INSERT → require `game-start` token validated by `game-submit`; add server-side score sanity bounds + duration checks |
| **Storage abuse** | Unbounded uploads (if any write path) | No anon upload; size/MIME limits; monitor egress |
| **Data scraping** | `select *` enumerates anon_ids/scores | Replace raw SELECT with aggregates/definer fns; counter instead of row reads |
| **Rate-limit bypass** | Hitting tables directly instead of Edge fn | Tables locked down so the Edge fn is the *only* path; rate limit lives there |

---

## 10. Scalability Architecture

Baseline: DB effectively empty (largest table 7 rows) — risks are **structural**, not current. Full plan: [SUPABASE_SCALABILITY_PLAN.md](SUPABASE_SCALABILITY_PLAN.md).

### 10.1 Bottlenecks → solutions
| Layer | Bottleneck | Solution |
|-------|-----------|----------|
| **Database** | Exact COUNT, ranking seq-scans, guestbook sort | `visit_stats` counter; composite indexes; sargable rankings; (at scale) precomputed top-N leaderboard, monthly partitioning |
| **Storage** | ≤31 `list()`/mount, egress on big blobs | `games_index` manifest; immutable cache headers; CDN; lazy ROM load |
| **Realtime** | `*` subscription storm (if re-enabled naïvely) | Publish only small curated tables; counter pattern |
| **Edge Functions** | Per-invocation client; cold starts; concurrency | Module-scope client; pooled connection; keep functions thin |
| **Frontend** | 32 HEAD probes/boot, initial bundle, heavy apps | Themes manifest; vendor+app code-split (done); idle prefetch; one heavy app at a time |

### 10.2 Growth scenarios
| DAU | Dominant cost | Action |
|-----|--------------|--------|
| **100** | none | ship Phase 4.5/5; monitor |
| **1,000** | storage egress; first COUNT cost | counter + manifests + cache headers live |
| **10,000** | egress; ranking under real scores; realtime fan-in | indexes mandatory; CDN tuned; counter proven; consider materialized leaderboard |
| **100,000** | counter write contention; egress $$$; leaderboard recompute; realtime connection count | batched/rollup counter or approximate count; precomputed leaderboards; CDN + signed URLs; evaluate realtime connection limits / shard channels; partition `game_scores` |

---

## 11. Performance Architecture

Target: **Lighthouse 95+** (perf/a11y/best-practices/SEO) on mobile mid-tier.

- **Bundle strategy**: per-app lazy chunks + named vendor chunks (`vite.config.ts` already does react/motion/supabase/dnd/radix). Keep heavy apps out of the entry chunk (verified). Target: budget the initial JS (<~170KB gz) and audit with `rollup-plugin-visualizer`.
- **Caching**: Workbox CacheFirst (assets) / NetworkFirst (docs); React Query `staleTime` per domain; manifests stale-while-revalidate. Add immutable cache-control on Storage assets.
- **Image optimization**: serve `webp/avif` (bucket MIME allow-list nudges this), responsive sizes, lazy-load, blur-up placeholders for project thumbs/wallpapers.
- **Prefetching**: idle-prefetch the probable next app per shell (mobile: likely Resume/Projects; desktop: pinned dock apps); prefetch manifests early.
- **Virtualization**: virtualize guestbook/leaderboard/wallpaper grids; render only open, non-minimized windows.
- **PWA strategy**: `autoUpdate` SW; precache app shell; runtime-cache Supabase public storage (already configured); offline document fallback; manifest already `standalone`/`portrait-primary` (revisit orientation for desktop installs).

**Performance edge cases**: cold cache first paint (precache shell), large ROM on mobile (explicit load), Framer animation jank on low-end (reduced-motion + GPU-friendly transforms), SW update mid-session (autoUpdate + reload prompt).

---

## 12. Observability

**Current state: largely absent** (console logs only; Supabase dashboard logs available but not aggregated/alerted). This is the single biggest operational gap.

| Pillar | Design |
|--------|--------|
| **Logging** | Structured logs in every Edge Function (request id, anonId hash, outcome); client logs gated by level; ship to Supabase log drains / Logflare |
| **Metrics** | Client: web-vitals (LCP/CLS/INP) beacon; realtime events-received counter; app-open counts. Server: edge invocation success/latency, cron run status, table sizes |
| **Tracing** | Correlate client action → Edge fn → DB via a request id passed through (e.g. guestbook post traceable end-to-end) |
| **Alerts** | Cron failure (job_run_details status ≠ succeeded **or** detect "succeeds but no-op"), Edge fn error rate, realtime "0 events" anomaly, advisor regressions, storage egress threshold |
| **Error reporting** | Client error boundaries → Sentry-style beacon with shell/app/anonId context; Edge fn errors captured with stack + payload (sans secrets) |

**Observability edge cases (failure → detection):**
- **Realtime failure** → "events received = 0 over N sessions" anomaly → alert.
- **Cron failure** → `cron.job_run_details` non-success **or** semantic check (`defaults.active_holiday_theme` freshness) → alert (catches the current "succeeds-but-broken" case).
- **Edge Function failure** → error-rate/latency threshold on invocation logs → alert + dashboard.
- **Storage failure** → asset 4xx/5xx rate from client beacon + egress anomaly → alert.

---

## 13. Disaster Recovery

| Scenario | Failure mode | Detection | Mitigation | Recovery procedure |
|----------|-------------|-----------|------------|--------------------|
| **Database corruption** | Bad data / constraint violation / partial write | Advisor, integrity checks, app errors | Supabase PITR/backups; constraints; transactional migrations | Restore from PITR to a point before corruption; replay tracked migrations; reconcile counter from `count(visits)` |
| **Deleted storage objects** | Missing ROM/wallpaper/resume → broken UI | Client 404 beacon; manifest vs bucket diff | Versioned paths; manifest as inventory; backups of buckets | Re-upload from source/backup; manifest points to restored paths; SW serves cached copy meanwhile |
| **Broken migrations** | Schema half-applied; RLS misconfigured | CI migration check; advisor; smoke tests | Transactional migrations; review gate; staging/branch first | Roll back the migration (or forward-fix); re-run advisors; verify recruiter read + Edge writes |
| **Failed deployments** | White screen / bad SW | Uptime check; error spike; web-vitals drop | Atomic deploys; SW `autoUpdate` + skipWaiting guarded; canary | Roll back to previous build; bust SW cache; verify shell loads on cold cache |
| **Expired/leaked API keys** | Edge fns 401; or anon/service key abused | Auth error spike; anomalous writes | Vault for secrets; rotate on schedule; service key never client-side | Rotate key in Supabase + Vault + Edge env; redeploy functions; invalidate old; audit access logs |

**Backup posture (target)**: enable PITR; periodic bucket backups for irreplaceable assets (resume, custom wallpapers); migrations in git = schema is reproducible from scratch.

---

## 14. Product Roadmap

Prioritized by **impact ↑, risk ↓, complexity ↓** (do high-impact/low-complexity first; defer high-complexity/low-impact).

### 14.1 30-day (stabilize & secure)
1. **Phase 4.5 security hotfix** — RLS on `projects`; remove anon INSERT bypasses. *(impact: critical, risk: low, complexity: low)*
2. **Repair realtime** — `visit_stats` counter + publish counter & guestbook; drop dead games subscription. *(high / low / med)*
3. **Fix holiday cron** — add `defaults.updated_at` (or edit fn) + raise timeout + verify logs. *(med / low / low)*
4. **Add error boundaries** (per-app + shell) + basic error beacon. *(high / low / low)*
5. **Adopt tracked migrations** going forward. *(high / low / low)*

### 14.2 90-day (scale-ready & observable)
1. **Leaderboard indexing + sargable rankings + anon_id type fix.** *(med / low / low)*
2. **Games index + themes manifest** (kill 31 list / 32 HEAD). *(high / med / med)*
3. **Observability v1** — web-vitals beacon, edge structured logs, cron/edge/realtime alerts. *(high / low / med)*
4. **Storage hardening** — size/MIME limits, immutable cache headers, drop listing policies. *(med / low / low)*
5. **PG upgrade + advisor-clean** (search_path, residual WARNs). *(med / low / low)*

### 14.3 6-month (mobile-native & DR)
1. **Mobile shell completion** — app-grid home, full-screen apps, bottom sheets, offline write queue. *(high / med / high)*
2. **Performance push to Lighthouse 95+** — bundle budget, image pipeline, prefetch, virtualization. *(high / med / med)*
3. **Disaster recovery** — PITR, bucket backups, runbooks, key rotation. *(med / low / med)*
4. **Leaderboard anti-cheat hardening** — server score bounds, duration validation. *(med / med / med)*

### 14.4 12-month (platform & polish)
1. **Web-OS extraction** — generic windowing/realtime/security substrate; new app = registry entry + chunk. *(med / med / high)*
2. **Admin authenticated surface** for project CRUD (separate role/RLS). *(med / med / med)*
3. **Analytics (privacy-friendly)** + richer notifications domain. *(med / low / med)*
4. **Accessibility certification** to WCAG 2.1 AA across all shells. *(high / low / med)*

---

## 15. Technical Debt Register

### 15.1 Must-fix debt (blocking trust/scale)
- `projects` RLS disabled (SEC-1). 
- Guestbook/game anti-abuse bypass via direct anon INSERT (SEC-2/3).
- Realtime publication empty — live features silently dead.
- Holiday cron is a no-op (writes nonexistent column).
- No error boundaries — one app crash kills the desktop.
- No migration tracking — schema is unauditable.

### 15.2 Current debt (real but not urgent)
- 31 storage `list()`/mount; 32 HEAD probes/boot.
- Exact COUNT for visitors; missing leaderboard indexes.
- `get_rankings_*` return `uuid` vs `text` column (errors on real data).
- `update_updated_at_column` orphaned (no trigger) → `updated_at` never bumped.
- `setTimeout`-driven minimize/midnight logic (throttling-fragile).
- Store `partialize` persists full `windows` map (can restore stale/broken windows).

### 15.3 Future debt (will appear at scale)
- Counter write contention at 100k DAU.
- `game_scores` table growth without partitioning.
- Storage egress cost without CDN tuning.
- Realtime connection limits at high concurrency.

### 15.4 Acceptable debt (conscious trade-offs)
- Anonymous-only model (no auth) — correct for a portfolio; revisit only if admin UI is built.
- Publishable-key "auth" in `guestbook-add` as a bot speed-bump (acceptable *once* the table is locked down).
- Three separate shells (more code, far better UX than one responsive layout).
- Persisting UI to localStorage (occasional stale state vs. session restore value).

---

## 16. Architecture Decision Records

> Format: Decision · Context · Alternatives · Rationale · Status.

**ADR-1 — Anonymous identity (no auth).** Context: portfolio, frictionless. Alternatives: full auth, magic-link. Rationale: zero friction for recruiters; `anonId` suffices for non-sensitive features. Status: **Accepted**; auth only for a future admin surface.

**ADR-2 — Server-authoritative writes via Edge Functions.** Context: anon key is public. Alternatives: trust RLS WITH CHECK alone; client writes. Rationale: validation/anti-abuse/secrets must be server-side; RLS is the backstop, Edge fn is the gate. Status: **Accepted** (enforced by Phase 4.5 locking tables).

**ADR-3 — Three capability-detected shells.** Context: desktop OS metaphor doesn't fit phones. Alternatives: one responsive layout; width-only breakpoints. Rationale: `useFormFactor` detects pointer/orientation/size for a native feel per device. Status: **Accepted**.

**ADR-4 — Zustand + React Query split.** Context: client UI state vs server cache. Alternatives: Redux; React Query only; Zustand only. Rationale: Zustand owns windows/prefs/anonId (persisted); React Query owns server data/caching. Status: **Accepted**.

**ADR-5 — Realtime via curated small tables + broadcast, not `*` subscriptions.** Context: `*` on `visits` caused O(N²) re-queries. Alternatives: publish raw tables; poll. Rationale: counter row + payload-carrying broadcast scale O(1)/event. Status: **Accepted** (target; supersedes the dead/raw approach).

**ADR-6 — Precomputed manifests over runtime discovery.** Context: 31 list / 32 HEAD per session. Alternatives: keep runtime listing; GraphQL. Rationale: one cached read replaces fan-out; decouples UI from bucket layout. Status: **Accepted** (Phase 5).

**ADR-7 — Per-app lazy chunks + named vendor chunks.** Context: heavy apps (EmulatorJS, Synth). Alternatives: single bundle; route-based only. Rationale: heavy apps never in initial bundle; vendors cache independently. Status: **Accepted** (already implemented).

**ADR-8 — PWA: CacheFirst assets / NetworkFirst docs.** Context: offline portfolio. Alternatives: NetworkOnly; StaleWhileRevalidate everywhere. Rationale: assets are immutable-ish (CacheFirst); docs need freshness (NetworkFirst). Status: **Accepted**; add SWR for manifests.

**ADR-9 — Tracked migrations from Phase 5 onward.** Context: no migration history today. Alternatives: dashboard edits. Rationale: reproducibility, review, DR. Status: **Accepted**.

**ADR-10 — Observability beacon + alerting.** Context: near-zero visibility today. Alternatives: dashboard-only. Rationale: detect realtime/cron/edge failures (incl. "succeeds-but-broken"). Status: **Proposed** (90-day).

---

## 17. Edge Cases Checklist

> Each: **failure mode → detection → mitigation → recovery.**

### Frontend
- **Lazy chunk fails to load (network blip)** → app won't open / blank → Suspense+error boundary catches → retry-load button → succeeds on retry / cached.
- **App component throws at runtime** → desktop crash (today) → per-app error boundary → isolate to that window + report → user reopens.
- **localStorage full/disabled** → persist throws → wrap persist in try/catch, in-memory fallback → degrade to non-persistent session.
- **Stale persisted window references a removed app** → broken window → validate `appKey` against registry on hydrate → drop invalid windows.

### Backend / Edge Functions
- **Edge fn cold start / timeout** → slow or failed write → client timeout+retry; raise cron timeout → retry/queue.
- **Service key missing/expired** → 401s → auth-error alert → rotate via Vault + redeploy.
- **`guestbook-add` bypassed by direct insert** → unfiltered spam → lock table (Phase 4.5) → spam stops at the gate.
- **`game-submit` invalid/replayed token** → fake score → token single-use + bounds check → reject.

### Database
- **`projects` RLS disabled** → anon write/deface → advisor ERROR → enable RLS + SELECT policy → re-run advisor.
- **Ranking type mismatch (`uuid` vs `text`)** → runtime error on real data → fix return type → redeploy fns.
- **Counter drift** (trigger missed) → wrong visitor count → periodic reconcile vs `count(*)` → recompute.
- **Unindexed leaderboard at scale** → slow `game-submit` → query latency alert → add composite indexes.

### Storage
- **Missing object** → broken image/resume → 404 beacon + manifest diff → re-upload; SW cache covers gap.
- **Oversized/wrong-type upload** → bloat/abuse → bucket size/MIME limits → reject at storage layer.
- **Bucket enumerable** → asset path leak → advisor `public_bucket_allows_listing` → drop listing policy after manifest.

### Realtime
- **Publication empty (current)** → no live updates → "0 events" anomaly → publish curated tables → refetch on subscribe.
- **Storm if `visits *` re-added** → CPU spike → load/advisor alert → counter pattern + migration review.
- **Duplicate/out-of-order events** → double-append / wrong order → id-dedupe + absolute counter + sort-on-apply → self-heals.
- **Reconnect after offline** → missed events → on `SUBSCRIBED` refetch source of truth → state heals.

### PWA
- **SW update mid-session** → stale/duplicated assets → `autoUpdate` + cleanupOutdatedCaches + reload prompt → reload.
- **Offline cold start** → app shell missing → precache shell → loads offline.
- **Cache bloat** → quota errors → Workbox expiration (maxEntries/maxAge set) → eviction.

### Mobile
- **Heavy app (EmulatorJS) on low-memory** → tab crash → explicit opt-in load + single mounted app + unmount on background → reload restores shell.
- **Landscape phone misdetected** → tablet layout on a phone → `useFormFactor` coarse+short→mobile rule → correct shell.
- **Lost write while offline** → guestbook post dropped → local queue + replay on reconnect → post lands.
- **Slow network big asset** → UI stall → skeleton + defer + timeout/retry → loads or degrades.

### Accessibility
- **Zoom locked** → WCAG 1.4.4 fail → `App.tsx` deliberately omits `maximum-scale` → pinch-zoom works.
- **Keyboard can't reach a window** → trap/unreachable → focus management on focus + `Esc`/cycle shortcuts → reachable.
- **Motion sensitivity** → genie/Framer animations nauseating → `prefers-reduced-motion` gate (target) → static transitions.
- **Screen reader on window chrome** → unlabeled controls → ARIA roles/labels on window/dock → announced.

### Security
- **Mass insert / bot** → spam, fake scores → tables locked + Edge rate limit + time-trap → blocked at gate.
- **Data scraping (anon_id enumeration)** → privacy leak → aggregates/definer fns instead of raw SELECT → no rows exposed.
- **Key leakage in bundle** → service key exposed → grep/CI check + Vault + never `VITE_`-prefix service key → rotate.
- **CORS too open on writes** → cross-site abuse → tighten allow-origin on write endpoints → restricted.

---

*This document is design-only. No code was written and no database or infrastructure changes were made or executed. Implementation is governed by the phased plans referenced above.*
