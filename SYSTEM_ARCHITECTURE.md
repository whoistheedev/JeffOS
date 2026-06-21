# JeffOS — System Architecture

> Staff+ architecture audit. Brutally honest by design. Generated 2026-06-21.
> Companion docs: [UI_UX_ARCHITECTURE.md](UI_UX_ARCHITECTURE.md) · [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md) · [MOBILE_STRATEGY.md](MOBILE_STRATEGY.md) · [REFACTOR_ROADMAP.md](REFACTOR_ROADMAP.md)

---

## 0. Executive Summary (read this first)

JeffOS is a genuinely impressive **vintage Mac OS X desktop simulation** with real craft in its window chrome, dock magnification, and theme system. As a portfolio artifact it already signals strong frontend ability. **As an engineering system, it is not yet production-grade**, and several core decisions actively block the stated goals (mobile-first, 100k visitors, Lighthouse 95+, plugin-extensible).

The five highest-severity issues, all verified in code:

| # | Issue | Where | Why it blocks a goal |
|---|-------|-------|----------------------|
| 1 | **No code-splitting at all** — all 14 apps + EmulatorJS + Framer Motion + Supabase ship in one bundle | [registry.tsx](src/apps/registry/registry.tsx) (static imports), `vite.config.ts` (no `manualChunks`) | Kills Lighthouse perf + TTI on mobile |
| 2 | **Mutable module-level globals as state** — `THEME_PACKS`, `themesLoadedAt` are `let` exports mutated at runtime | [themes.ts:26-27](src/config/themes.ts#L26-L27) | Non-reactive; spawns the racy multi-effect theme logic below |
| 3 | **Theme/wallpaper logic duplicated across 4 places** with overlapping timers | [App.tsx](src/App.tsx) (3 effects), [Desktop.tsx](src/components/Desktop.tsx) (3 effects), [prefs.ts](src/store/prefs.ts), themes.ts | Unmaintainable; race conditions; impossible to reason about |
| 4 | **Realtime fan-out re-queries** — every visit/game-storage change triggers a full re-fetch on *every* client | [useVisitors.ts:16-21](src/hooks/useVisitors.ts#L16-L21), [EmulatorApp.tsx:117-138](src/apps/games/EmulatorApp.tsx#L117-L138) | N² amplification at 1,000 concurrent users |
| 5 | **No mobile shell** — only `disableDragging` under 480px | [Window.tsx:256](src/components/Window.tsx#L256) | Directly contradicts "mobile-first" |

The rest of this document maps the current architecture, then proposes a target architecture that fixes these without throwing away the parts that are good (the window/dock UX, the slice pattern, the command bus idea).

---

## 1. Current Architecture

### 1.1 Component Hierarchy

```
main.tsx (createRoot, React.StrictMode)
└─ QueryClientProvider                 ← TanStack Query (only used by a few apps)
   └─ GlobalSoundProvider              ← global document click → play sound
      └─ BootLoader                    ← first-visit splash (localStorage gate)
         └─ App                        ← theme/holiday orchestration + layout
            ├─ StatusBar               ← menu bar, clock, battery, network, ⌘C/⌘V (placeholder)
            ├─ Desktop                 ← wallpaper layer + AutoArrangedIcons + context menu
            │   └─ AutoArrangedIcons → DesktopIcon[]
            ├─ WindowManager           ← maps windows → Window[]
            │   └─ Window (per id)     ← Rnd frame, traffic lights, genie anim
            │       └─ AppComponent    ← resolved from AppRegistry (static)
            ├─ Dock                    ← DockItem[] with magnification springs
            ├─ VisitorsWidget / SocialsWidget   (sm+ only)
            └─ KeyboardHelp
```

### 1.2 State Management Architecture

Single Zustand store composed of 5 slices, with `persist` → localStorage (key `whoisthedev-root`). See [store/index.ts](src/store/index.ts).

```
useBoundStore (Zustand)
├─ UiSlice      windows, focusStack, dock, dockIconPositions   (ui.ts)
├─ PrefsSlice   anonId, prefs{theme,wallpaper,sound…}, activeTheme   (prefs.ts)
├─ AppsSlice    apps, desktopIcons, trash   (apps.ts)
├─ GamesSlice   sessions, leaderboards   (games.ts)
└─ MetricsSlice metrics   (metrics.ts)

Persistence: persist({ partialize, debounced write 200ms })
React Query:  parallel server-state layer for guestbook/projects/games fetches
```

**Problems identified:**
- `partialize` persists `windows` (full record) → open windows are restored across reloads (questionable UX) and writes large blobs.
- `partialize` references **phantom keys** `anonIdOld`, `anoId` (typo of `anonId`) cast through `as any` — dead/confused persistence config. [index.ts:48-50](src/store/index.ts#L48-L50)
- Two persistence systems coexist: Zustand `persist` **and** manual `localStorage.setItem("prefs", …)` inside [prefs.ts](src/store/prefs.ts) and [themes.ts](src/config/themes.ts). They store overlapping wallpaper data under different keys and can disagree.
- `onRehydrateStorage` re-implements a debounced full-state write that duplicates what `persist` already does — and serializes the *entire* state, not the partialized subset.

### 1.3 Data Flow

```
                 ┌──────────────────────────────┐
   user input →  │  Components (Window/Dock/…)   │
                 └───────────┬──────────────────┘
                             │ store actions / setState
                 ┌───────────▼──────────────────┐
                 │   Zustand store (5 slices)    │ ←─ persist → localStorage
                 └───────────┬──────────────────┘
                             │ selectors
                 ┌───────────▼──────────────────┐
                 │   Re-render (see §1.4 issue)  │
                 └──────────────────────────────┘

   Side channels (bypass the store):
   • window.dispatchEvent("theme:changed")   themes.ts → Desktop.tsx
   • commandBus (custom event emitter)        lib/commandBus.ts
   • window._gamesRefreshTimer (global var)   EmulatorApp.tsx
   • module-level THEME_PACKS / windowMemory  themes.ts / Window.tsx
```

The app has **five parallel communication mechanisms** (store, DOM CustomEvents, command bus, module globals, `window.*` globals). This is the central maintainability problem — there is no single source of truth.

### 1.4 Window Manager Architecture

[WindowManager.tsx](src/components/WindowManager.tsx) subscribes to the **entire** `windows` object and renders one `<Window>` per id. Each [Window.tsx](src/components/Window.tsx):

- Subscribes to `focusStack` (the **whole array**) → **every window re-renders on any focus/drag/minimize**. [Window.tsx:38](src/components/Window.tsx#L38)
- Stores per-app geometry in a **module-level mutable `windowMemory` map** outside React/Zustand. [Window.tsx:26-29](src/components/Window.tsx#L26-L29)
- Reads `window.innerWidth < 480` **once during render** to decide draggability — never recomputed on rotation. [Window.tsx:256](src/components/Window.tsx#L256)
- Writes geometry on every `onDrag` tick via `useStore.setState` → high-frequency store churn during drags.
- Has a `useState`-before-early-`return null` ordering that is fragile under StrictMode. [Window.tsx:41-42](src/components/Window.tsx#L41-L42)
- Minimize is implemented **twice** (a `setTimeout(500)` in [ui.ts:92](src/store/ui.ts#L92) *and* an `onAnimationComplete` in Window) — two code paths racing to set `minimized:true`.

### 1.5 App Registry Architecture

[registry.tsx](src/apps/registry/registry.tsx) is a static object mapping `AppId → { component, resizable, expandToFit }`, with **eager top-level imports** of all 14 apps. There is no lazy boundary, no manifest, no per-app metadata (icon, default size, capabilities, mobile support). Adding an app = editing this file + the apps slice + menus config in 3+ places. **This is not a plugin system; it is a hardcoded switchboard.**

### 1.6 Theme System

The most over-engineered subsystem. Flow:
1. `LOCAL_THEMES` (8 holiday packs) defined in [themes.ts:14](src/config/themes.ts#L14).
2. `loadThemesFromSupabase()` probes Supabase Storage for wallpapers by **brute-forcing 4 file extensions per theme via HEAD requests** = up to 32 network round-trips on startup. [themes.ts:42-74](src/config/themes.ts#L42-L74)
3. Results mutate the module-global `THEME_PACKS` and bump `themesLoadedAt` (a `let` number used as a poor-man's reactivity signal).
4. `applyThemeToDocument()` sets CSS vars on `<html>` **and** fires a `theme:changed` CustomEvent **and** writes wallpaper to `localStorage.prefs` as a side effect.
5. Three components/effects then race to pick the wallpaper: App.tsx (3 effects), Desktop.tsx (3 effects + hourly interval), prefs slice.

### 1.7 Supabase Integration

Single client in [supabase.ts](src/lib/supabase.ts) with `persistSession/autoRefreshToken` on (though there's no auth flow — anonymous only). Used for: themes (storage HEAD probing), wallpapers, games (storage listing), guestbook, recruiter projects, visitor counts. Anon key is the only credential. `edge.ts` (intended Edge Functions wrapper) is **empty**.

### 1.8 Realtime Architecture

Two `postgres_changes` subscriptions:
- **Visitors** — on any change to `visits`, every connected client runs a fresh `count: exact` query. [useVisitors.ts](src/hooks/useVisitors.ts)
- **Games** — on any change to `storage.objects` in the games bucket, re-list all 31 systems (debounced 1.2s via a `window._gamesRefreshTimer` global). [EmulatorApp.tsx:117](src/apps/games/EmulatorApp.tsx#L117)

`useRealtimeChannel.ts` (intended generic wrapper) is **empty** — each consumer hand-rolls its own channel.

### 1.9 PWA Architecture

`vite-plugin-pwa` with `registerType: autoUpdate`, Workbox runtime caching (Supabase assets 7d, local 30d, pages NetworkFirst). Manifest defined both inline and in `public/site.webmanifest`. Solid baseline — the PWA layer is the **healthiest** part of the system. No `manualChunks`, so the SW precaches one giant JS chunk.

---

## 2. Target Architecture

Design principles: **one source of truth, lazy by default, reactive theme as data, shells per form-factor, plugin-shaped registry.** Prefer simplicity — delete the side channels.

### 2.1 Layered Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│ PRESENTATION LAYER                                                    │
│  ResponsiveShellRouter (chooses by breakpoint + pointer/coarse)       │
│   ├─ DesktopShell (≥1024)  ── WindowManager → Window → <AppSurface>   │
│   ├─ TabletShell  (768–1023) ─ split / single-window + sidebar nav    │
│   └─ MobileShell  (<768)    ── AppSwitcher (full-screen apps) + TabBar │
│  ThemeProvider (reactive)   NavigationLayer   A11y/FocusManager       │
└───────────────┬─────────────────────────────────────────────────────┘
                │ launch(appId, props) / command(name, payload)
┌───────────────▼─────────────────────────────────────────────────────┐
│ APPLICATION LAYER                                                     │
│  AppRegistry (manifest + React.lazy loader + capabilities)            │
│  CommandBus (typed, replaces DOM CustomEvents + window globals)       │
│  FeatureModules (each app = self-contained module w/ manifest)        │
│  PluginHost (runtime registration API → future 3rd-party apps)        │
└───────────────┬─────────────────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────────────────┐
│ DATA LAYER                                                            │
│  Zustand stores (ui / prefs / apps) — UI + persisted prefs ONLY       │
│  React Query (ALL server state: themes, games, guestbook, projects)   │
│  Persistence adapter (single key, single writer, versioned/migrated)  │
│  Supabase services (typed repo functions, one per domain)             │
└───────────────┬─────────────────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────────────────┐
│ INFRASTRUCTURE LAYER                                                  │
│  Analytics │ Error Tracking (Sentry) │ Logging │ Web Vitals/RUM │ Flags│
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Presentation Layer — Shells

Replace the single desktop layout with a **shell router** that selects an experience from `(min-width, pointer:coarse, hover:none)` — not just width.

```
useFormFactor() → 'desktop' | 'tablet' | 'mobile'
  desktop: hover-capable, ≥1024px            → DesktopShell (windows + dock)
  tablet : 768–1023 OR coarse pointer ≥768   → TabletShell  (1 window + rail)
  mobile : <768 OR (coarse && <1024)         → MobileShell  (full-screen apps)
```

All three shells consume the **same AppRegistry and CommandBus**. An app renders into an `<AppSurface>` that knows nothing about windowing — the shell decides whether that surface is a draggable window, a tablet pane, or a full-screen mobile view. (Details + wireframes in [MOBILE_STRATEGY.md](MOBILE_STRATEGY.md).)

### 2.3 Application Layer — Registry + Command Bus + Plugins

**Registry as manifest** (lazy by default):

```ts
// one entry per app — code-split, capability-aware
type AppManifest = {
  id: AppId
  title: string
  icon: string
  load: () => Promise<{ default: ComponentType<AppProps> }> // React.lazy target
  window?: { defaultSize; resizable; expandToFit }
  surfaces: ('desktop' | 'tablet' | 'mobile')[]   // which shells support it
  capabilities?: ('realtime' | 'audio' | 'offline')[]
}
```

`React.lazy(manifest.load)` + `<Suspense>` per app surface → each app becomes its own chunk. EmulatorJS, the synth audio graph, and the music player stop weighing down first load.

**Command Bus** becomes the *single* cross-feature channel (typed events), absorbing today's `theme:changed` CustomEvent, the `commandBus`, and the `window.*` globals. Apps emit/subscribe to typed commands; no app imports another app.

**Plugin host**: because the registry is now data + a loader function, a `registerApp(manifest)` API is a thin wrapper. Third-party/MDX/iframe apps become possible without touching the shell.

### 2.4 Data Layer — collapse the five channels into two

- **Zustand** owns *only* ephemeral UI (windows, focus, dock) + persisted user prefs. No server data, no module globals.
- **React Query** owns *all* server state — themes, wallpapers, games, guestbook, projects, visitor counts. Caching, dedup, and background refresh come for free and fix the realtime fan-out (see below).
- **Themes become data, not globals.** `useThemes()` = a React Query hook returning the resolved packs; `activeTheme` is a single store field; a *single* `useApplyTheme()` effect writes CSS vars. Delete `THEME_PACKS`/`themesLoadedAt` globals, the `theme:changed` event, and the duplicated effects.
- **One persistence writer**, one key, a `version` field + migration function. Drop the manual `localStorage("prefs")` writes and the phantom `anonIdOld/anoId` keys.

### 2.5 Realtime, redesigned (scales to 1,000 concurrent)

Current pattern broadcasts a change to N clients, each of which fires a query → **O(N) queries per write, O(N²) per active period.**

```
BEFORE                                AFTER
write → broadcast → N clients         write → DB trigger updates a counter row
        each runs COUNT(*)            → broadcast carries the NEW VALUE in payload
        = N queries per write           → clients read payload, run 0 queries
```

- **Visitors**: maintain an aggregate count (DB trigger or `pg` counter); broadcast the value in the realtime payload so clients never query. Or drop realtime entirely and poll every 30–60s via React Query — a portfolio visitor counter does not need sub-second accuracy.
- **Games**: list once via React Query with a long `staleTime`; invalidate on realtime event instead of imperatively re-listing 31 buckets. Better: precompute a `games_index` table/JSON so the client makes **1** request, not 31.

(Full scalability math in [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md) §Scalability.)

### 2.6 Infrastructure Layer (currently absent)

`analytics.ts`, `edge.ts`, `workers.ts` are **empty files**. Stand up:
- **Error tracking**: Sentry (or equivalent) with source maps — today a render crash in any app is invisible.
- **Web Vitals RUM**: report FCP/LCP/INP/CLS to confirm the Lighthouse-95 goal in the field, not just lab.
- **Analytics**: privacy-respecting (Plausible/Umami) keyed off the existing `anonId`.
- **Feature flags**: gate half-built apps (Explorer, MIDI) and risky experiments; enables the plugin rollout.

---

## 3. Dependency Diagram (target import direction)

```
        Shells ─────────────┐
          │ (uses)          │ (uses)
          ▼                 ▼
     AppRegistry ───────► CommandBus
          │ lazy-loads          ▲
          ▼                     │ emit/subscribe
     FeatureModules (apps) ─────┘
          │ (read/write)
          ▼
   Stores (ui/prefs)   React Query ──► Supabase repos ──► Supabase
          │                                   │
          ▼                                   ▼
   Persistence adapter              Infra (analytics/errors/flags)

RULE: arrows point one way. Apps never import other apps or shells.
      Cross-app talk goes through CommandBus only.
```

Contrast with today, where `Desktop.tsx` imports theme globals, `Window.tsx` imports the registry, the registry imports every app, and apps reach back into `window.*` — a cyclic, tangled graph.

---

## 4. What to Keep vs Change vs Delete

**Keep (genuinely good):**
- The sliced Zustand pattern (just narrow its responsibility).
- The window chrome, traffic lights, genie animation, dock magnification — this is the product's soul.
- The PWA/Workbox setup.
- The holiday-theme *concept* (just implement it once, as data).

**Change:**
- Registry → lazy manifest. Theme globals → React Query data. Realtime → payload-carrying / polling. Window subscriptions → narrow selectors. Single shell → shell router.

**Delete:**
- Empty scaffolding: `lib/analytics.ts`, `lib/edge.ts`, `lib/keyboard.ts`, `lib/profanity.ts`, `lib/workers.ts`, `hooks/useKeyboardShortcuts.ts`, `hooks/useRealtimeChannel.ts` (all 0 lines) — implement or remove; dead files imply features that don't exist.
- The `theme:changed` CustomEvent path, `window._gamesRefreshTimer`, module-level `windowMemory` and `THEME_PACKS` globals, the broken trailing `module.exports` in `eslint.config.js`, the phantom persist keys, the duplicate minimize path.

---

## 5. Critical Risks Summary

| Risk | Severity | Evidence |
|------|----------|----------|
| Single monolithic JS bundle | 🔴 Critical | no `manualChunks`, no `lazy()` |
| O(N²) realtime queries at scale | 🔴 Critical | useVisitors / EmulatorApp |
| Theme logic raced across 4 files via globals + events | 🔴 Critical | themes.ts, App.tsx, Desktop.tsx |
| No mobile/tablet shell | 🔴 Critical | Window.tsx only `disableDragging` |
| All windows re-render on any focus change | 🟠 High | Window subscribes to full `focusStack` |
| 31 sequential storage calls to load games | 🟠 High | EmulatorApp.loadGames |
| Dual/triple persistence with phantom keys | 🟠 High | index.ts + prefs.ts + themes.ts |
| No error tracking / RUM | 🟠 High | empty infra files |
| Empty scaffolding implies non-existent features | 🟡 Medium | 7 zero-line files |

Proceed to [REFACTOR_ROADMAP.md](REFACTOR_ROADMAP.md) for the sequenced, costed plan.
