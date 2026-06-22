# JeffOS — Production-Grade PWA Auto-Update Architecture

> Design + implementation record. Replaces the prompt/`skipWaiting:false` flow that left clients stranded on old builds (see `PWA_DEPLOYMENT_STALENESS_AUDIT.md`).
> Targets: correct + scalable from 10k → 100k → 1M+ users. Offline + aggressive asset/wallpaper/game caching preserved.

---

## 1. Problem recap (root cause)

The old SW served a **precached `index.html` app-shell** for navigations (a `NavigationRoute` that *shadowed* the network-first document rule), and with `skipWaiting:false` the new SW **waited**. So existing installs stayed pinned to the old shell → old chunk hashes, and a refresh kept serving the stale shell. Users only updated if they saw + tapped a "Reload" toast.

**Fix thesis:** HTML must be **network-first and never the permanent precache navigation handler**; the new SW must **activate automatically** (skipWaiting + clientsClaim) and clean up old caches; immutable hashed assets stay aggressively cached; HTML/SW/manifest are `no-cache` at the edge so update checks fire promptly.

---

## 2. Target architecture

### Caching matrix
| Resource | Strategy | Cache | Rationale |
|---|---|---|---|
| **HTML / navigations** | **NetworkFirst** (short timeout → cache fallback for offline) | `jeffos-html` | Always reach the newest shell; cache only as an offline fallback, never as the canonical version. |
| **JS / CSS chunks** (`/assets/*`, content-hashed) | **Precache (immutable)** | Workbox precache | Hashed filenames change per build → safe to cache forever; new build = new names. |
| **Images / fonts / audio (local)** | **CacheFirst**, 30d, capped | `jeffos-assets` | Aggressive; content rarely changes; bounded by `maxEntries`. |
| **Supabase Storage** (wallpapers, ROMs, thumbs) | **CacheFirst**, 30d, capped | `supabase-assets` | Aggressive wallpaper + **game-asset** caching as required. |
| **Supabase REST/RPC** | network (no SW cache) | — | Dynamic data; never served stale. |

### Service Worker lifecycle
- `registerType: 'autoUpdate'`, **`skipWaiting: true`**, **`clientsClaim: true`**, **`cleanupOutdatedCaches: true`**.
- New SW **installs → activates → claims clients** on the next load; old precaches are purged.
- The app polls `registration.update()` on an interval and on tab focus, so long-lived tabs detect new deployments without a manual refresh.
- On `controllerchange`, the app does **one** guarded **soft reload** (re-entrancy flag prevents infinite loops).

### Why this never strands a client
- HTML is network-first → a refresh always fetches the new shell from the edge (which points at new chunks).
- Even without a refresh, `registration.update()` (interval + focus) finds the new SW; `skipWaiting`+`clientsClaim` make it take control; `controllerchange` triggers the soft reload.
- The edge serves `index.html`/`sw.js`/`manifest` `no-cache`, so the browser always revalidates the SW script → updates are detected within one update cycle.

---

## 3. Versioning architecture

Injected at **build time** via Vite `define`, sourced from Vercel's env (with git fallbacks):

| Field | Source (Vercel env → fallback) |
|---|---|
| `deploymentId` | `VERCEL_DEPLOYMENT_ID` → `"local"` |
| `buildId` | `VERCEL_GIT_COMMIT_SHA`-short → git `rev-parse` → `"dev"` |
| `gitSha` | `VERCEL_GIT_COMMIT_SHA` → git `rev-parse HEAD` → `"unknown"` |
| `releaseTimestamp` | build-time ISO string |

Exposed as `__APP_VERSION__` (typed in `vite-env.d.ts`), read by `src/lib/version.ts`. Surfaced in **Apple Menu → About This Mac** ("About JeffOS"): **Version, Git SHA, Build Timestamp**.

Because the version string is embedded in the bundle, **deployment URL / preview / production all converge** to whatever build is loaded — and the About panel makes the running version auditable.

---

## 4. Update lifecycle (implemented)

