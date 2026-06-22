# JeffOS — Performance Audit & Scalability

> Performance Engineer lens. All findings traced to source. Generated 2026-06-21.
> Companion: [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) · [MOBILE_STRATEGY.md](MOBILE_STRATEGY.md) · [REFACTOR_ROADMAP.md](REFACTOR_ROADMAP.md)

---

## 0. Headline

The Lighthouse-95 claim is plausible on a desktop with a warm cache and an empty desktop. It will **not** survive a cold load on a mid-tier phone on 4G, because:

1. **Everything ships in one JS bundle** (no code-splitting, no `manualChunks`).
2. **Startup fires up to 32 HEAD requests** just to resolve theme wallpapers.
3. **Realtime re-queries amplify O(N²)** under concurrency.

These are structural, not tuning issues. Below: risks → quick/medium/major fixes → target metrics → scalability.

---

## 1. Current Performance Risks

### 1.1 Bundle size — 🔴 Critical
- **No code-splitting anywhere.** Verified: zero `React.lazy`/dynamic `import()` in `src/`, and no `manualChunks`/`rollupOptions` in `vite.config.ts`. [registry.tsx](src/apps/registry/registry.tsx) statically imports all 14 apps.
- Heavy deps all land in the **initial** chunk: `framer-motion` (used app-wide), `@supabase/supabase-js`, `react-rnd`, `@dnd-kit/*`, `fuse.js`, `fast-average-color`, plus every Radix package. The **EmulatorJS** integration (the single largest feature) is loaded even for a visitor who only wants the resume.
- A first-time mobile visitor downloads, parses, and executes the *entire OS* to see a desktop.

