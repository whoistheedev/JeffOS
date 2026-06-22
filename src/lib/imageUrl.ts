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
 * Wallpaper sized for display, at its NATIVE aspect ratio.
 *
 * Bounds only the WIDTH (DPR-aware, capped) so the render endpoint scales
 * proportionally and never pads the image to a square. The Desktop/MobileShell
 * then choose the CSS fit per-image via `useWallpaperFit`:
 *   - `cover`   — fill the screen (default; immersive, Tiger-authentic),
 *   - `contain` — show the whole picture on the solid Tiger blue fill, only when
 *     the image aspect is wildly different from the screen (e.g. a portrait
 *     holiday wallpaper on a wide desktop) so the subject isn't cropped.
 * Because the source keeps its native aspect, BOTH modes render correctly with
 * no "tiny zoomed band" bug.
 */
export function wallpaperUrl(url: string | undefined | null): string {
  if (!url) return ""
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280
  const vh = typeof window !== "undefined" ? window.innerHeight : 800
  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1
  const width = Math.min(Math.round(Math.max(vw, vh) * dpr), 1920)
  return renderImage(url, { width, quality: 78 })
}

/** Game-card thumbnail. */
export function thumbUrl(url: string | undefined | null): string {
  return renderImage(url, { width: 384, quality: 70, resize: "cover" })
}
