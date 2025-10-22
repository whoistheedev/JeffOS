import { useEffect } from "react"
import StatusBar from "./components/StatusBar"
import Desktop from "./components/Desktop"
import Dock from "./components/Dock"
import WindowManager from "./components/WindowManager"
import SocialsWidget from "./components/SocialsWidget"
import { VisitorsWidget } from "./components/VisitorsWidget"
import { KeyboardHelp } from "./components/KeyboardHelp"

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
    // ✅ Ensure viewport meta exists for responsive layout
    const meta = document.querySelector("meta[name='viewport']")
    if (!meta) {
      const m = document.createElement("meta")
      m.name = "viewport"
      m.content = "width=device-width,initial-scale=1,maximum-scale=1"
      document.head.appendChild(m)
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
  /* 🖥 LAYOUT – Responsive container                                          */
  /* -------------------------------------------------------------------------- */
  return (
    <div className="relative flex flex-col h-screen w-screen overflow-hidden bg-transparent">
      <StatusBar />
      <Desktop />
      <WindowManager />
      <Dock />

      {/* 🌍 Widgets visible on tablets and desktops only */}
      <div
        className="
          hidden sm:flex
          absolute bottom-4 left-0 w-full
          justify-between items-center
          px-6
          pointer-events-none
        "
      >
        <div className="pointer-events-auto">
          <VisitorsWidget />
        </div>
        <div className="pointer-events-auto">
          <SocialsWidget />
        </div>
      </div>

      <KeyboardHelp />
    </div>
  )
}
