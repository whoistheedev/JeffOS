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
import { wallpaperUrl as renderWallpaper } from "../lib/imageUrl"

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
  // The actually-painted (rendered) URL — only updated after the image decodes,
  // so the previous wallpaper stays visible until the next is ready.
  const [displayedUrl, setDisplayedUrl] = useState<string>("")
  const [ready, setReady] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  const icons = useStore((s) => s.desktopIcons)
  const trash = useStore((s) => s.trash)

  /* -------------------------------------------------------------------------- */
  /* ⚡ Instant cached wallpaper on mount                                       */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (wallpaper?.full) setWallpaperUrl(wallpaper.full)
    setReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* -------------------------------------------------------------------------- */
  /* 🖼️ Keep-previous + cross-fade (Phase 1 perf fix).                         */
  /* The currently-painted wallpaper (`displayedUrl`) stays visible while the   */
  /* next one loads off-DOM; only when the new image is decoded do we swap +    */
  /* cross-fade. Never shows black; repeat visits paint the persisted wallpaper */
  /* instantly; theme swaps fade smoothly. (Render endpoint = small+cacheable.) */
  /* -------------------------------------------------------------------------- */
  const targetUrl = wallpaperUrl
  useEffect(() => {
    if (!targetUrl) return
    const rendered = renderWallpaper(targetUrl)
    // First paint: if nothing is displayed yet, show it immediately (the
    // persisted/cached image is likely already in browser/edge cache).
    if (!displayedUrl) {
      setDisplayedUrl(rendered)
      return
    }
    if (rendered === displayedUrl) return
    let cancelled = false
    const img = new Image()
    img.src = rendered
    const swap = () => {
      if (!cancelled) setDisplayedUrl(rendered)
    }
    img.decode?.().then(swap).catch(swap)
    img.onload = swap
    return () => {
      cancelled = true
    }
  }, [targetUrl, displayedUrl])

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

    if (wallpaper?.full && wallpaper.folder !== "themes") {
      setWallpaperUrl(wallpaper.full)
      console.log("🎨 User wallpaper:", wallpaper.name)
      return
    }

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
  // Backdrop container: holds the layered wallpaper (blurred cover-fill +
  // contained image) and the fade-in. The image layers are rendered as children
  // (below) so the blurred fill can sit BEHIND the contained image.
  const bgStyle = useMemo<React.CSSProperties>(
    () => ({
      backgroundColor: "#0b1020", // fallback before first paint
      opacity: ready ? 1 : 0,
      transition: "opacity 0.4s ease-in-out",
    }),
    [ready]
  )

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
          {/* Layer 1 — blurred cover-fill: a soft, screen-filling blur of the
              same image, so the letter/pillar-box bands read as intentional
              rather than flat-colour letterboxing. */}
          {displayedUrl && (
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                backgroundImage: `url('${displayedUrl}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                filter: "blur(28px) brightness(0.85)",
                transform: "scale(1.1)", // hide the blurred edges
              }}
            />
          )}
          {/* Layer 2 — the WHOLE wallpaper, contained (never cropped). */}
          {displayedUrl && (
            <motion.div
              key={displayedUrl}
              aria-hidden
              className="absolute inset-0"
              style={{
                backgroundImage: `url('${displayedUrl}')`,
                backgroundSize: "contain",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />
          )}

          {/* Desktop icons grid (auto arranged, above Dock) */}
          <AutoArrangedIcons icons={icons.filter((icon) => !icon.pinned)} />
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
        <DialogContent srTitle="Desktop Info" className="max-w-sm space-y-2 text-sm">
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

/* -------------------------------------------------------------------------- */
/* 📦 AutoArrangedIcons Component                                             */
/* -------------------------------------------------------------------------- */
function AutoArrangedIcons({ icons }: { icons: any[] }) {
  const [positions, setPositions] = useState<{ id: string; x: number; y: number }[]>([])

  useEffect(() => {
    const arrange = () => {
      // Tighter icon footprint on phones so the right-aligned grid doesn't
      // overflow the left edge or crowd the ~390px viewport (§8 mobile polish).
      const isPhone = window.innerWidth < 480
      const ICON_WIDTH = isPhone ? 64 : 96
      const ICON_HEIGHT = isPhone ? 64 : 96
      const ICON_GAP = isPhone ? 14 : 22
      const TOP_OFFSET = isPhone ? 64 : 100
      const LEFT_OFFSET = isPhone ? 16 : 80
      const DOCK_HEIGHT = 80

      const viewportHeight = window.innerHeight - (DOCK_HEIGHT + ICON_GAP)
      const usableHeight = viewportHeight - TOP_OFFSET
      const maxPerColumn = Math.floor(usableHeight / (ICON_HEIGHT + ICON_GAP))

      const newPositions: { id: string; x: number; y: number }[] = []
      let col = 0
      let row = 0

      icons.forEach((icon) => {
        const x = window.innerWidth - LEFT_OFFSET - (col + 1) * (ICON_WIDTH + ICON_GAP)
        const y = TOP_OFFSET + row * (ICON_HEIGHT + ICON_GAP)
        newPositions.push({ id: icon.id, x, y })

        row++
        if (row >= maxPerColumn) {
          row = 0
          col++
        }
      })

      setPositions(newPositions)
    }

    arrange()
    window.addEventListener("resize", arrange)
    return () => window.removeEventListener("resize", arrange)
  }, [icons])

  return (
    <div className="absolute inset-0 select-none pointer-events-auto">
      {positions.map(({ id, x, y }) => {
        const icon = icons.find((i) => i.id === id)
        if (!icon) return null
        return (
          <div
            key={id}
            style={{
              position: "absolute",
              left: x,
              top: y,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <DesktopIcon icon={icon} />
          </div>
        )
      })}
    </div>
  )
}