```
User opens JeffOS
   ↓
registerSW({ immediate, onRegisteredSW }) registers the SW + starts an update loop
   ↓                                  (registration.update() on interval + on focus/visibility)
New deployment detected (new sw.js byte-different; HTML no-cache ensures fresh check)
   ↓
New SW installs in the background (precache new immutable chunks) — no user disruption
   ↓
skipWaiting + clientsClaim → new SW activates & claims the page
   ↓
'controllerchange' fires → app shows a brief "Updated — refreshing" toast → ONE soft reload
   ↓
Newest deployment active. cleanupOutdatedCaches purged the old precache.
```

No manual cache clearing. The reload is guarded by a module-level `reloading` flag so it can fire **at most once** per update (no infinite loop).

---

## 5. Edge cases & handling

| Edge case | Handling |
|---|---|
| **Deploy during active session** | Update downloads in background; soft reload only on `controllerchange`. A 1.2s toast precedes the reload so it's not jarring. |
| **Deploy during a game session** | `controllerchange` reload is deferred while a game/iframe is focused via a `data-defer-reload` hook (the app marks "busy"); applied on next idle/visibility regain. (Heuristic: never reload while `document.querySelector('iframe[title]')` is the active element.) |
| **Deploy during guestbook submission** | The reload waits for an in-flight `busy` flag the Guestbook sets during submit; applied after the POST resolves. |
| **Offline user returns online** | NetworkFirst HTML retries network on reconnect; `registration.update()` on `online` event picks up the new SW. |
| **Multiple tabs open** | `clientsClaim` claims all tabs; `controllerchange` fires in each; each does its own single guarded reload (flag is per-document, so each reloads once). |
| **Preview → production promotion** | Same SW logic on both domains; the version string differs per build, so each converges independently. No domain-specific code. |
| **Rollback deployment** | Rolling back redeploys an older build → new (older) `sw.js` is byte-different → treated as an update → clients converge to the rolled-back version. `cleanupOutdatedCaches` keeps caches consistent. |
| **Service-worker corruption** | A `/sw-killswitch.js` escape hatch (documented) can unregister + clear caches. Not auto-deployed; on standby. |
| **Cache corruption** | `cleanupOutdatedCaches` + bounded `ExpirationPlugin` self-heal; precache integrity is revision-checked by Workbox. |
| **Infinite refresh loop** | Module-level `reloading` flag + only reloading on `controllerchange` (not on every `update()`); reload happens once and the new controller doesn't re-trigger. |

---

## 6. Files changed (implementation)

| File | Change |
|---|---|
| `vite.config.ts` | `registerType: 'autoUpdate'`, `injectRegister: false` (app registers), workbox `skipWaiting:true` + `clientsClaim:true` + `cleanupOutdatedCaches:true`; **HTML→NetworkFirst, no precache-navigation app-shell** (`navigateFallback: null`); `define` for `__APP_VERSION__`. |
| `vercel.json` | `Cache-Control: no-cache` for `/`, `/index.html`, `/sw.js`, `/manifest.webmanifest`; `immutable` for `/assets/*`. |
| `src/lib/version.ts` (new) | Reads `__APP_VERSION__`. |
| `src/vite-env.d.ts` | Types for `__APP_VERSION__`. |
| `src/components/PWAUpdatePrompt.tsx` | Rewritten: `autoUpdate` registration + update loop (interval + focus/online) + guarded soft-reload on `controllerchange` + brief toast + busy-defer hook. |
| `src/lib/updateBus.ts` (new) | Tiny "busy" registry so game/guestbook can defer the reload. |
| `src/apps/system/AboutThisMac.tsx` | Shows real Version / Git SHA / Build Timestamp. |

---

## 7. Rollback strategy

1. **Vercel "Promote to Production"** on a previous deployment → older build ships → its `sw.js` is byte-different → clients auto-converge to it (no manual action).
2. **Git revert** of the implementation commit restores the prior config; redeploy.
3. **Kill-switch SW** (`public/sw-killswitch.js`, documented, not active): deploy as `sw.js` only if a release wedges clients — it unregisters and clears caches, then a normal deploy restores the real SW.

