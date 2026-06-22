# JeffOS — Phase 6: UI/UX Redesign (2026)

> Product Design Lead + Staff Frontend lens. **Design only — no code, no implementation, no database changes.**
> Authored 2026-06-21. Source of truth: this repository (`src/`, `src/index.css` tokens, shells, components) + the prior audits.
> Builds on: [UI_UX_ARCHITECTURE.md](UI_UX_ARCHITECTURE.md) · [MOBILE_STRATEGY.md](MOBILE_STRATEGY.md) · [HIGH_LEVEL_SYSTEM_DESIGN.md](HIGH_LEVEL_SYSTEM_DESIGN.md) · [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md) · [SUPABASE_DISCOVERY.md](SUPABASE_DISCOVERY.md)

---

## 0. North Star

**Keep the desktop-OS delight; guarantee the hire signal on every device in under 30 seconds.**

The single most important user is **a recruiter on a phone, time-boxed, possibly on a flaky network**. The OS metaphor is the *brand* and the *engineering demo*; it must never gate the two things that get Jeff hired — **resume** and **projects** — nor the conversion action — **Hire Me**.

Two non-negotiables drive every decision below:
1. **Recruiter conversion first** — Tier-0 (Resume · Projects · Hire Me) is always one tap away, on a conventional, fast, accessible surface, regardless of form factor.
2. **Mobile-first usability** — the mobile experience is *purpose-built and native-feeling*, not a shrunk desktop. (Today `MobileShell` is a landing-page scaffold; `TabletShell` delegates to Desktop — this phase replaces both.)

### What's preserved vs. redesigned
| Preserve (the soul) | Redesign (the friction) |
|---------------------|--------------------------|
| Windowing desktop, dock, menu bar, genie minimize | Flat, undifferentiated app list → **intent-tiered IA** |
| Holiday themes + wallpapers | Right-aligned icons that fall off-screen |
| Games/Synth/Terminal/iTunes "wow" apps | Dock-only nav → **Spotlight + Hire-Me affordance** |
| OKLCH/shadcn token foundation (`index.css`) | Mobile = landing page → **native app-grid shell** |
| Anonymous, frictionless entry | Tablet = desktop clone → **rail + focus surface** |

---

## 1. Design Principles (2026)

1. **Hire path is sacred** — Tier-0 actions are reachable in ≤1 interaction from any state, on any device.
2. **Delight without obstruction** — novelty is opt-in, never a prerequisite to the hire signal.
3. **Native per device** — desktop = windows; tablet = rail+focus; mobile = app-grid + full-screen + sheets.
4. **Motion with meaning** — animation communicates spatial relationships (genie, shared-element), always `prefers-reduced-motion`-aware.
5. **Accessible by construction** — WCAG 2.1 AA minimum; pinch-zoom preserved (already correct in `App.tsx`); keyboard-complete on desktop.
6. **Fast on the worst device** — performance budgets target a mid-range Android on 4G, not a MacBook.
7. **One token system, three shells** — visual language is shared; layout/interaction is shell-specific.

---

## 2. Information Architecture (intent-tiered)

Carried forward and finalized from [UI_UX_ARCHITECTURE.md](UI_UX_ARCHITECTURE.md) §1:

```
TIER 0 — Hire path (always 1 tap, all devices)
         Resume · Projects · Hire Me (contact + socials)

TIER 1 — Signature experiences (the "wow", desktop-first)
         Games · Synth · Terminal · iTunes · Explorer

TIER 2 — System / supporting
         Finder · Wallpapers · Calendar · Control Panel · Guestbook · About · Buy Me Coffee
```

**Affordance per tier:**
- **Tier 0** gets a *non-OS* guarantee: desktop → a persistent **"Hire Me"** menu-bar entry + Spotlight; tablet → pinned top of the rail; mobile → fixed bottom **TabBar** (Home · Resume · Projects · More).
- **Tier 1–2** live inside the OS metaphor on desktop/tablet; surface as grid icons / "More" on mobile.

