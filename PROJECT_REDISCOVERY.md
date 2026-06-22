# JeffOS — Project Rediscovery

> A rediscovery document to pick this project back up without re-deriving everything from the code.
> Generated 2026-06-21. Package name: `whoisthedev` · Branch: `main`.

---

## 1. What This Project Does

**JeffOS** is a vintage Mac OS X–style web portfolio, presented as a desktop operating system in the browser. Instead of a conventional scrolling portfolio page, visitors get a full desktop environment:

- A **dock** for launching apps, a **status bar** (menu bar) at the top, draggable **desktop icons**, and **resizable windows** that host ~15 self-contained mini-apps.
- It doubles as the personal portfolio of **Jeffrey James Idodo** (PERN full-stack developer). A dedicated `/hire` route auto-opens a "Recruiter" app for hiring managers.
- It is a **Progressive Web App (PWA)** — installable and works offline via a service worker.

The experience is highly polished: theme switching (System 7 / Mac OS 9 / Aqua eras), holiday auto-detection that re-themes the OS, retro game emulation with live leaderboards, a Web Audio synthesizer, a realtime guestbook, and more.

---

## 2. Current Tech Stack

**Frontend framework**
- React **19.1.1** + React DOM 19.1.1
- TypeScript **~5.8.3** (strict mode)
- Vite **7.1.2** (build + dev server, ES modules)

**Styling & UI**
- TailwindCSS **4.1.12** (via `@tailwindcss/vite`)
- shadcn/ui (New York style) over **Radix UI** primitives (context-menu, dialog, dropdown, popover, slider, switch, tabs)
- Class Variance Authority, `clsx` / `classnames`, `tailwind-merge`, `tw-animate-css`
- **Framer Motion 12** (animations), **Lucide React** (icons), **Sonner** (toasts), **Vaul** (drawer)

**State & data**
- **Zustand 5** — sliced store with `persist` middleware → `localStorage` (key: `whoisthedev-root`)
- **TanStack React Query 5** — remote/server state and caching

**Interaction & utilities**
- **dnd-kit** (drag & drop), **react-rnd** (resizable/movable windows)
- **Fuse.js** (fuzzy search / Spotlight), **fast-average-color**, **seedrandom**, **Zod** (validation)

**Backend & integrations**
- **Supabase** (`@supabase/supabase-js`) — Postgres, Storage, Realtime, Edge Functions
- **Spotify Web Playback** (optional, PKCE OAuth) for the iTunes app

**PWA / build / tooling**
- **vite-plugin-pwa 1.1** (`registerType: autoUpdate`, Workbox runtime caching) + `workbox-window`
- **ESLint 9** (flat config) + **Prettier 3** + `eslint-config-prettier`
- **Lighthouse** config with ≥95 thresholds (Performance / A11y / Best Practices / PWA)

---

## 3. Folder Structure

```
JeffOS/
├── index.html                 # HTML entry; mounts #root, loads /src/main.tsx
├── package.json               # name: "whoisthedev", scripts, deps
├── vite.config.ts             # Vite + React + Tailwind v4 + PWA config
├── tsconfig*.json             # root / app / node TS configs; @/* → src/*
├── eslint.config.js           # flat config (⚠ see §7 — has a trailing broken block)
├── components.json            # shadcn/ui config (New York style)
├── lighthouse.config.js       # perf thresholds (≥95)
├── README.md / LICENSE
├── public/
│   ├── icons/                 # app & folder icons (~18 PNGs, ~1.3 MB)
│   ├── sounds/                # 7 system MP3s (open/close/zoom/trash/select…)
│   ├── site.webmanifest       # PWA manifest
│   ├── *.pdf                  # resume PDF
│   └── favicons, wallpapers, about.txt
└── src/
    ├── main.tsx               # React bootstrap (providers + BootLoader + App)
    ├── App.tsx                # top-level composition; theme + holiday logic
    ├── apps/                  # 14–15 mini-app modules (one folder each)
    │   ├── finder/  games/  terminal/  calendar/  music/  synth/
    │   ├── guestbook/  wallpapers/  browser/  recruiter/  resume/
    │   ├── bmcoffee/  controlpanel/  system/  registry/
    ├── components/            # Desktop, Dock, Window / WindowManager, StatusBar
    ├── store/                 # Zustand slices: ui, prefs, apps, games, metrics, sounds
    ├── config/                # themes.ts, holidays.ts, menus
    ├── hooks/                 # useClock, useBattery, useNetwork, useVisitors, …
    ├── lib/                   # supabase.ts, spotify.ts, commandBus.ts, utils.ts (+ stubs)
    ├── helpers/               # helper functions
    ├── routes/hire.tsx        # /hire → auto-opens Recruiter app
    └── pages/                 # 404 / 500 error pages
```

