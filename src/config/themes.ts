import { supabase } from "../lib/supabase"
import type { ThemeId } from "./holidays"

export interface ThemePack {
  id: ThemeId
  label: string
  accent: string
  menuBarTint: "light" | "dark"
  dockGlow: boolean
  wallpaperUrl?: string
}

/* 🎨 Local base ------------------------------------------------------------ */
export const LOCAL_THEMES: Record<ThemeId, ThemePack> = {
  theme_new_year: { id: "theme_new_year", label: "New Year", accent: "#FACC15", menuBarTint: "dark", dockGlow: true },
  theme_valentines: { id: "theme_valentines", label: "Valentine's", accent: "#FB7185", menuBarTint: "light", dockGlow: true },
  theme_halloween: { id: "theme_halloween", label: "Halloween", accent: "#F97316", menuBarTint: "dark", dockGlow: true },
  theme_thanksgiving: { id: "theme_thanksgiving", label: "Thanksgiving", accent: "#D97706", menuBarTint: "dark", dockGlow: false },
  theme_christmas: { id: "theme_christmas", label: "Christmas", accent: "#10B981", menuBarTint: "dark", dockGlow: true },
  theme_cny: { id: "theme_cny", label: "Chinese New Year", accent: "#DC2626", menuBarTint: "light", dockGlow: true },
  theme_eid: { id: "theme_eid", label: "Eid al-Fitr", accent: "#16A34A", menuBarTint: "light", dockGlow: true },
  theme_nigeria_independence: { id: "theme_nigeria_independence", label: "Nigeria Independence Day", accent: "#059669", menuBarTint: "dark", dockGlow: true },
}

/* 🌈 Runtime store --------------------------------------------------------- */
export let THEME_PACKS: Record<string, ThemePack> = { ...LOCAL_THEMES }
export let themesLoadedAt = 0

/* ☁️ Load wallpapers by trying known filenames ----------------------------- */
export async function loadThemesFromSupabase(): Promise<void> {
  try {
    const bucket = "themes"
    console.log(`🎨 Loading wallpapers from Supabase bucket: ${bucket}`)

    const loaded = { ...LOCAL_THEMES }
    let successCount = 0
    let failCount = 0

    // Run all fetch HEAD requests in parallel for speed
    const themeEntries = Object.entries(LOCAL_THEMES)

    await Promise.all(
      themeEntries.map(async ([themeId, theme]) => {
        const themeKey = themeId.replace("theme_", "")
        const possibleFilenames = [
          `${themeKey}.jpg`,
          `${themeKey}.jpeg`,
          `${themeKey}.png`,
          `${themeKey}.webp`,
        ]

        for (const filename of possibleFilenames) {
          const path = `wallpapers/${filename}`
          const { data } = supabase.storage.from(bucket).getPublicUrl(path)
          const url = data?.publicUrl
          if (!url) continue

          try {
            const response = await fetch(url, { method: "HEAD" })
            if (response.ok) {
              loaded[themeId as ThemeId] = { ...theme, wallpaperUrl: url }
              console.log(`✅ ${themeId}: ${url}`)
              successCount++
              return
            }
          } catch {
            // try next format silently
          }
        }

        console.log(`❌ ${themeId}: No wallpaper found`)
        failCount++
      })
    )

    THEME_PACKS = loaded
    themesLoadedAt = Date.now()

    console.log(`🌈 Loaded ${successCount}/${successCount + failCount} wallpapers`)
    const withWallpapers = Object.values(loaded).filter((t) => t.wallpaperUrl)
    if (withWallpapers.length > 0) {
      console.table(
        withWallpapers.map((t) => ({
          Theme: t.label,
          File: t.wallpaperUrl?.split("/").pop(),
        }))
      )
    }
  } catch (err) {
    console.error("❌ Failed to load Supabase wallpapers:", err)
  }
}

/* 🎨 Apply active theme ---------------------------------------------------- */
export function applyThemeToDocument(theme: ThemeId | null) {
  const root = document.documentElement

  if (!theme || !THEME_PACKS[theme]) {
    root.style.removeProperty("--accent")
    root.dataset.menubartint = "light"
    root.dataset.dockglow = "0"
    window.dispatchEvent(new CustomEvent("theme:changed", { detail: null }))
    console.log("🧹 Cleared theme.")
    return
  }

  const pack = THEME_PACKS[theme]
  root.style.setProperty("--accent", pack.accent)
  root.dataset.menubartint = pack.menuBarTint
  root.dataset.dockglow = pack.dockGlow ? "1" : "0"
  window.dispatchEvent(new CustomEvent("theme:changed", { detail: theme }))

  const hasWallpaper = pack.wallpaperUrl ? "✅" : "❌"
  console.log(`🎉 Applied theme: ${pack.label} | Wallpaper: ${hasWallpaper}`)
  if (pack.wallpaperUrl) {
    console.log(`   URL: ${pack.wallpaperUrl}`)

    /* ⚡ Cache theme wallpaper locally for instant reloads */
    try {
      const prefs = JSON.parse(localStorage.getItem("prefs") || "{}")
      prefs.wallpaper = {
        id: pack.id,
        full: pack.wallpaperUrl,
        folder: "themes",
        name: pack.label,
      }
      localStorage.setItem("prefs", JSON.stringify(prefs))
      console.log("💾 Cached theme wallpaper locally for instant startup render")
    } catch (err) {
      console.warn("⚠️ Failed to cache theme wallpaper locally:", err)
    }
  }
}
