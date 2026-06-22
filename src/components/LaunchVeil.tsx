import { useEffect, useState } from "react"
import { bootedThisSession } from "./BootLoader"

/**
 * LaunchVeil — a brief fade-through-black "Starting JeffOS…" beat that softens
 * the cut from the minimalist Recruiter document to the Aqua desktop.
 *
 * Shown ONLY on launches where the Tiger boot screen did NOT play (return
 * visits). On a FIRST launch the boot screen already covers the entry beat, so
 * showing the veil too would double-gate (boot ~3s + veil ~1s over the visible
 * OS). `bootedThisSession` (set by BootLoader) tells us which case we're in.
 *
 * Self-dismissing: fades in, holds briefly, fades out, then unmounts.
 */
export default function LaunchVeil() {
  // Skip entirely if the boot screen played this session (no double-gate).
  const bootPlaying = bootedThisSession

  const [opacity, setOpacity] = useState(1)
  const [gone, setGone] = useState(bootPlaying) // start "gone" when boot is playing

  useEffect(() => {
    if (bootPlaying) return // boot covers the entry beat; no veil
    const fade = setTimeout(() => setOpacity(0), 450) // hold, then fade out
    const done = setTimeout(() => setGone(true), 1050) // unmount after fade
    return () => {
      clearTimeout(fade)
      clearTimeout(done)
    }
  }, [bootPlaying])

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
