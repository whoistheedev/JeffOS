import { useEffect } from "react"
import { Toaster } from "sonner"
import RootRouter from "./RootRouter"

import { useStore } from "./store"
import {
  loadThemesFromSupabase,
  applyThemeToDocument,
  THEME_PACKS,
  themesLoadedAt,
} from "./config/themes"
import type { ThemeId } from "./config/holidays"

/* -------------------------------------------------------------------------- */
/* 💻 Vintage Mac Portfolio OS – Main App Component                           */
/* -------------------------------------------------------------------------- */
export default function App() {
  const activeTheme = useStore((s) => s.activeTheme)
  const recomputeAutoHoliday = useStore((s) => s.recomputeAutoHoliday)
  const prefs = useStore((s) => s.prefs)
  const holidayThemeOverride = prefs.holidayThemeOverride

  /* -------------------------------------------------------------------------- */
  /* 🪄 INITIAL LOAD: themes + holiday check                                   */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    // ✅ Ensure viewport meta exists for responsive layout.
    // NOTE: no `maximum-scale` / `user-scalable=no` — locking zoom is a WCAG
    // 1.4.4 failure that hurts low-vision users. Pinch-zoom stays enabled.
    const meta = document.querySelector("meta[name='viewport']")
    if (!meta) {
      const m = document.createElement("meta")
      m.name = "viewport"
      m.content = "width=device-width,initial-scale=1"
      document.head.appendChild(m)
    }

    // 🔄 Release any inherited orientation lock so the installed PWA can rotate
    // freely (landscape is the natural orientation for gaming). The manifest
    // says orientation:"any", but an app installed BEFORE that change can keep
    // an OS-level portrait lock; unlock() clears it on browsers that support it.
    try {
      const so = (screen as any)?.orientation
      so?.unlock?.()
    } catch {
      /* not supported (e.g. iOS Safari) — harmless; the page reflows on rotate */
    }

    ;(async () => {
      try {
        await loadThemesFromSupabase()

        if (!holidayThemeOverride) {
          await recomputeAutoHoliday()
        }

        applyThemeToDocument(activeTheme)

        const themeKey = (holidayThemeOverride ?? activeTheme) as ThemeId
        const pack = THEME_PACKS[themeKey]
        if (pack?.wallpaperUrl) {
          useStore.getState().setWallpaper({
            id: pack.id,
            full: pack.wallpaperUrl,
            folder: "themes",
            name: pack.label,
          })
          console.log("🖼 Wallpaper synced:", pack.label)
        } else {
          console.log("⚠️ No wallpaper found for theme:", themeKey)
        }

        console.log("✅ Startup initialization complete")
      } catch (err) {
        console.warn("⚠️ App startup failed:", err)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* -------------------------------------------------------------------------- */
  /* 🔁 APPLY THEME COLORS WHENEVER ACTIVE THEME CHANGES                       */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    applyThemeToDocument(activeTheme)

    const pack = THEME_PACKS[activeTheme as ThemeId]
    if (pack?.wallpaperUrl) {
      useStore.getState().setWallpaper({
        id: activeTheme ?? "unknown-theme",
        full: pack.wallpaperUrl,
        folder: "themes",
        name: pack.label,
      })
      console.log("🖼 Wallpaper updated for theme:", pack.label)
    }
  }, [activeTheme])

  /* -------------------------------------------------------------------------- */
  /* 🔁 REACT TO THEMES LOADED (themesLoadedAt changes)                        */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (!themesLoadedAt) return

    const themeKey = (holidayThemeOverride ?? activeTheme) as ThemeId
    const pack = THEME_PACKS[themeKey]
    if (pack?.wallpaperUrl) {
      useStore.getState().setWallpaper({
        id: pack.id,
        full: pack.wallpaperUrl,
        folder: "themes",
        name: pack.label,
      })
      console.log("🖼 Wallpaper reloaded after Supabase sync:", pack.label)
    }
  }, [themesLoadedAt, activeTheme, holidayThemeOverride])

  /* -------------------------------------------------------------------------- */
  /* 🕛 MIDNIGHT AUTO-REFRESH (holiday recheck daily)                           */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    const run = async () => {
      await useStore.getState().recomputeAutoHoliday()
    }
    run()

    const now = new Date()
    const nextMidnight = new Date(now)
    nextMidnight.setHours(24, 0, 5, 0)
    const delay = nextMidnight.getTime() - now.getTime()

    const midnightTimer = setTimeout(() => {
      run()
      const dailyTimer = setInterval(run, 24 * 60 * 60 * 1000)
      return () => clearInterval(dailyTimer)
    }, delay)

    return () => clearTimeout(midnightTimer)
  }, [])

  /* -------------------------------------------------------------------------- */
  /* 🖥 LAYOUT – Responsive shell router                                       */
  /* The desktop tree now lives in DesktopShell (extracted verbatim). The       */
  /* router selects Desktop / Tablet / Mobile by form factor and defaults to    */
  /* desktop, preserving the existing experience. App-level theme/holiday       */
  /* effects above are unchanged.                                               */
  /* -------------------------------------------------------------------------- */
  return (
    <>
      {/* Phase 6: RootRouter shows Recruiter Mode by default and lazy-loads the
          JeffOS desktop OS only when the visitor opts in via "Launch JeffOS". */}
      <RootRouter />
      {/* Mounts sonner so existing app toasts (Recruiter/Guestbook/Wallpapers)
          actually render — there was no <Toaster> in the tree before. */}
      <Toaster position="bottom-center" richColors />
    </>
  )
}
