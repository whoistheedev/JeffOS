import { useEffect, useState } from "react"

/**
 * 🍏 Tiger boot screen.
 *
 * Plays the authentic Tiger boot sequence (grey Apple on light grey + spinning
 * gear + startup chime) the FIRST time a visitor enters JeffOS, then renders its
 * children. Seen-state is remembered in localStorage so it plays once.
 *
 * IMPORTANT: this gates **JeffOS only**, not the whole app. Recruiter Mode is
 * the default first paint and the fast hire path — it must NOT sit behind a ~3s
 * boot sequence (a conversion risk, especially on mobile). So RootRouter mounts
 * this around the JeffOS branch, not around the entire application.
 */
export default function BootLoader({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<"boot" | "fadein" | "done">("done")

  useEffect(() => {
    let seen = false
    try {
      seen = localStorage.getItem("hasSeenBootScreen") === "true"
    } catch {
      // Safari private mode can throw on localStorage — treat as not-seen and
      // never let storage access block rendering.
      seen = false
    }
    if (seen) return // RETURN IMMEDIATELY for returning visitors

    setPhase("boot") // only for first-time JeffOS entry

    // Tiger startup chime — reuse the existing app-open swell (the most
    // chime-like sound in the bundle). Best-effort: browsers block autoplay
    // before a user gesture, so this is wrapped to fail silently. Because the
    // boot now plays on the JeffOS opt-in (a click/tap on "Launch JeffOS"),
    // there has already been a user gesture, so the chime typically plays.
    try {
      const chime = new Audio("/sounds/app-open.mp3")
      chime.volume = 0.6
      void chime.play().catch(() => {
        /* autoplay blocked — no chime, no error */
      })
    } catch {
      /* ignore */
    }

    // Schedule the transitions immediately; never gate boot timing on any async
    // work (a hung fetch must not freeze the boot screen).
    const t1 = setTimeout(() => setPhase("fadein"), 2200)
    const t2 = setTimeout(() => {
      setPhase("done")
      try {
        localStorage.setItem("hasSeenBootScreen", "true")
      } catch {
        /* ignore storage failures */
      }
    }, 3000)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  if (phase === "done") return <>{children}</>

  // Authentic Tiger boot: plain light-grey background, centered grey Apple,
  // and a spinning gear/pinwheel below it. No panel, no blue, no text.
  return (
    <div
      className="fixed inset-0 z-[9000] flex flex-col items-center justify-center"
      style={{ background: "#cdced1", transition: "opacity 0.6s ease", opacity: phase === "fadein" ? 0 : 1 }}
    >
      {/* Grey Apple logo (mask the existing apple art to solid grey). */}
      <div
        aria-label="Apple"
        style={{
          width: 90,
          height: 110,
          background: "#3a3a3c",
          WebkitMaskImage: "url(/apple-big.png)",
          maskImage: "url(/apple-big.png)",
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
      />
      {/* Tiger spinning gear/pinwheel */}
      <div className="mt-10" aria-hidden>
        <svg width="32" height="32" viewBox="0 0 32 32" className="boot-gear">
          {Array.from({ length: 12 }).map((_, i) => (
            <rect
              key={i}
              x="15"
              y="3"
              width="2"
              height="7"
              rx="1"
              fill="#6b6b6e"
              opacity={0.25 + (i / 12) * 0.75}
              transform={`rotate(${i * 30} 16 16)`}
            />
          ))}
        </svg>
      </div>
    </div>
  )
}
