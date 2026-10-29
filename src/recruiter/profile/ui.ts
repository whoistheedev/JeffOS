import { cn } from "../../lib/utils"

/**
 * Non-component helpers for the recruiter experience. Kept out of
 * primitives.tsx so that file only exports components (React Fast Refresh).
 */

/* ------------------------------- buttons --------------------------------- */
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-hire)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"

/** Primary / secondary / tertiary. All ≥44px tall (Fitts's Law, WCAG 2.5.5). */
export function buttonClass(kind: "primary" | "secondary" | "tertiary", size: "md" | "sm" = "md") {
  const base = cn(
    "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    focusRing,
    size === "md" ? "min-h-11 px-5 text-[15px]" : "min-h-11 px-3.5 text-[13px]"
  )
  if (kind === "primary")
    return cn(
      base,
      "bg-[var(--color-hire)] text-[var(--color-hire-foreground)] shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_1px_2px_rgb(0_0_0/0.25)] hover:brightness-110"
    )
  if (kind === "secondary")
    return cn(base, "border border-foreground/15 bg-background text-foreground hover:border-foreground/30 hover:bg-muted")
  return cn(base, "px-1 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline")
}

/** Smooth-scroll to an element, instant under reduced motion. */
export function scrollToId(id: string) {
  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  const el = document.getElementById(id)
  el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
  // Move focus to the section heading so keyboard/screen-reader users land there too.
  if (el instanceof HTMLElement) {
    const heading = el.querySelector<HTMLElement>("h2")
    if (heading) {
      heading.tabIndex = -1
      heading.focus({ preventScroll: true })
    }
  }
}
