/**
 * Prerender the homepage (RecruiterMode) into static HTML.
 *
 * The portfolio is a client-rendered SPA: a no-JS crawler that fetches `/` sees
 * only the empty `#root` shell. RecruiterMode is too large/runtime-heavy to
 * `renderToString` in plain Node, so we snapshot the REAL rendered output with a
 * headless browser (Puppeteer's bundled Chromium — works in Vercel CI):
 *
 *   1. Serve the freshly-built `dist/` over a local HTTP origin (module scripts
 *      and the service worker need a real origin, not file://).
 *   2. Load `/`, wait for RecruiterMode's content to paint (it renders
 *      synchronously from the static content.ts — no data fetch gates first
 *      paint), and read `document.documentElement.outerHTML`.
 *   3. Write that hydrated markup back over `dist/index.html`. The original
 *      <script type="module"> tags are preserved, so the app still boots and
 *      re-renders for full interactivity (React 19 createRoot replaces #root,
 *      so there's no hydration-mismatch risk) — we've only added a real,
 *      crawlable static body and kept all the <head> metadata.
 *
 * Run AFTER `vite build`. Wired into `npm run build`. If anything fails, it logs
 * a warning and leaves the shell index.html untouched — the build never breaks.
 */
import { createServer } from "node:http"
import { readFile, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { resolve, dirname, join, extname } from "node:path"
import { fileURLToPath } from "node:url"
import type { Browser } from "puppeteer-core"

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(__dirname, "..", "dist")
const PORT = 4317
const ORIGIN = `http://localhost:${PORT}`

const ON_VERCEL = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION)

/** First existing path wins — used to find a local system Chrome/Chromium. */
function findLocalChrome(): string | undefined {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_PATH,
    // macOS
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    // Linux
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean) as string[]
  return candidates.find((p) => existsSync(p))
}

/**
 * Launch a headless browser via puppeteer-core, picking the right Chromium:
 *
 * - On Vercel/CI the build image lacks Chromium's system shared libraries
 *   (libnspr4.so, libnss3, …) — a plain download fails with "error while
 *   loading shared libraries". @sparticuz/chromium ships a self-contained
 *   Chromium built for exactly this.
 * - Locally we drive the system Google Chrome / Chromium directly (no large
 *   browser download — keeps the dep footprint small).
 */
async function launchBrowser(): Promise<Browser> {
  const { default: puppeteerCore } = await import("puppeteer-core")

  if (ON_VERCEL) {
    const { default: chromium } = await import("@sparticuz/chromium")
    return puppeteerCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    })
  }

  const executablePath = findLocalChrome()
  if (!executablePath) {
    throw new Error(
      "no local Chrome/Chromium found — set PUPPETEER_EXECUTABLE_PATH or install Google Chrome",
    )
  }
  return puppeteerCore.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  })
}

// In CI (Vercel sets CI/VERCEL), shipping the empty SPA shell is a real SEO
// regression — fail the build so a broken snapshot is caught, not silently
// deployed. Locally, a dev without a working browser shouldn't be blocked, so
// we only warn. Override with PRERENDER_STRICT=1 / =0 to force either way.
const STRICT = process.env.PRERENDER_STRICT
  ? process.env.PRERENDER_STRICT === "1"
  : Boolean(process.env.CI || process.env.VERCEL)

/** Warn (local) or throw (CI/strict) — keeps the failure policy in one place. */
function failOrWarn(message: string): void {
  if (STRICT) throw new Error(message)
  console.warn("⚠ prerender-home: " + message + " (non-fatal — not in CI)")
}

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".mp3": "audio/mpeg",
  ".txt": "text/plain",
  ".xml": "application/xml",
}

/** Minimal static file server over dist/, SPA-fallback to index.html. */
function serveDist() {
  return createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent((req.url || "/").split("?")[0])
      let filePath = join(DIST, urlPath)
      if (urlPath.endsWith("/")) filePath = join(filePath, "index.html")
      if (!existsSync(filePath) || extname(filePath) === "") {
        filePath = join(DIST, "index.html")
      }
      const body = await readFile(filePath)
      res.setHeader("Content-Type", MIME[extname(filePath)] || "application/octet-stream")
      res.end(body)
    } catch {
      res.statusCode = 404
      res.end("not found")
    }
  })
}

async function main() {
  const server = serveDist()
  await new Promise<void>((r) => server.listen(PORT, r))

  let browser: Browser | undefined
  try {
    browser = await launchBrowser()
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 900 })

    // Surface any page error so a broken render is visible in CI logs (non-fatal).
    page.on("pageerror", (e) => console.warn("  page error:", e.message))

    await page.goto(ORIGIN + "/", { waitUntil: "networkidle0", timeout: 30000 })

    // RecruiterMode paints the keyword headline as the page <h1>. Wait for it so
    // we snapshot a fully-rendered tree, not a mid-mount frame.
    await page.waitForSelector("#root h1", { timeout: 15000 })

    const html = await page.evaluate(() => document.documentElement.outerHTML)

    // Sanity: only overwrite if the snapshot actually captured a real render.
    const rootIdx = html.indexOf('<div id="root">')
    const bodyEnd = html.lastIndexOf("</body>")
    const rendered = rootIdx >= 0 && bodyEnd > rootIdx ? html.slice(rootIdx, bodyEnd) : ""
    const hasContent =
      rendered.length > 1000 &&
      (rendered.includes("Revenue Cycle") || rendered.includes("Senior Software Engineer"))
    if (!hasContent) {
      failOrWarn(
        `rendered #root looked empty (${rendered.length} chars) — leaving shell index.html as-is`,
      )
      return
    }

    const doc = html.startsWith("<!doctype") ? html : "<!doctype html>\n" + html
    await writeFile(resolve(DIST, "index.html"), doc, "utf8")
    console.log(`✓ prerendered homepage (RecruiterMode) — #root body: ${rendered.length} chars`)
  } finally {
    await browser?.close()
    server.close()
  }
}

try {
  await main()
} catch (err) {
  const msg = (err as Error)?.message ?? String(err)
  if (STRICT) {
    // In CI, a failed homepage snapshot is fatal — don't ship the empty shell.
    console.error("✖ prerender-home: snapshot failed in strict/CI mode — failing the build.\n  " + msg)
    process.exit(1)
  }
  console.warn("⚠ prerender-home: snapshot failed — leaving shell index.html as-is. " + msg)
}
