# JeffOS — Games & Wallpaper Performance Audit

> Investigation only. **No fixes, no code, no migrations, no DB changes were made.**
> Authored 2026-06-22. Evidence: client code (`src/`), live Supabase project `akqqmrqeloasisiybdjx` (catalog + storage metadata), and timed `curl` measurements against the live CDN.
> Scope: **wallpaper loading** and **game loading** only.

---

## 0. Executive summary — the three root causes

Every measurement points to three dominant problems. None is "the network is slow"; all are architectural.

| # | Root cause | Evidence | Affects |
|---|-----------|----------|---------|
| **RC-1** | **CDN never caches storage assets** — every public object returns `cache-control: no-cache` and `cf-cache-status: MISS`. | `curl -I` on themes/games/wallpapers objects all return `no-cache` + `MISS`. | Wallpapers **and** games, every load, especially repeat visits |
| **RC-2** | **Wallpapers are multi-MB full-resolution originals** served as backgrounds. | `cny.jpg = 5.26 MB` (TTFB 1.75s, total **3.34s**), `thanksgiving 3.27 MB`, `nigeria 2.49 MB`, `new_year 2.35 MB`; wallpapers bucket = 92 files / **71 MB**, largest 4.3 MB. | Wallpaper time-to-visible |
| **RC-3** | **Game discovery does ~37 sequential storage `list()` calls** over 36 systems when only **4 folders** have content; the Phase-5 `games_index` table exists but is **empty and unused**. | `EmulatorApp.loadGames()` loops `SUPPORTED_SYSTEMS` (36) + 1 thumbs list; live `games` bucket has only `gba/nes/snes/thumbs`; `games_index` rows = **0**. | Game-list time |

Fixing RC-1 + RC-2 makes wallpapers feel instant; RC-3 makes the game list near-instant. Details, measurements, and a ranked plan below.

---

## 1. Current architecture

```
APP BOOT (main.tsx)
 ├─ BootLoader (first visit): "Starting Mac OS X…" 2.2s + 3s fade
 │    └─ loadGlobalDefaultWallpaper()  → Supabase: defaults.global_wallpaper
 │         → wallpaper = wallpapers/Nature/Clown Fish.jpg (654 KB)
 └─ App.tsx initial effect:
      loadThemesFromSupabase()  → defaults.themes_manifest (1 row, JSON)
        → THEME_PACKS[*].wallpaperUrl  (theme → 2–5 MB image URL)
      recomputeAutoHoliday()    → picks active theme
        → setWallpaper(themePack.wallpaperUrl)   → <Desktop> renders background

DESKTOP WALLPAPER RENDER (components/Desktop.tsx)
 └─ <div style={{ backgroundImage: url(wallpaperUrl) }}>  (browser fetches image)

GAMES (lazy chunk, opens on window launch)
 └─ EmulatorApp.loadGames():
      list("thumbs")                       ← 1 call
      for system in SUPPORTED_SYSTEMS(36): list(system)   ← 36 calls (32 empty)
      build GameItem[] → GameLibrary grid (thumbs load)
 └─ on ROM select → EmulatorFrame (iframe srcDoc)
      loads https://cdn.emulatorjs.org/stable/data/loader.js  (3rd-party)
      EJS_gameUrl = public ROM url (2–4 MB) → emulator downloads + boots
```

**Boundary note:** Games & Wallpapers are correctly `React.lazy()` chunks (not in the initial bundle). The slowness is **data/asset**, not bundle.

---

## 2. SUPABASE REVIEW (live)

### 2.1 Buckets
| Bucket | public | size limit | MIME allow-list | objects |
|--------|:------:|:----------:|:---------------:|--------:|
| `games` | ✅ | none | none | 8 (4 ROMs + 4 thumbs) |
| `themes` | ✅ | none | none | 7 (wallpapers) |
| `wallpapers` | ✅ | none | none | **92** (71 MB) |
| `portfolio_thumb` | ✅ | none | none | — |

### 2.2 Cache headers — the headline finding (RC-1)
Object metadata records `cacheControl: max-age=3600` (already weak — 1 hour), **but the CDN actually returns:**
```
cache-control: no-cache
cf-cache-status: MISS        ← confirmed on themes, games, AND wallpapers objects
```
**Every** storage asset is fetched from origin **every time** — no browser cache, no edge cache. This is the dominant repeat-load cost for both features. (The Workbox SW does runtime-cache Supabase storage URLs `CacheFirst` for 7 days, which *partially* rescues repeat loads — but only after the first full origin fetch, only for SW-controlled navigations, and not at all in Safari private mode / first paint.)

