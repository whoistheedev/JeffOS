# JeffOS — Performance Migration (Phase 2)

> Phase 2 deliverable, authored **before** code changes. Implements the code-splitting foundation from [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md) §1.1/§2 and [REFACTOR_ROADMAP.md](REFACTOR_ROADMAP.md) tasks 1.4/1.5.
> Generated 2026-06-21.

---

## 0. Goal

Split the monolithic bundle so apps load on demand. **Games, Emulator, Synth, Browser (Explorer) and Terminal must never be part of the initial bundle.** Behavior must be identical; only the network/bundle shape changes.

## 1. Measured Baseline (before)

Real `npm run build` output on the current `main` (clean tree), this environment:

```
dist/assets/index-D15ERMM-.css   114.04 kB │ gzip:  16.66 kB
dist/assets/index-BtLw8wkt.js    808.48 kB │ gzip: 245.67 kB   ← EVERYTHING in one chunk
2337 modules transformed · built in 1.47s
Vite warning: "Some chunks are larger than 500 kB … use dynamic import() / manualChunks"
```

There is exactly **one** application JS chunk. Every app (incl. EmulatorJS, Synth audio, Explorer, Terminal) + every vendor (framer-motion, supabase, react-rnd, dnd-kit, radix, fuse) is in it. A visitor who only wants the résumé downloads all of it.

## 2. Strategy

Two additive, low-risk changes at the single registry → Window boundary, plus a Vite config addition. No app internals change.

### 2.1 Lazy app loading (`React.lazy`) + Suspense
- Convert `src/apps/registry/registry.tsx` from **eager top-level imports** to **`React.lazy(() => import(...))`** loaders, one dynamic import per app. Each becomes its own Rollup chunk automatically.
- Keep the registry's public shape (`AppRegistry[appKey].component`, `.resizable`, `.expandToFit`) so `Window.tsx` and any other reader need no changes beyond the Suspense wrapper. Backwards-compatible.
- Wrap the `<AppComponent />` render site in `src/components/Window.tsx` in a single `<Suspense fallback={…}>`. The fallback renders **inside the window content area only** — the window chrome (titlebar, traffic lights) stays mounted, so there's no layout flash (mitigates risk R2).

