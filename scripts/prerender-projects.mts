/**
 * Prerender crawlable case-study pages.
 *
 * The portfolio is a client-rendered SPA, so search engines and social/link
 * crawlers that don't run JS see only the empty `#root` shell. This script runs
 * AFTER `vite build` and emits one static, fully-rendered HTML page per case
 * study at `dist/projects/<slug>/index.html` — real content + per-page metadata
 * (title, description, canonical, Open Graph, Twitter, JSON-LD) baked into the
 * body. It also regenerates `dist/sitemap.xml` with every route + <lastmod>.
 *
 * Source of truth is `src/recruiter/content.ts` (pure data, no React) — the same
 * copy the live app renders, so these pages never drift from RecruiterMode.
 *
 * Run: tsx scripts/prerender-projects.mts   (wired as a build step in package.json)
 */
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { FEATURED_WORK, IDENTITY, CONTACT } from "../src/recruiter/content.ts"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..")
const DIST = resolve(ROOT, "dist")
const ORIGIN = "https://whoisjeff.dev"

/** Minimal HTML-escape for text interpolated into markup/attributes. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

type Work = (typeof FEATURED_WORK)[number]

function page(w: Work): string {
  const url = `${ORIGIN}/projects/${w.slug}/`
  const title = `${w.name} — ${IDENTITY.name} | Case Study`
  // Prefer the fuller 130–160 char SERP description; fall back to the short
  // card summary. (abstract in JSON-LD stays the short summary.)
  const desc = w.seoDescription ?? w.summary
  // The SPA's "/" defaults to RecruiterMode (the full portfolio) — see
  // RootRouter. There's no per-case-study deep link yet, so the CTA lands on
  // the portfolio front door, which is exactly what the button promises.
  const appHref = `/`

  const ld = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: w.name,
    headline: w.name,
    abstract: w.summary,
    url,
    keywords: w.tech.join(", "),
    author: {
      "@type": "Person",
      name: IDENTITY.name,
      url: ORIGIN + "/",
      jobTitle: IDENTITY.title,
      sameAs: [CONTACT.github, CONTACT.linkedin],
    },
  }

  const section = (label: string, body: string) =>
    `<section class="block"><h2>${esc(label)}</h2><p>${esc(body)}</p></section>`

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<link rel="canonical" href="${url}" />
<meta name="theme-color" content="#0a0e14" />
<link rel="icon" href="/favicon.ico" sizes="any" />

<meta property="og:type" content="article" />
<meta property="og:site_name" content="JeffOS" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${esc(w.name)} — ${esc(IDENTITY.name)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:image" content="${ORIGIN}/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(w.name)} — ${esc(IDENTITY.name)}" />
<meta name="twitter:description" content="${esc(desc)}" />
<meta name="twitter:image" content="${ORIGIN}/og-image.png" />

<script type="application/ld+json">${JSON.stringify(ld)}</script>

<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{
    font-family:-apple-system,'Helvetica Neue',Helvetica,Arial,sans-serif;
    background:linear-gradient(160deg,#0a0e14 0%,#10151f 60%,#1a2230 100%);
    color:#e7eefb;line-height:1.6;min-height:100vh;
  }
  .wrap{max-width:760px;margin:0 auto;padding:72px 24px 96px}
  .dots{display:flex;gap:9px;margin-bottom:28px}
  .dot{width:13px;height:13px;border-radius:50%}
  .r{background:#ff5f57}.y{background:#febc2e}.g{background:#28c840}
  .kicker{font-size:13px;letter-spacing:.28em;text-transform:uppercase;color:#8fa3bf;font-weight:600;margin-bottom:14px}
  h1{font-size:clamp(30px,6vw,46px);font-weight:700;letter-spacing:-1px;line-height:1.08;color:#fff}
  .summary{margin-top:16px;font-size:19px;color:#aebbcf;max-width:60ch}
  .tech{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}
  .tag{font-size:13px;font-family:'SF Mono',Menlo,monospace;color:#cfe0ff;background:rgba(94,160,255,.12);border:1px solid rgba(94,160,255,.25);padding:4px 11px;border-radius:14px}
  .block{margin-top:34px}
  .block h2{font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:#5ea0ff;font-weight:700;margin-bottom:8px}
  .block p{color:#c4d0e2;font-size:17px;max-width:64ch}
  .cta{display:inline-flex;align-items:center;gap:8px;margin-top:48px;font-weight:600;font-size:16px;
    color:#0a0e14;background:linear-gradient(#eaf2ff,#bcd4ff);padding:13px 22px;border-radius:24px;text-decoration:none}
  .cta:hover{filter:brightness(1.05)}
  .home{display:inline-block;margin-top:20px;margin-left:14px;color:#8fa3bf;text-decoration:none;font-size:15px}
  .home:hover{color:#cfe0ff}
  footer{margin-top:56px;padding-top:24px;border-top:1px solid rgba(255,255,255,.08);color:#7e8da3;font-size:14px}
  footer a{color:#9db4d6;text-decoration:none}
</style>
</head>
<body>
  <main class="wrap">
    <div class="dots"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span></div>
    <p class="kicker">Case Study · ${esc(IDENTITY.name)}</p>
    <h1>${esc(w.name)}</h1>
    <p class="summary">${esc(w.summary)}</p>
    <div class="tech">${w.tech.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>

    ${section("Problem", w.problem)}
    ${section("Constraints", w.constraints)}
    ${section("Architecture", w.architecture)}
    ${section("Solution", w.solution)}
    ${section("Outcome", w.outcome)}

    <a class="cta" href="${esc(appHref)}">Open the full portfolio → JeffOS</a>
    <a class="home" href="/">← All work</a>

    <footer>
      ${esc(IDENTITY.name)} · ${esc(IDENTITY.title)} ·
      <a href="${esc(CONTACT.github)}">GitHub</a> ·
      <a href="${esc(CONTACT.linkedin)}">LinkedIn</a>
    </footer>
  </main>
</body>
</html>
`
}

function buildSitemap(now: string): string {
  const urls = [
    { loc: `${ORIGIN}/`, priority: "1.0", changefreq: "weekly" },
    ...FEATURED_WORK.map((w) => ({
      loc: `${ORIGIN}/projects/${w.slug}/`,
      priority: "0.8",
      changefreq: "monthly",
    })),
  ]
  const body = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
    )
    .join("\n")
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}

// --- emit ---------------------------------------------------------------
const now = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

for (const w of FEATURED_WORK) {
  const dir = resolve(DIST, "projects", w.slug)
  mkdirSync(dir, { recursive: true })
  writeFileSync(resolve(dir, "index.html"), page(w), "utf8")
}

writeFileSync(resolve(DIST, "sitemap.xml"), buildSitemap(now), "utf8")

console.log(
  `✓ prerendered ${FEATURED_WORK.length} project pages + sitemap (${FEATURED_WORK.length + 1} urls)`,
)