### 2.3 `games_index` table — built but unused (RC-3)
- Phase 5 created `public.games_index` (manifest table) + a public-read RLS policy.
- **Live row count: 0.** Nothing populates it; neither `EmulatorApp` nor `GameLibrary` reads it. Game discovery still hits storage `list()` at runtime.

### 2.4 `themes_manifest` — working ✅
- `defaults.themes_manifest` row exists; `loadThemesFromSupabase()` reads it in **1 query** and maps theme→URL. This is the Phase-5 win; the wallpaper *discovery* is fine. The problem is the **image bytes + caching**, not discovery.

### 2.5 Queries / N+1 / realtime
- **Wallpaper theme path:** 1 query (`themes_manifest`) + 1 query (`global_wallpaper`) — fine.
- **WallpapersApp browse:** `list("")` + `list(folder)` per folder = **N+1 storage calls** (and `getPublicUrl` per file).
- **Games discovery:** **37 sequential `list()` calls** (see RC-3). The worst N+1 in the app.
- **Realtime:** the old `games-realtime` `storage.objects` subscription was already removed (Phase 5) — good, no realtime cost here now.
- **Indexes / RLS:** not on the hot path for these features (storage `list()` is an API call, not a SQL query you can index). `games_index` would *become* an indexed table read if adopted.

### 2.6 Missing
- ❌ No effective cache headers at the edge (RC-1).
- ❌ No image size limits / format enforcement (multi-MB JPEG/PNG; `christmas.png` is a PNG photo).
- ❌ No responsive/derivative images (no thumbnails for full wallpapers; no Supabase image transformations in use).
- ❌ `games_index` not populated/used.

---

## 3. WALLPAPER ANALYSIS

### 3.1 Step map (first visit)
```
User opens app
 → BootLoader splash (2.2s + 3s fade = ~5s gate, first visit only)   [FIXED-cost UX gate]
 → loadGlobalDefaultWallpaper(): defaults.global_wallpaper (DB ~tens of ms)
 → setWallpaper(Clown Fish.jpg)  → Desktop fetches 654 KB image
 → loadThemesFromSupabase(): themes_manifest (1 DB row)
 → recomputeAutoHoliday() → active theme → setWallpaper(theme image 2–5 MB)
 → Desktop re-renders backgroundImage → browser fetches 2–5 MB image
```

### 3.2 Why the wallpaper appears late
1. **RC-2 (bytes):** the visible image is a **2–5 MB** original. Measured `cny.jpg`: **TTFB 1.75s, total 3.34s on fast WiFi.** On 3G that is ~30–60s.
2. **RC-1 (no edge cache):** even a return visitor re-downloads the full image from origin (`cf-cache-status: MISS`), so it never gets "instant after first load" from the CDN. (SW CacheFirst helps *only* if the SW already cached that exact URL.)
3. **Double-set / re-render churn:** the wallpaper is set **twice** in sequence — first the global default (Clown Fish), then the theme/holiday wallpaper — and there are **three** `useEffect`s in `App.tsx` plus one in `Desktop.tsx` that all call `setWallpaper`/recompute on `activeTheme`/`themesLoadedAt`/`holidayThemeOverride`. The user may see the default flash, then a swap to the holiday image (a second multi-MB fetch).
4. **Placeholders remain visible** because the background only paints once the (large) image finishes downloading; there's no blur-up/LQIP, so the user stares at empty desktop or the previous image for the full multi-second fetch.

### 3.3 Why "the theme waits"
The theme itself is fast (1 manifest row). What "waits" is the **image** the theme points to. Discovery is not the bottleneck — **payload + caching** is.

### 3.4 Measured — time to wallpaper visible
| Scenario | Time to wallpaper visible (measured/derived) |
|----------|----------------------------------------------|
| Default (Clown Fish 654 KB), fast WiFi | ~1.1s image + DB ~0.1s ≈ **1.2s** |
| Holiday theme (cny 5.26 MB), fast WiFi | **~3.3s** image alone |
| Holiday theme, Slow 3G (~400 Kbps) | **~60–100s** for 5 MB (effectively "never" perceptually) |
| First visit | + the ~5s boot splash gate before any of the above |

---

## 4. GAME ANALYSIS

### 4.1 Step map
```
User opens Games (lazy chunk loads — fine)
 → EmulatorApp.loadGames():
      list("thumbs")                         1 storage call
      for 36 systems: list(system)           36 storage calls (32 return empty)
      → builds GameItem[]  → GameLibrary grid renders
      → each card fetches a thumb (~20–31 KB webp/jpg, no edge cache → origin)
 → user selects ROM
 → EmulatorFrame iframe (srcDoc) mounts
      → fetch https://cdn.emulatorjs.org/stable/data/loader.js  (3rd-party, uncontrolled)
      → EmulatorJS downloads core + the ROM (2–4 MB, no edge cache)
      → emulator boots → playable
```

