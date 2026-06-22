# UX Audit — Games & Wallpapers apps

> **Lens:** product/UX + interaction design, in the context of JeffOS = **macOS Tiger** on desktop and an **iPhone-OS Springboard** on mobile.
> **Method:** read the source, then drove both apps live in **both** hosts — the desktop `Window` (1440×900) and the new mobile full-screen `MobileAppHost` (iPhone 13). Evidence captured as screenshots. **0 console errors** on both form factors.
> **Scope:** audit + fixes.
>
> **Update — priority fixes implemented:**
> • **W1 (🔴 Wallpapers mobile layout)** — now form-factor responsive: a two-pane rail+grid on desktop, a stacked **preview banner on top + grid below** on mobile (`useFormFactor`). Verified usable on iPhone 13 (was a squished column).
> • **W5 / W2** — added a **loading skeleton** (shimmer grid) and an explicit **"No wallpapers found"** empty state; the desktop grid now fills its area instead of reading sparse.
> • **G2 (in-game Toolbar)** — buttons enlarged to ≥44px touch targets and **labelled** ("Quit", "CRT/LCD") instead of cryptic 12px icons.
> • **G3** — added a **"No games found"** empty state.
> All verified live (desktop 1440×900 + iPhone 13), 0 console errors, build green. Remaining (lower priority): Tiger-skin both apps (G1, W3), shorten the mobile nav title (W4), and the 390px follow-up audit of the other apps.

---

## TL;DR

| App | Desktop | Mobile | Headline |
|---|---|---|---|
| **Games** | 🟡 Works; styling is generic-modern, not Tiger | ✅ Adapts well (grid collapses to 1 col) | Solid UX, wrong *skin* for Tiger |
| **Wallpapers** | 🟡 Tiger-ish two-pane, but thin/empty-looking | 🔴 **Broken** — `grid-cols-12` desktop layout squished onto a phone | Mobile layout is the priority fix |

**The single most important finding:** the **Wallpapers app is visually broken in the mobile Springboard host.** It hard-codes a desktop two-pane `grid-cols-12` layout (4-col preview rail + 8-col grid). On a 390px phone that collapses into an unusable squished column — preview and "Set Desktop Picture" jammed into the left third, the grid cramped beside it. Games survives mobile only because its grid is responsive (`grid-cols-1 sm:grid-cols-2 …`).

---

## 1. Games app

