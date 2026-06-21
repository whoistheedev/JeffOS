# JeffOS — Refactor & Modernization Roadmap

> Prioritized, costed, sequenced. Generated 2026-06-21.
> Source analysis: [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) · [UI_UX_ARCHITECTURE.md](UI_UX_ARCHITECTURE.md) · [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md) · [MOBILE_STRATEGY.md](MOBILE_STRATEGY.md)

---

## How to read this

Each task carries: **Priority** (P0 blocker → P3 nice) · **Impact** (User/Perf/Maint/Scale) · **Complexity** (S/M/L/XL) · **Effort** (rough dev-days) · **Dependencies** · **Risk** (chance of regression).

Effort assumes one experienced full-stack dev. "Risk" is about breaking existing behavior, not difficulty.

**Sequencing logic:** Phase 1 fixes correctness + the things that *unblock* everything else (code-splitting, theme-as-data). Phase 2 banks the performance wins those unlock. Phase 3 delivers mobile (the headline goal). Phase 4 polishes UX/a11y. Phase 5 hardens for scale. Earlier phases are prerequisites for later ones, so resist reordering.

---

## Phase 1 — Critical Fixes & Foundations
*Goal: correct, debuggable, and architecturally unblocked. Nothing here is cosmetic.*

| # | Task | Priority | Impact | Complexity | Effort | Depends | Risk |
|---|------|----------|--------|-----------|--------|---------|------|
| 1.1 | Fix broken `eslint.config.js` (remove trailing `module.exports`) | P0 | Maint | S | 0.25d | — | 🟢 Low |
| 1.2 | Add error tracking (Sentry) + source maps | P0 | Maint/User | S | 0.5d | — | 🟢 Low |
| 1.3 | Add `.env.example` + README env/setup section | P0 | Maint | S | 0.25d | — | 🟢 Low |
| 1.4 | Code-split: `React.lazy` every app in registry + `<Suspense>` | P0 | Perf | M | 1.5d | — | 🟠 Med |
| 1.5 | `manualChunks` for heavy vendors (framer-motion, supabase, dnd-kit) | P0 | Perf | S | 0.5d | 1.4 | 🟢 Low |
| 1.6 | **Themes-as-data**: kill `THEME_PACKS`/`themesLoadedAt` globals; one React Query `useThemes()`; single `useApplyTheme()` effect | P0 | Maint/Perf | L | 3d | — | 🔴 High |
| 1.7 | Replace 32 HEAD-probe theme loader with a single themes manifest fetch | P0 | Perf | M | 1d | 1.6 | 🟠 Med |
| 1.8 | Collapse duplicate theme/wallpaper effects in App.tsx + Desktop.tsx into the single applier | P1 | Maint | M | 1d | 1.6 | 🟠 Med |
| 1.9 | Single persistence writer: prefs-only, versioned + migration; stop persisting `windows`; drop phantom `anonIdOld/anoId`; remove manual `localStorage("prefs")` | P1 | Maint/Perf | M | 1d | — | 🟠 Med |
| 1.10 | Delete empty scaffolding files (5 lib + 2 hooks, all 0 lines) or implement | P2 | Maint | S | 0.25d | — | 🟢 Low |
| 1.11 | Remove `maximum-scale=1` viewport lock | P1 | User/A11y | S | 0.1d | — | 🟢 Low |

**Phase 1 risk note:** 1.6 touches the most code and is the riskiest change in the whole roadmap (theme logic is currently spread across 4 files with side channels). Land it behind tests/feature flag. Everything downstream depends on it, so it must go first.

**Exit criteria:** lint clean; one theme source of truth; app bundle split into shell + per-app chunks; errors reported; setup reproducible.

---

## Phase 2 — Performance
*Goal: bank the wins that Phase 1's splitting + theme-as-data unlock. Hit the target metrics in [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md) §5.*

