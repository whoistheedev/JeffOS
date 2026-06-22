import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useStore } from "../store"
import { AppIconRenderer } from "./AppIconRenderer"

/**
 * Exposé (Tiger 10.4):
 *   F9  — tile all open windows so you can pick one
 *   F11 — clear all windows aside to reveal the desktop
 *   Esc / click backdrop — restore
 *
 * Implementation note: re-rendering each live app into a true thumbnail is
 * expensive and fragile, so this presents a labeled card per window (icon +
 * title) in the classic Exposé tiled layout; clicking one focuses that window
 * and exits. F11 dims the whole window layer to expose the desktop.
 */
type Mode = "off" | "all" | "desktop"

export default function Expose() {
  const [mode, setMode] = useState<Mode>("off")
  const windows = useStore((s) => s.windows)
  const apps = useStore((s) => s.apps)
  const desktopIcons = useStore((s) => s.desktopIcons)
  const focusWindow = useStore((s) => s.focusWindow)
  const restoreWindow = useStore((s) => s.restoreWindow)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F9") { e.preventDefault(); setMode((m) => (m === "all" ? "off" : "all")) }
      else if (e.key === "F11") { e.preventDefault(); setMode((m) => (m === "desktop" ? "off" : "desktop")) }
      else if (e.key === "Escape") setMode("off")
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const open = Object.values(windows).filter((w) => !w.minimized)

  // F11 "show desktop" — dim/slide the window layer aside via a CSS class on
  // body so the existing window DOM moves; click to restore.
  useEffect(() => {
    document.documentElement.classList.toggle("expose-desktop", mode === "desktop")
    return () => document.documentElement.classList.remove("expose-desktop")
  }, [mode])

  if (mode === "off") return null

  if (mode === "desktop") {
    // Just a click-catcher to restore; the window layer is slid away via CSS.
    return <div className="fixed inset-0 z-[5500]" onClick={() => setMode("off")} aria-label="Show Desktop (click to restore)" />
  }

  // F9 — tile cards in a responsive grid.
  const cols = Math.ceil(Math.sqrt(open.length || 1))
  const pick = (winId: string) => {
    const w = windows[winId]
    if (w?.minimized) restoreWindow(winId)
    focusWindow(winId)
    setMode("off")
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[5500] flex items-center justify-center p-10"
        style={{ background: "rgba(20,28,44,0.55)", backdropFilter: "blur(8px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={() => setMode("off")}
        role="dialog"
        aria-label="Exposé — all windows"
      >
        {open.length === 0 ? (
          <p className="text-white/80 text-sm">No open windows</p>
        ) : (
          <div
            className="grid gap-6 w-full max-w-5xl"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {open.map((w) => {
              const icon = desktopIcons.find((i) => i.id === w.appKey)
              const title = apps[w.appKey]?.title ?? String(w.appKey)
              return (
                <motion.button
                  key={w.id}
                  layoutId={`expose-${w.id}`}
                  onClick={(e) => { e.stopPropagation(); pick(w.id) }}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.03 }}
                  className="flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-lg p-4 text-center"
                  style={{
                    background: "linear-gradient(to bottom, rgba(255,255,255,0.16), rgba(255,255,255,0.06))",
                    border: "1px solid rgba(255,255,255,0.25)",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
                  }}
                >
                  <span className="h-12 w-12">
                    {icon ? <AppIconRenderer icon={icon} size="desktop" /> : null}
                  </span>
                  <span className="text-sm font-medium text-white/95">{title}</span>
                </motion.button>
              )
            })}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