---

## 3. User Journeys

### 3.1 Recruiter (primary) — "Is this person worth a call?"
**Goal: resume + 2 projects + contact in <30s, any device.**

```
Mobile (the critical path):
 Land → [Home: identity + 3 big CTAs visible above the fold]
      → tap "Resume"  → full-screen PDF + Download/Share sheet      (~5s)
      → back → tap "Projects" → card feed → tap card → live/source  (~15s)
      → tap "Hire Me" (fixed) → contact sheet: email/copy/socials   (~20s)  ✅ converted

Desktop:
 Land → boot (skippable) → desktop
      → "Hire Me" in menu bar  OR  ⌘-Space Spotlight → "resume"
      → Recruiter window (resume embedded + project grid)           (~15s)  ✅
```
**Conversion instrumentation (target):** track Tier-0 taps as funnel events (Home→Resume→Projects→HireMe) via the observability beacon from [HIGH_LEVEL_SYSTEM_DESIGN.md](HIGH_LEVEL_SYSTEM_DESIGN.md) §12.

### 3.2 Peer engineer — "Is the work real?"
Land → explores Tier-1 (Terminal, Games, Synth) → opens Recruiter for source links → reads code on GitHub. The OS metaphor *is* the proof; let them roam.

### 3.3 Casual visitor — "What is this?"
Land → plays with windows/games/holiday theme → maybe signs guestbook. Delight-led; no conversion pressure.

### 3.4 Returning visitor (PWA installed)
Launches installed app → offline-capable shell restores last state → sees live visitor count + new guestbook entries (once realtime is fixed per Phase 5).

---

## 4. Wireframes (low-fidelity, ASCII)

### 4.1 Desktop
```
┌──────────────────────────────────────────────────────────────────────┐
│  Jeff  File  Edit  View   …                ⌘-Space  [Hire Me]  🔋 🕛   │ ← menu bar + Tier-0 CTA
├──────────────────────────────────────────────────────────────────────┤
│  ┌── Recruiter ───────────────┐                                        │
│  │ [Resume PDF preview]       │     ┌── Terminal ──┐    🗂 icons        │
│  │ ── Projects ──             │     │ $ whoami     │    (grid, snapped) │
│  │ [▣ proj] [▣ proj] [▣ proj] │     └──────────────┘                   │
│  │ [Download résumé] [Email]  │                                        │
│  └────────────────────────────┘                                        │
│                                                                        │
│                      Visitors: 1,204 · 🟢 live                         │
├──────────────────────────────────────────────────────────────────────┤
│   🔍  📁 Finder  🎮 Games  💬 Guest  🖼 Wall  ⌨ Term  🌐 Web  ☕         │ ← dock
└──────────────────────────────────────────────────────────────────────┘
```

### 4.2 Tablet (rail + single focus surface)
```
┌────┬───────────────────────────────────────────────┐
│ 🏠 │  Projects                              [Hire]  │
│ 📄 │  ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│ ▣  │  │  thumb  │ │  thumb  │ │  thumb  │           │  ← one focused app,
│ 🎮 │  │  name   │ │  name   │ │  name   │           │     rail switches apps
│ 🎹 │  └─────────┘ └─────────┘ └─────────┘           │
│ ⌨  │  (snap-to-half: browse left / preview right)   │
│ …  │                                                │
└────┴───────────────────────────────────────────────┘
```

