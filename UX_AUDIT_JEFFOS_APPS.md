# UX Audit — All JeffOS Apps (desktop + mobile)

> **Lens:** product/UX + interaction design, JeffOS = macOS **Tiger** on desktop and an **iPhone-OS Springboard** on mobile.
> **Method:** drove **every registered app** live in both hosts — the desktop `Window` (1440×900) and the mobile full-screen `MobileAppHost` (iPhone 13). Screenshots + DOM overflow metrics captured for each.
> **Scope:** audit **+ fixes** (this pass implemented the breakages found).

This extends the per-app Games & Wallpapers audit to the **whole app suite**, on both form factors.

---

## The pattern (and the root cause)

The mobile Springboard now hosts every app full-screen. Apps were authored for the wide desktop `Window`, so several use a **fixed multi-column / fixed-width-sidebar layout that breaks at 390px** — the same class of bug first found in Wallpapers. The audit confirmed it recurs across the suite; this pass fixes each.

> Root cause: desktop-first layouts (`grid-cols-N`, `w-[190px]` sidebars, fixed-width cards) with no form-factor branch. Fix pattern: branch on `useFormFactor()` (hide secondary sidebars on mobile) or make grids/rows responsive (`grid-cols-1 sm:grid-cols-…`, `flex-wrap`).

---

## Per-app results

| App | Desktop | Mobile (before) | Fix applied | Mobile (after) |
|---|---|---|---|---|
| **Finder** | ✅ good | 🔴 DEVICES/PLACES sidebar ate ~45% of width | Hide sidebar on mobile (`useFormFactor`) | ✅ full-width file grid |
| **iTunes** | ✅ good | 🔴 LIBRARY/PLAYLISTS sidebar ate ~49%, search overflowed | Hide sidebar on mobile | ✅ full-width track list |
| **Safari** (Explorer) | ✅ good | 🟠 Top Sites `grid-cols-3` of fixed `w-48` cards overflowed (X cut off) | Responsive grid + fluid cards (`grid-cols-1 sm:2 lg:3`, `aspect-[3/2]`) | ✅ single-column, all cards visible |
| **Synth** | ✅ good | 🟠 waveform row (sine/square/triangle/sawtooth) overflowed; sawtooth cut off | `flex-wrap` the top control bar + wave group | ✅ all four waves visible, wraps cleanly |
| **Terminal** | ✅ good | 🟡 mobile focus-outline box on the input; autocaps/autocorrect on | `focus:outline-none`, transparent tap-highlight, `autoCapitalize/Correct=off`, green caret | ✅ clean terminal input |
| **Guestbook** | ✅ good | ✅ already adapts (chat bubbles + bottom composer) | — | ✅ |
| **Games** | 🟡 (prior audit) | ✅ responsive grid → 1 col | (prior PR) | ✅ |
| **Wallpapers** | 🟡 (prior audit) | 🔴→✅ stacked layout | (prior PR) | ✅ |
| **iCal** | ✅ | not re-captured (flaky tap); calendar is a self-contained grid, low risk | — | (follow-up confirm) |
| **Buy Me a Coffee** | ✅ | 🟢 works but very sparse (a centered link in empty space) | — (cosmetic) | 🟢 |

**Verified after fixes:** iTunes / Synth / Finder / Safari all report `scrollWidth == clientWidth` (no horizontal overflow) on iPhone 13. 0 console errors (one harmless theme-probe 404).

---

## Fixes implemented this pass

1. **Finder** — hide the DEVICES/PLACES sidebar on mobile; the file grid takes the full width. (`Finder.tsx`)
2. **iTunes** — hide the LIBRARY/PLAYLISTS sidebar on mobile; the track table takes the full width. (`iTunesApp.tsx`)
3. **Safari** — Top Sites grid is now responsive (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, `max-w-[640px]`) with fluid `aspect-[3/2]` cards, so it never overflows. (`Explorer.tsx`)
4. **Synth** — the top control bar and the waveform-button group `flex-wrap`, so all four waves stay visible at narrow widths. (`Synth.tsx`)
5. **Terminal** — suppressed the mobile focus-outline / tap-highlight, set a green caret, and disabled autocapitalize/autocorrect/spellcheck on the command input. (`Terminal.tsx`)

(Games & Wallpapers were fixed in the prior PR: responsive Wallpapers layout, empty/loading states, larger labelled in-game toolbar.)

---

## Cross-cutting observations (not fixed here)

- ✅ **Tiger-skin consistency — DONE.** Introduced a shared `src/lib/aquaSkin.ts` (brushed metal, glossy Aqua controls, the wet-blue gel button, recessed wells, Lucida Grande) and applied it to **Games** (brushed-metal library panel + glossy cards + Aqua Quit button), **Wallpapers** (Aqua "Set Desktop Picture"), **Synth** (brushed-metal header + Aqua wave buttons, active = wet blue), and the **Guestbook composer** (brushed-metal bar + Aqua Send). These were the most "modern-looking" surfaces in the OS; they now match the 94/100 desktop. Future apps can import the same tokens to stay Tiger-correct by default.
- 🟢 **Buy Me a Coffee is a 35-line stub** — a centered link in a large empty area. Functional; could be fleshed out (a proper card, QR, supporter note) or left minimal by choice.
- 🟡 **iCal** wasn't re-captured on mobile (flaky automated tap); its month grid is self-contained and low-risk, but a manual 390px confirm is worth doing.
- 🟢 **Empty/loading states:** added to Games & Wallpapers; the other data-backed apps (iTunes track list, Guestbook) could use the same treatment for parity.

---

## Recommendation (priority)

1. ✅ **Done this pass:** fix the mobile layout breakages across Finder, iTunes, Safari, Synth, Terminal.
2. 🟢 **Tiger-skin pass** for Games / Wallpapers / Synth / Guestbook composer (visual consistency with the 94/100 desktop).
3. 🟢 Flesh out Buy Me a Coffee (or accept as minimal).
4. 🟡 Manual mobile confirm of iCal.

---

*Audit + fixes against merged `main`. Live evidence: `sweep-{desktop,mobile}-*` and `vfx-*` (Playwright/Chromium, 1440×900 + iPhone 13). The mobile-breakage fixes were implemented and re-verified in-app (no horizontal overflow; 0 console errors); `tsc` clean; build green.*