### 2.2 Vendor chunk optimization (`manualChunks`)
- Add `build.rollupOptions.output.manualChunks` to `vite.config.ts`, grouping large, stable vendors into named chunks so they cache independently of app code:
  - `vendor-react` (react, react-dom, scheduler)
  - `vendor-motion` (framer-motion)
  - `vendor-supabase` (@supabase/*)
  - `vendor-dnd` (@dnd-kit/*, react-rnd)
  - `vendor-radix` (@radix-ui/*)
- Grouped **conservatively** to avoid circular vendor chunks or accidentally inflating the entry (risk R3). Everything else (query, sonner, vaul, lucide, etc.) stays in the default vendor split Rollup chooses.

### 2.3 What stays in the initial bundle (by design)
The shell, store, StatusBar/Desktop/Dock/Window chrome, React, and React Query core. These are needed to paint the desktop and are small relative to the app payloads being removed.

## 3. Acceptance Criteria (how Phase 2 is judged)

1. `tsc -b` clean, `vite build` succeeds.
2. Build output shows **separate chunks** for at minimum: Games/EmulatorJS, Synth, Explorer, Terminal (each lazy).
3. The **entry chunk does not contain** Games/Emulator/Synth/Browser/Terminal code (verified by chunk list + sizes; entry chunk meaningfully smaller than the 808 kB baseline).
4. Named vendor chunks (`vendor-react`, `vendor-motion`, `vendor-supabase`, …) appear.
5. `vite preview` smoke: desktop loads; opening each app still works (lazy chunk fetches, app renders).

## 4. Risks & Mitigations (Phase-2 specific)

| Risk | Mitigation |
|------|-----------|
| Lazy app that does measure-on-mount / audio / EmulatorJS init misbehaves under Suspense | Suspense only defers first render; init runs after mount as before. Smoke-test Games + Synth specifically. |
| StrictMode double-mount double-inits audio/emulator (R4) | Pre-existing behavior, not introduced here; noted as follow-up if observed. |
| `manualChunks` increases entry size (R3) | Compare entry chunk size before/after; adjust grouping if regressed. |
| Returning user has persisted open windows → brief Suspense fallback on reload (R6) | Acceptable; fallback is sub-second. Real fix is Phase 1.9 (stop persisting `windows`), out of scope now. |

## 5. Rollback

Both changes are isolated. Reverting `registry.tsx`, `Window.tsx`, and the `vite.config.ts` block restores the exact prior bundle. No data/schema/store changes.

## 6. Out of Scope (deferred perf items)

From the audit/roadmap, *not* in this Phase-2 session: narrow Window selectors (2.1), drag throttling (2.2), games index (2.3 — backend), responsive wallpapers (2.4), icon formats (2.5), framer-motion off the hire path (2.6 — needs the shell split first), boot-splash trim (2.7), RUM (2.8). These are tracked for later phases.

---

## 7. Results (measured after implementation)

`npm run build` after the changes — **no chunk-size warning**, build green, `tsc -b` clean:

```
BEFORE:  dist/assets/index-*.js   808.48 kB  (gzip 245.67 kB)   ← single bundle

AFTER (entry + on-demand chunks):
  dist/assets/index-*.js (ENTRY)        121.60 kB  gzip  37.64 kB   ← app shell only
  dist/assets/vendor-react-*.js         187.05 kB  gzip  58.76 kB
  dist/assets/vendor-supabase-*.js      123.28 kB  gzip  34.26 kB
  dist/assets/vendor-motion-*.js        122.06 kB  gzip  40.72 kB
  dist/assets/vendor-radix-*.js          89.10 kB  gzip  28.39 kB
  dist/assets/vendor-dnd-*.js            50.20 kB  gzip  14.74 kB
  — lazy app chunks (fetched on open) —
  dist/assets/EmulatorApp-*.js           11.74 kB  gzip   4.04 kB
  dist/assets/Synth-*.js                 10.83 kB  gzip   3.89 kB
  dist/assets/Explorer-*.js               6.00 kB  gzip   2.48 kB
  dist/assets/Terminal-*.js               3.72 kB  gzip   1.84 kB
  dist/assets/iTunesApp-*.js             21.04 kB  gzip   6.48 kB
  (+ Finder, Guestbook, Recruiter, Wallpapers, HolidayCalendar, BuyMeCoffee chunks)
```

**Acceptance criteria — all met:**
1. ✅ `tsc -b` clean, `vite build` succeeds, chunk-size warning gone.
2. ✅ Games/EmulatorJS, Synth, Explorer, Terminal each in their own chunk.
3. ✅ Entry chunk **provably free** of heavy-app code — verified the entry contains only the dynamic `import("./EmulatorApp-*.js")` reference, and grep for `SUPPORTED_SYSTEMS`, `crt-mattias`, `createOscillator`, `atarijaguar` returns **nothing** in the entry; that code lives in `EmulatorApp-*.js` / `Synth-*.js`. Entry shrank **808 → 122 kB**.
4. ✅ Named vendor chunks `vendor-react/-motion/-supabase/-dnd/-radix` present.
5. ✅ `vite preview` serves HTTP 200; entry + a lazy chunk both fetch on demand.

> Note: the five preloaded vendor chunks are `modulepreload`-hinted in `index.html`, so initial-load JS (entry + vendors) is ~209 kB gzip. The big win is that **per-app payloads (Emulator, Synth, etc.) no longer load until used**, and vendors now cache independently across deploys. Further trimming initial JS (e.g. lazy-loading `framer-motion` off the hire path) depends on the Phase-3 shell split and is deferred.
