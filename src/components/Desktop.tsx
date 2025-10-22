import { useEffect, useMemo, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import * as ContextMenu from "@radix-ui/react-context-menu"
import DesktopIcon from "./DesktopIcon"
import { useStore, storeApi } from "../store"
import { Dialog, DialogContent } from "./ui/dialog"
import {
  applyThemeToDocument,
  THEME_PACKS,
  themesLoadedAt,
} from "../config/themes"
import { getActiveHoliday, type ThemeId, type Holiday } from "../config/holidays"

/* -------------------------------------------------------------------------- */
/* 🖥 Desktop Component                                                       */
/* -------------------------------------------------------------------------- */
export default function Desktop() {
  const prefersReducedMotion = useReducedMotion()

  // Global store values
  const wallpaper = useStore((s) => s.prefs.wallpaper)
  const activeTheme = useStore((s) => s.activeTheme)
  const holidayTheme = useStore((s) => s.prefs.holidayThemeOverride)

  // Local UI state
  const [wallpaperUrl, setWallpaperUrl] = useState<string>("")
  const [ready, setReady] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  const icons = useStore((s) => s.desktopIcons)
  const trash = useStore((s) => s.trash)

  /* -------------------------------------------------------------------------- */
  /* ⚡ Instantly show cached wallpaper on mount                                */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (wallpaper?.full) {
      setWallpaperUrl(wallpaper.full)
      console.log("⚡ Restored cached wallpaper:", wallpaper.name)
    }
    const t = setTimeout(() => setReady(true), 200)
    return () => clearTimeout(t)
  }, [])

  /* -------------------------------------------------------------------------- */
  /* ⏰ Hourly holiday theme detection + auto apply                             */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    const updateHolidayTheme = async () => {
      try {
        const active: Holiday | null = await getActiveHoliday()
        const newId = active
          ? (`theme_${active.id.replace(/-/g, "_")}` as ThemeId)
          : null

        const current = storeApi.getState().activeTheme
        if (newId !== current) {
          storeApi.setState({
            prefs: {
              ...storeApi.getState().prefs,
              holidayThemeOverride: newId,
            },
            activeTheme: newId ?? current,
          })

          if (newId) {
            applyThemeToDocument(newId)
            console.log("📅 Applied holiday theme:", newId)
          }

          const pack = newId ? THEME_PACKS[newId] : null
          if (pack?.wallpaperUrl)
            console.log("🖼️ Updated wallpaper from theme:", pack.label)
        }
      } catch (err) {
        console.warn("⚠️ Holiday auto-update failed:", err)
      }
    }

    updateHolidayTheme()
    const interval = setInterval(updateHolidayTheme, 1000 * 60 * 60)
    return () => clearInterval(interval)
  }, [])

  /* -------------------------------------------------------------------------- */
  /* 🧭 Listen for Calendar “Apply Theme” manual trigger                        */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    const handler = (e: Event) => {
      const themeId = (e as CustomEvent<string | null>).detail
      if (themeId) {
        const pack = THEME_PACKS[themeId as ThemeId]
        if (pack?.wallpaperUrl) {
          storeApi.getState().setWallpaper({
            id: pack.id,
            full: pack.wallpaperUrl,
            folder: "themes",
            name: pack.label,
          })
          setWallpaperUrl(pack.wallpaperUrl)
          console.log("✅ Applied theme wallpaper:", pack.label)
          return
        }
      }

      // Revert to user wallpaper if theme removed
      const prefs = storeApi.getState().prefs
      if (prefs.wallpaper?.full && prefs.wallpaper.folder !== "themes") {
        setWallpaperUrl(prefs.wallpaper.full)
        console.log("🎨 Restored user wallpaper:", prefs.wallpaper.name)
      }
    }

    window.addEventListener("theme:changed", handler)
    return () => window.removeEventListener("theme:changed", handler)
  }, [])

  /* -------------------------------------------------------------------------- */
  /* 🖼 Reactively update wallpaper when prefs or themes change                 */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (!themesLoadedAt) return

    // User-selected wallpaper always takes priority
    if (wallpaper?.full && wallpaper.folder !== "themes") {
      setWallpaperUrl(wallpaper.full)
      console.log("🎨 User wallpaper:", wallpaper.name)
      return
    }

    // Active or holiday theme wallpaper
    const currentTheme = holidayTheme || activeTheme
    const pack = currentTheme ? THEME_PACKS[currentTheme] : null

    if (pack?.wallpaperUrl) {
      setWallpaperUrl(pack.wallpaperUrl)
      console.log("✅ Theme wallpaper:", pack.label)
    } else if (wallpaper?.full) {
      setWallpaperUrl(wallpaper.full)
      console.log("🎨 Stored wallpaper:", wallpaper.name)
    } else {
      console.warn("⚠️ No wallpaper available - theme:", currentTheme)
    }
  }, [activeTheme, holidayTheme, wallpaper, themesLoadedAt])

  /* -------------------------------------------------------------------------- */
  /* 🎨 Wallpaper background style + fade-in                                   */
  /* -------------------------------------------------------------------------- */
  const bgStyle = useMemo<React.CSSProperties>(
    () => ({
      backgroundImage: wallpaperUrl ? `url('${wallpaperUrl}')` : undefined,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundColor: "#000",
      opacity: ready ? 1 : 0,
      transition: "opacity 0.2s ease-in-out, background-image 1s ease-in-out",
    }),
    [wallpaperUrl, ready]
  )

  /* -------------------------------------------------------------------------- */
  /* 📁 Context menu + icons layout                                            */
  /* -------------------------------------------------------------------------- */
  const columns = useMemo(() => {
    const availableHeight = window.innerHeight - 100
    const iconHeight = 80
    const maxPerColumn = Math.floor(availableHeight / iconHeight)
    const cols: typeof icons[] = []
    for (let i = 0; i < icons.length; i += maxPerColumn) {
      cols.push(icons.slice(i, i + maxPerColumn))
    }
    return cols
  }, [icons])

  const newFolder = () => {
    const folder = {
      id: ("folder-" + Date.now()) as any,
      title: "Untitled Folder",
      iconUrl: "/icons/folder-generic.png",
      x: 100,
      y: 100,
      launch: () => {},
    }
    const icons = useStore.getState().desktopIcons
    useStore.getState().setDesktopIcons([...icons, folder])
  }

  const openWallpapers = () => {
    const id = "wallpapers-" + Math.random().toString(36).slice(2)
    const width = 640
    const height = 420
    const vw = window.innerWidth
    const vh = window.innerHeight
    const x = Math.max(16, Math.floor((vw - width) / 2))
    const y = Math.max(48, Math.floor((vh - height) / 3))

    useStore.getState().openWindow({
      id,
      appKey: "wallpapers",
      x,
      y,
      width,
      height,
      minimized: false,
      zoomed: false,
    })
    useStore.getState().focusWindow(id)
  }

  /* -------------------------------------------------------------------------- */
  /* 🖥 Render                                                                 */
  /* -------------------------------------------------------------------------- */
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <div className="fixed inset-0 z-0" style={bgStyle}>
          {!prefersReducedMotion && wallpaperUrl && (
            <motion.div
              key={wallpaperUrl}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.0, ease: "easeInOut" }}
            />
          )}

          {/* Desktop icons grid */}
          {/* 🖥 macOS X Tiger–style icon grid */}