### 4.3 Mobile (app-grid home + fixed TabBar)
```
┌───────────────────────┐    ┌───────────────────────┐    ┌───────────────────────┐
│  Hi, I'm              │    │  ← Résumé        ⤓ ⤴  │    │  Projects             │
│  Jeff Idodo          │    │ ┌───────────────────┐ │    │ ┌───────────────────┐ │
│  Full-Stack Dev      │    │ │                   │ │    │ │ [thumb]           │ │
│                      │    │ │   PDF page 1      │ │    │ │ Project name      │ │
│ ┌─────┐┌─────┐┌─────┐│    │ │                   │ │    │ │ short desc  →     │ │
│ │📄 Res││▣ Proj││✉ Hire││    │ └───────────────────┘ │    │ └───────────────────┘ │
│ └─────┘└─────┘└─────┘│    │  [Download] [Share]   │    │ ┌───────────────────┐ │
│ ┌─────┐┌─────┐┌─────┐│    │                       │    │ │ [thumb] …         │ │
│ │🎮 ││🎹 ││⌨ More││    │                       │    │ └───────────────────┘ │
│ └─────┘└─────┘└─────┘│    │                       │    │  (pull-to-refresh)    │
├───────────────────────┤    ├───────────────────────┤    ├───────────────────────┤
│ 🏠   📄   ▣   ⋯       │    │ 🏠   📄*  ▣   ⋯       │    │ 🏠   📄   ▣*  ⋯       │ ← TabBar (Tier-0)
└───────────────────────┘    └───────────────────────┘    └───────────────────────┘
   Home                         Resume (active)              Projects (active)
```

### 4.4 Mobile — Hire Me sheet (`vaul` bottom sheet)
```
╭───────────────────────╮
│        ▁▁▁            │ ← grabber
│  Let's work together  │
│  ✉  jeffrey…@gmail   [copy] │
│  in LinkedIn       →  │
│  ⌥ GitHub          →  │
│  📄 Download résumé   │
╰───────────────────────╯
```

---

## 5. Component Hierarchy

Builds on existing components (`src/components/*`, `src/components/ui/*` — shadcn primitives already present: button, dialog, drawer, tabs, input, slider, switch, textarea, badge).

```
<App>
└─ <ResponsiveShellRouter>                         (exists; selects by useFormFactor)
   ├─ <DesktopShell>
   │  ├─ <MenuBar>                                 (StatusBar.tsx + NEW HireMeMenuItem)
   │  ├─ <SpotlightLauncher>          ★NEW         (Fuse.js — already a dep)
   │  ├─ <Desktop> / <DesktopIcon>                 (fix snapped grid layout)
   │  ├─ <WindowManager> / <Window>                (exists; per-window ErrorBoundary ★)
   │  │   └─ <Suspense> → AppRegistry[appKey]      (lazy chunks, exists)
   │  ├─ <Dock> / <DockTrashIcon>                  (exists)
   │  └─ <VisitorsWidget> <SocialsWidget>          (exists)
   │
   ├─ <TabletShell>                    ★REBUILD    (currently delegates to Desktop)
   │  ├─ <AppRail>                     ★NEW         (Tier-0 pinned top)
   │  ├─ <FocusSurface>               ★NEW         (single active app, optional split)
   │  └─ <HireMeButton>                ★NEW
   │
   └─ <MobileShell>                    ★REBUILD    (currently a static landing page)
      ├─ <MobileHome>                  ★NEW         (app grid + identity)
      ├─ <AppScreen>                   ★NEW         (full-screen active app + nav stack)
      ├─ <BottomSheet>                              (vaul — already a dep)
      ├─ <TabBar>                      ★NEW         (Home · Resume · Projects · More)
      └─ <MoreDrawer>                  ★NEW         (Tier-1/2 apps)

Shared / cross-shell
├─ <ErrorBoundary>                     ★NEW         (per-app + per-shell)
├─ <OfflineBanner>                     ★NEW
├─ <SkeletonLoaders>                   ★NEW         (Suspense fallbacks)
├─ <ResumeViewer>                      ★NEW         (PDF + image fallback, shared by all shells)
├─ <ProjectCard> / <ProjectFeed>       ★NEW         (Recruiter-derived, responsive)
└─ <HireMeSheet>                       ★NEW         (contact + socials + résumé)
```

