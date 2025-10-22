import type { StateCreator } from "zustand"
import { getActiveHoliday, type ThemeId } from "../config/holidays"
import { THEME_PACKS, applyThemeToDocument } from "../config/themes"
import { supabase } from "../lib/supabase"
import { storeApi } from "./index"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */
export type ThemeEra = "system7" | "mac9" | "aqua"

export interface WallpaperData {
  id: string
  full: string
  lqip?: string
  thumbUrl?: string
  folder?: string
  name?: string
}

export interface PrefsData {
  themeEra: ThemeEra
  wallpaper: WallpaperData | null
  handle?: string
  avatar?: string
  soundOn: boolean
  volume: number
  reduceMotion: boolean
  recentWallpapers?: WallpaperData[]
  clickSound: string
  holidayThemeOverride: ThemeId | null
}

export interface PrefsSlice {
  anonId: string
  prefs: PrefsData
  activeTheme: ThemeId | null
  applyHolidayTheme: (theme: ThemeId) => void
  clearHolidayTheme: () => void
  recomputeAutoHoliday: (date?: Date) => Promise<void>

  setThemeEra: (era: ThemeEra) => void
  setWallpaper: (wallpaper: WallpaperData | null) => void
  setProfile: (handle?: string, avatar?: string) => void
  toggleSound: () => void
  setVolume: (v: number) => void
  setReduceMotion: (v: boolean) => void
  addRecentWallpaper: (wp: WallpaperData) => void
  setClickSound: (sound: string) => void
  playSystemClick: () => void
}

/* -------------------------------------------------------------------------- */
/* 🧩 Helpers                                                                 */
/* -------------------------------------------------------------------------- */
const newId = (key: string) => {
  try {
    const existing = localStorage.getItem(key)
    if (existing) return existing
    const id = crypto.randomUUID()
    localStorage.setItem(key, id)
    return id
  } catch {
    return Math.random().toString(36).slice(2)
  }
}

