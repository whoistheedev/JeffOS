# JeffOS — Phase 3: Responsive Shell Architecture (Foundation)

> Phase 3 deliverable, authored **before** code changes. Implements the shell architecture from [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) §2.2 and [MOBILE_STRATEGY.md](MOBILE_STRATEGY.md) §1.
> Generated 2026-06-21.

---

## 0. Scope (explicitly bounded)

**In scope — foundation only:**
- `useFormFactor()` hook (width + pointer + orientation, resize-reactive).
- `ResponsiveShellRouter` that selects a shell by form factor.
- `DesktopShell` — the **current desktop experience, extracted verbatim**.
- `TabletShell` / `MobileShell` — **scaffolds** that render a safe, minimal experience and clearly signal "foundation, not the redesign."
- `AppSurface` — a windowing-agnostic abstraction that renders a registry app by `appKey`.

**Explicitly NOT in scope (deferred to Phase 4+, per instruction):**
- The full mobile redesign (TabBar, app stack, More drawer, Recruiter/Resume mobile views).
- The tablet rail + split panes.
- Any change to desktop behavior, theme logic, or app internals.

## 1. Backwards-Compatibility Strategy

The #1 rule: **the desktop experience must be byte-for-byte the same.** Achieved by:

1. **Extract, don't rewrite.** `DesktopShell` contains the *exact* JSX currently inside `App.tsx`'s `return` (StatusBar · Desktop · WindowManager · Dock · Visitors/Socials widgets · KeyboardHelp), with identical class names.
2. **App.tsx keeps all its effects.** The theme/holiday/wallpaper `useEffect`s in `App.tsx` are untouched; only the returned JSX changes from the inline tree to `<ResponsiveShellRouter />`.
3. **Default to desktop.** `useFormFactor()` defaults to `'desktop'` during SSR/first paint and whenever detection is ambiguous, so nothing regresses if matchMedia is unavailable.
4. **No router for app launching.** Shells reuse the existing Zustand `openWindow`/`desktopIcons.launch` flow. `AppSurface` reuses the existing `AppRegistry` + Suspense pattern from Phase 2. No new global state.

## 2. Form-Factor Detection (`useFormFactor`)

Per MOBILE_STRATEGY §1 — capability, not width alone:

```
mobile  = (max-width: 767px) OR (pointer:coarse AND max-width:1023px AND portrait)
tablet  = (768–1023px)       OR (pointer:coarse AND min-width:768px AND landscape)
desktop = (min-width:1024px) AND (pointer:fine OR hover:hover)
landscape phone (coarse, short height) → MOBILE
```

Implementation notes:
- Uses `window.matchMedia` + a `resize`/`orientationchange` listener (so foldables/rotation re-evaluate — fixes the "read `innerWidth` once at render" bug the docs call out).
- Returns a typed `FormFactor = 'desktop' | 'tablet' | 'mobile'`.
- SSR-safe: returns `'desktop'` when `window` is undefined.
- This becomes the **single** source of viewport truth; later phases migrate `Window.tsx`/`Dock.tsx` off raw `window.innerWidth` to it.

## 3. `AppSurface` Abstraction

A small component that, given an `appKey` (and optional props), renders that app's component from `AppRegistry` inside a `<Suspense>` — **with no windowing assumptions**. The shell decides the container:
- DesktopShell → renders apps inside `Window` (unchanged; Window already resolves the registry).
- Tablet/Mobile scaffolds → render `AppSurface` directly in a full-bleed container.

This is the seam that lets one app run in a window, a pane, or full-screen without app code changing.

## 4. Components & Files

**New:**
- `src/hooks/useFormFactor.ts`
- `src/components/AppSurface.tsx`
- `src/shells/ResponsiveShellRouter.tsx`
- `src/shells/DesktopShell/DesktopShell.tsx` (+ `index.ts`)
- `src/shells/TabletShell/TabletShell.tsx` (+ `index.ts`)
- `src/shells/MobileShell/MobileShell.tsx` (+ `index.ts`)

**Modified:**
- `src/App.tsx` — return `<ResponsiveShellRouter />` instead of the inline desktop tree. Effects unchanged.

## 5. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Desktop regression from extraction | JSX copied verbatim; build + visual parity check; default-to-desktop |
| Tablet/Mobile scaffold looks unfinished to a real mobile visitor | Scaffold renders the recruiter-friendly basics (identity + key links) and an explicit "full JeffOS on desktop" affordance — never a broken/blank screen |
| `matchMedia` unavailable (old/SSR) | Hook guards `typeof window`; defaults desktop |
| Shell remount thrash on resize across a breakpoint | Form factor is memoized; only changes when the bucket actually changes |
| Form factor disagrees with existing `sm:` Tailwind breakpoints | Desktop path unaffected (still uses the same markup); scaffolds own their own layout |

## 6. Verification Plan

`npm run build` (green + chunk check), `npm run lint` (no *new* errors vs. baseline), `vite preview` serve check. Document affected files, perf impact (shell code is tiny; must not bloat entry), and migration risks.

---

## 7. Results (measured after implementation)

**Affected files**
- New: `src/hooks/useFormFactor.ts`, `src/components/AppSurface.tsx`, `src/shells/ResponsiveShellRouter.tsx`, `src/shells/DesktopShell/{DesktopShell.tsx,index.ts}`, `src/shells/TabletShell/{TabletShell.tsx,index.ts}`, `src/shells/MobileShell/{MobileShell.tsx,index.ts}`.
- Modified: `src/App.tsx` (imports + return only; all theme/holiday effects unchanged).

**Build** — green, `tsc -b` clean, no chunk-size warning. 2337 → 2345 modules.

**Performance impact**
- Entry (app shell) chunk: **121.60 kB → 125.53 kB** (gzip 37.64 → 38.54 kB). +3.9 kB raw / +0.9 kB gzip — the cost of the form-factor hook + 3 shells + AppSurface + the lucide icons used by the MobileShell scaffold. These must live in the entry because the router decides at runtime which shell to mount.
- **All lazy app chunks unchanged** — the Phase-2 split is fully preserved; entry verified still free of `SUPPORTED_SYSTEMS`/`createOscillator`.
- Net: negligible entry growth for the whole shell foundation; no regression to code-splitting.

**Lint** — new files: **0 errors, 0 warnings**. The one warning on `App.tsx` (`themesLoadedAt` unnecessary dep) is **pre-existing** (verified identical on git HEAD); Phase 3 added none.

**Parity** — DesktopShell's rendered element tree is **identical** to the original `App.tsx` return (verified by diff: same 7 components, same widgets block). `useFormFactor()` defaults to `desktop`, so desktop users are unaffected.

**Preview** — `vite preview` serves HTTP 200; `#root` present; entry + lazy chunks fetch on demand.

**Acceptance criteria — all met:** DesktopShell ✅ · TabletShell ✅ (scaffold, delegates to desktop) · MobileShell ✅ (scaffold, recruiter-friendly landing + escape hatch) · ResponsiveShellRouter ✅ · useFormFactor ✅ · AppSurface ✅ · backwards compatibility ✅ · full mobile redesign NOT implemented (correctly deferred) ✅.
