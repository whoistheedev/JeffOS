# JeffOS — Phase 4: UX & Accessibility

> Phase 4 deliverable, authored **before** code changes. Implements the accessibility + hire-signal items from [UI_UX_ARCHITECTURE.md](UI_UX_ARCHITECTURE.md) §4/§9 and [REFACTOR_ROADMAP.md](REFACTOR_ROADMAP.md) Phase 4 (+1.11).
> Generated 2026-06-21.

---

## 0. Scope

Phase 4 in the roadmap is broad. This session implements the **high-value, low-risk, build-verifiable** subset and explicitly defers the large items.

**In scope:**
- **1.11** — remove `maximum-scale=1` viewport lock (WCAG 1.4.4 pinch-zoom failure).
- **4.1** — Window accessibility: `role="dialog"` / `aria-modal` / `aria-label`, Escape-to-close, and **fix the conditional-hooks ordering bug** in `Window.tsx` (hooks currently run after early returns — a real rules-of-hooks violation flagged in the audit).
- **4.4** — implement ⌘C/⌘V via the Clipboard API (replace the `console.log("placeholder")` handlers).
- **4.5** — replace Explorer placeholder URLs/whitelist (`yourdomain.com`, `yourhandle`, `YOUR_SUPABASE_URL`) with real data.
- **4.3 (partial)** — add a Tier-0 **"Hire Me"** entry to the StatusBar menu (the highest-leverage hire-signal affordance). Full Spotlight launcher deferred.

**Explicitly deferred (too large / needs design iteration this session):**
- 4.2 full keyboard navigation across windows + dock (beyond Escape).
- 4.3 Spotlight/Fuse.js launcher UI.
- 4.6 tokenize chrome · 4.7 full contrast audit.

## 1. Why these, in this order

The four small fixes (1.11, 4.4, 4.5, Hire Me) are isolated and safe. The one structural change is **4.1**, because the window is the OS's core widget and currently:
- has no dialog semantics for screen readers,
- can't be closed with Escape,
- **calls `useReducedMotion`/`useEffect`/`useMemo` after `if (!win) return null` and two more early returns** — React hooks must run unconditionally in the same order every render. This is latent breakage (especially under StrictMode) and must be corrected as part of any window a11y work.

## 2. Window a11y + hooks-order fix (4.1) — approach

**Hooks ordering:** move all hook calls (`useReducedMotion`, the three `useEffect`s, `useMemo`) **above** the early returns, so every render calls the same hooks in the same order. The early `return null` / About-modal returns then happen *after* all hooks. Where a hook body needs `win`, guard inside the hook (it already tolerates `win` being briefly undefined via `win?.`), not by skipping the hook.

**Dialog semantics:** the window's outer container gets `role="dialog"`, `aria-modal="false"` (windows are non-modal — multiple can be open), and `aria-label` from the window title. Traffic-light buttons already have `aria-label`s.

**Escape-to-close:** extend the existing per-window keydown effect (which already handles ⌘W/⌘M) to also close on `Escape` when the window is focused (top of `focusStack`). Reuses the existing `closeWindow` + sound path, so behavior is consistent.

**Risk:** reordering hooks is the sensitive part. Mitigation: the desktop tree and app rendering are unchanged; only the *position* of hook calls moves. Verified by build + `vite preview` smoke + confirming the About/about-app special cases still render.

## 3. Clipboard (4.4) — approach

Replace the two `console.log` placeholders in `StatusBar.tsx`'s ⌘ handler with real behavior: ⌘C copies the current text selection (`window.getSelection()`), ⌘V is a no-op-with-toast in the OS chrome context (paste targets are inputs, which the browser already handles natively). Use the existing `sonner` toast (already a dependency) for feedback. **Do not** hijack ⌘C/⌘V when the user is in an input/textarea — let the browser handle those natively (guard on `e.target` tag).

## 4. Explorer placeholders (4.5) — approach