| # | Task | Priority | Impact | Complexity | Effort | Depends | Risk |
|---|------|----------|--------|-----------|--------|---------|------|
| 2.1 | Narrow `Window` selector to `isActive` boolean (stop subscribing to full `focusStack`) | P0 | Perf | S | 0.5d | — | 🟢 Low |
| 2.2 | Throttle drag: local transform during drag, commit on `onDragStop` | P1 | Perf | M | 1d | 2.1 | 🟠 Med |
| 2.3 | Games: replace 31 `storage.list()` calls with a precomputed `games_index` (1 request) | P0 | Perf/Scale | M | 1.5d | — | 🟠 Med |
| 2.4 | Responsive wallpapers + LQIP blur-up; sized variants | P1 | Perf | M | 1d | 1.6 | 🟢 Low |
| 2.5 | Icons → WebP/AVIF; remove `dummyimage.com` external dependency | P2 | Perf | S | 0.5d | — | 🟢 Low |
| 2.6 | Lazy-load framer-motion off the hire path; CSS-ify trivial animations | P2 | Perf | M | 1d | 1.4 | 🟠 Med |
| 2.7 | Boot splash: skippable / ≤600ms; never gate hire path | P1 | User/Perf | S | 0.5d | — | 🟢 Low |
| 2.8 | Web Vitals RUM → analytics | P1 | Perf/Maint | S | 0.5d | 1.2 | 🟢 Low |

**Exit criteria:** Lighthouse ≥95 on a throttled mid-tier phone for the hire path; smooth 60fps window drag with 5+ windows open.

---

## Phase 3 — Mobile (the headline goal)
*Goal: real mobile/tablet experiences per [MOBILE_STRATEGY.md](MOBILE_STRATEGY.md). Do NOT shrink desktop windows.*

| # | Task | Priority | Impact | Complexity | Effort | Depends | Risk |
|---|------|----------|--------|-----------|--------|---------|------|
| 3.1 | `useFormFactor()`/`useViewport()` hook (capability + resize-reactive); stop reading `innerWidth` at render | P0 | User | S | 0.5d | — | 🟢 Low |
| 3.2 | `ResponsiveShellRouter` → DesktopShell / TabletShell / MobileShell | P0 | User | L | 2d | 3.1, 1.4 | 🟠 Med |
| 3.3 | `<AppSurface>` abstraction so apps render in any shell; add `surfaces` to registry | P0 | User/Maint | M | 1.5d | 3.2 | 🟠 Med |
| 3.4 | MobileShell: full-screen app stack + fixed TabBar + app grid (Vaul for sheets) | P0 | User | L | 3d | 3.2, 3.3 | 🟠 Med |
| 3.5 | Mobile Resume: reflowable HTML + PDF download (precached offline) | P0 | User | M | 1.5d | 3.4 | 🟢 Low |
| 3.6 | Mobile Recruiter + `/hire` → full-screen on phones | P0 | User | M | 1d | 3.4 | 🟢 Low |
| 3.7 | TabletShell: rail nav + single surface + snap-half split | P1 | User | L | 2.5d | 3.2, 3.3 | 🟠 Med |
| 3.8 | Touch controls for Emulator (D-pad) / Synth, or graceful "desktop-best" fallback | P2 | User | L | 2d | 3.4 | 🟠 Med |

**Exit criteria:** a recruiter on a phone reaches résumé + projects + contact in ≤2 taps, no broken windowing; tablet uses rail not floating windows.

---

## Phase 4 — UX & Accessibility
*Goal: close the claim/reality a11y gap and sharpen the hire signal per [UI_UX_ARCHITECTURE.md](UI_UX_ARCHITECTURE.md).*

| # | Task | Priority | Impact | Complexity | Effort | Depends | Risk |
|---|------|----------|--------|-----------|--------|---------|------|
| 4.1 | Window a11y: `role`/`aria-modal`, focus trap, Tab order, Escape conventions | P0 | A11y/User | L | 2.5d | 3.2 | 🟠 Med |
| 4.2 | Keyboard navigation across windows + dock; document shortcuts | P1 | A11y | M | 1.5d | 4.1 | 🟠 Med |
| 4.3 | Tier-0 "Hire Me" in StatusBar + Spotlight launcher (Fuse.js) | P1 | User | M | 1.5d | — | 🟢 Low |
| 4.4 | Implement or remove ⌘C/⌘V placeholders | P2 | User/Maint | S | 0.5d | — | 🟢 Low |
| 4.5 | Replace Explorer placeholder URLs/whitelist with real data | P1 | User | S | 0.5d | — | 🟢 Low |
| 4.6 | Tokenize vintage chrome (gradients/shadows) into theme tokens | P2 | Maint | M | 1.5d | 1.6 | 🟢 Low |
| 4.7 | Contrast audit + fixes on chrome to meet AA | P2 | A11y | M | 1d | 4.6 | 🟢 Low |