/* -------------------------------------------------------------------------- */
/* 🪄 Prefs Slice                                                             */
/* -------------------------------------------------------------------------- */
export const createPrefsSlice: StateCreator<PrefsSlice> = (set, get) => {
  // ✅ Load cached prefs (for instant wallpaper render)
  let savedPrefs: Partial<PrefsData> = {}
  try {
    savedPrefs = JSON.parse(localStorage.getItem("prefs") || "{}")
  } catch {}

  return {
    anonId: newId("anonId"),

    prefs: {
      themeEra: savedPrefs.themeEra ?? "aqua",
      wallpaper: savedPrefs.wallpaper ?? null, // ⚡ restored instantly
      soundOn: savedPrefs.soundOn ?? true,
      volume: savedPrefs.volume ?? 0.5,
      reduceMotion: savedPrefs.reduceMotion ?? false,
      recentWallpapers: savedPrefs.recentWallpapers ?? [],
      clickSound: savedPrefs.clickSound ?? "pop.mp3",
      holidayThemeOverride: savedPrefs.holidayThemeOverride ?? null,
    },

    activeTheme: null,

    /* ---------------------------- BASIC SETTERS ---------------------------- */
    setThemeEra: (era) =>
      set((s) => ({ prefs: { ...s.prefs, themeEra: era } })),

    setWallpaper: (wallpaper) => {
      set((s) => ({
        prefs: {
          ...s.prefs,
          wallpaper,
          recentWallpapers: wallpaper
            ? [wallpaper, ...(s.prefs.recentWallpapers ?? [])]
                .filter((w, i, arr) => arr.findIndex((x) => x.id === w.id) === i)
                .slice(0, 6)
            : s.prefs.recentWallpapers,
        },
      }))

      // 💾 Persist instantly for reload cache
      try {
        const prefs = { ...get().prefs, wallpaper }
        localStorage.setItem("prefs", JSON.stringify(prefs))
      } catch {}
    },

    setProfile: (handle, avatar) =>
      set((s) => ({ prefs: { ...s.prefs, handle, avatar } })),

    toggleSound: () =>
      set((s) => ({ prefs: { ...s.prefs, soundOn: !s.prefs.soundOn } })),

    setVolume: (v) => set((s) => ({ prefs: { ...s.prefs, volume: v } })),

    setReduceMotion: (v) =>
      set((s) => ({ prefs: { ...s.prefs, reduceMotion: v } })),

    addRecentWallpaper: (wp) =>
      set((s) => ({
        prefs: {
          ...s.prefs,
          recentWallpapers: [wp, ...(s.prefs.recentWallpapers ?? [])]
            .filter((x, i, arr) => arr.findIndex((a) => a.id === x.id) === i)
            .slice(0, 6),
        },
      })),

    /* ---------------------------- MANUAL APPLY ----------------------------- */
    applyHolidayTheme: (theme) => {
      const pack = THEME_PACKS[theme]
      set({
        prefs: { ...get().prefs, holidayThemeOverride: theme },
        activeTheme: theme,
      })
      applyThemeToDocument(theme)
      if (pack?.wallpaperUrl) {
        get().setWallpaper({
          id: theme,
          full: pack.wallpaperUrl,
          folder: "themes",
          name: pack.label,
        })
      }
      console.info("🎨 Manually applied holiday theme:", theme)
    },

    /* ----------------------------- CLEAR THEME ----------------------------- */
    clearHolidayTheme: () => {
      set((s) => ({
        prefs: { ...s.prefs, holidayThemeOverride: null },
        activeTheme: null,
      }))
      applyThemeToDocument(null)
      console.info("💤 Cleared holiday theme — back to user wallpaper.")
    },

    /* -------------------------- AUTO APPLY AT 12AM -------------------------- */
    recomputeAutoHoliday: async (date = new Date()) => {
      const holiday = await getActiveHoliday(date)
      if (!holiday) {
        console.info("⏰ No holiday today — keeping current wallpaper.")
        get().clearHolidayTheme()
        return
      }

      const theme = holiday.themeId as ThemeId
      set({
        prefs: { ...get().prefs, holidayThemeOverride: theme },
        activeTheme: theme,
      })
      applyThemeToDocument(theme)

      const pack = THEME_PACKS[theme]
      if (pack?.wallpaperUrl) {
        get().setWallpaper({
          id: theme,
          full: pack.wallpaperUrl,
          folder: "themes",
          name: pack.label,
        })
      }
      console.info("🎉 Auto-applied:", holiday.name, theme)
    },

    /* ------------------------------ SOUND FX ------------------------------- */
    setClickSound: (sound) =>
      set((s) => ({ prefs: { ...s.prefs, clickSound: sound } })),

    playSystemClick: () => {
      const { prefs } = get()
      if (!prefs.soundOn) return
      const audio = new Audio(`/sounds/${prefs.clickSound}`)
      audio.volume = prefs.volume
      audio.play().catch(() => {})
    },
  }
}

/* -------------------------------------------------------------------------- */
/* 🌍 Load global wallpaper for new visitors                                 */
/* -------------------------------------------------------------------------- */
export async function loadGlobalDefaultWallpaper() {
  try {
    const { data, error } = await supabase
      .from("defaults")
      .select("value")
      .eq("key", "global_wallpaper")
      .single()

    if (error) {
      console.warn("⚠️ Could not load default wallpaper:", error)
      return
    }

    const wallpaperUrl = data?.value
    const current = storeApi.getState().prefs.wallpaper

    if (wallpaperUrl && !current?.full) {
      storeApi.getState().setWallpaper({
        id: "default",
        full: wallpaperUrl,
        folder: "default",
        name: "Default Wallpaper",
      })
    }
  } catch (err) {
    console.error("❌ Wallpaper fetch failed:", err)
  }
}