Replace the `whitelist` and `TOP_SITES` placeholder values with the real links already used elsewhere in the app (GitHub `whoistheedev`, LinkedIn `jeffrey-james-idodo-4402b6390`, X `whoistheedev`, the real résumé PDF path). Replace the `YOUR_SUPABASE_URL` siteshot images with a safe local/derived fallback so the grid has no broken/placeholder remote images.

## 5. Hire Me (4.3 partial) — approach

Add a "Hire Me" item near the top of the StatusBar Apple menu (and/or a dedicated menu button) that opens the résumé PDF / Recruiter app. Reuses existing `openApp`/anchor patterns. Small, additive, high signal.

## 6. Affected files (planned)
- `src/App.tsx` — viewport meta string (drop `maximum-scale=1`).
- `index.html` — ensure no conflicting static viewport (verify).
- `src/components/Window.tsx` — hooks reorder + dialog roles + Escape.
- `src/components/StatusBar.tsx` — clipboard handlers + Hire Me entry.
- `src/apps/browser/Explorer.tsx` — real URLs.

## 7. Verification
`npm run build` (green, chunk split preserved), `npm run lint` (no *new* errors — Window.tsx should lose its `rules-of-hooks` errors), `vite preview` serve check, desktop parity confirmation. Report affected files, perf impact, risks, follow-ups.

---

## 8. Results (measured after implementation)

**Affected files**
- `src/App.tsx` — viewport string drops `maximum-scale=1`; mounts `<Toaster>`.
- `src/components/Window.tsx` — all hooks moved above the guard returns; `role="dialog"`/`aria-modal`/`aria-label`; Escape-to-close; removed dead `moveWindow` selector.
- `src/components/StatusBar.tsx` — real ⌘C (clipboard, input-guarded) / ⌘V (native); "Hire Me — Résumé" menu item.
- `src/apps/browser/Explorer.tsx` — real GitHub/LinkedIn/X/résumé URLs; favicon-derived thumbnails (no `YOUR_SUPABASE_URL` placeholders).

**Build** — green, `tsc -b` clean, **no chunk-size warning**, lazy app chunks intact (entry re-verified free of `SUPPORTED_SYSTEMS`/`createOscillator`).

**Lint (net improvement, proven against git HEAD)**
| File | HEAD | After P4 | Δ |
|------|------|----------|---|
| App.tsx | 1 | 1 | 0 (pre-existing `themesLoadedAt` warning) |
| **Window.tsx** | **8** | **2** | **−6** (killed 5 `rules-of-hooks` errors + 1 unused var) |
| StatusBar.tsx | 4 | 4 | 0 (pre-existing unused vars; clipboard + Hire Me added cleanly) |
| Explorer.tsx | 2 | 2 | 0 (pre-existing unused `Button`/`whitelist`) |

**Phase 4 introduced 0 new lint problems and removed 6.**

**Performance impact**
- Entry chunk: **125.53 → 159.57 kB** (gzip 38.54 → 47.83 kB), i.e. **+34 kB raw / +9 kB gzip**. Cause: `sonner` now loads at App level (it was previously only in lazy app chunks). This is a deliberate fix — there was **no `<Toaster>` mounted**, so existing `toast()` calls in Recruiter/Guestbook/Wallpapers rendered nothing. Mounting it makes those work and enables future toasts. Lazy app chunks are unchanged.
- Other Phase-4 changes are byte-trivial.

**Accessibility outcomes**
- Pinch-zoom restored (WCAG 1.4.4). Windows now expose dialog semantics to screen readers and close with Escape. The latent `rules-of-hooks` violation (a real render-correctness bug) is fixed.

**Preview** — `vite preview` HTTP 200, `#root` present, chunks fetch on demand.

**Risks / follow-ups**
- Hooks reorder is the sensitive change; verified by typecheck + build + preview + the `rules-of-hooks` errors disappearing. Recommend a manual click-through of every app + the About/about-app modals when running `npm run dev` (headless env can't drive the browser).
- `whitelist` in Explorer is still unused dead code (pre-existing); values updated to real ones but it should be wired up or removed in a later cleanup.
- Deferred to a later session: full keyboard nav across windows/dock (4.2), Spotlight launcher (4.3 full), chrome tokenization (4.6), contrast audit (4.7).
