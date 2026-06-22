# PWA Deployment Staleness Audit

> **Objective:** find the exact reason users remain on older deployments after new deployments are live.
> **Method:** static audit of the PWA/service-worker config + the **generated `dist/sw.js`** (the ground truth) + the update-flow trace. Vercel assumed correct.
> **Scope:** investigation only — **no code changed.**
> **Verdict up front:** this is **not** a Vercel problem. It is a **service-worker app-shell precache** problem: the SW serves a **precached `index.html`** for navigations, and that shell **pins the old hashed JS chunk names**. With `skipWaiting: false`, existing installs stay on the old shell until the user explicitly taps the "Reload" toast (or the SW is otherwise replaced). Evidence below.

---

## 1. Root Cause

**The generated service worker answers every top-level navigation with the precached `index.html` app-shell, and that precached shell hard-references the previous build's hashed chunk filenames. Because `skipWaiting: false`, the newly-installed SW *waits* and does not take over, so existing clients keep being served the old shell → old chunks → old app.**

Two compounding facts make it sticky:

1. **App-shell navigation is served from precache, not the network.** `dist/sw.js` registers:
   ```js
   registerRoute(new NavigationRoute(createHandlerBoundToURL("index.html")))
   ```
   This is registered **first**, so *every navigation* (including a hard refresh / address-bar reload) is handled by returning the **precached** `index.html`. The precached `index.html` (revision `5988a721…`) contains `<script src="/assets/index-<hash>.js">` with the **build-time** hash. So as long as the **old SW** is in control, the browser is handed the **old shell → old chunks**, regardless of what Vercel is serving.

2. **`skipWaiting: false` + a user-gated update.** The PWA is configured `registerType: 'prompt'` with `skipWaiting: false` (`vite.config.ts:49,103`). When a new build deploys, the new SW **installs but waits**; control is only handed over when `updateSW(true)` runs — which only happens if the user **sees and taps the "Reload" toast** (`PWAUpdatePrompt.tsx`). Until then, the **old SW stays in control and keeps serving the old precached shell**. A normal refresh does **not** activate the waiting SW.

> **The `NetworkFirst` "document" rule is dead code for navigations.** `vite.config.ts:124–131` defines a `NetworkFirst` handler for `request.destination === 'document'` — which *would* fetch fresh HTML from the network first. But in `dist/sw.js` the **`NavigationRoute(index.html)` is registered at char 7410, the document `NetworkFirst` rule at char 7911** — i.e. **the NavigationRoute is registered first and wins.** Workbox routes first-match, so top-level navigations never reach the `NetworkFirst` rule. The intended "always check network for HTML" behavior is **silently overridden** by the precache app-shell route. This is the single most important finding.

---

## 2. Evidence

All from the built `dist/sw.js` (the actual deployed worker), not the source intent.

| # | Evidence | Meaning |
|---|----------|---------|
| E1 | `registerRoute(new NavigationRoute(createHandlerBoundToURL("index.html")))` | Navigations are served the **precached** `index.html`, not the network. |
| E2 | `{url:"index.html", revision:"5988a721b3d9a66ed3d014039e0f407f"}` in the precache manifest | `index.html` is **precached with a content revision**; the SW serves *that exact shell* until a new SW activates. |
| E3 | Built `dist/index.html` references `/assets/index-D8sShzXh.js` | The precached shell **pins the build-time chunk hash**. Old SW → old shell → `index-DzEQhPdS.js` (the previously-deployed hash observed live). |
| E4 | Route order: `NavigationRoute` at char **7410**, `document` `NetworkFirst` at char **7911** | First-match wins → the `NetworkFirst` "fetch fresh HTML" rule is **never reached for navigations**. The network-first intent is dead. |
| E5 | `vite.config.ts:103` → `skipWaiting: false` (and `dist/sw.js` `self.skipWaiting()` is **message-gated**: `addEventListener("message", e => e.data?.type==="SKIP_WAITING" && self.skipWaiting())`) | The new SW **waits**; it only activates when `updateSW(true)` posts `SKIP_WAITING` — i.e. on the user tapping "Reload". A refresh alone won't update. |
| E6 | `vite.config.ts:49` → `registerType: 'prompt'`; `PWAUpdatePrompt.tsx` shows a toast on `onNeedRefresh` | Update is **opt-in via UI**. If the toast is missed/dismissed (or the tab is long-lived), the user stays on the old version indefinitely. |
| E7 | `vite.config.ts:96–123` runtime caches: `CacheFirst` for Supabase storage (7d) and local image/audio/font (30d) | Secondary: cached **assets** (wallpapers, icons, sounds) are `CacheFirst` and won't refresh for 7–30 days even after the app updates. Not the navigation cause, but a related staleness vector. |
| E8 | `cleanupOutdatedCaches: true` (`vite.config.ts:98`) | Old *precaches* are cleaned **only after the new SW activates** — which (per E5) doesn't happen on refresh. So cleanup never fires for a waiting SW. |

### Why each observed symptom happens (mapped to evidence)

