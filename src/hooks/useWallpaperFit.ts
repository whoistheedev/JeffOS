import { useEffect, useState } from "react"

export type WallpaperFit = "cover" | "contain"

/**
 * Decide how a wallpaper should sit on the current screen — the "smart per-image"
 * rule a high-level designer would pick:
 *
 *   - `cover`  (default): the image aspect is reasonably close to the screen, so
 *     fill edge-to-edge and let the small overflow crop. This is the immersive,
 *     Tiger-authentic default — a wallpaper's job is to fill the desktop.
 *   - `contain`: the image aspect is *wildly* different from the screen (e.g. a
 *     portrait 1440×2160 holiday wallpaper on a wide desktop). Cropping would
 *     cut the subject, so show the WHOLE picture centered on the solid Tiger
 *     "Aqua Blue" fill instead.
 *
 * "Wildly different" = the image and screen aspect ratios differ by more than
 * `tolerance` (as a ratio). Default 1.4 ≈ a 40% mismatch, which keeps normal
 * landscape wallpapers on `cover` and only flips clearly-portrait art to
 * `contain` on a landscape screen (and vice-versa).
 *
 * Measures the natural size of the already-decoded URL; returns `cover` until
 * measured (the safe, common case) and updates once the image loads.
 */
export function useWallpaperFit(url: string | undefined | null, tolerance = 1.4): WallpaperFit {
  const [fit, setFit] = useState<WallpaperFit>("cover")

  useEffect(() => {
    if (!url || typeof window === "undefined") {
      setFit("cover")
      return
    }
    let cancelled = false
    const img = new Image()
    const decide = () => {
      if (cancelled || !img.naturalWidth || !img.naturalHeight) return
      const imgAspect = img.naturalWidth / img.naturalHeight
      const screenAspect = window.innerWidth / Math.max(1, window.innerHeight)
      // Ratio of the two aspects, always >= 1.
      const mismatch = Math.max(imgAspect / screenAspect, screenAspect / imgAspect)
      setFit(mismatch > tolerance ? "contain" : "cover")
    }
    img.src = url
    img.decode?.().then(decide).catch(decide)
    img.onload = decide

    // Re-evaluate on resize/rotation (the screen aspect changes).
    const onResize = () => decide()
    window.addEventListener("resize", onResize)
    window.addEventListener("orientationchange", onResize)
    return () => {
      cancelled = true
      window.removeEventListener("resize", onResize)
      window.removeEventListener("orientationchange", onResize)
    }
  }, [url, tolerance])

  return fit
}
