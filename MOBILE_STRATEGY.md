# JeffOS — Mobile, Tablet & Responsive Strategy

> Principal Frontend + Product Design lens. Mobile-first redesign. Generated 2026-06-21.
> Companion: [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) · [UI_UX_ARCHITECTURE.md](UI_UX_ARCHITECTURE.md) · [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md) · [REFACTOR_ROADMAP.md](REFACTOR_ROADMAP.md)

---

## 0. The Mandate

> **Do not shrink desktop windows onto a phone.** A floating-window OS is a desktop interaction model; on touch it is fiddly, inaccessible, and off-brand for "production-grade."

Today the *only* mobile adaptation is [Window.tsx:256](src/components/Window.tsx#L256): `disableDragging={window.innerWidth < 480}` (read once at render, never updated on rotation). There is no mobile shell, no mobile navigation, and no mobile-specific resume/recruiter experience. This document specifies all three plus tablet behavior and edge cases.

---

## 1. Breakpoint & Form-Factor Strategy

Detect by **capability, not width alone** — a touch laptop and a tablet differ from a mouse desktop:

```
useFormFactor():
  mobile  = (max-width: 767px)  OR  (pointer:coarse AND max-width:1023px AND portrait)
  tablet  = (768px–1023px)      OR  (pointer:coarse AND min-width:768px AND landscape)
  desktop = (min-width:1024px)  AND (pointer:fine OR hover:hover)

  landscape phone (short height, coarse) → treat as MOBILE, not tablet
```

A `ResponsiveShellRouter` renders `DesktopShell | TabletShell | MobileShell` from this. All three share the same AppRegistry + CommandBus (see architecture doc §2.2).

| Behavior | Desktop ≥1024 | Tablet 768–1023 | Mobile <768 |
|----------|---------------|-----------------|-------------|
| **Window** | Free drag/resize, multi-window | 1 focused surface, snap-half split | Full-screen app stack |
| **Navigation** | Dock + StatusBar + Spotlight | Sidebar rail | Bottom TabBar + app grid |
| **Dock** | Magnifying dock | Collapses into rail | Hidden → TabBar replaces it |
| **Gestures** | Mouse + keyboard | Tap, snap zones | Swipe back, pull-refresh, long-press |
| **Keyboard** | Full ⌘ shortcuts | Partial | Software kbd only; no chrome shortcuts |
| **A11y** | Window roles + focus mgmt | Same | Native scroll/focus, large targets |

---

## 2. Mobile Home

```
┌─────────────────────────────┐
│  9:41          JeffOS    ⌄   │ ← slim status strip (clock + menu sheet)
├─────────────────────────────┤
│                             │
│   Hi, I'm Jeff Idodo        │ ← identity up top (hire signal)
│   Full-Stack Developer      │
│                             │
│   ┌────┐ ┌────┐ ┌────┐      │
│   │📄  │ │💼  │ │✉️  │      │ ← Tier-0 quick actions:
│   │Res │ │Work│ │Hire│      │   Resume · Projects · Contact
│   └────┘ └────┘ └────┘      │
│                             │
│   Explore JeffOS ↓          │
│   ┌──┐┌──┐┌──┐┌──┐          │
│   │🎮││🎹││⌨ ││🎵│          │ ← app grid (Tier-1/2)
│   └──┘└──┘└──┘└──┘          │
│   ┌──┐┌──┐┌──┐┌──┐          │
│   │📁││🖼││📅││ℹ️│          │
│   └──┘└──┘└──┘└──┘          │
│                             │
├─────────────────────────────┤
│  🏠      📄      💼      ⋯   │ ← fixed TabBar (always reachable)
│ Home   Resume  Projects More│
└─────────────────────────────┘
```

Principles: identity + hire actions **above the fold**; the OS is "explore," not the gate; one tap to resume from anywhere via TabBar.

## 3. Mobile Navigation

```
App stack (push/pop)              "More" sheet
┌─────────────────────────────┐  ┌─────────────────────────────┐
│ ← Terminal                  │  │  All Apps              ✕    │
│ ───────────────────────────│  │  ◻ Finder    ◻ Wallpapers   │
│  (full-screen app content) │  │  ◻ Calendar  ◻ Guestbook    │
│                             │  │  ◻ Synth     ◻ Control Panel│
│                             │  │  ◻ About                    │
│                             │  │                             │
│                             │  │  Theme: [Aqua ⌄]            │
│                             │  │  Sound:  [●—] on            │
├─────────────────────────────┤  └─────────────────────────────┘
│  🏠      📄      💼      ⋯   │
└─────────────────────────────┘
 • swipe-right or ← = pop to previous
 • TabBar persists across the stack
```

- **No floating windows.** Each app is a full-screen route pushed onto a stack.
- **Swipe-back** gesture + explicit back chevron.
- TabBar is fixed; the "More" sheet (Vaul drawer — already a dependency) holds Tier-1/2 apps and quick settings.

## 4. Mobile App Experience (general pattern)

```
┌─────────────────────────────┐
│ ← App Name           [⋯]    │ ← app header: back + optional actions
├─────────────────────────────┤
│                             │
│      app fills the screen   │
│      (its own scroll)       │
│                             │
├─────────────────────────────┤
│  🏠      📄      💼      ⋯   │
└─────────────────────────────┘
```
- Apps declare `surfaces: ['mobile', …]`. Apps that can't work on touch (free-form windowing demos) show a tasteful "Best experienced on desktop ↗" card instead of a broken UI.
- **Emulator**: on-screen D-pad + A/B/Start overlay, or "play on desktop" fallback. Never keyboard-only.
- **Synth**: scrollable on-screen keyboard with touch; smaller octave range.

## 5. Mobile Resume Experience

```
┌─────────────────────────────┐
│ ← Résumé              ⤓      │ ← native download
├─────────────────────────────┤
│  Jeff Idodo                 │
│  Full-Stack Developer       │
│  ─────────────────────────  │
│  Summary…                   │ ← HTML-rendered, reflowed for mobile
│  Experience                 │   (NOT a pinch-zoom PDF canvas)
│   • Role — Company  '23–now │
│   • …                       │
│  Skills  [React][TS][PERN]  │
│                             │
│  ┌─────────────────────────┐│
│  │   ⤓  Download PDF        ││ ← real file (already in /public)
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │   ✉️  Email Me           ││
│  └─────────────────────────┘│
├─────────────────────────────┤
│  🏠      📄      💼      ⋯   │
└─────────────────────────────┘
```
- **Render resume as reflowable HTML** on mobile; offer the PDF as download. Pinch-zooming a desktop PDF is the current failure mode and the single worst recruiter experience.

## 6. Mobile Recruiter Experience

```
┌─────────────────────────────┐
│ ← For Recruiters            │
├─────────────────────────────┤
│   [ headshot ]              │
│   Jeff Idodo                │
│   "I build PERN/React apps  │
│    end-to-end."             │
│  ─────────────────────────  │
│  Featured Work              │
│  ┌─────────────────────────┐│
│  │ ▣ Project One            ││ ← tappable cards, lazy images
│  │   stack · 1-line impact  ││   (Recruiter app already pulls
│  └─────────────────────────┘│    these from Supabase)
│  ┌─────────────────────────┐│
│  │ ▣ Project Two            ││
│  └─────────────────────────┘│
│  ┌─────────┐ ┌─────────────┐│
│  │ ⤓ Résumé │ │ ✉️ Contact  ││
│  └─────────┘ └─────────────┘│
├─────────────────────────────┤
│  🏠      📄      💼      ⋯   │
└─────────────────────────────┘
```
- This is the `/hire` deep link's mobile target. Today `/hire` opens the Recruiter app **in a draggable window** ([routes/hire.tsx](src/routes/hire.tsx)) — fine on desktop, wrong on mobile. The shell router sends `/hire` to this full-screen view on phones.

## 7. Tablet Experience

```
Landscape tablet
┌──────┬──────────────────────────────────┐
│ Rail │  ← Recruiter                       │
│      │  ┌────────────────────────────────┐│
│ 📄Res│  │ headshot · pitch               ││
│ 💼Prj│  │ ┌─────────┐ ┌─────────┐        ││
│ 🎮Gme│  │ │Project 1│ │Project 2│        ││ ← roomier 2-col
│ ⌨ Trm│  │ └─────────┘ └─────────┘        ││
│ 📁Fnd│  └────────────────────────────────┘│
│ ⋯ More│                                    │
└──────┴──────────────────────────────────┘
        optional split for Finder-type apps:
        ┌──────────┬──────────────┐
        │ list     │ preview pane │  (snap-half, no free drag)
        └──────────┴──────────────┘
```
- **Sidebar rail** = primary nav (replaces dock).
- **Single focused surface**, with **snap-to-half split** for browse+preview apps; no free-floating windows.
- Touch targets ≥44px; honor `pointer:coarse`.

---

## 8. Behavior Matrix (detail)

| Concern | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Window mgmt | open/close/min/zoom/move, multi | 1 focus + split, snap | full-screen stack, push/pop |
| Dock | magnify dock (fixed) | folds into rail | replaced by TabBar |
| Gestures | mouse, dbl-click zoom | tap, drag-to-snap | swipe-back, pull-refresh, long-press menu |
| Keyboard | ⌘W/⌘M/⌘-Space etc. | partial | none for chrome (software kbd in inputs only) |
| A11y | window=`application`/`dialog` roles, focus trap, Tab order | same | native focus/scroll, big targets, no zoom lock |
| Offline | full PWA | full PWA | full PWA + install prompt |

---

## 9. Edge Cases

- **iPhone SE (375×667, short):** TabBar + header eat vertical space — keep app headers ≤44px, content scrolls; test the resume CTA stays reachable without scrolling on Home.
- **Foldables (e.g. 280px folded → 717px unfolded):** subscribe to viewport changes (don't read `innerWidth` once at render as Window.tsx does today); re-run the shell decision on `resize`/`orientationchange`. Treat the narrow folded state as a constrained mobile.
- **Tablets:** §7 — rail + single surface; never the desktop windowing model by default.
- **Landscape phones (short height, coarse pointer):** force **mobile** model; hide non-essential chrome; the floating-window and rail models both fail at ~360px height.
- **Touch-only laptops / hybrid (`pointer:coarse` + large screen):** allow desktop shell but enlarge hit targets and disable hover-only affordances (dock magnify needs a tap fallback).
- **Offline mode:** PWA already caches the shell. Mobile must degrade gracefully when Supabase is unreachable — Games/Guestbook/Recruiter show cached or empty states with a clear "offline" banner, and the **resume PDF must be precached** so the hire path works offline.
- **Reduced motion / reduced data:** honor `prefers-reduced-motion` (partially done) and `prefers-reduced-data` (skip wallpaper auto-download, use LQIP only).

---

## 10. Implementation Notes (reuse what exists)

- **Vaul** (installed) → mobile sheets / "More" drawer.
- **Fuse.js** (installed) → Spotlight/search across shells.
- **Framer Motion** → stack push/pop transitions (but lazy-load it off the hire path, per perf audit).
- Keep the AppRegistry as the single source of apps; just add `surfaces` + a `MobileSurface` renderer alongside `Window`.
- Fix the root cause behind every responsive bug: **stop reading `window.innerWidth` during render** ([Window.tsx:256](src/components/Window.tsx#L256), [Dock.tsx:165](src/components/Dock.tsx#L165)); use a `useFormFactor()`/`useViewport()` hook that subscribes to resize.