1. **Deployment URL shows the new version.** The `*.vercel.app` deployment URL is a **fresh origin the SW hasn't claimed** (different scope/host) → no SW interception → browser fetches the new HTML/chunks directly. *(E1 doesn't apply on an unclaimed origin.)*
2. **Existing tab shows old version.** The tab has the **old SW in control**; every navigation is answered from the precached old shell (E1–E3). The new SW is **waiting** (E5).
3. **Refresh still shows old version.** A reload is a navigation → still served the **precached** old `index.html` by the old SW (E1, E4). Refresh does **not** activate the waiting SW (E5), so the user is pinned.
4. **Social link sometimes opens the new version.** Social apps frequently open links in an **in-app browser / fresh webview with no registered SW** (or a cleared one) → no interception → fresh fetch. When it opens in the user's main browser with the SW installed, it shows old.
5. **Incognito works correctly.** Incognito has **no persisted SW and no caches** → every request hits the network/CDN → always the latest. This is the clean-room proof that the staleness is **client-side SW/cache**, not Vercel.

---

## 3. Files Involved

| File | Lines | Role in the bug |
|------|-------|-----------------|
| `vite.config.ts` | 44–53 | `registerType: 'prompt'`, `injectRegister: false` — update is UI-gated. |
| `vite.config.ts` | 96–103 | `cleanupOutdatedCaches`, `clientsClaim`, **`skipWaiting: false`** — new SW waits. |
| `vite.config.ts` | 124–131 | `NetworkFirst` document rule — **intended fresh-HTML fetch, but dead** (E4). |
| `dist/sw.js` (generated) | — | The actual worker: `NavigationRoute(index.html)` precache app-shell (E1), precached `index.html` revision (E2), route order (E4), message-gated `skipWaiting` (E5). |
| `dist/index.html` (generated) | — | The precached shell that pins the chunk hash (E3). |
| `src/components/PWAUpdatePrompt.tsx` | 21–36 | `registerSW({ onNeedRefresh })` → toast; `updateSW(true)` only on user tap. |
| `src/App.tsx` | 4, 158 | Mounts `PWAUpdatePrompt`. |
| `src/main.tsx` | — | **No** SW code (registration is solely in `PWAUpdatePrompt`). Confirmed clean. |

There is **no custom service-worker file and no `injectManifest`** — this is a `generateSW` (Workbox) setup. No custom cache handlers beyond the `runtimeCaching` above.

---

## 4. Update Flow Trace — where staleness is introduced

```
GitHub Push            ✅ reaches Vercel
   ↓
Vercel Build           ✅ new build, new chunk hashes, new precache manifest
   ↓
Deployment URL         ✅ *.vercel.app serves NEW (no SW claims that host)
   ↓
Custom Domain          ✅ whoisjeff.dev / dev.whoisjeff.dev serve NEW from the edge…
   ↓
Browser Request        ── for an EXISTING install, intercepted by the OLD SW ──┐
   ↓                                                                            │
Service Worker         ❌ STALENESS INTRODUCED HERE                            │
                          • NavigationRoute → precached OLD index.html (E1,E4)  │
                          • new SW is WAITING, not active (E5)                  │
   ↓                                                                            │
Chunk Resolution       ❌ old shell references OLD /assets/index-<oldhash>.js   │
   ↓                          (and the old chunks are precached too)           │
Rendered App           ❌ OLD version  ◄───────────────────────────────────────┘
```

**The break is entirely at the Service-Worker step**, before the request ever reaches the network for an existing install. Vercel/edge/domain are all serving the new build correctly (proven by the deployment URL + incognito).

---

## 5. Probability Ranking (highest → lowest)