### 4.2 Why the game list is slow (RC-3)
- **37 sequential `list()` calls**, 32 of which scan **empty** system folders, because the code iterates a hardcoded 36-system list while the live bucket has only `gba`, `nes`, `snes` (+ `thumbs`). Each `list()` is a round-trip to the Storage API.
- Sequential `for…await` (not parallel) → latencies **add up**. At ~150–300ms per call, that's **~5–11s** just to enumerate, mostly for empty folders.
- The `games_index` table that would collapse this to **1 read** exists but is empty/unused.
- **Duplicate discovery logic**: `EmulatorApp` and `GameLibrary` each implement their own listing; if both mount, the work doubles.

### 4.3 Why ROM discovery is slow
Same as 4.2 — it's the `list()` fan-out, not the ROMs themselves. Discovery should be one indexed read.

### 4.4 Why emulator startup is slow
- **3rd-party dependency**: `cdn.emulatorjs.org/stable/data/loader.js` + the core are fetched from EmulatorJS's CDN at play time (uncontrolled latency/availability).
- **ROM payload, no edge cache (RC-1)**: a 4 MB GBA ROM measured **total 2.55s on fast WiFi**; `no-cache` means re-download every play. On 3G, tens of seconds.
- The iframe uses `srcDoc` (inline HTML) so the emulator bootstrap can't be SW-precached as a normal document.

### 4.5 Measured — time to playable
| Step | Fast WiFi | Slow 3G |
|------|-----------|---------|
| Game list (37 list calls, sequential) | ~5–11s | ~15–40s |
| Thumbs (4 × ~25 KB, no cache) | <0.5s | ~2–4s |
| EmulatorJS loader + core (3rd-party) | ~1–3s | ~10–20s |
| ROM download (4 MB, no edge cache) | ~2.5s | ~60–90s |
| **Total to playable** | **~9–17s** | **~90–150s** |

---

## 5. MEASUREMENTS — per-step (P50 / P95 / worst)

> Storage latency derived from measured `curl` TTFB (~0.9–1.8s incl. origin MISS) and typical Storage API `list()` round-trips (~150–300ms each). "Worst" = Slow 3G / cold cache / large asset.

### Wallpaper
| Step | Requests | Payload | Blocking | P50 | P95 | Worst |
|------|---------:|--------:|---------:|----:|----:|------:|
| `global_wallpaper` DB read | 1 | ~0.2 KB | no | 60ms | 200ms | 1s |
| `themes_manifest` DB read | 1 | ~0.5 KB | no | 60ms | 200ms | 1s |
| Default image (654 KB) | 1 | 654 KB | paints bg | 1.1s | 2s | 8s (3G) |
| Theme image (2–5 MB) | 1 | 2–5 MB | paints bg | **3.3s** | 6s | **60–100s (3G)** |
| Re-render churn (double setWallpaper) | — | — | minor | — | extra image fetch | duplicate MB fetch |

### Game
| Step | Requests | Payload | Blocking | P50 | P95 | Worst |
|------|---------:|--------:|---------:|----:|----:|------:|
| Discovery `list()` ×37 (sequential) | **37** | small | gates list UI | **~6s** | ~11s | ~40s (3G) |
| Thumbnails | 1/card | ~25 KB ea | no | <0.5s | 1s | 4s |
| EmulatorJS loader+core (3rd-party) | several | ~MBs | gates play | 1–3s | 5s | 20s |
| ROM download (2–4 MB, no cache) | 1 | 2–4 MB | gates play | 2.5s | 5s | 90s (3G) |
| **Time to playable** | — | — | — | **~9s** | ~17s | ~150s |

---

## 6. REQUEST WATERFALL DIAGRAMS

### Wallpaper (first visit, holiday active) — current
```
0s     boot splash ───────────────────────────────── 5s (gate)
5.0س   defaults.global_wallpaper  ▪ (60ms)
5.1s   GET Clown Fish.jpg 654KB   ████ (1.1s, origin MISS)
5.1s   defaults.themes_manifest   ▪ (60ms)
6.2s   recompute → setWallpaper(theme)
6.2s   GET cny.jpg 5.26MB         ██████████████ (3.34s, origin MISS)
~9.5s  wallpaper finally visible          ▲ user-perceived
```
Two sequential multi-hundred-KB→multi-MB image fetches, neither edge-cached, after a 5s gate.

