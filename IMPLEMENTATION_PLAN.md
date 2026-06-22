# JeffOS — Implementation Plan (Modernization)

> Phase 1 deliverable: architecture audit + migration strategy. **No code changes in this phase.**
> Source of truth: [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) · [UI_UX_ARCHITECTURE.md](UI_UX_ARCHITECTURE.md) · [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md) · [MOBILE_STRATEGY.md](MOBILE_STRATEGY.md) · [REFACTOR_ROADMAP.md](REFACTOR_ROADMAP.md)
> Generated 2026-06-21.

---

## 0. Purpose & Guardrails

This document is the contract for *how* the modernization is executed against the current code, so that every later phase is incremental and reversible. It does **not** change behavior.

**Hard rules (from the task brief):**
- Do **not** rewrite from scratch. Do **not** remove the desktop OS experience. Do **not** break existing apps. Do **not** add unnecessary abstractions.
- Prefer incremental migration, backwards compatibility, and feature flags where a change is risky.
- Verify each phase before advancing.

**Session scope (agreed with owner):** Phases 1 + 2 only — this audit, then `PERFORMANCE_MIGRATION.md` + the performance foundation (lazy apps, Suspense, manualChunks). Phases 3–8 are documented here for context but not implemented yet.

**Environment note:** this workspace had no Node toolchain and no `node_modules`. Node is being installed so builds/typechecks can actually run; verification commands in §7 assume it succeeds. Backend-dependent items (games index, visitor counter) will ship with their SQL/config authored alongside defensive frontend fallbacks, per owner direction.

---

## 1. Current Architecture (as-built, verified 2026-06-21)

Working tree is clean except the five analysis docs. Re-verified today: **no `React.lazy`/`Suspense`/dynamic `import()` anywhere in `src/`**, and **no `manualChunks`/`rollupOptions` in `vite.config.ts`** — confirming the single-bundle finding still holds.

### 1.1 Boot & composition
```
main.tsx → QueryClientProvider → GlobalSoundProvider → BootLoader → App
App → StatusBar · Desktop · WindowManager · Dock · Visitors/Socials · KeyboardHelp
WindowManager → Window[] (per id) → AppComponent (resolved from static AppRegistry)
```

### 1.2 App registry (the code-split target)
[src/apps/registry/registry.tsx](src/apps/registry/registry.tsx) eagerly `import`s all built apps at module top and maps `AppId → { component, resizable, expandToFit }`. Apps currently registered: `wallpapers, games, guestbook, synth, explorer, recruiter, finder, itunes, terminal, calendar, bmcoffee` (+ special-cased `about`/`about-app` handled inside Window). `ControlPanel`, `Resume`, `AboutThisMac` are imported but routed elsewhere.

`Window.tsx` resolves `AppRegistry[win.appKey]` and renders `AppComponent` directly — **this is the single chokepoint where lazy loading must be introduced** (Phase 2).

### 1.3 State
Single Zustand store, 5 slices (`ui, prefs, apps, games, metrics`), `persist` → `localStorage["whoisthedev-root"]`. Server data is fetched ad hoc (some via React Query, some via raw Supabase calls in components/hooks).

### 1.4 Heavy dependencies in the initial bundle (verified in package.json)
`framer-motion`, `@supabase/supabase-js`, `react-rnd`, `@dnd-kit/core`, `fuse.js`, `fast-average-color`, the full set of `@radix-ui/*`, plus the EmulatorJS integration loaded by the Games app. None are split today.

---

## 2. Dependencies (impact map for the refactor)

| Area | Library | Role | Phase-2 disposition |
|------|---------|------|---------------------|
| Animation | `framer-motion` | window/dock/desktop motion | Keep; isolate into its own vendor chunk; lazy out of hire path later (Phase 2.6, optional this session) |
| Windowing | `react-rnd` | drag/resize frame | Keep; vendor chunk |
| DnD | `@dnd-kit/*` | desktop icon drag | Keep; vendor chunk |
| Data | `@tanstack/react-query` | server-state cache | Keep; core (stays in main) |
| Backend | `@supabase/supabase-js` | DB/storage/realtime | Keep; vendor chunk |
| Search | `fuse.js` | (future Spotlight) | Keep; lazy with the feature |
| UI | `@radix-ui/*`, `vaul`, `sonner` | primitives | Keep; main or grouped vendor |
| Color | `fast-average-color` | wallpaper color | Keep; lazy with consumer |
| Emulation | EmulatorJS (runtime) | Games app | Must be lazy — never in initial bundle |

