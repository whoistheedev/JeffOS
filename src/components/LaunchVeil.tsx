import { useEffect, useState } from "react"

/**
 * LaunchVeil — a brief fade-through-black veil shown each time the user enters
 * JeffOS from Recruiter Mode. It softens the otherwise abrupt cut from the 2026
 * minimalist Recruiter document to the 2005 Aqua desktop, and reads as an
 * intentional "Starting JeffOS…" beat rather than a jarring swap.
 *
 * Distinct from the first-visit Tiger boot screen (components/BootLoader.tsx):
 * the boot plays once and is the headline first impression; this veil plays on
 * *every* launch (including returns, where the boot is skipped) and is short.
 * On a first visit the boot screen (z-9000) sits above this, so they don't
 * conflict.
 *
 * Self-dismissing: fades in, holds briefly, fades out, then unmounts.
 */
export default function LaunchVeil() {
  const [opacity, setOpacity] = useState(1)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const fade = setTimeout(() => setOpacity(0), 450) // hold, then fade out
    const done = setTimeout(() => setGone(true), 1050) // unmount after fade
    return () => {
      clearTimeout(fade)
      clearTimeout(done)
    }
  }, [])

  if (gone) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[8000] flex items-center justify-center"
      style={{ background: "#0b0e14", opacity, transition: "opacity 0.6s ease" }}
    >
      <span className="text-[13px] font-medium tracking-wide text-white/70">Starting JeffOS…</span>
    </div>
  )
}
