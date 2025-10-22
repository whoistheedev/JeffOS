// src/store/sounds.ts
import { useStore } from "./index"

/**
 * Mac-style system sounds for whoisthedev portfolio
 * 
 * Available sound types:
 *  - "select"       → desktop icon select / focus
 *  - "focus"        → window activated / brought forward
 *  - "open"         → app or window opened
 *  - "close"        → red button close
 *  - "minimize"     → yellow button minimize
 *  - "zoom"         → green button maximize/restore
 *  - "trash"        → item moved to trash
 *  - "appOpen"      → major app launch (optional alt to open)
 */
export type SystemSound =
  | "select"
  | "focus"
  | "open"
  | "close"
  | "minimize"
  | "zoom"
  | "trash"
  | "appOpen"

export const playSystemSound = (type: SystemSound = "select") => {
  const { prefs } = useStore.getState()
  if (!prefs?.soundOn) return

  // Map friendly names to actual MP3 file names
  const soundMap: Record<SystemSound, string> = {
    select: "select.mp3",
    focus: "focus.mp3",
    open: "window-open.mp3",
    close: "window-close.mp3",
    minimize: "window-minimize.mp3",
    zoom: "window-zoom.mp3",
    trash: "trash.mp3",
    appOpen: "app-open.mp3",
  }

  const file = soundMap[type]
  if (!file) return

  const audio = new Audio(`/sounds/${file}`)
  audio.volume = prefs?.volume ?? 0.7
  audio.play().catch(() => {
    // Ignore autoplay policy errors
  })
}
