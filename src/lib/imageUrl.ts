/**
 * Supabase Storage image-URL helpers (Phase 1 perf).
 *
 * The public OBJECT endpoint (`/storage/v1/object/public/...`) serves originals
 * with `cache-control: no-cache` (CDN bypass) — measured. The image RENDER
 * endpoint (`/storage/v1/render/image/public/...`) resizes/transcodes AND
 * returns a cacheable `cache-control: max-age=...`. Routing display images
 * through render therefore gives BOTH a smaller payload and real CDN/browser
 * caching.
 *
 * Measured example: themes/cny.jpg 5.26 MB → ~248 KB at width=1280 (≈21×),
 * and cacheable instead of no-cache.
 *
 * `renderImage` is a safe no-op for non-Supabase URLs (e.g. the dummyimage
 * fallback thumb) and for URLs already pointing at the render endpoint.
 */

const OBJECT_PUBLIC = "/storage/v1/object/public/"
const RENDER_PUBLIC = "/storage/v1/render/image/public/"

export type RenderOpts = {
  width?: number
  height?: number
  quality?: number // 20–100
  resize?: "cover" | "contain" | "fill"
}

export function renderImage(url: string | undefined | null, opts: RenderOpts = {}): string {
  if (!url) return ""
  // Only transform Supabase public-object URLs; leave everything else untouched.
  if (!url.includes(OBJECT_PUBLIC)) return url

  const base = url.replace(OBJECT_PUBLIC, RENDER_PUBLIC)
  const params = new URLSearchParams()
  if (opts.width) params.set("width", String(opts.width))
  if (opts.height) params.set("height", String(opts.height))
  params.set("quality", String(opts.quality ?? 70))
  if (opts.resize) params.set("resize", opts.resize)
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}

/**
 * Wallpaper sized for display — the WHOLE picture is always preserved.
 *
 * We request the render endpoint with `resize: "contain"` and a single bounded
 * dimension (the longer screen edge, capped), so the image keeps its own aspect
 * ratio and is never cropped server-side. The Desktop/MobileShell then paint it
 * with `background-size: contain` so the full picture is visible on every
 * screen, with the desktop backdrop colour filling any letter/pillar-box bands.
 *
 * (Earlier approaches used `cover`, which cropped tall/wide wallpapers — a
 * portrait holiday wallpaper on a wide desktop got heavily cut off. Per product
 * decision the full image must always be visible, so we use contain.)
 */
export function wallpaperUrl(url: string | undefined | null): string {
  if (!url) return ""
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280
  const vh = typeof window !== "undefined" ? window.innerHeight : 800
  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1
  // Bound only the WIDTH (DPR-aware, capped). With width-only the render endpoint
  // scales proportionally and preserves the SOURCE aspect ratio — it does NOT pad
  // to a square (passing width===height would letterbox the image into a square).
  // The Desktop/MobileShell then paint it with `background-size: contain`, so the
  // whole picture is visible at the screen's own aspect, never cropped.
  const width = Math.min(Math.round(Math.max(vw, vh) * dpr), 1920)
  return renderImage(url, { width, quality: 78 })
}

/** Game-card thumbnail. */
export function thumbUrl(url: string | undefined | null): string {
  return renderImage(url, { width: 384, quality: 70, resize: "cover" })
}