| Rank | Cause | Probability | Basis |
|------|-------|:-----------:|-------|
| 1 | **Service-Worker precache app-shell** (NavigationRoute → precached `index.html`) + **`skipWaiting:false`** waiting SW | **~85%** | E1–E6. This alone fully explains symptoms 1–5. |
| 2 | **Workbox precache** pinning old chunk hashes via the precached shell | **~10%** (same mechanism as #1) | E2, E3 — the vehicle for #1. |
| 3 | **Runtime cache** (`CacheFirst` assets, 7–30d) | ~3% | E7 — keeps *assets* stale but not the app shell/code. |
| 4 | Browser HTTP cache | ~1% | Minor; the SW intercepts before HTTP cache matters for navigations. |
| 5 | Vercel edge cache | <1% | Disproven by deployment URL + incognito both showing new. |
| 6 | Domain routing / deployment aliasing | <1% | Stated correct; deployment URL is current. |

**Bottom line:** ranks 1–2 are the same root mechanism (SW serving a precached shell that an inactive new SW can't replace). Everything else is negligible.

---

## 6. Recommended Fix (do NOT implement — for decision)

The cleanest correct fix is to **stop precaching the HTML app-shell as the navigation handler** so navigations get **fresh HTML**, and let only the **hashed, immutable assets** be precached:

- **Option A — make HTML genuinely network-first (recommended).** Exclude `index.html` from being served as the precached navigation shell, OR remove the `NavigationRoute(createHandlerBoundToURL("index.html"))` so the existing `NetworkFirst` document rule actually applies. Then a refresh fetches fresh HTML → fresh chunk hashes immediately. (Hashed `/assets/*` stay precache/immutable — that's correct and desirable.)
  - In `vite-plugin-pwa`/Workbox terms: set `workbox.navigateFallback` appropriately and/or `navigationPreload`, and ensure the document `NetworkFirst` route is the one that handles navigations (it currently is shadowed — E4).
- **Option B — switch to immediate updates.** `registerType: 'autoUpdate'` + `skipWaiting: true` + `clientsClaim: true`. The new SW activates on next load and `cleanupOutdatedCaches` purges the old precache, so users get the new version on the **next navigation** without a toast. (Trade-off: can swap assets mid-session; usually fine for this app. This is what the project used **before** the recent switch to `prompt`.)
- **Either way:** add `Cache-Control: no-cache` on `index.html`, `sw.js`, and `manifest.webmanifest` at the edge (the repo's `vercel.json` already sets this for `sw.js` + `manifest.webmanifest`; **`index.html` should be added**) so the *SW script itself* is always re-fetched and the update check fires promptly.

> Note: the visible "Reload" toast (`prompt` flow) is a fine UX *if* it actually reaches users — but it only helps users who **see and tap it**. The precache-app-shell route (E4) is the real defect; it must be fixed regardless of prompt-vs-autoUpdate.

---

## 7. Production-Safe Fix

Lowest-risk sequence to roll out without stranding the existing (old-SW) install base:

1. **Edge headers first (zero app risk):** ensure `index.html`, `sw.js`, `manifest.webmanifest` are served `Cache-Control: no-cache` (so the browser always revalidates the SW + shell). `vercel.json` already does this for `sw.js`/`manifest`; add `index.html`.
2. **Fix the navigation route** (Option A) so HTML is network-first while keeping hashed-asset precache. Ship it.
3. Keep `cleanupOutdatedCaches: true` (already on) so stale precaches are purged once the corrected SW activates.
4. **For the currently-stranded installs** (which won't auto-update because the old SW waits): the corrected SW must be able to take over. Pairing the Option-A fix with **`skipWaiting: true` for one release** guarantees the fixed SW activates on the next load for everyone, clearing the backlog; you can return to the `prompt` flow afterward if desired.
5. Bump anything that changes the SW URL/content so browsers detect a byte-different `sw.js` (any of the above already does this).

---

## 8. Rollback Plan

- The change is config-only (`vite.config.ts` workbox/registerType) + optional `vercel.json` headers + `PWAUpdatePrompt` wiring. **Revert the commit** to restore the current behavior.
- Because the fixed release would activate immediately (step 4), rollback is safe: deploying the reverted build produces a new `sw.js`; with `skipWaiting`/`clientsClaim` it also takes over on next load. If you instead keep the `prompt` flow, a rollback reaches users on their next "Reload".
- **Escape hatch (no redeploy):** a one-line "kill-switch" SW (an empty SW that `self.registration.unregister()`s and clears caches) can be deployed to forcibly de-stale every client if a release goes wrong. Keep this on hand but it should not be needed.

---

## 9. Verification Checklist

After the fix is deployed:

- [ ] **Incognito** on `whoisjeff.dev` shows the new chunk hash (baseline — should already pass; proves edge is fresh).
- [ ] **Existing installed/visited browser:** open DevTools → Application → Service Workers. Confirm the **new SW activates** (no perpetual "waiting") on the next load.
- [ ] DevTools → Network: a top-level **navigation request returns fresh HTML from the network** (not "(ServiceWorker)" serving the precached shell) — i.e. the `NetworkFirst`/network path now handles navigations.
- [ ] The served `index.html` references the **new** `/assets/index-<hash>.js`; confirm `curl -s https://whoisjeff.dev | grep index-` matches the just-built hash.
- [ ] DevTools → Application → Cache Storage: the **old precache is gone** (`cleanupOutdatedCaches` fired) and `jeffos-pages`/precache hold the new revision.
- [ ] A **plain refresh** (not a toast tap) on an existing install now lands on the new version within one reload cycle.
- [ ] Headers: `curl -sI https://whoisjeff.dev/sw.js`, `/index.html`, `/manifest.webmanifest` all show `cache-control: no-cache`; `curl -sI .../assets/index-<hash>.js` shows `immutable`/long max-age.
- [ ] Social-link / webview open and main-browser open now show the **same** (new) version.

---

*Investigation only. No code, config, or deployment changed. Conclusions are drawn from the source config (`vite.config.ts`, `PWAUpdatePrompt.tsx`, `App.tsx`, `main.tsx`) and — decisively — the **generated `dist/sw.js`** and `dist/index.html`, which show the precache-app-shell navigation route, the precached `index.html` revision, the route-registration order, and the message-gated `skipWaiting`.*
