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

/* 🍏 Authentic Mac OS X Tiger Boot Screen */
function BootLoader({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<"boot" | "flash" | "fadein" | "done">("boot")

  useEffect(() => {
    ;(async () => {
      try {
        await loadGlobalDefaultWallpaper()
        // show boot screen for ~2 s, then flash white, then fade desktop in
        setTimeout(() => {
          setPhase("flash")
          setTimeout(() => setPhase("fadein"), 400)     // white flash
          setTimeout(() => setPhase("done"), 1200)      // wallpaper fade-in done
        }, 2200)
      } catch {
        setPhase("done")
      }
    })()
  }, [])

  // --- Boot / flash phases ---
  if (phase === "boot" || phase === "flash") {
    return (
      <div
        className={`fixed inset-0 flex items-center justify-center transition-colors duration-500 ${
          phase === "flash" ? "bg-white" : "bg-[#3B5998]"
        }`}
      >
        {/* Boot box */}
        <div className="w-[380px] rounded-md border border-[#b8b8b8] shadow-[0_3px_8px_rgba(0,0,0,0.45)] bg-gradient-to-b from-[#f0f0f0] to-[#d7d7d7] text-center px-6 py-7">
          {/* Apple logo */}
          <div className="relative mx-auto mb-2 w-12 h-12">
            <img
              src="/apple-big.png"
              alt="Apple Logo"
              className="w-12 h-12 opacity-90 select-none"
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/25 to-transparent animate-logo-glint rounded-full pointer-events-none" />
          </div>

          <h2
            className="text-[18px] font-semibold mb-5"
            style={{
              fontFamily:
                '"Lucida Grande", "Lucida Sans Unicode", "Geneva", sans-serif',
              color: "#333",
            }}
          >
            Mac&nbsp;OS&nbsp;X
          </h2>

          {/* Progress area */}
          <div className="rounded-md bg-gradient-to-b from-[#c8c8c8] to-[#9e9e9e] border border-[#7f7f7f] shadow-inner p-4">
            <div className="relative w-full h-[16px] rounded-[3px] bg-gradient-to-b from-[#bdbdbd] to-[#8f8f8f] border border-[#7b7b7b] overflow-hidden mb-3">
              <div className="absolute top-[2px] left-[2px] h-[10px] w-[30%] rounded-[2px] bg-gradient-to-r from-[#9cd1ff] via-[#3b82f6] to-[#9cd1ff] animate-tiger-loader" />
            </div>
            <p
              className="text-[13px] tracking-tight"
              style={{
                fontFamily:
                  '"Lucida Grande", "Lucida Sans Unicode", "Geneva", sans-serif',
                color: "#444",
              }}
            >
              Starting&nbsp;Mac&nbsp;OS&nbsp;X…
            </p>
          </div>
        </div>
      </div>
    )
  }

  // --- Fade-in phase overlay ---
  if (phase === "fadein") {
    return (
      <div className="fixed inset-0 bg-white animate-wallpaper-fade pointer-events-none z-[9999]" />
    )
  }

  // --- Done: render desktop ---
  return <>{children}</>
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