<div
  className="absolute inset-y-12 right-8 select-none pointer-events-auto"
  style={{
    display: "grid",
    gridAutoFlow: "column",
    gridTemplateRows: "repeat(auto-fill, 96px)", // each icon “slot”
    gridAutoColumns: "max-content",
    gap: "22px",
    justifyContent: "end",
    alignContent: "start",
    height: "calc(100vh - 6rem)",
    width: "auto",
  }}
>
  {icons.map((icon) => (
    <div
      key={icon.id}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
      }}
    >
      <DesktopIcon icon={icon} />
    </div>
  ))}
</div>

        </div>
      </ContextMenu.Trigger>

      {/* Context Menu */}
      <ContextMenu.Portal>
        <ContextMenu.Content
          alignOffset={4}
          className="z-50 min-w-[12rem] rounded-md border bg-white p-1 shadow-lg text-sm"
        >
          <ContextMenu.Item
            onSelect={newFolder}
            className="cursor-pointer px-3 py-1.5 rounded hover:bg-blue-500/10"
          >
            New Folder
          </ContextMenu.Item>
          <ContextMenu.Item
            onSelect={() => setShowInfo(true)}
            className="cursor-pointer px-3 py-1.5 rounded hover:bg-blue-500/10"
          >
            Get Info
          </ContextMenu.Item>
          <ContextMenu.Separator className="my-1 h-px bg-gray-200" />
          <ContextMenu.Item
            onSelect={openWallpapers}
            className="cursor-pointer px-3 py-1.5 rounded hover:bg-blue-500/10"
          >
            Change Desktop Background…
          </ContextMenu.Item>
          <ContextMenu.Item
            onSelect={() => useStore.getState().setTrash([])}
            disabled={trash.length === 0}
            className="cursor-pointer px-3 py-1.5 rounded text-red-600 data-[disabled]:opacity-40 hover:bg-red-500/10"
          >
            Empty Trash
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>

      {/* Info dialog */}
      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent className="max-w-sm space-y-2 text-sm">
          <h2 className="font-bold text-lg">Desktop</h2>
          <div>
            <span className="text-gray-500">Kind:</span> Folder
          </div>
          <div>
            <span className="text-gray-500">Created:</span> Jan 1, 2025
          </div>
          <div>
            <span className="text-gray-500">Modified:</span> Today
          </div>
          <div>
            <span className="text-gray-500">Items:</span> {icons.length}
          </div>
        </DialogContent>
      </Dialog>
    </ContextMenu.Root>
  )
}