**Exit criteria:** keyboard-only + screen-reader user can operate the OS or use an accessible reader path; Lighthouse a11y ≥95 is *earned*, not asserted.

---

## Phase 5 — Scalability & Extensibility
*Goal: survive 100k MAU / 1k concurrent; open the door to plugins.*

| # | Task | Priority | Impact | Complexity | Effort | Depends | Risk |
|---|------|----------|--------|-----------|--------|---------|------|
| 5.1 | Visitor counter: aggregate counter + payload broadcast (or 30–60s poll); kill per-client COUNT | P0 | Scale | M | 1d | — | 🟠 Med |
| 5.2 | Subscribe to realtime channels only when relevant app is open | P1 | Scale/Perf | M | 1d | 3.2 | 🟠 Med |
| 5.3 | CDN for assets (wallpapers/thumbs/ROMs) with immutable cache headers | P0 | Scale/Perf | M | 1d | 2.3 | 🟠 Med |
| 5.4 | Typed Supabase repo layer (one module per domain) replacing inline queries | P1 | Maint/Scale | M | 2d | 1.6 | 🟠 Med |
| 5.5 | Feature flags (gate half-built apps + plugin rollout) | P2 | Maint | S | 0.5d | 1.2 | 🟢 Low |
| 5.6 | Plugin host: `registerApp(manifest)` API on top of the lazy registry | P3 | Extensibility | L | 3d | 1.4, 3.3 | 🟠 Med |
| 5.7 | Test foundation: Vitest for store slices + window manager + theme applier; Playwright smoke for hire path | P1 | Maint | L | 3d | 1.6 | 🟢 Low |
| 5.8 | CI: lint + typecheck + build + Lighthouse budget gate | P1 | Maint | M | 1d | 5.7 | 🟢 Low |

**Exit criteria:** load-test 1k concurrent without query storms; new app addable via a single manifest; green CI enforcing the perf budget.

---

## Aggregate Effort

| Phase | Focus | ~Effort | Cumulative |
|-------|-------|---------|-----------|
| 1 | Critical fixes & foundations | ~9.5d | 9.5d |
| 2 | Performance | ~6d | 15.5d |
| 3 | Mobile | ~13.5d | 29d |
| 4 | UX & accessibility | ~9d | 38d |
| 5 | Scalability & extensibility | ~12d | 50d |

≈ **10 weeks** for one dev to take JeffOS from "impressive demo" to "production-grade, mobile-first, 95+, scale-ready." The first ~2 weeks (Phases 1–2) deliver the highest ROI: correctness, a fast hire path, and the architectural unblocking that makes everything else cheaper.

---

## If you only do five things

1. **Code-split + lazy apps** (1.4/1.5) — single biggest perf lever.
2. **Themes-as-data** (1.6/1.7) — removes the worst maintainability + startup hazard and unblocks the rest.
3. **Mobile hire path** (3.1→3.6) — the headline goal; what a recruiter actually experiences.
4. **Fix the visitor counter** (5.1) — the one latent self-DDoS at scale.
5. **Window a11y + Tier-0 Hire Me** (4.1/4.3) — earns the accessibility claim and makes the portfolio do its job.

---

## Honest closing assessment

JeffOS is a **strong portfolio idea executed with real frontend craft** — the windowing, dock, and theming show genuine skill. It is **not yet a production-grade system**: it has no code-splitting, no mobile experience, racy global-mutated theme state, a realtime pattern that doesn't scale, overstated accessibility, and dead scaffolding implying features that don't exist. None of these are fatal; all are fixable on the sequence above. The work that most increases its value as a *hiring artifact* is, ironically, making the non-OS parts (mobile, resume, accessibility, scale) as polished as the OS gimmick already is. Prefer simplicity: every fix above deletes a side channel or a duplicated path rather than adding cleverness.
