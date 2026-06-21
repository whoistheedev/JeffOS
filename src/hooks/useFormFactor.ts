import { useEffect, useState } from "react"

/**
 * The three presentation form factors JeffOS targets.
 * @see MOBILE_STRATEGY.md §1 — detect by capability, not width alone.
 */
export type FormFactor = "desktop" | "tablet" | "mobile"

/**
 * Compute the current form factor from viewport width, pointer capability and
 * orientation. Mirrors the rules in MOBILE_STRATEGY.md §1:
 *
 *   mobile  = (max-width: 767px)  OR (pointer:coarse AND max-width:1023px AND portrait)
 *   tablet  = (768–1023px)        OR (pointer:coarse AND min-width:768px AND landscape)
 *   desktop = (min-width:1024px)  AND (pointer:fine OR hover:hover)
 *   landscape phone (coarse, short height) → MOBILE
 *
 * SSR-safe: returns "desktop" when `window`/`matchMedia` is unavailable, so the
 * default (and any ambiguous) case preserves the existing desktop experience.
 */
export function computeFormFactor(): FormFactor {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "desktop"
  }

  const width = window.innerWidth
  const height = window.innerHeight
  const coarse = window.matchMedia("(pointer: coarse)").matches
  const fineOrHover =
    window.matchMedia("(pointer: fine)").matches ||
    window.matchMedia("(hover: hover)").matches
  const portrait = height >= width

  // Landscape phone: coarse pointer + short viewport → treat as mobile.
  const isLandscapePhone = coarse && !portrait && height < 500

  // Mobile
  if (width < 768) return "mobile"
  if (coarse && width < 1024 && portrait) return "mobile"
  if (isLandscapePhone) return "mobile"

  // Tablet
  if (width >= 768 && width < 1024) return "tablet"
  if (coarse && width >= 768 && !portrait) return "tablet"

  // Desktop — large screen with a precise pointer / hover.
  if (width >= 1024 && fineOrHover) return "desktop"

  // Fallback: large coarse-only screen (e.g. big touch display) → tablet,
  // otherwise desktop. Keeps the default biased toward the safe desktop path.
  return coarse ? "tablet" : "desktop"
}

/**
 * Reactive form-factor hook. Re-evaluates on resize and orientation change so
 * foldables / rotation are handled correctly (fixes the "read innerWidth once at
 * render" bug noted in MOBILE_STRATEGY.md §9). The returned value only changes
 * when the form-factor *bucket* changes, so consumers don't re-render on every
 * pixel of a resize.
 */
export function useFormFactor(): FormFactor {
  const [formFactor, setFormFactor] = useState<FormFactor>(computeFormFactor)

  useEffect(() => {
    const update = () => {
      const next = computeFormFactor()
      setFormFactor((prev) => (prev === next ? prev : next))
    }

    update()
    window.addEventListener("resize", update)
    window.addEventListener("orientationchange", update)
    return () => {
      window.removeEventListener("resize", update)
      window.removeEventListener("orientationchange", update)
    }
  }, [])

  return formFactor
}