**Reuse principle:** `ResumeViewer`, `ProjectFeed`, and `HireMeSheet` are **shell-agnostic** — desktop renders them inside a `<Window>`, tablet inside `<FocusSurface>`, mobile inside `<AppScreen>`/`<BottomSheet>`. One implementation, three presentations.

---

## 6. Design Tokens

Extends the existing OKLCH/shadcn `@theme inline` system in [src/index.css](src/index.css) and the holiday `ThemePack` shape in [src/config/themes.ts](src/config/themes.ts). **Do not replace — layer on.**

### 6.1 Color (OKLCH, existing primitives kept)
Existing semantic tokens (`--color-background/foreground/primary/accent/...`) remain. The holiday system already injects an **`accent`** per `ThemePack` (e.g. Christmas `#10B981`, Valentine's `#FB7185`). Add a **conversion-intent token** so the Hire path is visually consistent regardless of theme:
```
--color-hire           : <fixed, AA-contrast CTA color, theme-independent>
--color-hire-foreground: <text-on-hire>
--color-live           : <realtime "🟢 live" indicator>
--color-success / --color-warning / --color-danger : semantic states
```
> Rationale: the holiday `accent` shifts with the season; the **Hire CTA must not** — conversion affordances stay recognizable. Verify every theme's `accent` and `--color-hire` meet **4.5:1** against their backgrounds.

### 6.2 Spacing & radius
Reuse the existing `--radius` scale (`--radius-sm…xl`). Add a touch scale:
```
--touch-target-min : 44px      (WCAG 2.5.5 / Apple HIG)
--space-safe-top / -bottom : env(safe-area-inset-*)   (mobile notch/home-bar)
--sheet-radius : 16px          (vaul bottom sheets)
```

### 6.3 Typography
```
--font-sans   : system-ui stack (already effectively used)
--font-mono   : for Terminal / code (ui-monospace)
--text-display / -h1 / -h2 / -body / -caption  : fluid clamp() ramp (mobile→desktop)
line-height   : 1.5 body / 1.2 headings
```

### 6.4 Elevation & motion tokens
```
--z-wallpaper:0  --z-icons:10  --z-window:100+stack  --z-dock:1000
--z-menu:2000  --z-toast:3000  --z-modal:4000          (formalizes §6 of HLD)
--shadow-window / --shadow-sheet / --shadow-dock
--motion-fast:120ms  --motion-base:240ms  --motion-genie:500ms
--ease-standard: cubic-bezier(0.2,0,0,1)   --ease-decelerate / -accelerate
```

### 6.5 Token governance
- All three shells consume the **same** token set; only layout primitives differ.
- Holiday themes may override `accent`, wallpaper, `menuBarTint`, `dockGlow` — **never** Tier-0/`--color-hire` tokens.
- Tokens are the contract between design and code; new colors must be tokens, not hex literals.

---

## 7. Animation & Motion

| Interaction | Motion | Token | Reduced-motion fallback |
|-------------|--------|-------|--------------------------|
| Window minimize | Genie (existing) | `--motion-genie` | Instant minimize, no warp |
| Window open/focus | Scale+fade in, z-raise | `--motion-base` | Opacity only |
| Mobile app open | Shared-element from grid icon → full screen | `--motion-base`/decelerate | Cross-fade |
| TabBar switch | Horizontal slide between Tier-0 screens | `--motion-fast` | No slide, swap |
| Bottom sheet (Hire/Contact) | Spring up from bottom (`vaul`) | spring | Fade up, no spring overshoot |
| Pull-to-refresh (Projects) | Rubber-band + spinner | `--motion-fast` | Static spinner |
| Dock hover magnify (desktop) | Scale on hover | `--motion-fast` | None (hover-only anyway) |
| Theme/holiday change | Wallpaper cross-fade + accent tween | `--motion-base` | Instant swap |
| Skeleton → content | Fade/shimmer | `--motion-fast` | Solid placeholder → content |

**Rules:** every animation respects `prefers-reduced-motion: reduce`; animate only `transform`/`opacity` (GPU-friendly, protects the perf budget); background tabs pause animation loops (`visibilitychange`); never block input on a transition.

---

## 8. Accessibility Requirements (WCAG 2.1 AA)

| Area | Requirement |
|------|-------------|
| **Zoom** | Pinch-zoom stays enabled (already correct — `App.tsx` omits `maximum-scale`); meets 1.4.4 |
| **Touch targets** | ≥`--touch-target-min` (44px) on tablet/mobile; spacing prevents mis-taps (2.5.5) |
| **Keyboard (desktop)** | Full operability: Tab into windows, `Esc` close, `⌘-Space` Spotlight, focus-cycle windows, dock reachable (2.1.1) |
| **Focus management** | Focus moves into a window on focus; focus trap in active mobile/tablet surface; visible focus ring via `--color-ring` (2.4.7) |
| **Contrast** | All text + Tier-0 CTAs ≥4.5:1 across **every** holiday theme; verify `accent` and `--color-hire` per theme (1.4.3) |
| **Screen readers** | ARIA roles/labels on window chrome, dock, TabBar, sheets; live region for visitor count + toasts; PDF viewer has accessible name + download alternative (4.1.2, 1.3.1) |
| **Motion** | `prefers-reduced-motion` honored everywhere (2.3.3) |
| **Forms** | Guestbook/contact inputs labeled, error messages associated, no color-only state (3.3.1) |
| **Landmarks** | `<header>/<nav>/<main>` per shell (already in MobileShell scaffold); skip-to-content link |
| **Orientation** | No content locked to one orientation except where essential (games landscape); 1.3.4 |

**A11y acceptance gate:** automated (axe) clean + manual keyboard + VoiceOver/TalkBack pass on the Tier-0 path before ship.

---

## 9. Performance Budgets

Target: **Lighthouse 95+** (perf/a11y/best-practices/SEO) on **mid-range Android / 4G**.

| Metric | Budget | How |
|--------|--------|-----|
| **LCP** | < 2.5s (mobile 4G) | Tier-0 above-the-fold is text+CTAs (no heavy asset); preconnect Supabase; precache shell |
| **INP** | < 200ms | GPU-only animations; avoid main-thread blocking on open |
| **CLS** | < 0.1 | Reserve space via skeletons; fixed TabBar/menu bar |
| **Initial JS (entry)** | < 170KB gz | Per-app lazy chunks + vendor split (already in `vite.config.ts`); heavy apps (EmulatorJS/Synth) excluded from entry |
| **Route/app chunk** | < 120KB gz each | Code-split per app (registry.tsx, exists) |
| **Images** | webp/avif, responsive, lazy | Bucket MIME allow-list (Phase 5); blur-up for thumbs |
| **Fonts** | system stack, 0 web-font blocking | `--font-sans` system-ui |
| **Heavy apps on mobile** | explicit opt-in load | Don't auto-download ROMs; warn before EmulatorJS/Synth |
| **Storage reads** | 1 manifest read, not 31 list / 32 HEAD | `games_index` + `themes_manifest` (Phase 5) — directly removes the current boot cost |

**Budget enforcement:** `rollup-plugin-visualizer` in CI; fail build on entry-chunk regression; Lighthouse CI on the Tier-0 mobile path.

> Note: the current 32-HEAD theme probe (`themes.ts`) and ≤31 storage `list()` per games mount are the dominant cold-boot costs today; the Phase 5 manifests are a **prerequisite** for hitting LCP budget — this redesign assumes they land.

---

## 10. Migration Strategy

Strangler-style, shell-by-shell, **zero-regression and reversible**. Each step ships independently behind the existing `ResponsiveShellRouter` so desktop is never at risk.

### Stage A — Foundations (shared, no shell rewrite)
1. Add tokens (§6) to `index.css`; introduce `--color-hire`, touch/safe-area, z-scale, motion tokens.
2. Build shell-agnostic primitives: `ResumeViewer`, `ProjectFeed/ProjectCard`, `HireMeSheet`, `ErrorBoundary`, `OfflineBanner`, skeletons.
3. Add per-app + per-shell `ErrorBoundary` (also a HLD §4 gap) — protects the rewrite.
> Ship value immediately: desktop gets `ErrorBoundary` + `HireMeSheet` with no layout change.

### Stage B — Desktop enhancements (additive)
4. Add **Hire Me** menu-bar item + **Spotlight** (`⌘-Space`, Fuse.js).
5. Fix desktop icon grid (snap layout so icons can't fall off-screen).
6. Apply intent-tiered IA to dock/Spotlight ordering.
> Desktop OS concept fully preserved; only navigation clarity improves.

### Stage C — Mobile shell rebuild (highest conversion impact)
7. Replace the landing-page `MobileShell` with `MobileHome` (app grid) + `TabBar` (Tier-0) + `AppScreen` (full-screen) + `MoreDrawer`.
8. Wire Tier-0 to shared `ResumeViewer`/`ProjectFeed`/`HireMeSheet`.
9. Keep the existing **"full JeffOS" escape hatch** (the scaffold already has `showFullOS`) so the desktop experience remains reachable on mobile.
> This is the recruiter-conversion win; prioritize it right after Stage A.

### Stage D — Tablet shell rebuild
10. Replace the Desktop delegation with `AppRail` + `FocusSurface` (+ optional snap-to-half).
> Lowest risk to defer (current delegation is functional); do after mobile.

### Stage E — Polish & instrument
11. Animations/reduced-motion pass; a11y certification on Tier-0.
12. Conversion funnel instrumentation (Home→Resume→Projects→HireMe).
13. Lighthouse CI + bundle budgets enforced.

### Rollout & rollback
- Each shell is independently switchable in `ResponsiveShellRouter`; a regression in one shell reverts to its prior scaffold/delegation without touching others.
- Desktop (the proven experience) changes are **additive only** in Stages B/E — never a rewrite.
- Feature-flag Spotlight and the new mobile shell for a canary before full enable.

### Sequencing priority (impact ↑, risk ↓)
```
A (foundations) → C (mobile rebuild)  ← recruiter conversion + mobile-first
              → B (desktop additive)  ← cheap clarity wins
              → D (tablet)            ← defer; current delegation works
              → E (polish/instrument)
```

---

## 11. Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| Recruiter conversion | Tier-0 funnel completion (Home→HireMe) | ≥ 40% of mobile sessions reach Resume or Projects |
| Mobile usability | Time-to-Resume on mobile | < 8s median |
| Performance | Lighthouse mobile (Tier-0 path) | 95+ all categories |
| Accessibility | axe + manual SR pass on Tier-0 | 0 critical issues |
| Delight retained | Desktop app opens / session | no decrease vs. baseline |
| Reliability | App-crash containment | 1 app crash ≠ shell crash (ErrorBoundary) |

---

## 12. Open Questions / Dependencies
- **Depends on Phase 5 manifests** (`games_index`, `themes_manifest`) to hit the LCP budget (§9) — the 32-HEAD/31-list boot cost must go first.
- **Depends on realtime fix** (Phase 5) for the "🟢 live" visitor/guestbook indicators to be truthful.
- Confirm canonical résumé source — currently the `portfolio` bucket PDF (Recruiter) **and** a `/public` PDF (MobileShell scaffold); the redesign should pick one (recommend the bucket, with `ResumeViewer` handling fallback).
- Decide whether Spotlight indexes apps only, or also projects/guestbook (Fuse.js supports both).

---

*This document is design-only. No code was written, no components were built, and no database or infrastructure changes were made. Implementation is governed by the staged migration in §10 and the phased plans in the referenced documents.*