### Game list — current
```
list(thumbs) ▪
list(3do) ▪  list(arcade) ▪  list(atari2600) ▪ … (32 EMPTY) … sequential
list(gba) ▪  list(nes) ▪  list(snes) ▪
└────────────── ~6–11s of sequential round-trips ──────────────┘ → grid renders
```

### Game play — current
```
select ROM → iframe srcDoc mount
  GET cdn.emulatorjs.org/loader.js  ███ (3rd-party)
  GET EmulatorJS core               ████
  GET ROM 4MB (no edge cache)       ██████ (2.5s+)
  → playable
```

---

## 7. BOTTLENECK RANKING

| Rank | Bottleneck | Root cause | Impact | Confidence |
|------|-----------|-----------|--------|:----------:|
| **1** | Storage assets never edge/browser cached (`no-cache`) | RC-1 | 🔴 Huge — every wallpaper & ROM re-downloaded from origin every time | Measured |
| **2** | Multi-MB wallpaper originals as backgrounds | RC-2 | 🔴 Huge — 3.3s fast / 60s+ 3G to first paint | Measured |
| **3** | 37 sequential `list()` for game discovery (32 empty) | RC-3 | 🔴 High — ~6–11s to game list | Code + live counts |
| **4** | No blur-up/LQIP → blank/placeholder until full image | RC-2 | 🟠 Med — perceived slowness even when bytes are en route | Code |
| **5** | Double `setWallpaper` + redundant theme effects | render | 🟠 Med — flash + a second multi-MB fetch | Code |
| **6** | EmulatorJS loader/core from 3rd-party CDN | external | 🟠 Med — uncontrolled play-time latency | Code |
| **7** | WallpapersApp browse N+1 (`list` per folder) | N+1 | 🟡 Low-Med — only when browsing wallpapers app | Code |
| **8** | Duplicate game-discovery logic (EmulatorApp + GameLibrary) | dup | 🟡 Low — potential 2× work | Code |
| **9** | No bucket size/MIME limits (lets 5 MB images in) | governance | 🟡 Low — root enabler of RC-2 | Live |

---

## 8. ROOT-CAUSE ANALYSIS (synthesis)

- **Wallpapers feel slow** because the visible asset is a **2–5 MB original** (RC-2) fetched with **`no-cache` from origin** (RC-1), with **no progressive placeholder**, set **twice** (default→theme). The *discovery* (manifest) is already optimized; the *bytes and caching* are not.
- **Games feel slow** because the list is built from **37 sequential storage `list()` calls** scanning mostly **empty** folders (RC-3) — the `games_index` that would make it one read is empty — and then the **ROM + EmulatorJS core download with `no-cache`** (RC-1) and a 3rd-party CDN gate play.
- **The initial experience feels sluggish** because of the **~5s boot splash gate** on first visit *plus* the above — the first thing a user waits on (wallpaper) is the worst-cached, heaviest asset in the app.

The common denominator is **RC-1 (caching) + payload size** — caching/bytes, not logic, dominate both features.

---

## 9. PRIORITIZED IMPLEMENTATION PLAN (with expected gains)

> Recommendations only — nothing applied. Ordered by impact ÷ effort.

### Quick wins (< 1 day)
| # | Fix | Addresses | Expected gain |
|---|-----|-----------|---------------|
| Q1 | **Set long, immutable cache headers on storage objects** (`cache-control: public, max-age=31536000, immutable`) — re-upload or set on upload; verify CDN stops returning `no-cache`. | RC-1 | Repeat wallpaper/ROM loads **~3.3s → ~0s** (edge/browser hit). Single biggest win. |
| Q2 | **Replace 37-system loop with the 4 real folders** (or `list("")` then list only non-empty folders) and run them **in parallel** (`Promise.all`). | RC-3 | Game list **~6–11s → ~0.5–1s** immediately, with zero new infra. |
| Q3 | **Compress/resize the theme wallpapers** to ~1600–2048px webp (target <300 KB each). | RC-2 | Wallpaper paint **3.3s → ~0.4s** on fast, **60s → ~6s** on 3G. |
| Q4 | **Add `loading`/blur-up placeholder** (LQIP or CSS blur of a tiny inline) for the desktop background. | RC-4 | Perceived "instant" wallpaper even mid-download. |
| Q5 | **De-dupe the double `setWallpaper`** (skip default fetch when a theme wallpaper will immediately replace it). | render | Removes one redundant multi-MB fetch + the flash. |