**Notable empty/stub files in `src/lib/`:** `analytics.ts`, `edge.ts`, `keyboard.ts`, `profanity.ts`, `workers.ts` (scaffolding not yet wired up).

---

## 4. Main Application Flow

**Boot sequence (`src/main.tsx`):**

```
QueryClientProvider (TanStack Query)
  └─ GlobalSoundProvider (click sound via Zustand)
       └─ BootLoader (Mac OS X splash for first-time visitors)
            └─ App
```

**`App.tsx` responsibilities:**
1. Loads theme packs from Supabase (async).
2. Computes holiday auto-detection (recomputes at midnight) and applies the matching theme.
3. Applies the active theme as CSS custom properties (oklch tokens); syncs wallpapers from theme packs.
4. Renders the OS chrome: `StatusBar` (top) · `Desktop` (icons) · `WindowManager` (app windows) · `Dock` · `VisitorsWidget` + `SocialsWidget` (sm+ screens) · `KeyboardHelp` overlay.

**Runtime interactions:**
- **Launching apps** → Zustand `openWindow()` from the apps registry (`src/apps/registry/registry.tsx`).
- **Window management** → `store/ui.ts`: open/close/minimize/restore/zoom/move/focus, z-order via `focusStack`, dock magnification.
- **App-to-app navigation** → `src/lib/commandBus.ts` (e.g. Terminal dispatches `resume.open`) — decouples apps from direct imports.
- **Realtime** → Supabase channels: guestbook messages, games list/leaderboards, calendar theme broadcasts.
- **Deep link** → `/hire` (`routes/hire.tsx`) opens the Recruiter app on load.

---

## 5. Features Already Completed

- ✅ **Desktop & window manager** — dock, status bar, draggable icons, resizable windows; minimize/restore/zoom/move/close, genie animation, dock magnification.
- ✅ **Finder** — icon/list/column views, context menus, breadcrumb nav, trash management, search.
- ✅ **Games (Emulator)** — EmulatorJS-based, ROMs from Supabase Storage, realtime game list, **live leaderboards**, CRT/LCD shaders.
- ✅ **Guestbook** — realtime entries (Supabase `postgres_changes`), profanity masking, server-side rate limiting via Edge Functions.
- ✅ **Terminal** — command history + themed portfolio commands (`help`, `about`, `resume`, `socials`, `ls`, `cd`, `cat`, `open`, `clear`).
- ✅ **Synth** — Web Audio synthesizer, 4 presets, ADSR envelopes, filter + reverb, computer-keyboard mapping.
- ✅ **Calendar** — holiday detection and automatic theming, Supabase holiday lookup.
- ✅ **Wallpapers & Themes** — Supabase-backed wallpapers grouped by folder, instant localStorage cache, holiday override.
- ✅ **Recruiter & Resume** — dynamic project cards from Supabase; PDF viewer with download/print/copy-link.
- ✅ **PWA** — offline support, auto-updating service worker, Workbox runtime caching.

---

## 6. Features Partially Completed

