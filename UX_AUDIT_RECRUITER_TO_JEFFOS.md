# UX Audit — Recruiter → JeffOS, and the Mobile Question

> **Lens:** product/UX + interaction design + Apple-platform historian.
> **Thesis under test:** JeffOS is **macOS Tiger**; the desktop nails that. **Mobile should feel like an iPhone running that same era's aesthetic** — i.e. *iPhone OS 1–3* (the touch sibling of Tiger/Leopard) — **not** a Tiger desktop shrunk onto a phone.
> **Method:** drove the live build end-to-end at **1440×900 (desktop)** and **390×844 / iPhone 13 (mobile)** through the full journey: Recruiter landing → tabs → "Launch JeffOS" → boot → desktop/springboard → open an app. Evidence captured as screenshots. **0 console errors** on both form factors.
> **Scope:** audit + high-level design. No code changed in this pass.

---

## TL;DR

| Surface | State | Verdict |
|---|---|---|
| **Recruiter — desktop** | Sticky identity rail + scannable content column | ✅ Strong. Leave. |
| **Recruiter — mobile** | Sticky identity bar + bottom tabs + working CTAs | ✅ Strong. Leave. |
| **Transition (Recruiter → JeffOS)** | Quiet tertiary link → abrupt aesthetic jump → boot | 🟡 Works, but jarring & undersold |
| **JeffOS — desktop** | Convincing Tiger (94/100 authenticity) | ✅ Strong. Leave. |
| **JeffOS — mobile** | **Desktop Tiger shrunk onto a phone** (desktop menu bar, magnify dock, floating icons) | 🔴 **The core gap.** Off-thesis. |

**The one big finding:** mobile JeffOS delegates to `DesktopShell` (`MobileShell.tsx` → `return <DesktopShell />`). The desktop *interaction model* — a mouse menu bar, a hover-magnify dock, free-floating desktop icons, mouse-sized traffic lights — is presented on a touch device where none of those affordances work as intended. It's *Tiger shrunk*, not *Tiger reimagined for touch*. The thesis wants the latter.

---

## 1. The Journey (what a real user meets)

```
        ┌─────────────────────────────────────────────────────────────┐
DESKTOP │ Recruiter (light, minimal)  ──"Launch JeffOS"(quiet link)──► │
        │   sidebar: identity+CTAs+nav         │                       │
        │   content: headline→impact→work      ▼                       │
        │                              [Tiger boot ~3s]                │
        │                                      │                       │
        │                                      ▼                       │
        │                              JeffOS desktop (Aqua, dock,     │
        │                              menu bar, windows) ✅           │
        └─────────────────────────────────────────────────────────────┘
        ┌─────────────────────────────────────────────────────────────┐
MOBILE  │ Recruiter (sticky id bar + bottom tabs) ✅                   │
        │   Home·Projects·Experience·Contact                          │
        │   "Launch JeffOS" link ──► [boot] ──►                       │
        │                                      ▼                       │
        │                       JeffOS = DesktopShell on a phone 🔴   │
        │                       (desktop menu bar, magnify dock,       │
        │                        floating icons, full-screen sheets)   │
        └─────────────────────────────────────────────────────────────┘
```

---

## 2. Recruiter Mode — desktop & mobile · **Keep**

Working well, no action needed:

- **Desktop:** sticky left rail (name, role, tagline, *Schedule* primary + *View Projects* secondary + quiet *Launch JeffOS*, section nav, trust chips, socials, theme toggle) beside a scannable content column (headline → stat band → current impact → architecture → featured → why-hire → experience → contact). Clear hierarchy, restrained, conversion-first.
- **Mobile:** sticky identity bar (name + role + org, persists across tabs), four bottom tabs (Home·Projects·Experience·Contact), CTAs that now actually route (the inert-CTA bugs were fixed). Reads like a focused hire app.

This is the right product decision — Recruiter-first as the default front door, JeffOS as the opt-in. The recruiter UX is **not** where the work is.

---

## 3. The Transition — Recruiter → JeffOS · **Polish (Medium)**

Three friction points, none blocking but all worth addressing:

1. **The entry is *too* quiet.** "Launch JeffOS" is a tertiary underlined link below two buttons. The OS is the portfolio's signature flex (a Tiger recreation), yet a recruiter may never notice the invitation. Consider a slightly more deliberate (still secondary) affordance — e.g. a small framed "Explore JeffOS — my macOS Tiger recreation" card/button that *sells* the easter egg without competing with *Schedule*.
2. **Aesthetic whiplash.** The cut from a 2026 minimalist light document to 2005 Aqua is instant and unmediated. The Tiger boot screen helps on first visit, but on *return* visits (boot already seen) the jump is abrupt. A ~300–500ms transitional veil (fade-through-black, or a brief "Starting JeffOS…") on every launch would smooth it and read as intentional.
3. **No way back is signposted at the moment of entry.** Exit lives correctly in the Apple menu (authentic), but a first-time JeffOS visitor doesn't know that. A one-time, auto-dismissing hint ("⌘-click the Apple menu → Exit to Recruiter Mode", or on mobile a visible Done affordance) would prevent the "I'm trapped in the OS" moment.

---

## 4. JeffOS — desktop · **Keep**

This is the success story: **94/100 Tiger authenticity** (see `TIGER_AUTHENTICITY_RESCORE.md`). Glass dock, Lucida Grande, wet-Aqua, Spotlight/Exposé/Dashboard, app-aware menu bar, genie, brushed-metal Finder, content-sized zoom. A Tiger user does a double-take. No action.