### Medium wins (< 1 week)
| # | Fix | Addresses | Expected gain |
|---|-----|-----------|---------------|
| M1 | **Populate + read `games_index`** (the Phase-5 table): one server-side job lists the bucket and writes rows; client reads **1 query**. Then drop the runtime `list()` path. | RC-3 | Game list discovery → **1 indexed read (~60ms)**, independent of folder count; also kills the duplicate logic. |
| M2 | **Generate wallpaper derivatives** (full + 2048 + 1024 + LQIP) via Supabase image transformations or a build step; serve responsive `srcset`. | RC-2 | Right-sized bytes per device; mobile loads ~5–10× less. |
| M3 | **Enforce bucket `file_size_limit` + `allowed_mime_types`** (e.g. ≤500 KB webp for wallpapers). | RC-9 | Prevents regressions back to multi-MB originals. |
| M4 | **Self-host or SW-precache the EmulatorJS loader/core**, and cache ROMs via SW after first play. | RC-6/RC-1 | Removes 3rd-party gate; instant replays. |

### Large architectural improvements
| # | Fix | Addresses | Expected gain |
|---|-----|-----------|---------------|
| L1 | **Asset/CDN strategy**: versioned immutable paths + a manifest of derivatives for wallpapers and games; treat Storage as origin-behind-CDN with proper cache tiers. | RC-1/RC-2 | Systemic — every asset becomes cache-first; first-paint and repeat-paint both minimized. |
| L2 | **Precompute a games catalog** (title, system, rom url, thumb url, sizes) in `games_index`, updated on upload via an Edge Function trigger; client never lists buckets. | RC-3 | O(1) discovery forever; supports pagination/search at scale. |
| L3 | **Rethink the boot splash** (make it skippable / overlap asset load) so the first wallpaper paints during, not after, the 5s gate. | UX gate | Removes the first-visit "sluggish" perception entirely. |

### Expected end-state
- **Wallpaper time-to-visible:** ~3.3s (fast) / 60s (3G) → **~0.3–0.5s (fast) / ~5s (3G)**, and **~0s on repeat** once cached. (Q1+Q3+Q4)
- **Game list:** ~6–11s → **~0.5–1s** (Q2), then **~60ms** (M1).
- **Time to playable:** ~9–17s → **~3–5s** first play, **~1–2s** on replay (Q1+M4).

---

## 10. EDGE CASES (analysis)

| Case | Current behavior | Risk |
|------|------------------|------|
| **Cold cache** | Full origin fetch of every asset (`no-cache`) | 🔴 Worst case — both features slow |
| **Warm cache** | SW CacheFirst *may* serve storage URLs (7-day), but CDN still `no-cache` so non-SW paths re-fetch | 🟠 Partial; inconsistent |
| **Slow 3G** | 5 MB wallpaper ≈ 60–100s; 4 MB ROM ≈ 90s; 37 list calls ≈ 40s | 🔴 Effectively broken |
| **Fast WiFi** | Wallpaper 3.3s, list ~6s, playable ~9–17s | 🟠 Still sluggish |
| **Large ROM** | No cache → re-download each play; no progress UI | 🟠 |
| **Large wallpaper collection** | WallpapersApp `list("")`+N folders, 92 files / 71 MB; thumbnails are full images | 🟠 N+1 + heavy |
| **Empty bucket** | 36 empty `list()` still execute; list UI shows nothing after long wait | 🟠 wasted calls |
| **Supabase unavailable** | `loadGames` catch → empty list; `loadThemes` catch → local themes (no wallpaper); boot wallpaper fails silently | 🟢 degrades, no crash (boot no longer hangs — prior fix) |
| **Storage timeout** | `list()`/image hangs; no per-request timeout on discovery | 🟠 list UI can stall |
| **Realtime unavailable** | N/A — games realtime sub removed (Phase 5) | 🟢 |
| **Mobile devices** | Multi-MB wallpapers + ROMs over cellular; full-res images on small screens | 🔴 worst real-world impact |

---

## 11. What is already good (don't regress)
- Games & Wallpapers are **lazy chunks** — not in the initial bundle. ✅
- `themes_manifest` makes wallpaper **discovery** one query (Phase-5 win). ✅
- Dead `games-realtime` `storage.objects` subscription already removed. ✅
- Desktop shows a **cached wallpaper instantly on mount** if one is in the persisted store (good pattern — extend it). ✅
- SW runtime-caches Supabase storage `CacheFirst` (helps once primed — but undermined by origin `no-cache`). ✅/⚠️

---

*Investigation only. No code, migrations, or database/storage changes were made. The plan in §9 is a proposal for review; nothing has been applied.*
