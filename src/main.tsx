import React, { useEffect, useState } from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useStore } from "./store"
import { loadGlobalDefaultWallpaper } from "./store/prefs"
import "./index.css"

const queryClient = new QueryClient()

/* 🎵 Global click sound provider */
function GlobalSoundProvider({ children }: { children: React.ReactNode }) {
  const playSystemClick = useStore((s) => s.playSystemClick)
  const prefs = useStore((s) => s.prefs)
  useEffect(() => {
    const handler = () => prefs.soundOn && playSystemClick()
    document.addEventListener("click", handler)
    return () => document.removeEventListener("click", handler)
  }, [prefs.soundOn, playSystemClick])
  return <>{children}</>
}

/* 🍏 Boot Screen for first-time visitors only */
function BootLoader({ children }: { children: React.ReactNode }) {
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

    setPhase("boot") // only for first-time visitors

    // CRITICAL: the boot-screen timing must NOT be gated on the wallpaper
    // fetch. Previously we `await`ed loadGlobalDefaultWallpaper() before
    // scheduling these timers, so a hung/slow Supabase request (seen on
    // Safari) left the boot screen stuck forever → white/frozen screen.
    // Schedule the transitions immediately; load the wallpaper in the
    // background (best-effort).
    const t1 = setTimeout(() => setPhase("fadein"), 2200)
    const t2 = setTimeout(() => {
      setPhase("done")
      try {
        localStorage.setItem("hasSeenBootScreen", "true")
      } catch {
        /* ignore storage failures */
      }
    }, 3000)

    void loadGlobalDefaultWallpaper().catch(() => {
      /* best-effort; never blocks the boot sequence */
    })

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  if (phase === "done") return <>{children}</>

  // Authentic Tiger boot: plain light-grey background, centered grey Apple,
  // and a spinning gear/pinwheel below it. No panel, no blue, no text.
  // TODO(asset): play the Tiger startup chime here — needs a chime audio file.
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
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

/* 💻 Mount Application */
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <GlobalSoundProvider>
        <BootLoader>
          <App />
        </BootLoader>
      </GlobalSoundProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