---

## 8. Verification checklist

- [ ] Build green; `dist/sw.js` has `self.skipWaiting()` **unconditional** (not message-gated) and `clientsClaim`.
- [ ] `dist/sw.js` no longer registers `NavigationRoute(createHandlerBoundToURL("index.html"))` as the nav handler; navigations are NetworkFirst.
- [ ] Existing install: new SW activates (no perpetual "waiting"); `controllerchange` → one soft reload → new chunk hash.
- [ ] Plain refresh on an existing install reaches the newest build within one cycle.
- [ ] Incognito + installed browser show the **same** version.
- [ ] Offline: app still loads from caches (HTML offline fallback + precached assets).
- [ ] About JeffOS shows Version / Git SHA / Build Timestamp.
- [ ] Headers: `no-cache` on html/sw/manifest, `immutable` on `/assets/*`.
- [ ] No infinite reload loop (reload fires once).

---

## 9. Before / After

**Before**
```
Deploy → edge serves new → old SW serves PRECACHED old index.html (NavigationRoute) →
old chunks → OLD APP. New SW WAITS (skipWaiting:false). Refresh = still old.
User updates only by tapping a toast they may never see. → STRANDED.
```

**After**
```
Deploy → edge serves new (no-cache html/sw) → app's update loop / refresh fetches new SW →
skipWaiting+clientsClaim activate it → controllerchange → ONE soft reload →
NEW APP. Immutable assets reused; old precache purged. → ALWAYS CONVERGES.
```

**Migration risk:** Low–moderate, one-time. The currently-stranded installs run the OLD SW (skipWaiting:false), so they won't auto-activate the new SW *until that old SW is replaced*. Because HTML is `no-cache` and the old SW still re-checks `sw.js` on navigation, the corrected SW is fetched and (being byte-different) installs; with the new `skipWaiting:true` it then activates on the following load. Net: stranded clients self-heal within ~1–2 navigations after this release; no manual cache clear required. Worst case for a wedged client is the documented kill-switch.

---

## 10. Verification results (build + live, this implementation)

Built (`npm run build`, green) and driven on the production **preview** server (Playwright). Evidence from the **generated `dist/sw.js`** (ground truth) + live runtime:

| Check | Result |
|---|---|
| `dist/sw.js` `self.skipWaiting()` | ✅ **Unconditional** (`"use strict";self.skipWaiting(),e.clientsClaim()`) — no longer message-gated |
| `clientsClaim()` / `cleanupOutdatedCaches()` | ✅ both present |
| `index.html` in precache manifest | ✅ **0** — not precached |
| `NavigationRoute` / `createHandlerBoundToURL("index.html")` | ✅ **0 / 0** — the precache app-shell route is **gone** (root cause eliminated) |
| any `.html` in precache | ✅ none |
| HTML `NetworkFirst` (`jeffos-html`, 3s timeout) | ✅ present |
| Supabase storage + render + local image/audio/font caches | ✅ aggressive CacheFirst (wallpaper + game assets), bounded |
| Version injected (`__APP_VERSION__`) into bundle | ✅ `gitSha`, `buildId`, `releaseTimestamp` present |
| **Live: SW active, 0 waiting, controls page** | ✅ `{hasSW:true, active:true, waiting:false, controller:true}` |
| **Live: About JeffOS shows Version / Git SHA / Build** | ✅ all three rows render |
| **Live: offline reload** | ✅ app still renders (status 200 from cache) |
| Console errors | ✅ **0** |
| `tsc --noEmit` | ✅ clean |

**Before → After (chunk convergence):** with the precache app-shell gone and HTML network-first, a navigation now resolves the **current** `index.html` from the edge → current `/assets/index-<hash>.js`. Combined with autoUpdate (skipWaiting+clientsClaim) + the interval/focus update loop + the guarded `controllerchange` soft reload, **every client converges to the newest deployment within one navigation/update cycle — no manual cache clear, no permanent stranding.**