---

## 5. JeffOS — mobile · 🔴 **The core finding (High)**

### What it is today
`MobileShell` returns `<DesktopShell />`. On a phone you get:
- a **desktop menu bar** (Finder · File · Edit · View · Go · Help + cramped status icons) — mouse menus, ~11px tap targets, no touch model;
- a **magnify dock** — magnification is a *hover* affordance that does nothing on touch; icons are small tap targets in a row that can clip at 390px;
- **free-floating desktop icons** on the wallpaper — not how any phone presents apps;
- **windows with mouse traffic lights** — the 12px close/zoom dots are below the ~44px touch-target minimum; app sheets do open full-screen (good), but there's no touch-native *Done*/back.

### Why it's off-thesis
The thesis isn't "make Tiger fit a small screen." It's **"the iPhone of the Tiger era."** That device existed — **iPhone OS 1–3 (2007–2009)** — and it *shared Tiger/Leopard's visual DNA*: pinstripe/Aqua chrome, glossy lozenge buttons, Lucida/Helvetica type, the same system sounds — but a **completely different interaction model**: a Springboard home grid, a fixed 4-slot dock, a status bar, and full-screen apps with a top navigation bar. That is the correct mobile target, and it's a *reskin of an interaction model the app already half-has* (the Recruiter mobile shell already proves the team can do touch-native).

### High-level design — "JeffOS Mobile" = iPhone-OS-era Springboard

```
┌───────────────────────────┐   Status bar (carrier · clock · battery),
│ ●●●  JeffOS      9:20  ▓▓ │   pinstriped Aqua — NOT the Mac menu bar
├───────────────────────────┤
│                           │
│   ▢      ▢      ▢      ▢  │   Springboard: glossy rounded-rect app
│ Finder Safari Games Guest │   icons in a grid (the desktop icons,
│                           │   re-presented as a home screen)
│   ▢      ▢      ▢      ▢  │
│ iTunes Synth  iCal  Coffee│   tap = open full-screen (no windows)
│                           │
│        • •                │   page dots
├───────────────────────────┤
│  ▣     ▣     ▣      ◉     │   Fixed dock (4): Phone-era — e.g.
│ Finder Safari Spot.  Recr.│   Finder · Safari · Spotlight · "Recruiter"
└───────────────────────────┘
        (home indicator)
```

- **Home = Springboard.** Reuse the existing `desktopIcons` list, render as a paged grid of glossy icons with labels. No free-drag desktop, no Mac menu bar.
- **Apps open full-screen** (already true) but get a **top nav bar** with a real **‹ Done / Home** control (replaces mouse traffic lights on touch) and the app title — iPhone-OS style, still Aqua.
- **Dock = fixed 4**, no magnification (a hover idiom). Tap-only.
- **Spotlight** → a phone search field (swipe-down or a dock slot), reusing the existing Fuse index.
- **Exit to Recruiter** becomes a first-class, *visible* control on mobile (a dock slot or a Springboard tile), since there's no Apple menu to hide behind.
- **Keep the era's texture:** Aqua gloss, pinstripe status bar, Lucida/Helvetica, the existing system sounds, the wallpaper. Same *look*, phone-native *behavior*.

### Effort & risk
Medium. It's a new `MobileShell` (Springboard + full-screen app host + top nav bar + fixed dock) that **reuses** the existing app registry, icons, Fuse index, and sounds. No backend, no new data. The current `MobileShell.tsx` is literally one delegating line — this is the file the prior mobile note already flagged as "the single line to replace when a dedicated mobile redesign is built." This is that redesign.

---

## 6. Cross-cutting QA notes (observed during the drive)

- ✅ **0 console errors** on both desktop and mobile through the full journey.
- ✅ Recruiter mobile CTAs route correctly (Hero *View Projects* and *See how at BFLOW RCM* → Projects tab; tab switches reset scroll; identity persists).
- 🟡 **Touch targets in mobile JeffOS** (menu bar items, traffic lights, dock icons) are below the ~44px guideline — resolved naturally by the §5 redesign.
- 🟡 **Dock can clip / crowd at 390px** in the delegated desktop dock — also resolved by the fixed-dock redesign.
- 🟢 Desktop-icon spacing on phone was already tightened (`< 480px`), so the *interim* delegated view is at least not overflowing — but it's still the wrong model.

---

## 7. Recommendation (priority order)

1. **🔴 Build "JeffOS Mobile" as an iPhone-OS-era Springboard** (§5). This is the single change that makes the product match its thesis. Highest impact.
2. **🟡 Smooth the Recruiter → JeffOS transition** (§3): a louder-but-secondary entry affordance, a short transitional veil on every launch, and a one-time "how to exit" hint (a visible Exit control on mobile).
3. **🟢 Keep** Recruiter (both form factors) and JeffOS desktop as-is.

The encouraging part: the desktop is *done*, the recruiter UX is *done*, and the mobile fix is a **reskin of an interaction model the codebase already demonstrates** (Recruiter mobile) onto assets it already has (the app registry/icons/sounds). The thesis is one focused shell away from true.

---

*Audit performed against the merged `main` build. Live evidence: `audit-desktop-recruiter`, `audit-desktop-jeffos`, `audit-desktop-jeffos-finder`, `audit-mobile-recruiter`(+tabs), `audit-mobile-jeffos`, `audit-mobile-jeffos-app` (Playwright/Chromium, 1440×900 + iPhone 13). Analysis & design only — no code or DB changes in this pass.*