- ⚠️ **Explorer (in-OS web browser)** — tab system and Top Sites homepage work, but the whitelist / `TOP_SITES` are **placeholder templates**: `https://yourdomain.com`, `https://github.com/yourhandle`, `https://linkedin.com/in/yourhandle`, and image URLs pointing at `https://YOUR_SUPABASE_URL/storage/...`. Needs real values.
- ⚠️ **iTunes / Spotify** — personal playback mode is conditional on a Spotify token; falls back to a limited mode when unavailable.
- ⚠️ **Control Panel** — mostly routes to other apps (wallpapers, sound, about); dedicated Sound/General/Accounts panes are stubs.
- ⚠️ **Synth MIDI** — `@types/webmidi` is installed (groundwork present) but MIDI input is not yet wired up.

---

## 7. Known Bugs & Technical Debt

- 🐞 **Broken ESLint config** — [`eslint.config.js`](eslint.config.js#L24-L37) appends a stray CommonJS `module.exports = { … }` block **after** the `export default tseslint.config([...])` in an ESM file. It's dead/contradictory config and should be removed.
- 🐞 **Copy/Paste are placeholders** — `StatusBar.tsx` handles `⌘C` / `⌘V` with only `console.log("Copy action (placeholder)")` / `"Paste action (placeholder)"`; no real clipboard behavior.
- ⚠️ **No automated tests** — zero test files; no Vitest/Jest config or runner installed.
- ⚠️ **No Node version pinning** — no `.nvmrc` / `.node-version` and no `engines` field (Vite 7 implies Node 18+).
- ⚠️ **No `.env.example`** — required env vars must be inferred from code.
- ⚠️ **No pre-commit hooks / no CI config** — linting/build consistency isn't enforced; deployment appears handled externally (Vercel).
- ℹ️ **Informational `console.*` noise** — numerous `console.log/warn/error` calls during App init, theme/wallpaper sync, and fetch fallbacks (mostly intentional fallbacks, not failures).
- ℹ️ No `TODO`/`FIXME`/`HACK`/`XXX` markers exist in the code — debt is structural rather than annotated.

---

## 8. Missing Features

- Real **clipboard** support (replace the Copy/Paste placeholders).
- Real **Explorer** site configuration (replace placeholder URLs/whitelist).
- Dedicated **Control Panel panes** (Sound / General / Accounts).
- **MIDI** input for the Synth.
- A genuine **virtual filesystem** behind Finder/Terminal (currently presentational).
- **Tests + CI** (Vitest unit tests, lint/build/Lighthouse pipeline).
- Contributor onboarding: **`.env.example`** and a setup/env section in the README.

---

## 9. How to Run Locally

**Prerequisites:** Node 18+ recommended (Vite 7). No version is pinned.

```bash
npm install
```

**Environment variables** (no `.env.example` ships — create a `.env` with):

```
VITE_SUPABASE_URL=...                          # Supabase project URL
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=...       # Supabase anon/publishable key
VITE_SPOTIFY_CLIENT_ID=...                       # optional — for iTunes/Spotify mode
```

**Scripts** (from `package.json`):

```bash
npm run dev       # Vite dev server (default http://localhost:5173)
npm run build     # tsc -b && vite build  → outputs to /dist
npm run preview   # serve the production build (default http://localhost:4173)
npm run lint      # eslint .
```

> Supabase-backed features (games, guestbook, wallpapers, recruiter projects, realtime visitors) require a configured Supabase project; without it those apps fall back or show empty/error states.

---

## 10. Recommended Next Steps (Priority Order)

1. **Fix `eslint.config.js`** — remove the trailing `module.exports` block so linting is correct and unambiguous. *(Quick, high-confidence.)*
2. **Add `.env.example` + README setup section** — make the project reproducible for a fresh checkout.
3. **Replace Explorer placeholders** — set real Top Sites / whitelist URLs and screenshot asset paths.
4. **Implement or remove Copy/Paste** — wire `⌘C` / `⌘V` to the Clipboard API, or drop the dead handlers.
5. **Add a minimal test setup (Vitest)** — start with store slices (`ui`, `prefs`, `apps`) and the window manager.
6. **Pin Node + add tooling** — `.nvmrc`/`engines`, a `format` script, optional `husky` + `lint-staged`.
7. **Finish Control Panel panes** and, if desired, **wire Synth MIDI** (types are already present).
8. **Add CI** — lint + build + Lighthouse to enforce the documented ≥95 thresholds.