### 1.2 Unnecessary re-renders — 🟠 High
- **Every `Window` subscribes to the whole `focusStack` array** → focusing/dragging one window re-renders all open windows. [Window.tsx:38](src/components/Window.tsx#L38)
- **`onDrag` writes to the store on every pointer tick** via `useStore.setState`, churning the store (and thus the `windows` subscription in WindowManager) at frame rate during a drag. [Window.tsx:275-282](src/components/Window.tsx#L275-L282)
- **`WindowManager` subscribes to the entire `windows` object**, re-rendering on any field change of any window. [WindowManager.tsx:8](src/components/WindowManager.tsx#L8)
- **Global `document` click handler** plays a sound on *every* click app-wide. [main.tsx:15-19](src/main.tsx#L15-L19)

### 1.3 Large dependencies — 🟠 High
- `framer-motion` is imported broadly (windows, dock, desktop, several apps). It's a big lib used for effects that could partly be CSS. At minimum, lazy-load it out of the critical path for the hire flow.
- Radix packages are individually small but numerous; ensure tree-shaking and avoid pulling unused primitives.

### 1.4 Startup bottlenecks — 🔴 Critical
- **Theme wallpaper resolution = brute-force HEAD probing.** [themes.ts:42-74](src/config/themes.ts#L42-L74) loops 8 themes × up to 4 extensions = **up to 32 `fetch(HEAD)` round-trips** to Supabase on startup, gated inside the App init effect before the desktop fully settles.
- **Multiple overlapping startup effects** in App.tsx (3) + Desktop.tsx (3, incl. an hourly interval) all touch theme/wallpaper state, causing redundant work and layout thrash during boot.
- The **boot splash** adds a deliberate 2.2–3.0s delay for first-time visitors. [main.tsx:37-39](src/main.tsx#L37-L39)

### 1.5 Asset loading — 🟠 High
- Wallpapers are full-size images set as CSS `background-image` with no `srcset`/responsive sizing; `WallpaperData` has an `lqip`/`thumbUrl` field but the desktop path doesn't reliably use a blur-up. A 4K wallpaper on a phone is wasteful.
- `public/icons` ~1.3MB of PNGs; no sprite/format optimization (WebP/AVIF) mentioned.
- Games thumbnails fall back to a remote `dummyimage.com` URL — an **external network dependency** on the games grid. [EmulatorApp.tsx:97](src/apps/games/EmulatorApp.tsx#L97)

### 1.6 Theme loading — 🔴 Critical
Covered in 1.4. The deeper issue: themes are mutable module globals (`THEME_PACKS`, `themesLoadedAt`), so the app can't cache/dedup them via React Query and instead re-derives via effects. See [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) §1.6.

### 1.7 State management inefficiencies — 🟠 High
- `persist` writes the **entire `windows` record** (full geometry of every open window) to localStorage, debounced — and `onRehydrateStorage` serializes the *whole* state again, duplicating work. [index.ts:44-74](src/store/index.ts#L44-L74)
- Dual persistence (`whoisthedev-root` via Zustand **and** a separate `prefs` key written manually) doubles localStorage I/O and risks divergence.

### 1.8 Realtime inefficiency — 🔴 Critical (also a scale issue, see §4)
- **Visitors**: each `visits` change → every client runs `count: exact`. [useVisitors.ts:16-21](src/hooks/useVisitors.ts#L16-L21)
- **Games**: each games-bucket storage change → re-list 31 systems. [EmulatorApp.tsx:117-138](src/apps/games/EmulatorApp.tsx#L117-L138)
- **Games initial load = 31 sequential `storage.list()` calls** on every mount of the Games app. [EmulatorApp.tsx:84-106](src/apps/games/EmulatorApp.tsx#L84-L106)

---

## 2. Quick Wins (< 1 day each)

| Fix | Impact | Where |
|-----|--------|-------|
| Add `manualChunks` to split vendor (framer-motion, supabase, dnd-kit) | 🔴 Large | `vite.config.ts` |
| `React.lazy` each app in the registry + `<Suspense>` | 🔴 Large | registry.tsx / Window |
| Remove `maximum-scale=1` (also a11y) | 🟢 Med | App.tsx:37 |
| Make boot splash skippable / drop to ~600ms | 🟢 Med | main.tsx |
| Narrow `Window` selector: subscribe to `isActive` boolean, not full `focusStack` | 🟠 Med | Window.tsx:38 |
| Throttle `onDrag` store writes (commit on `onDragStop`, use local transform during drag) | 🟠 Med | Window.tsx |
| Drop the duplicate `onRehydrateStorage` full-state writer | 🟢 Small | index.ts |
| Replace `dummyimage.com` fallback with a local placeholder asset | 🟢 Small | EmulatorApp.tsx |
| Memoize / remove the global document click-sound (gate to interactive elements) | 🟢 Small | main.tsx |

## 3. Medium Wins (< 1 week)

| Fix | Impact |
|-----|--------|
| Replace HEAD-probing theme loader with a **single** themes manifest fetch (one request) cached by React Query | 🔴 Large startup win |
| Consolidate the 6+ theme/wallpaper effects into one `useApplyTheme` | 🟠 Maintainability + fewer reflows |
| Move games discovery server-side: one `games_index` query instead of 31 `list()` calls | 🔴 Large (Games TTI + scale) |
| Responsive wallpapers: serve sized variants + LQIP blur-up | 🟠 LCP win on mobile |
| Convert icons to WebP/AVIF + sprite where sensible | 🟢 Transfer-size win |
| Single persistence writer, versioned, prefs-only (stop persisting `windows`) | 🟠 I/O + correctness |

## 4. Major Refactors

- **Code-split by route/shell**: hire path (Resume/Recruiter) as its own entry that does *not* pull the OS or EmulatorJS.
- **Realtime redesign** (payload-carrying broadcasts / polling) — see §6.
- **Themes-as-data via React Query**, deleting module globals.
- **Shell architecture** (desktop/tablet/mobile) — large but it's the mobile-first prerequisite.

---

## 5. Target Metrics

Measured cold, mid-tier Android (e.g. Moto G-class), Slow 4G, for the **hire path** (the journey that must be fast) and the **full desktop**:

| Metric | Hire path target | Full desktop target | Why |
|--------|------------------|---------------------|-----|
| FCP | < 1.2s | < 1.8s | First paint of content |
| LCP | < 2.0s | < 2.5s | Lighthouse "good" threshold |
| TTI | < 2.5s | < 4.0s | Interactive resume/projects fast |
| Total JS (initial) | < 150KB gz | < 250KB gz (shell only; apps lazy) | Today: one undivided bundle |
| INP | < 200ms | < 200ms | Smooth window drag/launch |
| CLS | < 0.05 | < 0.05 | No layout shift on boot |
| Memory (idle, few windows) | — | < 120MB | Catch window-leak regressions |
| Lighthouse (all categories) | ≥ 95 | ≥ 95 | Stated goal — verify per-shell |

Add **RUM (web-vitals → analytics)** so these are tracked in the field, not just in a lab run on the author's laptop.

---

## 6. Scalability — 100k MAU / 10k DAU / 1k concurrent

### 6.1 Supabase / query bottleneck — 🔴 Critical
The visitor counter is the textbook anti-pattern:
```
1,000 concurrent users, each new visit INSERTs a row →
realtime broadcasts the change to ~1,000 clients →
each client runs COUNT(*) on visits →
≈ 1,000 COUNT queries per single visit.
A burst of traffic becomes a self-amplifying query storm (O(N²)).
```
**Fix:** maintain an aggregate counter (DB trigger increments a single row, or a materialized counter), broadcast the *new value* in the realtime payload (clients run 0 queries), **or** drop realtime and poll a cached count every 30–60s via React Query. A portfolio counter does not need realtime precision.

### 6.2 Realtime connection bottleneck — 🟠 High
1,000 concurrent WebSocket subscriptions across `visitors` + `games-realtime` channels is within Supabase Realtime limits but wasteful. Subscribe **only when the relevant app is open** (Games channel only while the Games window exists), and prefer broadcast payloads over re-fetch triggers.

### 6.3 Storage / games listing — 🔴 Critical
31 `storage.list()` calls per Games mount × many users is heavy on the Storage API and slow for users. **Precompute** a `games_index.json` (or a DB table) updated when ROMs change; clients fetch **one** cached object. ROM/wallpaper assets should sit behind a **CDN** (Supabase Storage + CDN, or push to a dedicated CDN/R2) with long cache headers — these are immutable blobs.

### 6.4 Image delivery — 🟠 High
Wallpapers, game thumbnails, and icons must be CDN-served with responsive variants and immutable caching. The current full-size-image-as-background approach won't hold at 10k DAU on mobile data. Remove the external `dummyimage.com` dependency (third-party SPOF on the games grid).

### 6.5 Theme distribution — 🟢 Medium
Today every client HEAD-probes Supabase for wallpapers on boot — at 10k DAU that's ~320k speculative requests/day for data that changes rarely. Ship themes as a **single CDN-cached manifest**; invalidate only when themes change. Effectively free after the §3 fix.

### 6.6 Client memory under heavy use — 🟠 High
No cap on open windows; each keeps geometry in the persisted store and a Framer Motion subtree. Heavy tinkering (many windows, Emulator running) can balloon memory. Add a soft window cap / "minimize others", and ensure Emulator/audio contexts are torn down on close (audit `SynthCore`/`EmulatorFrame` cleanup).

### Scalability verdict
With (a) aggregate-counter visitors, (b) precomputed games index, (c) CDN for assets, (d) themes manifest, and (e) lazy app chunks, JeffOS comfortably serves 100k MAU / 1k concurrent on Supabase's standard tier. **Without them, the visitor counter alone is a latent self-DDoS under a traffic spike.**
