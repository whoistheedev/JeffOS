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
 * Wallpaper URL for display.
 *
 * Two modes:
 *  - `crop: true` (DESKTOP): the render endpoint crops to the CURRENT viewport
 *    aspect (width + height, `resize: cover`). Painting with CSS `cover` then
 *    fills edge-to-edge with a WELL-COMPOSED crop — no "tiny zoomed band" that a
 *    portrait source would produce if scaled by width alone. The desktop always
 *    fills (no side gaps).
 *  - default (MOBILE): keep the NATIVE aspect (width-only render, no square
 *    padding) so the mobile smart fit (`useWallpaperFit`) can choose cover vs.
 *    contain per image and both render correctly.
 */
export function wallpaperUrl(url: string | undefined | null, opts: { crop?: boolean } = {}): string {
  if (!url) return ""
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280
  const vh = typeof window !== "undefined" ? window.innerHeight : 800
  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1

  if (opts.crop) {
    // Crop to the viewport aspect, longer edge capped at 1920.
    const aspect = vw / vh
    let width = Math.round(vw * dpr)
    let height = Math.round(vh * dpr)
    const cap = 1920
    if (width > cap || height > cap) {
      if (aspect >= 1) { width = cap; height = Math.round(cap / aspect) }
      else { height = cap; width = Math.round(cap * aspect) }
    }
    return renderImage(url, { width, height, quality: 78, resize: "cover" })
  }

  // Native aspect (mobile smart-fit).
  const width = Math.min(Math.round(Math.max(vw, vh) * dpr), 1920)
  return renderImage(url, { width, quality: 78 })
}

/** Game-card thumbnail. */
export function thumbUrl(url: string | undefined | null): string {
  return renderImage(url, { width: 384, quality: 70, resize: "cover" })
}
