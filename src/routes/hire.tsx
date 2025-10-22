import React, { useEffect } from "react"
import { useStore } from "../store"

export default function HireRoute() {
  const openWindow = useStore((s) => s.openWindow)
  const focusWindow = useStore((s) => s.focusWindow)

  useEffect(() => {
    // Auto-open Recruiter Mode in a window
    const appKey = "recruiter"
    const winId = `${appKey}-${Math.random().toString(36).slice(2)}`

    openWindow({
      id: winId,
      appKey, // ✅ required
      x: 100,
      y: 100,
      width: 900,
      height: 600,
      minimized: false,
      zoomed: false,
    })

    focusWindow(winId)
  }, [openWindow, focusWindow])

  return null // WindowManager will render <Recruiter/> automatically
}