### What works
- **Clear two-state model:** Library (grid of cards) → play (emulator + toolbar), with a tasteful cross-fade (`AnimatePresence`).
- **Good cards:** thumbnail, title, and a system badge (NES/SNES/…); lazy-loaded images with a `No Thumbnail` fallback; a shimmer skeleton while loading (no jarring text flash).
- **Responsive grid** (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`) — this is *why* it survives the mobile host: cards become full-width and very tappable (verified: Contra/SF/Mario read cleanly on iPhone).
- **Perf:** manifest-first discovery (`games_index`, 1 query) with a parallel-list fallback — fast.

### Issues
| # | Sev | Issue |
|---|----|-------|
| G1 | 🟡 | **Skin is generic-modern, not Tiger.** Grey gradient + frosted-glass cards + blue glow read "2020s app", not Aqua. In a Tiger OS this should be a brushed-metal or Aqua window with glossy controls (cf. the Finder/iTunes treatment). |
| G2 | 🟡 | **In-game Toolbar is tiny and cryptic.** 12px icon buttons (Power/Palette) + a "CRT/LCD" chip at `text-[10px]` — below the ~44px touch target on mobile and hard to parse on desktop. "Quit" as a power icon is non-obvious; a labelled "Quit Game" / "‹ Library" is clearer. |
| G3 | 🟡 | **No empty / error state.** If `games` is empty (index unpopulated *and* bucket list fails) the library renders a header over a blank area. Needs an explicit "No games found" state. |
| G4 | 🟢 | **"Game Library" header is thin** (tiny grey caps + a hairline). Fine, but doesn't establish the app the way a Tiger title/toolbar would. |
| G5 | 🟢 | On mobile the in-emulator Toolbar duplicates the host nav bar's job (both offer "back"); the relationship between "‹ Home" (closes app) and "Quit" (back to library) isn't signposted. |

### Recommendation
Keep the structure; **re-skin to Tiger** (Aqua/brushed-metal window, glossy library cards, a real toolbar), enlarge the in-game controls with labels, and add an empty/error state. Mobile already works.

---

## 2. Wallpapers app ("Desktop & Screen Saver")

### What works
- **Right model for Tiger:** a two-pane "Desktop & Screen Saver" pref-pane shape — a **preview + "Set Desktop Picture"** rail on the left, a **grouped grid** ("Desktop Pictures", folders as sections) on the right. That's faithful to Tiger.
- **Clear selection states:** previewing = blue ring, current = green ring, with a label band. Good affordance.
- **Perf-correct images:** thumbnails via the render endpoint (`renderImage(..., {width:256})`), lazy-loaded.
- **Sensible feedback:** toast on set, "Select a wallpaper first" guard.

### Issues
| # | Sev | Issue |
|---|----|-------|
| **W1** | 🔴 | **Mobile layout is broken.** `grid-cols-12` with a `col-span-4` rail + `col-span-8` grid is a *desktop* layout. In the mobile full-screen host it squishes into an unusable column (verified on iPhone 13: preview + button crammed left, grid cramped right). It needs a **stacked mobile layout** (preview on top, grid below) — or the app should detect the form factor like Recruiter Mode does. |
| **W2** | 🟡 | **Looks sparse / near-empty on the right.** Only one image rendered in the grid during the drive — either few wallpapers loaded or the grouped grid under-fills the 8-col area. Worth confirming the folder load (`storage.list`) is returning groups; if the catalog is genuinely small, the grid columns should shrink so it doesn't read as broken/empty. |
| W3 | 🟡 | **Not Tiger-skinned controls.** The grey gradient is okay, but "Set Desktop Picture" is a generic blue gel button and the section headers are plain — Tiger's pref pane had glossier Aqua chrome. Minor vs W1. |
| W4 | 🟡 | **Nav-bar title wraps on mobile.** "Desktop & Screen Saver" wraps to two lines in the mobile host nav bar (cramped). Either shorten the mobile title (e.g. "Wallpaper") or let the host truncate. |
| W5 | 🟢 | **No loading skeleton.** Unlike Games, the grid pops in with no placeholder while `storage.list` resolves; a brief skeleton would match Games and avoid an empty flash. |

### Recommendation
**W1 is the priority** — give Wallpapers a responsive/stacked mobile layout (or form-factor branch) so it's usable in the Springboard. Then confirm the grid populates (W2), add a loading skeleton (W5), and optionally Tiger-skin the chrome (W3).

---

## 3. Cross-cutting

- ✅ **0 console errors** opening/using both apps on both form factors.
- 🔴 **The general lesson:** apps were authored for the desktop `Window` and assume desktop width. With the mobile Springboard now hosting them full-screen, **any app with a fixed multi-column desktop layout will break on a phone.** Wallpapers is the clearest victim; an audit of the other apps (Finder column view, iTunes, Synth) at 390px is warranted as a follow-up.
- 🟡 **Tiger skin consistency:** Finder/iTunes/menu bar got the wet-Aqua/brushed-metal treatment (94/100 work), but Games and Wallpapers are still on the older generic-glass skin — they're now the most "modern-looking" surfaces inside the OS.

---

## 4. Recommendation (priority order)

1. **🔴 Fix Wallpapers mobile layout (W1)** — stacked/responsive (preview on top, grid below) so it's usable in the Springboard. Highest impact, clearest breakage.
2. **🟡 Games & Wallpapers empty/loading/error states** (G3, W2, W5) — no blank/empty-looking screens.
3. **🟡 Enlarge & label the in-game Toolbar** (G2) — touch targets + clarity.
4. **🟢 Tiger-skin both apps** (G1, W3) — bring them up to the Aqua/brushed-metal bar the rest of the OS now sets.
5. **🟢 Follow-up:** audit the remaining apps at 390px for the same fixed-desktop-layout problem.

---

*Audit performed against merged `main`. Live evidence: `aud-desktop-games`, `aud-desktop-wallpapers`, `aud-mobile-games2`, `aud-mobile-wallpapers` (Playwright/Chromium, 1440×900 + iPhone 13). Audit only — no code or DB changes in this pass.*
