---
name: run-jeffos
description: Launch and drive the JeffOS app (Vite + React SPA) to verify changes in the real UI. Use when asked to run, start, screenshot, or visually verify JeffOS, or to confirm a change works in the actual app (recruiter projects loading, guestbook posting, app windows). Handles the Vite dev server, the headless-browser driver setup, and the desktop-vs-dock launch quirks.
---

# Run JeffOS

JeffOS is a **browser-driven Vite + React 19 SPA** (a macOS-style desktop OS).
"Running" it means launching the dev server and driving the desktop in a real
browser — opening app windows, interacting, and **looking at screenshots**. A
blank frame is a failed launch.

It talks to a **live Supabase backend**, so the local `.env` must be present
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`). Verified actions
hit the live DB — clean up any test rows you create.

## Prerequisites (one-time)

No browser driver ships with the repo. Install Playwright + Chromium **into the
project** (scripts must resolve `playwright` from the project's `node_modules`,
so keep driver scripts in the repo root, not `/tmp`):

```sh
npm i -D playwright@latest
npx playwright install chromium
```

Confirm `.env` exists at repo root (needed for Supabase):
```sh
grep -oE 'VITE_[A-Z_]+' .env | sort -u   # expect the two VITE_SUPABASE_* vars
```

## Launch the dev server

Run in the background on a fixed port; poll the log until ready (do NOT block on
`sleep`):

```sh
npm run dev -- --port 5174 > /tmp/jeffos-dev.log 2>&1 &
# then poll:
for i in $(seq 1 20); do grep -q 'ready in' /tmp/jeffos-dev.log && break; sleep 0.5; done
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5174/   # expect 200
```

Stop it when done: `pkill -f "vite --port 5174"`.

## Launch quirks (the part that wastes time if rediscovered)

- **Dock apps** (Finder, **iguest**=Guestbook, **igames**=Games, iwallpapers,
  iweb, Terminal) launch with a **single click** on their dock button. The
  accessible name is `"Open <id>"`, e.g. `getByRole('button', {name: /Open iguest/i})`.
- **Desktop icons** (notably **iprojects**=Recruiter, Synth, Calendar, iTunes,
  Buy Me Coffee) are `IMG` elements that need a **double-click** to launch.
  At 1440×900 the `iprojects` icon centers near **(1306, 376)** — double-click
  the coordinates, or `dblclick` the `IMG[alt="iprojects"]` bounding-box center.
- Let startup run ~2–2.5s after load before interacting (theme init + first fetches).
- Expect harmless boot noise: ~8 console `400`s from theme wallpaper HEAD-probes
  (one theme has no file → "Loaded 7/8") and a `409` on the `visits` upsert.
  These are pre-existing (audit §S3), NOT launch failures.

## Driver skeleton (Playwright, ESM, run from repo root)

```js
// drive.mjs  — keep in repo root so `playwright` resolves
import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const net = [];
page.on('response', r => {
  const u = r.url();
  if (u.includes('/rest/v1/') || u.includes('/functions/v1/')) net.push(`${r.status()} ${r.request().method()} ${u.split('.co')[1]||u}`);
});
await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
await page.screenshot({ path: '/tmp/jeffos-load.png' });   // LOOK at this
// ... interactions ...
await browser.close();
```
Run: `node drive.mjs`. Then **Read the PNG** to confirm the UI actually rendered.

## Representative drives (smoke tests)

### Recruiter — projects load (RLS-critical read path)
```js
await page.mouse.dblclick(1306, 376);          // iprojects desktop icon
await page.waitForTimeout(4000);
// expect: 200 GET /rest/v1/projects?select=*&active=eq.true&order=id.asc
// expect: project names render (e.g. "Mac Portfolio OS", "Slippiggy")
```

### Guestbook — post via the guestbook-add Edge Function
```js
await page.getByRole('button', { name: /Open iguest/i }).click();
await page.waitForTimeout(2500);
await page.getByPlaceholder('Name').fill('PhaseTest');
await page.getByPlaceholder('Message…').fill('check ' + Date.now());  // Message is an INPUT, not textarea
await page.waitForTimeout(2300);               // guestbook-add enforces a 2s anti-bot delay
await page.getByRole('button', { name: 'Send' }).click();
await page.waitForTimeout(4000);
// expect: 200 POST /functions/v1/guestbook-add  + the message appears in the wall
// CLEANUP: delete the test row afterwards (it hits the live DB)
```

### Games
The current client does **NOT** call the `game-start`/`game-submit` Edge
Functions (zero references in `src/`); the games app is EmulatorJS ROM play only.
There is no UI path to drive the leaderboard backend — verify those at the DB
layer instead if needed.

## Cleanup checklist
- Delete any guestbook/test rows created against the live DB.
- `pkill -f "vite --port 5174"`.
- Remove temporary `drive*.mjs` scripts from the repo root.
- `playwright` stays in devDependencies (reusable for future runs/verification).