No dependencies are being added or removed in Phase 2. (Sentry/web-vitals/flags are Phase 1.2/2.8/5.5 — out of this session's scope.)

---

## 3. Risk Areas (ranked, with mitigations)

| # | Risk | Likelihood | Blast radius | Mitigation |
|---|------|-----------|--------------|------------|
| R1 | Lazy boundary breaks apps that render synchronously inside `Window` (e.g. measure-on-mount, audio context, EmulatorJS init) | Med | Per-app | One shared `<Suspense>` fallback in `Window`; test each app opens; keep `expandToFit`/`resizable` meta intact |
| R2 | Suspense fallback flashes/janks window chrome | Med | Cosmetic | Fallback rendered *inside* the window content area only; chrome stays mounted |
| R3 | `manualChunks` misgroups and *increases* initial JS or creates circular vendor chunks | Med | Global perf | Group conservatively (react / framer / supabase / radix / dnd); measure before/after with `vite build` output |
| R4 | StrictMode double-invoke + lazy = double network fetch of a chunk (harmless) or double-init of audio/emulator (harmful) | Low | Games/Synth | Verify teardown in `SynthCore`/`EmulatorFrame`; lazy import is idempotent, side-effectful init is the concern |
| R5 | Theme module globals (`THEME_PACKS`) imported by both `App.tsx` and `Desktop.tsx` — touching them in Phase 6 risks the racy effects | Low *this session* | Desktop wallpaper | Phase 6 not in scope now; Phase 2 must not touch theme code |
| R6 | Persisted `windows` in localStorage means a returning user reopens windows that now lazy-load — first paint shows Suspense fallback | Low | UX | Acceptable; fallback is brief. Noted for Phase 1.9 (persist cleanup, not this session) |
| R7 | No build available to catch type errors → regressions slip in | Was High | Global | **Mitigated** by installing Node so `tsc -b && vite build` runs in verification |

---

## 4. Components Affected by the Refactor

### Phase 2 (this session) — touched files
- **`vite.config.ts`** — add `build.rollupOptions.output.manualChunks`. Additive, no behavior change.
- **`src/apps/registry/registry.tsx`** — convert eager imports to lazy loaders. The registry shape gains a `load: () => Promise<...>` (or wraps each `component` in `React.lazy`). Backwards-compatible: `Window` still reads `appMeta.component`.
- **`src/components/Window.tsx`** — wrap the `<AppComponent />` render site in `<Suspense fallback={…}>`. Minimal, localized to the content `<div>`.

### Phases 3–8 (documented, not yet touched)
- New: `src/shells/{DesktopShell,TabletShell,MobileShell}/`, `src/hooks/useFormFactor.ts`, `ResponsiveShellRouter`, `src/components/AppSurface.tsx`, mobile `TabBar`/`MoreDrawer`, `RecruiterHome`.
- Refactor: `src/config/themes.ts` → `ThemeProvider`/`useThemes`/`useApplyTheme`; `App.tsx`/`Desktop.tsx` effect consolidation; `useVisitors.ts`; `EmulatorApp.tsx` games index; persistence in `store/index.ts`.

---

## 5. Migration Strategy

**Principle: strangler-fig, not big-bang.** Each change wraps or augments existing code paths so the old behavior remains until the new one is proven.

1. **Code-splitting first (Phase 2).** Purely additive at the registry/Window boundary. The app behaves identically; only the *network/bundle shape* changes. This is the lowest-risk high-value change and unblocks the bundle-size metric.
2. **Shells via a router, not a rewrite (Phase 3).** `ResponsiveShellRouter` chooses a shell; the existing desktop composition becomes `DesktopShell` essentially unchanged. Mobile/tablet are *new* trees that reuse the same registry + store — the desktop path is untouched.
3. **`AppSurface` decouples apps from windowing (Phase 3).** Apps keep rendering their current component; the shell decides the container (window vs full-screen vs pane). No app internals change.
4. **Theme-as-data behind a flag (Phase 6).** Build `useThemes`/`useApplyTheme` alongside the globals, switch the read path, then delete globals once parity is confirmed.
5. **Backend items ship dual-path (Phases 5/8).** New `games_index`/aggregate-counter reads fall back to the current logic if the new table/RPC is absent, so deploying frontend before backend never breaks.
6. **Feature flags** gate anything user-visible and risky (new shells, theme provider) so rollout/rollback is a config change.

**Sequencing matches REFACTOR_ROADMAP:** 1 → 2 → 3 → 4 → 5..8. Phase 2 has no dependency on later phases, so it is safe to land in isolation this session.

---

## 6. Verification Strategy (per phase)

Because correctness can't be eyeballed for bundle changes, every phase ends with:
1. `tsc -b` clean (no type regressions).
2. `vite build` succeeds and the **chunk manifest** is inspected (Phase 2's whole point).
3. Manual smoke of the affected path (`vite preview`) where a UI behavior changed.
4. A deliverables report: changes / decisions / affected files / risks / follow-ups.

**Phase-2 specific acceptance:** the build output must show **separate chunks** for `games`/EmulatorJS, `synth`, `explorer`, `terminal`, and vendor groups — and the **initial/entry chunk must not contain** the Games/Emulator/Synth/Browser/Terminal code. This is checked by reading `vite build`'s emitted file list and chunk sizes.

---

## 7. Commands (this environment)

Node is being installed via Homebrew (`/opt/homebrew/bin`). Once present:

```bash
npm install            # restore node_modules (currently absent)
npm run build          # tsc -b && vite build  → inspect dist/assets chunk list
npm run preview        # smoke test built output
npm run lint           # eslint (note: eslint.config.js has a known trailing module.exports bug — Phase 1.1)
```

If Node setup fails, fallback is static verification (type-consistency review) with that limitation called out explicitly in each phase report.

---

## 8. Out of Scope This Session (tracked for later)

Phases 3–8 in full: shells, mobile/tablet, recruiter home, theme provider, accessibility pass, scalability/backend. Also the Phase-1 housekeeping items (Sentry, `.env.example`, eslint fix, empty-file cleanup) — these are low-risk and can be batched, but the owner scoped this session to the performance foundation, so they are deferred with no code touched.

---

## 9. Phase 1 Deliverables Summary

- **Changes made:** none to application code (audit phase). Created this `IMPLEMENTATION_PLAN.md`. Began installing Node toolchain so later verification can run real builds.
- **Architectural decisions:** strangler-fig migration; code-splitting introduced at the single `registry`/`Window` boundary; shells added via a router that leaves the desktop path intact; backend changes ship dual-path behind fallbacks/flags.
- **Affected files (this phase):** documentation only.
- **Risks:** R7 (no build) is the main one — actively mitigated by installing Node. If install fails, Phase 2 verification degrades to static review.
- **Follow-up / next:** proceed to Phase 2 — author `PERFORMANCE_MIGRATION.md` *before* code, then implement lazy loading + Suspense + manualChunks, then verify the chunk split and report.
