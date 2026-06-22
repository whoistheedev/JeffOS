import React, { useEffect } from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useStore } from "./store"
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

/* 💻 Mount Application
 *
 * Note: the Tiger boot screen used to wrap the whole app here, so EVERY
 * first-time visitor sat through ~3s of boot before even Recruiter Mode (the
 * fast hire path) appeared — a conversion risk. The boot sequence now lives in
 * components/BootLoader.tsx and is mounted by RootRouter around the JeffOS
 * branch ONLY, so Recruiter Mode paints immediately. */
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <GlobalSoundProvider>
        <App />
      </GlobalSoundProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
